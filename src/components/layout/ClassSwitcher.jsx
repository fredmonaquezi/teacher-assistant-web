import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getClassSwitchDestination } from "./classSwitchNavigation";

function ClassSwitcher({ classes = [], activeClassId = "", setActiveClassId = () => {} }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const hasClasses = classes.length > 0;

  const handleChange = (event) => {
    const nextClassId = event.target.value;
    if (!nextClassId || nextClassId === activeClassId) return;

    setActiveClassId(nextClassId);

    const destination = getClassSwitchDestination(location.pathname, nextClassId);
    if (destination) {
      navigate(destination);
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("classId")) {
      searchParams.delete("classId");
      const nextSearch = searchParams.toString();
      navigate(
        { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" },
        { replace: true }
      );
    }
  };

  return (
    <div className="class-switcher">
      <label htmlFor="active-class-select">{t("layout.classSwitcher.label")}</label>
      <div className="class-switcher-row">
        <select
          id="active-class-select"
          value={activeClassId}
          onChange={handleChange}
          disabled={!hasClasses}
          aria-label={t("layout.classSwitcher.aria")}
        >
          <option value="" disabled>
            {hasClasses
              ? t("layout.classSwitcher.placeholder")
              : t("layout.classSwitcher.noClasses")}
          </option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
              {classItem.grade_level ? ` · ${classItem.grade_level}` : ""}
            </option>
          ))}
        </select>
        <NavLink to="/classes" className="class-switcher-manage">
          {t("layout.classSwitcher.manage")}
        </NavLink>
      </div>
    </div>
  );
}

export default ClassSwitcher;
