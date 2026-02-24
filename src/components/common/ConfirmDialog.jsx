import { useTranslation } from "react-i18next";

function ConfirmDialog({
  open,
  title,
  description = "",
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  danger = true,
  className = "",
  children = null,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  const modalClassName = ["modal-card", "confirm-dialog", className].filter(Boolean).join(" ");

  return (
    <div className="modal-overlay">
      <div className={modalClassName} role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {description ? <p className="muted">{description}</p> : null}
        {children}
        <div className="modal-actions confirm-dialog-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            {cancelLabel || t("common.actions.cancel")}
          </button>
          <button
            type="button"
            className={danger ? "danger" : undefined}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel || t("common.actions.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
