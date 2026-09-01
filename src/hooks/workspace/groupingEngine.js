import {
  averageFromPercents,
  getAssessmentMaxScore,
  scoreToPercent,
} from "../../utils/assessmentMetrics";

export function buildConstraintSet(studentList, groupConstraints) {
  const set = new Set();
  const studentIdSet = new Set(studentList.map((student) => student.id));

  const addPair = (a, b) => {
    if (!studentIdSet.has(a) || !studentIdSet.has(b) || a === b) return;
    const [firstId, secondId] = a < b ? [a, b] : [b, a];
    set.add(`${firstId}|${secondId}`);
  };

  groupConstraints.forEach((constraint) => {
    addPair(constraint.student_a, constraint.student_b);
  });

  studentList.forEach((student) => {
    const rawList = student.separation_list || "";
    rawList
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((otherId) => addPair(student.id, otherId));
  });

  return set;
}

function canJoinGroup(studentId, group, constraintSet) {
  for (const memberId of group) {
    const [firstId, secondId] =
      studentId < memberId ? [studentId, memberId] : [memberId, studentId];
    if (constraintSet.has(`${firstId}|${secondId}`)) {
      return false;
    }
  }
  return true;
}

function shuffleArray(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeGender(value) {
  return (value || "").trim().toLowerCase();
}

const ACTIVITY_OUTCOME_PERCENT = {
  needs_support: 25,
  working_towards: 50,
  met: 75,
  exceeded: 100,
};

export const ACADEMIC_PROFILE_KEYS = ["needs_support", "developing", "on_track", "extending"];

const ACADEMIC_PROFILE_RANK = {
  needs_support: 0,
  developing: 1,
  on_track: 2,
  extending: 3,
};

function inferredAcademicProfile(averagePercent) {
  if (!Number.isFinite(averagePercent)) return "unknown";
  if (averagePercent < 50) return "needs_support";
  if (averagePercent < 70) return "developing";
  if (averagePercent < 85) return "on_track";
  return "extending";
}

export function buildAbilityProfiles(
  classId,
  classStudents,
  assessments,
  assessmentEntries,
  activityAssessments = [],
  activityAssessmentEntries = []
) {
  const classAssessmentMap = new Map(
    assessments
      .filter((assessment) => assessment.class_id === classId)
      .map((assessment) => [assessment.id, assessment])
  );
  const classActivityAssessmentMap = new Map(
    activityAssessments
      .filter((assessment) => assessment.class_id === classId)
      .map((assessment) => [assessment.id, assessment])
  );
  const scoreSamplesByStudentAndSubject = new Map();

  const addScoreSample = (studentId, subjectId, percent) => {
    if (!Number.isFinite(percent)) return;
    if (!scoreSamplesByStudentAndSubject.has(studentId)) {
      scoreSamplesByStudentAndSubject.set(studentId, new Map());
    }
    const subjectSamples = scoreSamplesByStudentAndSubject.get(studentId);
    const subjectKey = subjectId || "general";
    if (!subjectSamples.has(subjectKey)) subjectSamples.set(subjectKey, []);
    subjectSamples.get(subjectKey).push(percent);
  };

  assessmentEntries.forEach((entry) => {
    const assessment = classAssessmentMap.get(entry.assessment_id);
    if (!assessment) return;
    const percent = scoreToPercent(entry.score, getAssessmentMaxScore(assessment));
    addScoreSample(entry.student_id, assessment.subject_id, percent);
  });

  activityAssessmentEntries.forEach((entry) => {
    const activityAssessment = classActivityAssessmentMap.get(entry.activity_assessment_id);
    if (!activityAssessment) return;
    addScoreSample(
      entry.student_id,
      activityAssessment.subject_id,
      ACTIVITY_OUTCOME_PERCENT[entry.outcome]
    );
  });

  const abilityByStudentId = new Map();

  classStudents.forEach((student) => {
    const samplesBySubject = scoreSamplesByStudentAndSubject.get(student.id) || new Map();
    const subjectAverages = [...samplesBySubject.entries()]
      .map(([subjectId, samples]) => ({
        subjectId,
        averagePercent: averageFromPercents(samples),
        sampleCount: samples.length,
      }))
      .filter((item) => Number.isFinite(item.averagePercent));
    const avgPercent = subjectAverages.length
      ? averageFromPercents(subjectAverages.map((item) => item.averagePercent))
      : null;
    const manualProfile = ACADEMIC_PROFILE_KEYS.includes(student.academic_level_override)
      ? student.academic_level_override
      : null;
    const abilityBand = manualProfile || inferredAcademicProfile(avgPercent);
    const abilityRank = ACADEMIC_PROFILE_RANK[abilityBand] ?? 2;

    abilityByStudentId.set(student.id, {
      averagePercent: avgPercent,
      subjectAverages,
      subjectCount: subjectAverages.length,
      sampleCount: subjectAverages.reduce((total, item) => total + item.sampleCount, 0),
      band: abilityBand,
      rank: abilityRank,
      source: manualProfile ? "manual" : Number.isFinite(avgPercent) ? "assessment" : "unknown",
      isSupportPartner:
        !student.needs_help &&
        (abilityBand === "extending" ||
          (abilityBand !== "needs_support" && Number.isFinite(avgPercent) && avgPercent >= 75)),
    });
  });

  return abilityByStudentId;
}

function pickBestStudent(candidates, group, constraintSet, options, abilityByStudentId) {
  const filtered = candidates.filter((student) =>
    canJoinGroup(student.id, group.map((member) => member.id), constraintSet)
  );
  if (filtered.length === 0) return null;

  if (options.balanceGender && group.length > 0) {
    const groupGenders = new Set(group.map((student) => normalizeGender(student.gender)));
    const differentGender = filtered.find(
      (student) => !groupGenders.has(normalizeGender(student.gender))
    );
    if (differentGender) return differentGender;
  }

  if (options.pairSupportPartners && group.length > 0) {
    const needsAcademicSupport = (student) =>
      student.needs_help || abilityByStudentId.get(student.id)?.band === "needs_support";
    const hasNeedsHelp = group.some(needsAcademicSupport);
    const hasSupportPartner = group.some(
      (student) => abilityByStudentId.get(student.id)?.isSupportPartner
    );

    if (hasNeedsHelp && !hasSupportPartner) {
      const candidate = filtered.find(
        (student) => !needsAcademicSupport(student) && abilityByStudentId.get(student.id)?.isSupportPartner
      );
      if (candidate) return candidate;
    }

    if (hasSupportPartner && !hasNeedsHelp) {
      const candidate = filtered.find(needsAcademicSupport);
      if (candidate) return candidate;
    }
  }

  if (options.balanceAbility && group.length > 0) {
    const bandCounts = group.reduce((acc, student) => {
      const band = abilityByStudentId.get(student.id)?.band || "unknown";
      acc.set(band, (acc.get(band) || 0) + 1);
      return acc;
    }, new Map());

    const ranked = [...filtered].sort((a, b) => {
      const aBand = abilityByStudentId.get(a.id)?.band || "unknown";
      const bBand = abilityByStudentId.get(b.id)?.band || "unknown";
      const aBandCount = bandCounts.get(aBand) || 0;
      const bBandCount = bandCounts.get(bBand) || 0;
      if (aBandCount !== bBandCount) return aBandCount - bBandCount;

      const aRank = abilityByStudentId.get(a.id)?.rank ?? 1;
      const bRank = abilityByStudentId.get(b.id)?.rank ?? 1;
      if (aRank !== bRank) return aRank - bRank;

      const aAvg = abilityByStudentId.get(a.id)?.averagePercent ?? -1;
      const bAvg = abilityByStudentId.get(b.id)?.averagePercent ?? -1;
      return aAvg - bAvg;
    });

    if (ranked.length > 0) return ranked[0];
  }

  return filtered[0];
}

export function generateGroups(
  studentList,
  groupSize,
  constraintSet,
  options,
  abilityByStudentId,
  maxAttempts = 200
) {
  if (studentList.length === 0) return [];
  if (options.separateGender) {
    const pools = new Map();
    for (const student of studentList) {
      const gender = normalizeGender(student.gender) || "prefer not to say";
      if (!pools.has(gender)) pools.set(gender, []);
      pools.get(gender).push(student);
    }
    const groups = [];
    for (const pool of pools.values()) {
      const result = generateGroups(pool, groupSize, constraintSet, { ...options, separateGender: false, balanceGender: false }, abilityByStudentId, maxAttempts);
      if (!result) return null;
      groups.push(...result);
    }
    return groups;
  }
  const size = Math.max(2, groupSize);
  const targetGroupCount = Math.max(1, Math.ceil(studentList.length / size));
  const attemptLimit = Math.max(
    maxAttempts,
    studentList.length * (targetGroupCount + 1) * 2
  );
  let available = [...studentList];

  const finish = (groups) => {
    if (available.length > 0) return null;
    const assignedIds = groups.flatMap((group) => group.map((student) => student.id));
    if (
      assignedIds.length !== studentList.length ||
      new Set(assignedIds).size !== studentList.length
    ) {
      return null;
    }
    return groups;
  };

  if (options.balanceAbility) {
    available.sort((a, b) => {
      const aRank = abilityByStudentId.get(a.id)?.rank ?? 1;
      const bRank = abilityByStudentId.get(b.id)?.rank ?? 1;
      if (aRank !== bRank) return aRank - bRank;
      const aAvg = abilityByStudentId.get(a.id)?.averagePercent ?? -1;
      const bAvg = abilityByStudentId.get(b.id)?.averagePercent ?? -1;
      return aAvg - bAvg;
    });
  } else if (options.pairSupportPartners) {
    const needsAcademicSupport = (student) =>
      student.needs_help || abilityByStudentId.get(student.id)?.band === "needs_support";
    available.sort((a, b) =>
      (needsAcademicSupport(a) ? 0 : 1) - (needsAcademicSupport(b) ? 0 : 1)
    );
  } else {
    available = shuffleArray(available);
  }

  if (options.balanceGender) {
    const groupsDraft = Array.from({ length: targetGroupCount }, () => []);
    let attempts = 0;

    while (available.length > 0 && attempts < attemptLimit) {
      let assignedThisRound = 0;

      for (const group of groupsDraft) {
        if (available.length === 0) break;
        if (group.length >= size) continue;
        attempts += 1;

        const candidate = pickBestStudent(available, group, constraintSet, options, abilityByStudentId);
        if (!candidate) continue;

        group.push(candidate);
        available = available.filter((student) => student.id !== candidate.id);
        assignedThisRound += 1;
      }

      if (assignedThisRound === 0) break;
    }

    const finalized = groupsDraft.filter((group) => group.length > 0);

    while (available.length > 0 && attempts < attemptLimit) {
      attempts += 1;
      const group = [];

      while (group.length < size && available.length > 0 && attempts < attemptLimit) {
        const candidate = pickBestStudent(available, group, constraintSet, options, abilityByStudentId);
        if (!candidate) break;
        group.push(candidate);
        available = available.filter((student) => student.id !== candidate.id);
      }

      if (group.length === 0) break;
      finalized.push(group);
    }

    return finish(finalized);
  }

  const groupsDraft = [];
  let attempts = 0;

  while (available.length > 0 && attempts < attemptLimit) {
    attempts += 1;
    const group = [];

    while (group.length < size && available.length > 0 && attempts < attemptLimit) {
      const candidate = pickBestStudent(available, group, constraintSet, options, abilityByStudentId);
      if (!candidate) break;
      group.push(candidate);
      available = available.filter((student) => student.id !== candidate.id);
    }

    if (group.length > 0) groupsDraft.push(group);
  }

  return finish(groupsDraft);
}
