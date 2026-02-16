function TileIcon({ kind }) {
  switch (kind) {
    case "classes":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="4" y="4" width="16" height="10" rx="2" />
          <circle cx="8" cy="18" r="1.2" />
          <circle cx="12" cy="18" r="1.2" />
          <circle cx="16" cy="18" r="1.2" />
          <line x1="10" y1="10" x2="14" y2="7" />
        </svg>
      );
    case "attendance":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
          <path d="M8.2 12.4l2.2 2.3 5-5.1" />
          <line x1="8" y1="8" x2="16" y2="8" />
        </svg>
      );
    case "gradebook":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <path d="M6 4.5h10a2 2 0 0 1 2 2V19H8a2 2 0 0 1-2-2V4.5Z" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="14" x2="13" y2="14" />
          <path d="M5 6.5h2v10H5z" />
        </svg>
      );
    case "rubrics":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="6" y="4.5" width="12" height="15" rx="2" />
          <rect x="9" y="3" width="6" height="3" rx="1" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <path d="M9 15l1.2 1.2L12.8 14" />
        </svg>
      );
    case "groups":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <circle cx="8" cy="9" r="2" />
          <circle cx="16" cy="9" r="2" />
          <circle cx="12" cy="7" r="2" />
          <path d="M5.5 17c0-1.7 1.4-3 3-3h7c1.6 0 3 1.3 3 3" />
        </svg>
      );
    case "random":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <circle cx="9" cy="9" r="1" />
          <circle cx="15" cy="9" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="9" cy="15" r="1" />
          <circle cx="15" cy="15" r="1" />
        </svg>
      );
    case "timer":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <circle cx="12" cy="13" r="6" />
          <line x1="12" y1="13" x2="15.5" y2="11" />
          <line x1="12" y1="13" x2="12" y2="9" />
          <path d="M10 3.5h4" />
          <path d="M14.5 6 16.5 4" />
        </svg>
      );
    case "records":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <path d="M5 6a2 2 0 0 1 2-2h10v15H7a2 2 0 0 0-2 2V6Z" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <path d="M9 15h3l2-2.4" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
          <line x1="8" y1="3.5" x2="8" y2="7" />
          <line x1="16" y1="3.5" x2="16" y2="7" />
          <line x1="4" y1="10" x2="20" y2="10" />
          <circle cx="9" cy="13.5" r="1" />
          <circle cx="13" cy="13.5" r="1" />
          <circle cx="17" cy="13.5" r="1" />
        </svg>
      );
    default:
      return null;
  }
}

export default TileIcon;
