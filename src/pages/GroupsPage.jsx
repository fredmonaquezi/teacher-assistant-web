import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/common/ConfirmDialog";

const INITIAL_VISIBLE_GROUP_CARDS = 24;
const VISIBLE_GROUP_CARD_STEP = 24;

const genderIcon = (gender) => {
  const value = (gender || "").toLowerCase();
  if (value.includes("female")) return "♀";
  if (value.includes("male")) return "♂";
  if (value.includes("non")) return "⚧";
  return "•";
};

const genderColor = (gender) => {
  const value = (gender || "").toLowerCase();
  if (value.includes("female")) return "#ec4899";
  if (value.includes("male")) return "#3b82f6";
  if (value.includes("non")) return "#8b5cf6";
  return "#94a3b8";
};

const gradientForGroup = (index) => {
  const gradients = [
    ["#f1dfbe", "#e7d0a6"],
    ["#efe2c8", "#e4d3ad"],
    ["#ead7b4", "#e0c596"],
    ["#f0e3ca", "#e7d6b2"],
    ["#ebddc1", "#dfcaa3"],
    ["#f2e5cf", "#e7d7b7"],
  ];
  const pair = gradients[index % gradients.length];
  return `linear-gradient(90deg, ${pair[0]}, ${pair[1]})`;
};

