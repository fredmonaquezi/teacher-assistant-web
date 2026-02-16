import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId") || "";

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
  const classStudents = activeClassId
    ? students.filter((student) => student.class_id === activeClassId)
    : [];
  const classStudentIdSet = new Set(classStudents.map((student) => student.id));
  const classConstraintList = activeClassId
    ? groupConstraints.filter(
        (constraint) =>
          classStudentIdSet.has(constraint.student_a) && classStudentIdSet.has(constraint.student_b)
      )
    : groupConstraints;
  const classGroups = activeClassId
    ? groups.filter((group) => group.class_id === activeClassId)
    : [];
  const classGroupMembers = classGroups.length
    ? groupMembers.filter((member) => classGroups.some((group) => group.id === member.group_id))
    : [];

  const grouped = classGroups.map((group) => {
    const memberIds = classGroupMembers
      .filter((member) => member.group_id === group.id)
      .map((member) => member.student_id);
    const members = classStudents.filter((student) => memberIds.includes(student.id));
    return { group, members };
  });

  const groupSize = Number(groupGenForm.size) || 4;
  const expectedGroupCount =
    classStudents.length > 0 ? Math.ceil(classStudents.length / groupSize) : 0;

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

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel groups-page">
        <div className="groups-header-card">
          <div className="groups-header-icon">👥</div>
          <h2>Smart Group Generator</h2>
          <p className="muted">Create balanced student groups with advanced options.</p>
          <div className="groups-header-info">
            <div>
              <span className="muted">Students</span>
              <strong>{classStudents.length || "—"}</strong>
            </div>
            <div>
              <span className="muted">Groups</span>
              <strong>{classGroups.length || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="groups-controls-card">
          <div className="groups-controls-header">
            <h3>Group Settings</h3>
            {!classId && (
              <select
                value={groupGenForm.classId}
                onChange={(event) =>
                  setGroupGenForm((prev) => ({ ...prev, classId: event.target.value }))
                }
              >
                <option value="">Select class</option>
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="groups-size-row">
            <div className="groups-size-display">
              <div className="muted">Students per group</div>
              <div className="groups-size-value">{groupSize}</div>
            </div>
            <div className="groups-size-controls">
              <button
                type="button"
                onClick={() =>
                  setGroupGenForm((prev) => ({
                    ...prev,
                    size: String(Math.max(2, groupSize - 1)),
                  }))
                }
                disabled={groupSize <= 2}
              >
                −
              </button>
              <button
                type="button"
                onClick={() =>
                  setGroupGenForm((prev) => ({
                    ...prev,
                    size: String(Math.min(10, groupSize + 1)),
                  }))
                }
                disabled={groupSize >= 10}
              >
                +
              </button>
            </div>
          </div>

          {classStudents.length > 0 && (
            <div className="groups-info-row">
              This will create approximately {expectedGroupCount} groups.
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
            {classGroups.length ? "Regenerate Groups" : "Generate Groups"}
          </button>
        </div>

        <div className="groups-advanced-card">
          <div className="groups-advanced-header">
            <h3>Advanced Options</h3>
            <button type="button" className="link" onClick={() => setGroupsShowAdvanced((prev) => !prev)}>
              {groupsShowAdvanced ? "Hide" : "Show"}
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
                Balance Gender
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={groupGenForm.balanceAbility}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({ ...prev, balanceAbility: event.target.checked }))
                  }
                />
                Balance Academic Levels
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={groupGenForm.pairSupportPartners}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({ ...prev, pairSupportPartners: event.target.checked }))
                  }
                />
                Pair Learning Partners
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
                Respect Separation Rules
              </label>
              <button type="button" className="link" onClick={openSeparationsModal}>
                Separations
              </button>
              <p className="muted groups-option-help">
                Academic levels are estimated from recent gradebook scores for this class.
              </p>
            </div>
          )}
        </div>

        {grouped.length === 0 ? (
          <div className="groups-empty">
            <div className="groups-empty-icon">✨</div>
            <div className="groups-empty-title">No groups yet</div>
            <div className="muted">Configure your settings and click Generate Groups.</div>
          </div>
        ) : (
          <div className="groups-results">
            <div className="groups-results-header">
              <h3>Generated Groups</h3>
            </div>
            <div className="groups-grid">
              {grouped.map(({ group, members }, index) => (
                <div key={group.id} className="group-card">
                  <div className="group-card-header" style={{ background: gradientForGroup(index) }}>
                    <span>Group {index + 1}</span>
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
                        {student.needs_help && <span className="group-need">✋</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {groupsShowSeparations && (
        <div className="modal-overlay">
          <div className="modal-card separations-modal">
            <h3>Separation Rules</h3>
            <div className="grid">
              <label className="stack">
                <span>Student A</span>
                <select
                  value={constraintForm.studentA}
                  onChange={(event) =>
                    setConstraintForm((prev) => ({ ...prev, studentA: event.target.value }))
                  }
                  required
                >
                  <option value="">Select student</option>
                  {classStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>Student B</span>
                <select
                  value={constraintForm.studentB}
                  onChange={(event) =>
                    setConstraintForm((prev) => ({ ...prev, studentB: event.target.value }))
                  }
                  required
                >
                  <option value="">Select student</option>
                  {classStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="separations-add-btn" onClick={handleAddConstraint}>
                Add separation
              </button>
            </div>
            {classConstraintList.length > 0 && (
              <ul className="list">
                {classConstraintList.map((constraint) => {
                  const studentA = students.find((item) => item.id === constraint.student_a);
                  const studentB = students.find((item) => item.id === constraint.student_b);
                  return (
                    <li key={constraint.id}>
                      <div className="list-row">
                        <span>
                          {studentA ? `${studentA.first_name} ${studentA.last_name}` : "Student"}
                          {" ↔ "}
                          {studentB ? `${studentB.first_name} ${studentB.last_name}` : "Student"}
                        </span>
                        <button
                          type="button"
                          className="link danger separation-delete-btn"
                          onClick={() => handleDeleteConstraint(constraint.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="modal-actions separations-actions">
              <button type="button" className="secondary" onClick={closeSeparationsModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GroupsPage;
