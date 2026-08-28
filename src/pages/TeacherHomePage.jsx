import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TileIcon from "../components/navigation/TileIcon";

const HOME_ACTIONS = [
  { key: "students", icon: "classes", getPath: (classId) => `/classes/${classId}` },
  { key: "attendance", icon: "attendance", getPath: () => "/attendance" },
  { key: "assessment", icon: "gradebook", getPath: (classId) => `/classes/${classId}/assess-activity` },
  { key: "groups", icon: "groups", getPath: () => "/groups" },
  { key: "random", icon: "random", getPath: () => "/random" },
];

function TeacherHomePage({ activeClass, activeClassId, students, loading }) {
  const { t } = useTranslation();
  const classStudents = activeClassId
    ? students.filter((student) => student.class_id === activeClassId)
    : [];

  return (
    <section className="panel teacher-home-page">
      <header className="teacher-home-hero">
        <p className="teacher-home-kicker">{t("home.kicker")}</p>
        <h2>{t("home.title")}</h2>
        <p>{t("home.intro")}</p>
      </header>

      <section className={`teacher-home-class${activeClass ? " is-active" : ""}`}>
        {loading && !activeClass ? (
          <p className="muted">{t("home.class.loading")}</p>
        ) : activeClass ? (
          <>
            <div className="teacher-home-class-copy">
              <span>{t("home.class.workingWith")}</span>
              <h3>{activeClass.name}</h3>
              <p>
                {t("home.class.summary", {
                  count: classStudents.length,
                  grade: activeClass.grade_level || t("home.class.gradeNotSet"),
                })}
                {activeClass.school_year ? ` · ${activeClass.school_year}` : ""}
              </p>
            </div>
            <div className="teacher-home-class-actions">
              <NavLink className="button" to={`/classes/${activeClassId}`}>
                {t("home.class.openStudents")}
              </NavLink>
              <NavLink className="button secondary" to="/classes">
                {t("home.class.manage")}
              </NavLink>
            </div>
          </>
        ) : (
          <>
            <div className="teacher-home-class-copy">
              <span>{t("home.class.getStarted")}</span>
              <h3>{t("home.class.selectTitle")}</h3>
              <p>{t("home.class.selectDescription")}</p>
            </div>
            <NavLink className="button" to="/classes">
              {t("home.class.manage")}
            </NavLink>
          </>
        )}
      </section>

      <section className="teacher-home-actions-section">
        <div className="teacher-home-section-heading">
          <h3>{t("home.actions.title")}</h3>
          <p>{t("home.actions.subtitle")}</p>
        </div>
        <div className="teacher-home-actions">
          {HOME_ACTIONS.map((action) => {
            const content = (
              <>
                <span className="teacher-home-action-icon" aria-hidden="true">
                  <TileIcon kind={action.icon} />
                </span>
                <span>
                  <strong>{t(`home.actions.${action.key}.title`)}</strong>
                  <small>{t(`home.actions.${action.key}.description`)}</small>
                </span>
                <span className="teacher-home-action-arrow" aria-hidden="true">→</span>
              </>
            );

            if (!activeClassId) {
              return (
                <div key={action.key} className="teacher-home-action is-disabled" aria-disabled="true">
                  {content}
                </div>
              );
            }

            return (
              <NavLink
                key={action.key}
                className="teacher-home-action"
                to={action.getPath(activeClassId)}
              >
                {content}
              </NavLink>
            );
          })}
        </div>
      </section>

      <section className="teacher-home-how">
        <div className="teacher-home-section-heading">
          <h3>{t("home.how.title")}</h3>
        </div>
        <ol>
          {["select", "tool", "switch"].map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <div>
                <strong>{t(`home.how.${step}.title`)}</strong>
                <p>{t(`home.how.${step}.description`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}

export default TeacherHomePage;
