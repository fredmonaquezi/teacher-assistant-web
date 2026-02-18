import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt-BR" ? ptBR : enUS;
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
    return student ? `${student.first_name} ${student.last_name}` : t("runningRecords.unknownStudent");
  };

  const classDisplayName = (classId) => {
    if (!classId) return t("runningRecords.noClass");
    const classItem = classLookup.get(classId);
    if (!classItem) return t("runningRecords.noClass");
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
      return { short: t("runningRecords.levels.independent.short"), color: "#16a34a", tint: "#dcfce7", badge: "✓" };
    }
    if (normalized === "Instructional (90-94%)") {
      return { short: t("runningRecords.levels.instructional.short"), color: "#ea580c", tint: "#ffedd5", badge: "📘" };
    }
    return { short: t("runningRecords.levels.frustration.short"), color: "#dc2626", tint: "#fee2e2", badge: "⚠" };
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
      t("runningRecords.export.student"),
      t("runningRecords.export.class"),
      t("runningRecords.export.date"),
      t("runningRecords.export.textTitle"),
      t("runningRecords.export.level"),
      t("runningRecords.export.accuracy"),
      t("runningRecords.export.totalWords"),
      t("runningRecords.export.errors"),
      t("runningRecords.export.selfCorrections"),
      t("runningRecords.export.scRatio"),
      t("runningRecords.export.notes"),
    ];
    const rows = sortedRecords.map((record) => {
      const student = studentLookup.get(record.student_id);
      return [
        `${student?.first_name || ""} ${student?.last_name || ""}`.trim() || t("runningRecords.unknownStudent"),
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
          <h2>{t("runningRecords.title")}</h2>
          <div className="running-records-actions">
            <button type="button" className="secondary" onClick={exportRunningRecordsCsv} disabled={sortedRecords.length === 0}>
              {t("runningRecords.exportCsv")}
            </button>
            <button type="button" className="secondary" onClick={exportRunningRecordsJson} disabled={sortedRecords.length === 0}>
              {t("runningRecords.exportJson")}
            </button>
            <button type="button" onClick={() => setShowCreateModal(true)}>
              {t("runningRecords.newRecord")}
            </button>
          </div>
        </div>

        <div className="running-records-stats">
          <article className="rr-stat">
            <div className="rr-stat-icon">📄</div>
            <div className="rr-stat-value">{totalRecords}</div>
            <div className="rr-stat-label">{t("runningRecords.stats.totalRecords")}</div>
          </article>
          <article className="rr-stat">
            <div className="rr-stat-icon">👥</div>
            <div className="rr-stat-value">{studentsAssessed}</div>
            <div className="rr-stat-label">{t("runningRecords.stats.studentsAssessed")}</div>
          </article>
          <article className="rr-stat">
            <div className="rr-stat-icon">📈</div>
            <div className="rr-stat-value">{avgAccuracy}%</div>
            <div className="rr-stat-label">{t("runningRecords.stats.avgAccuracy")}</div>
          </article>
          <article className="rr-stat">
            <div className="rr-stat-icon">🎯</div>
            <div className="rr-stat-value">{filteredAvgAccuracy}%</div>
            <div className="rr-stat-label">{t("runningRecords.stats.filteredAvg")}</div>
          </article>
        </div>

        <div className="rr-level-summary">
          <span className="independent">{t("runningRecords.levels.independent.short")}: {filteredLevelCounts.independent}</span>
          <span className="instructional">{t("runningRecords.levels.instructional.short")}: {filteredLevelCounts.instructional}</span>
          <span className="frustration">{t("runningRecords.levels.frustration.short")}: {filteredLevelCounts.frustration}</span>
        </div>

        <div className="running-records-filters">
          <label className="stack">
            <span>{t("runningRecords.filters.class")}</span>
            <select
              value={selectedClassFilter}
              onChange={(event) => {
                setSelectedClassFilter(event.target.value);
                setSelectedStudentFilter("");
              }}
            >
              <option value="">{t("runningRecords.filters.allClasses")}</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>{t("runningRecords.filters.student")}</span>
            <select
              value={selectedStudentFilter}
              onChange={(event) => setSelectedStudentFilter(event.target.value)}
            >
              <option value="">{t("runningRecords.filters.allStudents")}</option>
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
            <span>{t("runningRecords.filters.search")}</span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={t("runningRecords.filters.searchPlaceholder")}
            />
          </label>
          <label className="stack">
            <span>{t("runningRecords.filters.sort")}</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="date_desc">{t("runningRecords.filters.sortNewest")}</option>
              <option value="date_asc">{t("runningRecords.filters.sortOldest")}</option>
              <option value="accuracy_desc">{t("runningRecords.filters.sortAccuracyHighLow")}</option>
              <option value="accuracy_asc">{t("runningRecords.filters.sortAccuracyLowHigh")}</option>
            </select>
          </label>
          <div className="rr-date-quick">
            {[
              { id: "all", label: t("runningRecords.filters.allTime") },
              { id: "7d", label: t("runningRecords.filters.last7Days") },
              { id: "30d", label: t("runningRecords.filters.last30Days") },
              { id: "term", label: t("runningRecords.filters.thisTerm") },
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
            {t("runningRecords.filters.clear")}
          </button>
        </div>

        {loading ? (
          <p className="muted">{t("runningRecords.loading")}</p>
        ) : sortedRecords.length === 0 ? (
          <div className="rr-empty">
            <h3>{t("runningRecords.empty.title")}</h3>
            <p className="muted">{t("runningRecords.empty.description")}</p>
            <button type="button" onClick={() => setShowCreateModal(true)}>
              {t("runningRecords.empty.createFirst")}
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
                      <p className="rr-card-title">{record.text_title || t("runningRecords.untitledText")}</p>
                      <p className="rr-card-class">{classDisplayName(student?.class_id)}</p>
                    </div>
                    <div className="rr-card-date">{record.record_date || t("runningRecords.noDate")}</div>
                  </div>
                  <div className="rr-mini-grid">
                    <article>
                      <strong style={{ color: meta.color }}>
                        {record.accuracy_pct !== null ? `${record.accuracy_pct}%` : "--"}
                      </strong>
                      <span>{t("runningRecords.metrics.accuracy")}</span>
                    </article>
                    <article>
                      <strong>{record.errors ?? 0}</strong>
                      <span>{t("runningRecords.metrics.errors")}</span>
                    </article>
                    <article>
                      <strong>{record.self_corrections ?? 0}</strong>
                      <span>{t("runningRecords.metrics.sc")}</span>
                    </article>
                    <article>
                      <strong>{record.total_words ?? 0}</strong>
                      <span>{t("runningRecords.metrics.words")}</span>
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
                <h3>{t("runningRecords.modal.newTitle")}</h3>
                <p className="muted">{t("runningRecords.modal.newDescription")}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowCalendar(false);
                }}
                aria-label={t("common.actions.close")}
              >
                ×
              </button>
            </div>
            <form onSubmit={onCreateRecord} className="grid">
              <label className="stack">
                <span>{t("runningRecords.modal.student")}</span>
                <select
                  value={runningRecordForm.studentId}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, studentId: event.target.value }))
                  }
                  required
                >
                  <option value="">{t("runningRecords.modal.selectStudent")}</option>
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
                <span>{t("runningRecords.modal.date")}</span>
                <input
                  type="text"
                  value={runningRecordForm.recordDate}
                  onClick={() => setShowCalendar(true)}
                  onFocus={() => setShowCalendar(true)}
                  readOnly
                  placeholder={t("runningRecords.modal.clickToChoose")}
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
                <span>{t("runningRecords.modal.textTitle")}</span>
                <input
                  value={runningRecordForm.textTitle}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, textTitle: event.target.value }))
                  }
                  placeholder={t("runningRecords.modal.textTitlePlaceholder")}
                />
              </label>
              <label className="stack">
                <span>{t("runningRecords.modal.totalWords")}</span>
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
                <span>{t("runningRecords.modal.errors")}</span>
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
                <span>{t("runningRecords.modal.selfCorrections")}</span>
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
                <span>{t("runningRecords.modal.notesOptional")}</span>
                <textarea
                  rows="3"
                  value={runningRecordForm.notes}
                  onChange={(event) =>
                    setRunningRecordForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder={t("runningRecords.modal.notesPlaceholder")}
                />
              </label>
              {totalWords > 0 && (
                <div className="rr-live-results">
                  <h4>{t("runningRecords.modal.results")}</h4>
                  <p>
                    {t("runningRecords.metrics.accuracy")}: <strong>{liveAccuracy.toFixed(1)}%</strong>
                  </p>
                  <p>
                    {t("runningRecords.modal.readingLevel")}: <strong>{levelMeta(liveLevel).short}</strong>
                  </p>
                  {liveRatio && (
                    <p>
                      {t("runningRecords.modal.selfCorrectionRatio")}: <strong>{liveRatio}</strong>
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
                  {t("common.actions.cancel")}
                </button>
                <button type="submit">{t("common.actions.save")}</button>
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
                <h3>{t("runningRecords.detail.title")}</h3>
                <p className="muted">{getStudentName(selectedRecord.student_id)}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedRecord(null)}
                aria-label={t("common.actions.close")}
              >
                ×
              </button>
            </div>
            <div className="rr-detail-block">
              <p className="rr-detail-title">{selectedRecord.text_title || t("runningRecords.untitledText")}</p>
              <p className="muted">{selectedRecordDate ? format(selectedRecordDate, "PPP", { locale }) : t("runningRecords.noDate")}</p>
            </div>
            <div
              className="rr-detail-accuracy"
              style={{ background: selectedRecordLevel?.tint, color: selectedRecordLevel?.color }}
            >
              <div>
                <p className="muted">{t("runningRecords.metrics.accuracy")}</p>
                <p>{selectedRecord.accuracy_pct ?? 0}%</p>
              </div>
              <div>{selectedRecordLevel?.short}</div>
            </div>
            <div className="rr-detail-grid">
              <article>
                <span>{t("runningRecords.modal.totalWords")}</span>
                <strong>{selectedRecord.total_words ?? 0}</strong>
              </article>
              <article>
                <span>{t("runningRecords.metrics.errors")}</span>
                <strong>{selectedRecord.errors ?? 0}</strong>
              </article>
              <article>
                <span>{t("runningRecords.modal.selfCorrections")}</span>
                <strong>{selectedRecord.self_corrections ?? 0}</strong>
              </article>
              <article>
                <span>{t("runningRecords.metrics.scRatio")}</span>
                <strong>{selectedRecord.sc_ratio !== null ? `1:${selectedRecord.sc_ratio}` : t("runningRecords.na")}</strong>
              </article>
            </div>
            {!!selectedRecord.notes && (
              <div className="rr-detail-notes">
                <h4>{t("runningRecords.modal.notesOptional")}</h4>
                <p>{selectedRecord.notes}</p>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setSelectedRecord(null)}>
                {t("common.actions.done")}
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  await handleDeleteRunningRecord(selectedRecord.id);
                  setSelectedRecord(null);
                }}
              >
                {t("common.actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default RunningRecordsPage;
