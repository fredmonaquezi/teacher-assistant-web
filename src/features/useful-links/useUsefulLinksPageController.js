import { useMemo, useState } from "react";
import { useHandleDrag } from "../../hooks/useHandleDrag";
import { useReorderMode } from "../../hooks/useReorderMode";

const EMPTY_FORM = { title: "", url: "", description: "" };

function normalizeLinks(links) {
  return [...links].sort((first, second) => {
    const firstSort = Number(first.sort_order ?? 0);
    const secondSort = Number(second.sort_order ?? 0);
    if (firstSort !== secondSort) return firstSort - secondSort;
    return String(first.created_at || "").localeCompare(String(second.created_at || ""));
  });
}

export function getLinkDomain(url) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

export function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest("button,input,textarea,select,a,label"));
}

export default function useUsefulLinksPageController({
  usefulLinks,
  handleCreateUsefulLink,
  handleUpdateUsefulLink,
  handleDeleteUsefulLink,
  handleSwapUsefulLinkSortOrder,
}) {
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editingLinkId, setEditingLinkId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [dragLinkId, setDragLinkId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const isMobileReorderActive = isMobileLayout && isReorderMode;
  const drag = useHandleDrag(isReorderEnabled && !isMobileLayout);
  const sortedLinks = useMemo(() => normalizeLinks(usefulLinks), [usefulLinks]);
  const editingLink = useMemo(
    () => sortedLinks.find((item) => item.id === editingLinkId) || null,
    [editingLinkId, sortedLinks]
  );

  const closeEditModal = () => {
    setEditingLinkId("");
    setEditForm(EMPTY_FORM);
  };
  const onSubmitCreate = async (event) => {
    event.preventDefault();
    if (await handleCreateUsefulLink(createForm)) setCreateForm(EMPTY_FORM);
  };
  const onSubmitEdit = async (event) => {
    event.preventDefault();
    if (!editingLinkId) return;
    if (await handleUpdateUsefulLink(editingLinkId, editForm)) closeEditModal();
  };
  const openEditModal = (link) => {
    setEditingLinkId(link.id);
    setEditForm({
      title: link.title || "",
      url: link.url || "",
      description: link.description || "",
    });
  };
  const confirmDeleteLink = async () => {
    if (!linkToDelete?.id) return;
    await handleDeleteUsefulLink(linkToDelete.id);
    setLinkToDelete(null);
  };
  const handleMobileMove = async (linkId, direction) => {
    const currentIndex = sortedLinks.findIndex((item) => item.id === linkId);
    const target = sortedLinks[currentIndex + direction];
    if (currentIndex < 0 || !target) return;
    await handleSwapUsefulLinkSortOrder(sortedLinks, linkId, target.id);
  };

  return {
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    editingLink,
    linkToDelete,
    setLinkToDelete,
    dragLinkId,
    setDragLinkId,
    sortedLinks,
    isMobileLayout,
    isReorderMode,
    setIsReorderMode,
    isReorderEnabled,
    isMobileReorderActive,
    closeEditModal,
    onSubmitCreate,
    onSubmitEdit,
    openEditModal,
    confirmDeleteLink,
    handleMobileMove,
    ...drag,
  };
}
