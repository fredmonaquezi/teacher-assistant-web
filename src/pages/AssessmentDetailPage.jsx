import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { averageFromPercents, getAssessmentMaxScore, performanceColor, scoreToPercent } from "../utils/assessmentMetrics";

const AssessmentEntryRow = ({ entry, student, handleUpdateAssessmentEntry, assessmentMaxScore }) => {
  const { t } = useTranslation();
  const [scoreValue, setScoreValue] = useState(
    entry.score !== null && entry.score !== undefined ? String(entry.score) : ""
  );
  const [noteValue, setNoteValue] = useState(entry.notes || "");

  const scoreNumber = scoreValue === "" ? null : Number(scoreValue);
  const scorePercent = scoreToPercent(scoreNumber, assessmentMaxScore);
  const scoreColor = scorePercent === null ? "#8b6f4c" : performanceColor(scorePercent);

  return (
    <div className="grade-entry-card">
      <div className="grade-entry-header">
        <div className="grade-entry-name">
          {student.first_name} {student.last_name}
        </div>
        <div className="grade-entry-score">
          <span className="muted">{t("assessmentDetail.entry.score")}</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={scoreValue}
            onChange={(event) => setScoreValue(event.target.value)}
            onBlur={() =>
              handleUpdateAssessmentEntry(entry.id, {
                score: scoreValue === "" ? null : Number(scoreValue),
              })
            }
            style={{ color: scoreColor }}
          />
          <span className="grade-entry-percent">
            {scorePercent === null ? "—" : `${scorePercent.toFixed(1)}%`}
          </span>
        </div>
      </div>
      <div className="grade-entry-notes">
        <span className="muted">{t("assessmentDetail.entry.notes")}</span>
        <input
          value={noteValue}
          onChange={(event) => setNoteValue(event.target.value)}
          onBlur={() =>
            handleUpdateAssessmentEntry(entry.id, {
              notes: noteValue.trim() || null,
            })
          }
          placeholder={t("assessmentDetail.entry.addNotes")}
        />
      </div>
    </div>
  );
};

const AssessmentDetailPage = ({
  assessments,
  assessmentEntries,
  classes,
  subjects,
  units,
  students,
  handleUpdateAssessmentEntry,
  setAssessments,
  handleEnsureAssessmentEntries,
  handleUpdateAssessmentNotes,
}) => {
  const { t, i18n } = useTranslation();
  const { assessmentId } = useParams();
  const locale = i18n.language === "pt-BR" ? ptBR : enUS;
  const assessment = assessments.find((item) => item.id === assessmentId);
  const assessmentEntriesForAssessment = assessmentEntries.filter(
    (entry) => entry.assessment_id === assessmentId
  );
  const classItem = classes.find((item) => item.id === assessment?.class_id);
  const subjectItem = subjects.find((item) => item.id === assessment?.subject_id);
  const unitItem = units.find((item) => item.id === assessment?.unit_id);
  const classStudents = students
    .filter((student) => student.class_id === assessment?.class_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  useEffect(() => {
    if (!assessment?.id || classStudents.length === 0) return;
    handleEnsureAssessmentEntries(assessment.id);
  }, [
    assessment,
    classStudents,
    assessmentEntriesForAssessment,
    handleEnsureAssessmentEntries,
  ]);

  if (!assessment) {
    return (
      <section className="panel">
        <h2>{t("assessmentDetail.notFoundTitle")}</h2>
        <p className="muted">{t("assessmentDetail.notFoundDescription")}</p>
      </section>
    );
  }

  const maxScore = getAssessmentMaxScore(assessment);
  const scored = assessmentEntriesForAssessment
    .map((entry) => scoreToPercent(entry.score, maxScore))
    .filter((score) => score !== null && score !== undefined && Number(score) >= 0)
    .map(Number);

  const average = averageFromPercents(scored);
  const highest = scored.length > 0 ? Math.max(...scored) : 0;
  const lowest = scored.length > 0 ? Math.min(...scored) : 0;

  const averageColor = performanceColor(average);

  return (
    <section className="panel gradebook-detail">
      <div className="gradebook-header gradebook-detail-hero">
        <div>
          <p className="gradebook-kicker">{t("assessmentDetail.kicker")}</p>
          <h2>{assessment.title}</h2>
        </div>
        <div className="gradebook-date-pill">
          {assessment.assessment_date
            ? format(parseISO(assessment.assessment_date), "PPP", { locale })
            : ""}
        </div>
      </div>

      <div className="gradebook-stats">
        <div className="stat-card gradebook-stat-card">
            <div className="stat-label">{t("assessmentDetail.stats.classAverage")}</div>
            <div className="stat-value" style={{ color: averageColor }}>
            {average.toFixed(1)}%
            </div>
          </div>
        <div className="stat-card gradebook-stat-card">
            <div className="stat-label">{t("assessmentDetail.stats.highest")}</div>
            <div className="stat-value" style={{ color: "#16a34a" }}>
            {highest.toFixed(1)}%
            </div>
          </div>
        <div className="stat-card gradebook-stat-card">
            <div className="stat-label">{t("assessmentDetail.stats.lowest")}</div>
            <div className="stat-value" style={{ color: "#ef4444" }}>
            {lowest.toFixed(1)}%
            </div>
          </div>
      </div>

      <div className="gradebook-info">
        <h3>{t("assessmentDetail.info.title")}</h3>
        <div className="gradebook-info-grid">
          {classItem && (
            <div className="gradebook-info-item">
              <span className="muted">{t("assessmentDetail.info.class")}</span>
              <strong>{classItem.name}</strong>
            </div>
          )}
          {subjectItem && (
            <div className="gradebook-info-item">
              <span className="muted">{t("assessmentDetail.info.subject")}</span>
              <strong>{subjectItem.name}</strong>
            </div>
          )}
          {unitItem && (
            <div className="gradebook-info-item">
              <span className="muted">{t("assessmentDetail.info.unit")}</span>
              <strong>{unitItem.name}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="gradebook-notes">
        <h3>{t("assessmentDetail.description.title")}</h3>
        <textarea
          rows="4"
          value={assessment.notes || ""}
          onChange={(event) =>
            setAssessments((prev) =>
              prev.map((item) =>
                item.id === assessment.id ? { ...item, notes: event.target.value } : item
              )
            )
          }
          onBlur={(event) =>
            handleUpdateAssessmentNotes(assessment.id, event.target.value)
          }
          placeholder={t("assessmentDetail.description.placeholder")}
        />
      </div>

      <div className="gradebook-students">
        <div className="gradebook-students-header">
          <h3>{t("assessmentDetail.students.title")}</h3>
          <span className="muted">
            {t("assessmentDetail.students.graded", {
              graded: scored.length,
              total: assessmentEntriesForAssessment.length,
            })}
          </span>
        </div>

        {assessmentEntriesForAssessment.length === 0 ? (
          <div className="muted">{t("assessmentDetail.students.empty")}</div>
        ) : (
          <div className="gradebook-entries">
            {classStudents.map((student) => {
              const entry = assessmentEntriesForAssessment.find(
                (item) => item.student_id === student.id
              );
              return entry ? (
                <AssessmentEntryRow
                  key={`${entry.id}-${entry.score ?? ""}-${entry.notes ?? ""}`}
                  entry={entry}
                  student={student}
                  handleUpdateAssessmentEntry={handleUpdateAssessmentEntry}
                  assessmentMaxScore={maxScore}
                />
              ) : null;
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AssessmentDetailPage;
