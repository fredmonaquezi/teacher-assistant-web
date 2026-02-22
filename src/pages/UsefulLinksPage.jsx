import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReorderModeToggle from "../components/common/ReorderModeToggle";
import { useHandleDrag } from "../hooks/useHandleDrag";
import { useReorderMode } from "../hooks/useReorderMode";

const EMPTY_FORM = {
  title: "",
  url: "",
  description: "",
};

function normalizeLinks(links) {
  return [...links].sort((first, second) => {
    const firstSort = Number(first.sort_order ?? 0);
    const secondSort = Number(second.sort_order ?? 0);
    if (firstSort !== secondSort) return firstSort - secondSort;
    return String(first.created_at || "").localeCompare(String(second.created_at || ""));
  });
}

function getLinkDomain(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function UsefulLinksPage({
  formError,
  usefulLinks,
  handleCreateUsefulLink,
  handleUpdateUsefulLink,
  handleDeleteUsefulLink,
  handleSwapUsefulLinkSortOrder,
}) {
  const { t } = useTranslation();
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editingLinkId, setEditingLinkId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [dragLinkId, setDragLinkId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const isMobileReorderActive = isMobileLayout && isReorderMode;

  const {
    onHandlePointerDown: onLinkHandlePointerDown,
    onHandlePointerMove: onLinkHandlePointerMove,
    onHandlePointerUp: onLinkHandlePointerUp,
    isDragAllowed: isLinkDragAllowed,
    resetHandleDrag: resetLinkHandleDrag,
  } = useHandleDrag(isReorderEnabled && !isMobileLayout);

  const sortedLinks = useMemo(() => normalizeLinks(usefulLinks), [usefulLinks]);
  const editingLink = useMemo(
    () => sortedLinks.find((item) => item.id === editingLinkId) || null,
    [editingLinkId, sortedLinks]
  );

  const resetCreateForm = () => setCreateForm(EMPTY_FORM);
  const closeEditModal = () => {
    setEditingLinkId("");
    setEditForm(EMPTY_FORM);
  };

  const openExternalLink = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onSubmitCreate = async (event) => {
    event.preventDefault();
    const didCreate = await handleCreateUsefulLink(createForm);
    if (!didCreate) return;
    resetCreateForm();
  };

  const onSubmitEdit = async (event) => {
    event.preventDefault();
    if (!editingLinkId) return;
    const didUpdate = await handleUpdateUsefulLink(editingLinkId, editForm);
    if (!didUpdate) return;
    closeEditModal();
  };

  const openEditModal = (link) => {
    setEditingLinkId(link.id);
    setEditForm({
      title: link.title || "",
      url: link.url || "",
      description: link.description || "",
    });
  };

  const onDeleteLink = async (link) => {
    if (!link?.id) return;
    const didConfirm = window.confirm(t("usefulLinks.confirm.delete", { title: link.title || "" }));
    if (!didConfirm) return;
    await handleDeleteUsefulLink(link.id);
  };

  const handleMobileMove = async (linkId, direction) => {
    const currentIndex = sortedLinks.findIndex((item) => item.id === linkId);
    if (currentIndex < 0) return;
    const targetIndex = currentIndex + direction;
    const target = sortedLinks[targetIndex];
    if (!target) return;
    await handleSwapUsefulLinkSortOrder(sortedLinks, linkId, target.id);
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}

      <section className="panel useful-links-page">
        <div className="useful-links-header">
          <div className="useful-links-copy">
            <h2>{t("usefulLinks.title")}</h2>
            <p>{t("usefulLinks.subtitle")}</p>
          </div>
          {isMobileLayout && sortedLinks.length > 1 && (
            <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
          )}
        </div>

        <form className="useful-links-form" onSubmit={onSubmitCreate}>
          <label className="stack">
            <span>{t("usefulLinks.form.titleLabel")}</span>
            <input
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder={t("usefulLinks.form.titlePlaceholder")}
              required
            />
          </label>
          <label className="stack">
            <span>{t("usefulLinks.form.urlLabel")}</span>
            <input
              value={createForm.url}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, url: event.target.value }))
              }
              placeholder={t("usefulLinks.form.urlPlaceholder")}
              inputMode="url"
              required
            />
          </label>
          <label className="stack">
            <span>{t("usefulLinks.form.descriptionLabel")}</span>
            <input
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder={t("usefulLinks.form.descriptionPlaceholder")}
            />
          </label>
          <div className="useful-links-form-actions">
            <button type="submit">{t("usefulLinks.form.addButton")}</button>
          </div>
        </form>

        {sortedLinks.length === 0 ? (
          <div className="useful-links-empty">{t("usefulLinks.empty")}</div>
        ) : (
          <div className="useful-links-grid">
            {sortedLinks.map((link, index) => {
              const previousLink = index > 0 ? sortedLinks[index - 1] : null;
              const nextLink = index < sortedLinks.length - 1 ? sortedLinks[index + 1] : null;
              const domainLabel = getLinkDomain(link.url);

              return (
                <article
                  key={link.id}
                  className={`useful-link-card draggable${isMobileReorderActive ? " mobile-reorder-active" : ""}`}
                  draggable={isReorderEnabled && !isMobileLayout}
                  onDragStart={(event) => {
                    if (!isLinkDragAllowed(link.id)) {
                      event.preventDefault();
                      return;
                    }
                    setDragLinkId(link.id);
                  }}
                  onDragEnd={() => {
                    setDragLinkId(null);
                    resetLinkHandleDrag();
                  }}
                  onDragOver={(event) => {
                    if (!isReorderEnabled || isMobileLayout) return;
                    event.preventDefault();
                  }}
                  onDrop={() => handleSwapUsefulLinkSortOrder(sortedLinks, dragLinkId, link.id)}
                >
                  <div className="useful-link-card-head">
                    <div className="useful-link-card-copy">
                      <h3>{link.title}</h3>
                      <p className="useful-link-domain">{domainLabel}</p>
                    </div>
                    <div className="useful-link-card-actions">
                      {isMobileReorderActive && (
                        <div className="reorder-mobile-controls">
                          <button
                            type="button"
                            className="reorder-mobile-btn"
                            aria-label={t("usefulLinks.aria.moveUp", { title: link.title })}
                            disabled={!previousLink}
                            onClick={() => handleMobileMove(link.id, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="reorder-mobile-btn"
                            aria-label={t("usefulLinks.aria.moveDown", { title: link.title })}
                            disabled={!nextLink}
                            onClick={() => handleMobileMove(link.id, 1)}
                          >
                            ↓
                          </button>
                        </div>
                      )}
                      {!isMobileLayout && (
                        <button
                          type="button"
                          className={`drag-handle${isReorderEnabled && !isMobileLayout ? "" : " disabled"}`}
                          aria-label={t("usefulLinks.aria.drag", { title: link.title })}
                          onPointerDown={(event) => onLinkHandlePointerDown(link.id, event)}
                          onPointerMove={onLinkHandlePointerMove}
                          onPointerUp={onLinkHandlePointerUp}
                          onPointerCancel={onLinkHandlePointerUp}
                        >
                          ⠿
                        </button>
                      )}
                      <button
                        type="button"
                        className="secondary useful-link-open-btn"
                        onClick={() => openExternalLink(link.url)}
                      >
                        {t("usefulLinks.actions.open")}
                      </button>
                      <button
                        type="button"
                        className="secondary useful-link-edit-btn"
                        onClick={() => openEditModal(link)}
                      >
                        {t("usefulLinks.actions.edit")}
                      </button>
                      <button
                        type="button"
                        className="icon-button useful-link-delete-btn"
                        aria-label={t("usefulLinks.aria.delete", { title: link.title })}
                        onClick={() => onDeleteLink(link)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="useful-link-url">{link.url}</p>
                  {link.description && <p className="useful-link-description">{link.description}</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editingLink && (
        <div className="modal-overlay">
          <div className="modal-card useful-links-edit-modal">
            <h3>{t("usefulLinks.editModal.title")}</h3>
            <form className="stack" onSubmit={onSubmitEdit}>
              <label className="stack">
                <span>{t("usefulLinks.form.titleLabel")}</span>
                <input
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="stack">
                <span>{t("usefulLinks.form.urlLabel")}</span>
                <input
                  value={editForm.url}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, url: event.target.value }))
                  }
                  inputMode="url"
                  required
                />
              </label>
              <label className="stack">
                <span>{t("usefulLinks.form.descriptionLabel")}</span>
                <input
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="link" onClick={closeEditModal}>
                  {t("common.actions.cancel")}
                </button>
                <button type="submit">{t("usefulLinks.form.saveButton")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default UsefulLinksPage;
