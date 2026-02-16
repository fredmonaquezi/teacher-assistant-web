import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";

function RunningRecordsPage({
  formError,
  handleCreateRunningRecord,
  handleDeleteRunningRecord,
  runningRecordForm,
  setRunningRecordForm,
  students,
  classes,
  loading,
  runningRecords,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const classLookup = useMemo(() => {
    const map = new Map();
    classes.forEach((classItem) => map.set(classItem.id, classItem));
    return map;
  }, [classes]);

  const studentLookup = useMemo(() => {
    const map = new Map();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const getStudentName = (studentId) => {
    const student = studentLookup.get(studentId);
    return student ? `${student.first_name} ${student.last_name}` : "Unknown Student";
  };

  const classDisplayName = (classId) => {
    if (!classId) return "No Class";
    const classItem = classLookup.get(classId);
    if (!classItem) return "No Class";
    if (!classItem.grade_level) return classItem.name;
    return `${classItem.name} (${classItem.grade_level})`;
  };

  const groupedStudents = (() => {
    const groups = new Map();
    students.forEach((student) => {
      const key = classDisplayName(student.class_id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(student);
    });
    return [...groups.entries()]
      .map(([className, classStudents]) => ({
        className,
        students: [...classStudents].sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        ),
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  })();
  const classOptions = classes
    .map((classItem) => ({
      id: classItem.id,
      label: classItem.grade_level ? `${classItem.name} (${classItem.grade_level})` : classItem.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const isDateInRange = (recordDate, rangeKey) => {
    if (!recordDate || rangeKey === "all") return true;
    const date = new Date(`${recordDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
    if (rangeKey === "7d") return diffDays >= 0 && diffDays <= 7;
    if (rangeKey === "30d") return diffDays >= 0 && diffDays <= 30;
    if (rangeKey === "term") {
      const year = today.getFullYear();
      const isFirstHalf = today.getMonth() <= 5;
      const termStart = new Date(year, isFirstHalf ? 0 : 6, 1);
      const termEnd = new Date(year, isFirstHalf ? 5 : 11, isFirstHalf ? 30 : 31);
      return date >= termStart && date <= termEnd;
    }
    return true;
  };

  const normalizeLevel = (levelValue) => {
    const value = (levelValue || "").toLowerCase();
    if (value.startsWith("independent")) return "Independent (95-100%)";
    if (value.startsWith("instructional")) return "Instructional (90-94%)";
    if (value.startsWith("frustration")) return "Frustration (<90%)";
    return "Frustration (<90%)";
  };

  const levelMeta = (levelValue) => {
    const normalized = normalizeLevel(levelValue);
    if (normalized === "Independent (95-100%)") {
      return { short: "Independent", color: "#16a34a", tint: "#dcfce7", badge: "✓" };
    }
    if (normalized === "Instructional (90-94%)") {
      return { short: "Instructional", color: "#ea580c", tint: "#ffedd5", badge: "📘" };
    }
    return { short: "Frustration", color: "#dc2626", tint: "#fee2e2", badge: "⚠" };
  };

  const totalRecords = runningRecords.length;
  const studentsAssessed = new Set(runningRecords.map((record) => record.student_id).filter(Boolean)).size;
  const avgAccuracy = totalRecords
    ? (
        runningRecords.reduce((sum, record) => sum + Number(record.accuracy_pct || 0), 0) /
        totalRecords
      ).toFixed(1)
    : "0.0";

  const filteredRecords = (() => {
    return runningRecords.filter((record) => {
      const student = studentLookup.get(record.student_id);
      if (selectedClassFilter && student?.class_id !== selectedClassFilter) return false;
      if (selectedStudentFilter && record.student_id !== selectedStudentFilter) return false;
      if (selectedLevelFilter && normalizeLevel(record.level) !== selectedLevelFilter) return false;
      if (!isDateInRange(record.record_date, selectedDateRange)) return false;
      if (searchText.trim()) {
        const query = searchText.trim().toLowerCase();
        const studentName = getStudentName(record.student_id).toLowerCase();
        const textTitle = (record.text_title || "").toLowerCase();
        if (!studentName.includes(query) && !textTitle.includes(query)) return false;
      }
      return true;
    });
  })();

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = new Date(`${a.record_date || "1970-01-01"}T00:00:00`).getTime();
    const dateB = new Date(`${b.record_date || "1970-01-01"}T00:00:00`).getTime();
    const accA = Number(a.accuracy_pct || 0);
    const accB = Number(b.accuracy_pct || 0);
    if (sortBy === "date_asc") return dateA - dateB;
    if (sortBy === "accuracy_desc") return accB - accA;
    if (sortBy === "accuracy_asc") return accA - accB;
    return dateB - dateA;
  });

  const filteredAvgAccuracy = sortedRecords.length
    ? (
        sortedRecords.reduce((sum, record) => sum + Number(record.accuracy_pct || 0), 0) /
        sortedRecords.length
      ).toFixed(1)
    : "0.0";
  const filteredLevelCounts = sortedRecords.reduce(
    (acc, record) => {
      const level = normalizeLevel(record.level);
      if (level === "Independent (95-100%)") acc.independent += 1;
      else if (level === "Instructional (90-94%)") acc.instructional += 1;
      else acc.frustration += 1;
      return acc;
    },
    { independent: 0, instructional: 0, frustration: 0 }
  );

  const totalWords = runningRecordForm.totalWords ? Number(runningRecordForm.totalWords) : 0;
  const errors = runningRecordForm.errors ? Number(runningRecordForm.errors) : 0;
  const selfCorrections = runningRecordForm.selfCorrections ? Number(runningRecordForm.selfCorrections) : 0;
  const liveAccuracy = totalWords > 0 ? ((totalWords - errors) / totalWords) * 100 : 0;
  const liveLevel =
    liveAccuracy >= 95
      ? "Independent (95-100%)"
      : liveAccuracy >= 90
        ? "Instructional (90-94%)"
        : "Frustration (<90%)";
  const liveRatio =
    selfCorrections > 0 ? `1:${(((errors + selfCorrections) / selfCorrections) || 0).toFixed(1)}` : null;

  const onCreateRecord = async (event) => {
    const created = await handleCreateRunningRecord(event);
    if (created) {
      setShowCreateModal(false);
      setShowCalendar(false);
    }
  };

  const selectedRecordLevel = selectedRecord ? levelMeta(selectedRecord.level) : null;
  const selectedRecordDate = selectedRecord?.record_date
    ? new Date(`${selectedRecord.record_date}T00:00:00`)
    : null;

  const downloadBlob = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const exportRunningRecordsCsv = () => {
    if (sortedRecords.length === 0) return;
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const header = [
      "Student",
      "Class",
      "Date",
      "Text Title",
      "Level",
      "Accuracy %",
      "Total Words",
      "Errors",
      "Self Corrections",
      "SC Ratio",
      "Notes",
    ];
    const rows = sortedRecords.map((record) => {
      const student = studentLookup.get(record.student_id);
      return [
        `${student?.first_name || ""} ${student?.last_name || ""}`.trim() || "Unknown Student",
        classDisplayName(student?.class_id),
        record.record_date || "",
        record.text_title || "",
        normalizeLevel(record.level),
        record.accuracy_pct ?? "",
        record.total_words ?? "",
        record.errors ?? "",
        record.self_corrections ?? "",
        record.sc_ratio ?? "",
        record.notes || "",
      ].map(escape).join(",");
    });
    const csv = [header.map(escape).join(","), ...rows].join("\n");
    downloadBlob(csv, `running-records-${format(new Date(), "yyyyMMdd")}.csv`, "text/csv;charset=utf-8;");
  };

  const exportRunningRecordsJson = () => {
    if (sortedRecords.length === 0) return;
    const payload = sortedRecords.map((record) => {
      const student = studentLookup.get(record.student_id);
      return {
        id: record.id,
        student_id: record.student_id,
        student_name: `${student?.first_name || ""} ${student?.last_name || ""}`.trim(),
        class_name: classDisplayName(student?.class_id),
        record_date: record.record_date || null,
        text_title: record.text_title || "",
        level: normalizeLevel(record.level),
        accuracy_pct: Number(record.accuracy_pct || 0),
        total_words: Number(record.total_words || 0),
        errors: Number(record.errors || 0),
        self_corrections: Number(record.self_corrections || 0),
        sc_ratio: record.sc_ratio,
        notes: record.notes || "",
      };
    });
    downloadBlob(
      JSON.stringify(payload, null, 2),
      `running-records-${format(new Date(), "yyyyMMdd")}.json`,
      "application/json;charset=utf-8;"
    );
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel running-records-panel">
        <div className="running-records-title">
          <h2>Running Records</h2>
          <div className="running-records-actions">
            <button type="button" className="secondary" onClick={exportRunningRecordsCsv} disabled={sortedRecords.length === 0}>
              Export CSV
            </button>
            <button type="button" className="secondary" onClick={exportRunningRecordsJson} disabled={sortedRecords.length === 0}>
              Export JSON
            </button>
            <button type="button" onClick={() => setShowCreateModal(true)}>
              + New Record
            </button>
          </div>
        </div>

        <div className="running-records-stats">
          <article className="rr-stat">
            <div className="rr-stat-icon">📄</div>
            <div className="rr-stat-value">{totalRecords}</div>
            <div className="rr-stat-label">Total Records</div>
          </article>
          <article className="rr-stat">
            <div className="rr-stat-icon">👥</div>
            <div className="rr-stat-value">{studentsAssessed}</div>
            <div className="rr-stat-label">Students Assessed</div>
          </article>
          <article className="rr-stat">
            <div className="rr-stat-icon">📈</div>
            <div className="rr-stat-value">{avgAccuracy}%</div>
            <div className="rr-stat-label">Avg. Accuracy</div>
          </article>
          <article className="rr-stat">
            <div className="rr-stat-icon">🎯</div>
            <div className="rr-stat-value">{filteredAvgAccuracy}%</div>
            <div className="rr-stat-label">Filtered Avg.</div>
          </article>
        </div>

        <div className="rr-level-summary">
          <span className="independent">Independent: {filteredLevelCounts.independent}</span>
          <span className="instructional">Instructional: {filteredLevelCounts.instructional}</span>
          <span className="frustration">Frustration: {filteredLevelCounts.frustration}</span>
        </div>

        <div className="running-records-filters">
          <label className="stack">
            <span>Class</span>
            <select
              value={selectedClassFilter}
              onChange={(event) => {
                setSelectedClassFilter(event.target.value);
                setSelectedStudentFilter("");
              }}
            >
              <option value="">All Classes</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>Student</span>
            <select
              value={selectedStudentFilter}
              onChange={(event) => setSelectedStudentFilter(event.target.value)}
            >
              <option value="">All Students</option>
              {students
                .filter((student) => !selectedClassFilter || student.class_id === selectedClassFilter)
                .map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>Search</span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Student or text title"
            />
          </label>
          <label className="stack">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="accuracy_desc">Accuracy high-low</option>
              <option value="accuracy_asc">Accuracy low-high</option>
            </select>
          </label>
          <div className="rr-date-quick">
            {[
              { id: "all", label: "All time" },
              { id: "7d", label: "Last 7 days" },
              { id: "30d", label: "Last 30 days" },
              { id: "term", label: "This term" },
            ].map((range) => (
              <button
                key={range.id}
                type="button"
                className={`rr-date-chip ${selectedDateRange === range.id ? "active" : ""}`}
                onClick={() => setSelectedDateRange(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="rr-level-filters">
            {[
              "Independent (95-100%)",
              "Instructional (90-94%)",
              "Frustration (<90%)",
            ].map((level) => {
              const meta = levelMeta(level);
              const isActive = selectedLevelFilter === level;
              return (
                <button
                  type="button"
                  key={level}
                  className={`rr-level-chip ${isActive ? "active" : ""}`}
                  style={{ "--chip-color": meta.color, "--chip-bg": meta.tint }}
                  onClick={() => setSelectedLevelFilter(isActive ? "" : level)}
                >
                  {meta.short}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSelectedClassFilter("");
              setSelectedStudentFilter("");
              setSelectedLevelFilter("");
              setSelectedDateRange("all");
              setSearchText("");
              setSortBy("date_desc");
            }}
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading running records...</p>
        ) : sortedRecords.length === 0 ? (
          <div className="rr-empty">
            <h3>No Running Records Yet</h3>
            <p className="muted">Create your first running record to start tracking reading growth.</p>
            <button type="button" onClick={() => setShowCreateModal(true)}>
              Create First Record
            </button>
          </div>
        ) : (
          <div className="rr-cards">
            {sortedRecords.map((record) => {
              const studentName = getStudentName(record.student_id);
              const student = studentLookup.get(record.student_id);
              const meta = levelMeta(record.level);
              return (
                <button
                  type="button"
                  key={record.id}
                  className="rr-card"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="rr-card-header">
                    <div>
                      <p className="rr-card-student">{studentName}</p>
                      <p className="rr-card-title">{record.text_title || "Untitled Text"}</p>
                      <p className="rr-card-class">{classDisplayName(student?.class_id)}</p>
                    </div>
                    <div className="rr-card-date">{record.record_date || "No date"}</div>
                  </div>
                  <div className="rr-mini-grid">
                    <article>
                      <strong style={{ color: meta.color }}>
                        {record.accuracy_pct !== null ? `${record.accuracy_pct}%` : "--"}
                      </strong>
                      <span>Accuracy</span>
                    </article>
                    <article>
                      <strong>{record.errors ?? 0}</strong>
                      <span>Errors</span>
                    </article>
                    <article>
                      <strong>{record.self_corrections ?? 0}</strong>
                      <span>SC</span>
                    </article>
                    <article>
                      <strong>{record.total_words ?? 0}</strong>
                      <span>Words</span>
                    </article>
                  </div>
                  <div className="rr-level-badge" style={{ color: meta.color, background: meta.tint }}>
                    <span>{meta.badge}</span>
                    <span>{meta.short}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card running-records-modal">
            <div className="rr-modal-header">
              <div>
                <h3>New Running Record</h3>
                <p className="muted">Record reading assessment data</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowCalendar(false);
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={onCreateRecord} className="grid">
              <label className="stack">
                <span>Student</span>
                <select
                  value={runningRecordForm.studentId}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, studentId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select a student</option>
                  {groupedStudents.map((group) => (
                    <optgroup key={group.className} label={group.className}>
                      {group.students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="stack date-picker">
                <span>Date</span>
                <input
                  type="text"
                  value={runningRecordForm.recordDate}
                  onClick={() => setShowCalendar(true)}
                  onFocus={() => setShowCalendar(true)}
                  readOnly
                  placeholder="Click to choose"
                  required
                />
                {showCalendar && (
                  <div className="calendar-popover">
                    <DayPicker
                      mode="single"
                      selected={runningRecordForm.recordDate ? parseISO(runningRecordForm.recordDate) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        setRunningRecordForm((prev) => ({
                          ...prev,
                          recordDate: format(date, "yyyy-MM-dd"),
                        }));
                        setShowCalendar(false);
                      }}
                    />
                  </div>
                )}
              </label>
              <label className="stack">
                <span>Text Title</span>
                <input
                  value={runningRecordForm.textTitle}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, textTitle: event.target.value }))
                  }
                  placeholder="e.g., The Cat in the Hat"
                />
              </label>
              <label className="stack">
                <span>Total Words</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={runningRecordForm.totalWords}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, totalWords: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="stack">
                <span>Errors</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={runningRecordForm.errors}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, errors: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="stack">
                <span>Self-Corrections (SC)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={runningRecordForm.selfCorrections}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, selfCorrections: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="stack rr-notes-field">
                <span>Notes (Optional)</span>
                <textarea
                  rows="3"
                  value={runningRecordForm.notes}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Optional notes"
                />
              </label>
              {totalWords > 0 && (
                <div className="rr-live-results">
                  <h4>Results</h4>
                  <p>
                    Accuracy: <strong>{liveAccuracy.toFixed(1)}%</strong>
                  </p>
                  <p>
                    Reading Level: <strong>{levelMeta(liveLevel).short}</strong>
                  </p>
                  {liveRatio && (
                    <p>
                      Self-Correction Ratio: <strong>{liveRatio}</strong>
                    </p>
                  )}
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowCalendar(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-card running-records-detail-modal">
            <div className="rr-modal-header">
              <div>
                <h3>Running Record</h3>
                <p className="muted">{getStudentName(selectedRecord.student_id)}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="rr-detail-block">
              <p className="rr-detail-title">{selectedRecord.text_title || "Untitled Text"}</p>
              <p className="muted">{selectedRecordDate ? format(selectedRecordDate, "PPP") : "No date"}</p>
            </div>
            <div
              className="rr-detail-accuracy"
              style={{ background: selectedRecordLevel?.tint, color: selectedRecordLevel?.color }}
            >
              <div>
                <p className="muted">Accuracy</p>
                <p>{selectedRecord.accuracy_pct ?? 0}%</p>
              </div>
              <div>{selectedRecordLevel?.short}</div>
            </div>
            <div className="rr-detail-grid">
              <article>
                <span>Total Words</span>
                <strong>{selectedRecord.total_words ?? 0}</strong>
              </article>
              <article>
                <span>Errors</span>
                <strong>{selectedRecord.errors ?? 0}</strong>
              </article>
              <article>
                <span>Self-Corrections</span>
                <strong>{selectedRecord.self_corrections ?? 0}</strong>
              </article>
              <article>
                <span>SC Ratio</span>
                <strong>{selectedRecord.sc_ratio !== null ? `1:${selectedRecord.sc_ratio}` : "N/A"}</strong>
              </article>
            </div>
            {!!selectedRecord.notes && (
              <div className="rr-detail-notes">
                <h4>Notes</h4>
                <p>{selectedRecord.notes}</p>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setSelectedRecord(null)}>
                Done
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  await handleDeleteRunningRecord(selectedRecord.id);
                  setSelectedRecord(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default RunningRecordsPage;
