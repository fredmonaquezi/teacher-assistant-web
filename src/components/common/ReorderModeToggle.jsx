function ReorderModeToggle({ isReorderMode, setIsReorderMode }) {
  return (
    <button
      type="button"
      className={`reorder-mode-toggle ${isReorderMode ? "active" : ""}`}
      onClick={() => setIsReorderMode((prev) => !prev)}
    >
      {isReorderMode ? "Done Reordering" : "Reorder Mode"}
    </button>
  );
}

export default ReorderModeToggle;
