const DEFAULT_MAX_SCORE = 10;

export const getAssessmentMaxScore = (assessment) => {
  const raw = Number(assessment?.max_score);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_MAX_SCORE;
};

export const scoreToPercent = (score, maxScore) => {
  const numericScore = Number(score);
  const numericMax = Number(maxScore);
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericMax) || numericMax <= 0) {
    return null;
  }
  return (numericScore / numericMax) * 100;
};

export const entryToPercent = (entry, assessmentById) => {
  if (!entry) return null;
  const assessment = assessmentById.get(entry.assessment_id);
  const maxScore = getAssessmentMaxScore(assessment);
  return scoreToPercent(entry.score, maxScore);
};

export const averageFromPercents = (values) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

export const performanceColor = (percent) => {
  if (percent >= 70) return "#16a34a";
  if (percent >= 50) return "#ea580c";
  return "#dc2626";
};

