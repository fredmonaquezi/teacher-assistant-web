import { useTranslation } from "react-i18next";
import ConfirmDialog from "../components/common/ConfirmDialog";
import TileIcon from "../components/navigation/TileIcon";
import { ACADEMIC_PROFILE_KEYS } from "../features/groups/groupingEngine";
import { genderColor, genderIcon, groupAccent } from "../features/groups/groupsPageModel";
import useGroupsPageController from "../features/groups/useGroupsPageController";
import "../styles/groups-page.css";
import "../styles/separations.css";

function GroupsPage({
  formError,
  activeClass,
  activeClassId,
  students,
  activityAssessments = [],
  activityAssessmentEntries = [],
  subjects = [],
  groups,
  groupMembers,
  groupConstraints,
  groupGenForm,
  setGroupGenForm,
  constraintForm,
  setConstraintForm,
  groupsShowAdvanced,
  setGroupsShowAdvanced,
  groupsShowSeparations,
  setGroupsShowSeparations,
  groupsScrollTopRef,
  handleGenerateGroups,
  isGeneratingGroups,
  handleAddConstraint,
  handleDeleteConstraint,
  handleUpdateStudentAcademicLevel = async () => false,
}) {
  const { t } = useTranslation();
  const {
    showAdvancedHelp, setShowAdvancedHelp, constraintToDelete, setConstraintToDelete,
    savingAcademicProfileIds, classStudents, academicProfiles, subjectsById,
    classConstraintList, constraintDisplayRows, classGroups, grouped, visibleGrouped,
    hasMoreGroups, groupsDataIsPending, groupSize, expectedGroupCount,
    selectedStudentA, selectedStudentB, adjustGroupSize, updateAcademicProfile,
    openSeparationsModal, closeSeparationsModal, showMoreGroups,
  } = useGroupsPageController({
    activeClassId, students, activityAssessments, activityAssessmentEntries, subjects,
    groups, groupMembers, groupConstraints, groupGenForm, setGroupGenForm,
    constraintForm, groupsShowSeparations, setGroupsShowSeparations,
    groupsScrollTopRef, handleUpdateStudentAcademicLevel,
  });

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel groups-page polished-groups-page">
        <div className="groups-header-card">
          <div className="groups-header-icon">
            <TileIcon kind="groups" />
          </div>
          <div className="groups-header-copy">
            <h2>{t("groups.title")}</h2>
            <p className="muted">{t("groups.subtitle")}</p>
            <span className="groups-active-class">
              {activeClass?.name || t("layout.classSwitcher.placeholder")}
            </span>
          </div>
          <div className="groups-header-info">
            <div>
              <strong>{activeClassId ? classStudents.length : "—"}</strong>
              <span className="muted">{t("groups.stats.students")}</span>
            </div>
            <div>
              <strong>{activeClassId ? classGroups.length : "—"}</strong>
              <span className="muted">{t("groups.stats.groups")}</span>
            </div>
          </div>
        </div>

        <div className="groups-controls-card">
          <div className="groups-controls-header">
            <h3>{t("groups.settings.title")}</h3>
          </div>

          <div className="groups-settings-layout">
          <div className="groups-size-row">
            <div className="groups-size-display">
              <div className="muted">{t("groups.settings.studentsPerGroup")}</div>
            </div>
            <div className="groups-size-controls">
              <button
                type="button"
                aria-label={t("groups.settings.decreaseSize")}
                onClick={() => adjustGroupSize(-1)}
                disabled={groupSize <= 2}
              >
                −
              </button>
              <div className="groups-size-value" aria-live="polite">{groupSize}</div>
              <button
                type="button"
                aria-label={t("groups.settings.increaseSize")}
                onClick={() => adjustGroupSize(1)}
                disabled={groupSize >= 10}
              >
                +
              </button>
            </div>
          </div>

          <div className="groups-generate-area">
          {classStudents.length > 0 && (
            <div className="groups-info-row">
              {t("groups.settings.expectedGroups", { count: expectedGroupCount })}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleGenerateGroups(activeClassId)}
            className={`groups-generate-btn ${isGeneratingGroups ? "button-with-spinner" : ""}`}
            disabled={!activeClassId || isGeneratingGroups}
            aria-busy={isGeneratingGroups}
          >
            {isGeneratingGroups && <span className="inline-spinner" aria-hidden="true" />}
            {classGroups.length ? t("groups.actions.regenerateGroups") : t("groups.actions.generateGroups")}
          </button>
          </div>
          </div>
        </div>

        <div className="groups-advanced-card">
          <div className="groups-advanced-header">
            <h3>{t("groups.advanced.title")}</h3>
            <button
              type="button"
              className="link"
              aria-expanded={groupsShowAdvanced}
              aria-controls="group-advanced-options"
              onClick={() =>
                setGroupsShowAdvanced((prev) => {
                  const next = !prev;
                  if (!next) setShowAdvancedHelp(false);
                  return next;
                })
              }
            >
              {groupsShowAdvanced ? t("groups.advanced.hide") : t("groups.advanced.show")}
            </button>
          </div>
          {groupsShowAdvanced && (
            <div className="groups-advanced-options" id="group-advanced-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={groupGenForm.balanceGender}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({ ...prev, balanceGender: event.target.checked, separateGender: false }))
                  }
                />
                {t("groups.advanced.balanceGender")}
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={!!groupGenForm.separateGender}
                  onChange={(event) => setGroupGenForm((prev) => ({ ...prev, separateGender: event.target.checked, balanceGender: false }))} />
                {t("groups.advanced.separateGender")}
              </label>
              {groupGenForm.separateGender && <p className="muted">{t("groups.advanced.separateGenderHelp")}</p>}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={groupGenForm.balanceAbility}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({ ...prev, balanceAbility: event.target.checked }))
                  }
                />
                {t("groups.advanced.balanceAcademic")}
              </label>
              {groupGenForm.balanceAbility && (
                <section className="academic-profiles" aria-labelledby="academic-profiles-title">
                  <div className="academic-profiles-heading">
                    <div>
                      <h4 id="academic-profiles-title">{t("groups.academicProfiles.title")}</h4>
                      <p>{t("groups.academicProfiles.description")}</p>
                    </div>
                    <span>{t("groups.academicProfiles.studentCount", { count: classStudents.length })}</span>
                  </div>
                  {classStudents.length > 0 ? (
                    <div className="academic-profile-list">
                      {classStudents.map((student) => {
                        const profile = academicProfiles.get(student.id);
                        const saving = savingAcademicProfileIds.has(student.id);
                        const averageLabel = Number.isFinite(profile?.averagePercent)
                          ? t("groups.academicProfiles.assessmentSummary", {
                              average: Math.round(profile.averagePercent),
                              count: profile.subjectCount,
                            })
                          : t("groups.academicProfiles.noAssessments");
                        const subjectSummary = (profile?.subjectAverages || [])
                          .map((subjectAverage) => {
                            const subjectName =
                              subjectsById.get(subjectAverage.subjectId)?.name ||
                              t("groups.academicProfiles.generalSubject");
                            return `${subjectName} ${Math.round(subjectAverage.averagePercent)}%`;
                          })
                          .join(" · ");
                        return (
                          <div className="academic-profile-row" key={student.id}>
                            <div className="academic-profile-student">
                              <strong>{student.first_name} {student.last_name}</strong>
                              <span>{averageLabel}</span>
                              {subjectSummary && <small>{subjectSummary}</small>}
                            </div>
                            <label>
                              <select
                                value={student.academic_level_override || ""}
                                disabled={saving}
                                aria-busy={saving}
                                aria-label={t("groups.academicProfiles.profileFor", {
                                  name: `${student.first_name} ${student.last_name}`,
                                })}
                                onChange={(event) =>
                                  updateAcademicProfile(student.id, event.target.value)
                                }
                              >
                                <option value="">
                                  {profile?.source === "assessment"
                                    ? t("groups.academicProfiles.useAssessmentWithProfile", {
                                        profile: t(`groups.academicProfiles.levels.${profile.band}`),
                                      })
                                    : t("groups.academicProfiles.useAssessment")}
                                </option>
                                {ACADEMIC_PROFILE_KEYS.map((profileKey) => (
                                  <option value={profileKey} key={profileKey}>
                                    {t(`groups.academicProfiles.levels.${profileKey}`)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="muted">{t("groups.academicProfiles.empty")}</p>
                  )}
                </section>
              )}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={groupGenForm.pairSupportPartners}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({ ...prev, pairSupportPartners: event.target.checked }))
                  }
                />
                {t("groups.advanced.pairPartners")}
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={groupGenForm.respectSeparations}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({
                      ...prev,
                      respectSeparations: event.target.checked,
                    }))
                  }
                />
                {t("groups.advanced.respectSeparations")}
              </label>
              <button type="button" className="link" onClick={openSeparationsModal} disabled={!activeClassId}>
                {t("groups.advanced.separations")}
              </button>
              {showAdvancedHelp && (
                <div className="groups-help-card" role="note" aria-live="polite">
                  <h4>{t("groups.advanced.helpTitle")}</h4>
                  <ul>
                    <li>
                      <strong>{t("groups.advanced.balanceGender")}:</strong>{" "}
                      {t("groups.advanced.helpGender")}
                    </li>
                    <li>
                      <strong>{t("groups.advanced.balanceAcademic")}:</strong>{" "}
                      {t("groups.advanced.helpAcademic")}
                    </li>
                    <li>
                      <strong>{t("groups.advanced.pairPartners")}:</strong>{" "}
                      {t("groups.advanced.helpPairPartners")}
                    </li>
                    <li>
                      <strong>{t("groups.advanced.respectSeparations")}:</strong>{" "}
                      {t("groups.advanced.helpRespectSeparations")}
                    </li>
                  </ul>
                </div>
              )}
              <button
                type="button"
                className="link groups-help-toggle"
                aria-expanded={showAdvancedHelp}
                onClick={() => setShowAdvancedHelp((prev) => !prev)}
              >
                {showAdvancedHelp ? t("groups.advanced.hideHelp") : t("groups.advanced.help")}
              </button>
            </div>
          )}
        </div>

        {grouped.length === 0 ? (
          <div className="groups-empty">
            <div className="groups-empty-icon">✨</div>
            <div className="groups-empty-title">
              {activeClassId ? t("groups.empty.title") : t("layout.classSwitcher.placeholder")}
            </div>
            <div className="muted">
              {activeClassId ? t("groups.empty.description") : t("layout.classSwitcher.pagePrompt")}
            </div>
          </div>
        ) : (
          <div className="groups-results">
            <div className="groups-results-header">
              <h3>{t("groups.results.title")}</h3>
            </div>
            <div className="groups-grid">
              {visibleGrouped.map(({ group, members }, index) => (
                <div
                  key={group.id}
                  className="group-card"
                  style={{ "--group-accent": groupAccent(index) }}
                >
                  <div className="group-card-header">
                    <span>{t("groups.results.groupN", { number: index + 1 })}</span>
                    <span className="group-card-count">{members.length}</span>
                  </div>
                  <div className="group-card-body">
                    {members.map((student) => (
                      <div key={student.id} className="group-student">
                        <span style={{ color: genderColor(student.gender) }}>
                          {genderIcon(student.gender)}
                        </span>
                        <span className="group-student-name">
                          {student.first_name} {student.last_name}
                        </span>
                        {groupGenForm.balanceAbility && (
                          <span
                            className={`academic-profile-badge academic-profile-${academicProfiles.get(student.id)?.band || "unknown"}`}
                          >
                            {t(
                              `groups.academicProfiles.levels.${academicProfiles.get(student.id)?.band || "unknown"}`
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="muted">
              {t("groups.resultsSummary", { shown: visibleGrouped.length, total: grouped.length })}
              {groupsDataIsPending ? ` ${t("groups.updatingResults")}` : ""}
            </p>
            {hasMoreGroups && (
              <button
                type="button"
                className="secondary"
                onClick={showMoreGroups}
              >
                {t("groups.showMore")}
              </button>
            )}
          </div>
        )}
      </section>

      {groupsShowSeparations && (
        <div className="modal-overlay">
          <div className="modal-card separations-modal polished-separations" role="dialog" aria-labelledby="separations-title" aria-describedby="separations-description">
            <header className="separations-heading">
              <h3 id="separations-title">{t("groups.separations.title")}</h3>
              <p id="separations-description">{t("groups.separations.description")}</p>
              {activeClass?.name && <span className="separations-class">{activeClass.name}</span>}
            </header>
            <div className="separations-create">
            <div className="separations-selectors">
              <label className="stack">
                <span>{t("groups.separations.studentA")}</span>
                <select
                  value={selectedStudentA}
                  onChange={(event) =>
                    setConstraintForm((prev) => ({ ...prev, studentA: event.target.value }))
                  }
                  required
                >
                  <option value="">{t("groups.separations.selectStudent")}</option>
                  {classStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <span className="separations-pair-symbol" aria-hidden="true">↔</span>
              <label className="stack">
                <span>{t("groups.separations.studentB")}</span>
                <select
                  value={selectedStudentB}
                  onChange={(event) =>
                    setConstraintForm((prev) => ({ ...prev, studentB: event.target.value }))
                  }
                  required
                >
                  <option value="">{t("groups.separations.selectStudent")}</option>
                  {classStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
              <button
                type="button"
                className="separations-add-btn"
                onClick={handleAddConstraint}
                disabled={!selectedStudentA || !selectedStudentB || selectedStudentA === selectedStudentB}
              >
                {t("groups.separations.add")}
              </button>
            </div>
            <section className="separations-saved" aria-labelledby="separations-saved-title">
              <div className="separations-list-heading">
                <h4 id="separations-saved-title">{t("groups.separations.saved")}</h4>
                <span className="separations-count">{classConstraintList.length}</span>
              </div>
            {classConstraintList.length > 0 ? (
              <ul className="separations-rule-list">
                {constraintDisplayRows.map(({ constraint, studentA, studentB }) => {
                  return (
                    <li key={constraint.id}>
                      <div className="separations-rule-pair">
                        <span>{studentA ? `${studentA.first_name} ${studentA.last_name}` : t("groups.separations.studentFallback")}</span>
                        <span className="separations-pair-symbol" aria-hidden="true">↔</span>
                        <span>{studentB ? `${studentB.first_name} ${studentB.last_name}` : t("groups.separations.studentFallback")}</span>
                      </div>
                        <button
                          type="button"
                          className="link danger separation-delete-btn"
                          aria-label={t("groups.separations.deletePair", { first: studentA ? `${studentA.first_name} ${studentA.last_name}` : t("groups.separations.studentFallback"), second: studentB ? `${studentB.first_name} ${studentB.last_name}` : t("groups.separations.studentFallback") })}
                          onClick={() => setConstraintToDelete(constraint)}
                        >
                          {t("common.actions.delete")}
                        </button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="separations-empty">{t("groups.separations.empty")}</p>}
            </section>
            <div className="modal-actions separations-actions">
              <button type="button" className="secondary" onClick={closeSeparationsModal}>
                {t("common.actions.done")}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(constraintToDelete)}
        title={t("common.actions.delete")}
        description={t("groups.separations.deleteConfirm")}
        onCancel={() => setConstraintToDelete(null)}
        onConfirm={async () => {
          if (!constraintToDelete?.id) return;
          await handleDeleteConstraint(constraintToDelete.id);
          setConstraintToDelete(null);
        }}
      />
    </>
  );
}

export default GroupsPage;