function GroupsPage({
  formError,
  classOptions,
  students,
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
}) {
  const { t } = useTranslation();
  const [showAdvancedHelp, setShowAdvancedHelp] = useState(false);
  const [constraintToDelete, setConstraintToDelete] = useState(null);
  const [visibleGroupCardCount, setVisibleGroupCardCount] = useState(INITIAL_VISIBLE_GROUP_CARDS);
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId") || "";
  const deferredStudents = useDeferredValue(students);
  const deferredGroups = useDeferredValue(groups);
  const deferredGroupMembers = useDeferredValue(groupMembers);
  const deferredGroupConstraints = useDeferredValue(groupConstraints);
  const deferredClassOptions = useDeferredValue(classOptions);

  const openSeparationsModal = () => {
    if (typeof window !== "undefined") {
      groupsScrollTopRef.current = window.scrollY;
    }
    setGroupsShowSeparations(true);
  };

  const closeSeparationsModal = () => {
    if (typeof window !== "undefined") {
      groupsScrollTopRef.current = window.scrollY;
    }
    setGroupsShowSeparations(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: groupsScrollTopRef.current, behavior: "auto" });
        });
      });
    }
  };

  useEffect(() => {
    if (!groupsShowSeparations || typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: groupsScrollTopRef.current, behavior: "auto" });
    });
  }, [groupsShowSeparations, groupsScrollTopRef]);

  useEffect(() => {
    if (!classId) return;
    setGroupGenForm((prev) => {
      if (prev.classId === classId) return prev;
      return { ...prev, classId };
    });
  }, [classId, setGroupGenForm]);

  const activeClassId = classId || groupGenForm.classId;
  const studentsById = useMemo(
    () => new Map(deferredStudents.map((student) => [student.id, student])),
    [deferredStudents]
  );
  const classStudents = useMemo(
    () =>
      activeClassId ? deferredStudents.filter((student) => student.class_id === activeClassId) : [],
    [activeClassId, deferredStudents]
  );
  const classStudentIdSet = useMemo(
    () => new Set(classStudents.map((student) => student.id)),
    [classStudents]
  );
  const classConstraintList = useMemo(
    () =>
      activeClassId
        ? deferredGroupConstraints.filter(
            (constraint) =>
              classStudentIdSet.has(constraint.student_a) && classStudentIdSet.has(constraint.student_b)
          )
        : deferredGroupConstraints,
    [activeClassId, classStudentIdSet, deferredGroupConstraints]
  );
  const constraintDisplayRows = useMemo(
    () =>
      classConstraintList.map((constraint) => ({
        constraint,
        studentA: studentsById.get(constraint.student_a) || null,
        studentB: studentsById.get(constraint.student_b) || null,
      })),
    [classConstraintList, studentsById]
  );
  const classGroups = useMemo(
    () => (activeClassId ? deferredGroups.filter((group) => group.class_id === activeClassId) : []),
    [activeClassId, deferredGroups]
  );
  const classGroupIdSet = useMemo(
    () => new Set(classGroups.map((group) => group.id)),
    [classGroups]
  );
  const classGroupMembers = useMemo(
    () =>
      classGroups.length
        ? deferredGroupMembers.filter((member) => classGroupIdSet.has(member.group_id))
        : [],
    [classGroupIdSet, classGroups.length, deferredGroupMembers]
  );
  const memberIdsByGroupId = useMemo(() => {
    const map = new Map();
    for (const member of classGroupMembers) {
      if (!map.has(member.group_id)) {
        map.set(member.group_id, []);
      }
      map.get(member.group_id).push(member.student_id);
    }
    return map;
  }, [classGroupMembers]);
  const grouped = useMemo(
    () =>
      classGroups.map((group) => {
        const memberIds = memberIdsByGroupId.get(group.id) || [];
        const members = memberIds
          .map((studentId) => studentsById.get(studentId))
          .filter((student) => student && classStudentIdSet.has(student.id));
        return { group, members };
      }),
    [classGroups, classStudentIdSet, memberIdsByGroupId, studentsById]
  );
  const visibleGrouped = grouped.slice(0, visibleGroupCardCount);
  const hasMoreGroups = visibleGrouped.length < grouped.length;
  const groupsDataIsPending =
    deferredStudents !== students ||
    deferredGroups !== groups ||
    deferredGroupMembers !== groupMembers ||
    deferredGroupConstraints !== groupConstraints;

  const groupSize = Number(groupGenForm.size) || 4;
  const expectedGroupCount =
    classStudents.length > 0 ? Math.ceil(classStudents.length / groupSize) : 0;
  const handleClassChange = useCallback(
    (nextClassId) => {
      startTransition(() => {
        setGroupGenForm((prev) => ({ ...prev, classId: nextClassId }));
        setVisibleGroupCardCount(INITIAL_VISIBLE_GROUP_CARDS);
      });
    },
    [setGroupGenForm]
  );

  const adjustGroupSize = useCallback(
    (delta) => {
      startTransition(() => {
        setGroupGenForm((prev) => {
          const currentSize = Number(prev.size) || 4;
          const nextSize = Math.max(2, Math.min(10, currentSize + delta));
          return { ...prev, size: String(nextSize) };
        });
      });
    },
    [setGroupGenForm]
  );

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel groups-page">
        <div className="groups-header-card">
          <div className="groups-header-icon">👥</div>
          <h2>{t("groups.title")}</h2>
          <p className="muted">{t("groups.subtitle")}</p>
          <div className="groups-header-info">
            <div>
              <span className="muted">{t("groups.stats.students")}</span>
              <strong>{classStudents.length || "—"}</strong>
            </div>
            <div>
              <span className="muted">{t("groups.stats.groups")}</span>
              <strong>{classGroups.length || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="groups-controls-card">
          <div className="groups-controls-header">
            <h3>{t("groups.settings.title")}</h3>
            {!classId && (
              <select
                value={groupGenForm.classId}
                onChange={(event) => handleClassChange(event.target.value)}
              >
                <option value="">{t("groups.settings.selectClass")}</option>
                {deferredClassOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="groups-size-row">
            <div className="groups-size-display">
              <div className="muted">{t("groups.settings.studentsPerGroup")}</div>
              <div className="groups-size-value">{groupSize}</div>
            </div>
            <div className="groups-size-controls">
              <button
                type="button"
                onClick={() => adjustGroupSize(-1)}
                disabled={groupSize <= 2}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => adjustGroupSize(1)}
                disabled={groupSize >= 10}
              >
                +
              </button>
            </div>
          </div>

          {classStudents.length > 0 && (
            <div className="groups-info-row">
              {t("groups.settings.expectedGroups", { count: expectedGroupCount })}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateGroups}
            className={`groups-generate-btn ${isGeneratingGroups ? "button-with-spinner" : ""}`}
            disabled={isGeneratingGroups}
            aria-busy={isGeneratingGroups}
          >
            {isGeneratingGroups && <span className="inline-spinner" aria-hidden="true" />}
            {classGroups.length ? t("groups.actions.regenerateGroups") : t("groups.actions.generateGroups")}
          </button>
        </div>

        <div className="groups-advanced-card">
          <div className="groups-advanced-header">
            <h3>{t("groups.advanced.title")}</h3>
            <button
              type="button"
              className="link"
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
            <div className="groups-advanced-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={groupGenForm.balanceGender}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({ ...prev, balanceGender: event.target.checked }))
                  }
                />
                {t("groups.advanced.balanceGender")}
              </label>
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
              <button type="button" className="link" onClick={openSeparationsModal}>
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
            <div className="groups-empty-title">{t("groups.empty.title")}</div>
            <div className="muted">{t("groups.empty.description")}</div>
          </div>
        ) : (
          <div className="groups-results">
            <div className="groups-results-header">
              <h3>{t("groups.results.title")}</h3>
            </div>
            <div className="groups-grid">
              {visibleGrouped.map(({ group, members }, index) => (
                <div key={group.id} className="group-card">
                  <div className="group-card-header" style={{ background: gradientForGroup(index) }}>
                    <span>{t("groups.results.groupN", { number: index + 1 })}</span>
                    <span className="group-card-count">{members.length}</span>
                  </div>
                  <div className="group-card-body">
                    {members.map((student) => (
                      <div key={student.id} className="group-student">
                        <span style={{ color: genderColor(student.gender) }}>
                          {genderIcon(student.gender)}
                        </span>
                        <span>
                          {student.first_name} {student.last_name}
                        </span>
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
                onClick={() =>
                  startTransition(() => {
                    setVisibleGroupCardCount((current) =>
                      Math.min(current + VISIBLE_GROUP_CARD_STEP, grouped.length)
                    );
                  })
                }
              >
                {t("groups.showMore")}
              </button>
            )}
          </div>
        )}
      </section>

      {groupsShowSeparations && (
        <div className="modal-overlay">
          <div className="modal-card separations-modal">
            <h3>{t("groups.separations.title")}</h3>
            <div className="grid">
              <label className="stack">
                <span>{t("groups.separations.studentA")}</span>
                <select
                  value={constraintForm.studentA}
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
              <label className="stack">
                <span>{t("groups.separations.studentB")}</span>
                <select
                  value={constraintForm.studentB}
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
              <button type="button" className="separations-add-btn" onClick={handleAddConstraint}>
                {t("groups.separations.add")}
              </button>
            </div>
            {classConstraintList.length > 0 && (
              <ul className="list">
                {constraintDisplayRows.map(({ constraint, studentA, studentB }) => {
                  return (
                    <li key={constraint.id}>
                      <div className="list-row">
                        <span>
                          {studentA ? `${studentA.first_name} ${studentA.last_name}` : t("groups.separations.studentFallback")}
                          {" ↔ "}
                          {studentB ? `${studentB.first_name} ${studentB.last_name}` : t("groups.separations.studentFallback")}
                        </span>
                        <button
                          type="button"
                          className="link danger separation-delete-btn"
                          onClick={() => setConstraintToDelete(constraint)}
                        >
                          {t("common.actions.delete")}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
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
        description="Delete this separation rule?"
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
