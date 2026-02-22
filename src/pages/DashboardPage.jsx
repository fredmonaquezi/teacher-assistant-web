import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TileIcon from "../components/navigation/TileIcon";

const TILES = [
  { labelKey: "dashboard.tiles.classes", path: "/classes", accent: "#c9604a", icon: "classes", iconTilt: -1.2, iconX: -0.7, iconY: -0.5, iconStroke: 1.95, wobbleMs: 950 },
  { labelKey: "dashboard.tiles.attendance", path: "/attendance", accent: "#6f8f5f", icon: "attendance", iconTilt: 0.8, iconX: 0.3, iconY: -0.6, iconStroke: 1.8, wobbleMs: 980 },
  { labelKey: "dashboard.tiles.gradebook", path: "/assessments", accent: "#cf8a4b", icon: "gradebook", iconTilt: -0.4, iconX: -0.4, iconY: -0.3, iconStroke: 1.85, wobbleMs: 1020 },
  { labelKey: "dashboard.tiles.rubrics", path: "/rubrics", accent: "#8a74b0", icon: "rubrics", iconTilt: 1.1, iconX: 0.5, iconY: -0.2, iconStroke: 1.75, wobbleMs: 930 },
  { labelKey: "dashboard.tiles.groups", path: "/groups", accent: "#5f9b99", icon: "groups", iconTilt: -0.8, iconX: -0.2, iconY: -0.5, iconStroke: 1.9, wobbleMs: 970 },
  { labelKey: "dashboard.tiles.randomPicker", path: "/random", accent: "#be6973", icon: "random", iconTilt: 0.6, iconX: 0.6, iconY: -0.4, iconStroke: 1.82, wobbleMs: 1010 },
  { labelKey: "dashboard.tiles.timer", path: "/timer", accent: "#c36f4b", icon: "timer", iconTilt: -1, iconX: -0.5, iconY: -0.3, iconStroke: 1.88, wobbleMs: 990 },
  { labelKey: "dashboard.tiles.runningRecords", path: "/running-records", accent: "#69885f", icon: "records", iconTilt: 0.9, iconX: 0.4, iconY: -0.5, iconStroke: 1.78, wobbleMs: 940 },
  { labelKey: "dashboard.tiles.calendar", path: "/calendar", accent: "#6384b5", icon: "calendar", iconTilt: -0.5, iconX: -0.4, iconY: -0.4, iconStroke: 1.86, wobbleMs: 1000 },
  { labelKey: "dashboard.tiles.usefulLinks", path: "/useful-links", accent: "#4e8d7a", icon: "links", iconTilt: 0.4, iconX: 0.2, iconY: -0.4, iconStroke: 1.78, wobbleMs: 960 },
];

function DashboardPage() {
  const { t } = useTranslation();

  return (
    <section className="panel quick-actions-panel">
      <div className="tile-grid">
        {TILES.map((tile) => (
          <NavLink
            key={tile.path}
            to={tile.path}
            className="tile"
            style={{
              "--tile-accent": tile.accent,
              "--tile-accent-soft": `${tile.accent}26`,
              "--icon-tilt": `${tile.iconTilt}deg`,
              "--icon-offset-x": `${tile.iconX}px`,
              "--icon-offset-y": `${tile.iconY}px`,
              "--icon-stroke": tile.iconStroke,
              "--icon-wobble-ms": `${tile.wobbleMs}ms`,
            }}
          >
            <span className="tile-circle" aria-hidden="true">
              <TileIcon kind={tile.icon} />
            </span>
            <span className="tile-label">{t(tile.labelKey)}</span>
            <span className="tile-scratch" aria-hidden="true" />
          </NavLink>
        ))}
      </div>
    </section>
  );
}

export default DashboardPage;
