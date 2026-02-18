import { useTranslation } from "react-i18next";

function ReorderModeToggle({ isReorderMode, setIsReorderMode }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`reorder-mode-toggle ${isReorderMode ? "active" : ""}`}
      onClick={() => setIsReorderMode((prev) => !prev)}
    >
      {isReorderMode ? t("common.actions.doneReordering") : t("common.actions.reorderMode")}
    </button>
  );
}

export default ReorderModeToggle;
