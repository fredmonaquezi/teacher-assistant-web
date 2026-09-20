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
    case "links":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <path d="M14.8 7.5h2.4a4 4 0 1 1 0 8h-2.4" />
          <path d="M9.2 16.5H6.8a4 4 0 1 1 0-8h2.4" />
          <path d="M8.8 12h6.4" />
        </svg>
      );
    default:
      return null;
  }
}

export default TileIcon;
