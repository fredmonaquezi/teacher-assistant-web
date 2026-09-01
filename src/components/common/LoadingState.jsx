import "../../styles/loading-state.css";

function LoadingState({ children, fullPage = false }) {
  return (
    <div className={`app-loading-wrap${fullPage ? " full-page" : ""}`}>
      <div className="app-loading-state" role="status" aria-live="polite">
        <span className="app-loading-mark" aria-hidden="true">
          <span className="app-loading-spinner" />
        </span>
        <span className="app-loading-copy">
          <strong>Teacher Codex</strong>
          <span>{children}</span>
        </span>
      </div>
    </div>
  );
}

export default LoadingState;
