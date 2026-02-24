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

export function buildAbilityProfiles(classId, classStudents, assessments, assessmentEntries) {
  const classAssessmentMap = new Map(
    assessments
      .filter((assessment) => assessment.class_id === classId)
      .map((assessment) => [assessment.id, assessment])
  );
  const scoreSamplesByStudent = new Map();

  assessmentEntries.forEach((entry) => {
    const assessment = classAssessmentMap.get(entry.assessment_id);
    if (!assessment) return;
    const percent = scoreToPercent(entry.score, getAssessmentMaxScore(assessment));
    if (!Number.isFinite(percent)) return;
    if (!scoreSamplesByStudent.has(entry.student_id)) {
      scoreSamplesByStudent.set(entry.student_id, []);
    }
    scoreSamplesByStudent.get(entry.student_id).push(percent);
  });

  const averages = classStudents
    .map((student) => {
      const samples = scoreSamplesByStudent.get(student.id) || [];
      if (samples.length === 0) return null;
      return averageFromPercents(samples);
    })
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  const lowerIndex = averages.length
    ? Math.max(0, Math.floor((averages.length - 1) * 0.33))
    : -1;
  const upperIndex = averages.length
    ? Math.max(0, Math.floor((averages.length - 1) * 0.66))
    : -1;
  const lowerThreshold = lowerIndex >= 0 ? averages[lowerIndex] : null;
  const upperThreshold = upperIndex >= 0 ? averages[upperIndex] : null;

  const abilityByStudentId = new Map();

  classStudents.forEach((student) => {
    const samples = scoreSamplesByStudent.get(student.id) || [];
    const avgPercent = samples.length ? averageFromPercents(samples) : null;
    let abilityBand = "unknown";
    let abilityRank = 1;

    if (Number.isFinite(avgPercent)) {
      if (!Number.isFinite(lowerThreshold) || !Number.isFinite(upperThreshold)) {
        abilityBand = "proficient";
        abilityRank = 1;
      } else if (avgPercent <= lowerThreshold) {
        abilityBand = "developing";
        abilityRank = 0;
      } else if (avgPercent >= upperThreshold) {
        abilityBand = "advanced";
        abilityRank = 2;
      } else {
        abilityBand = "proficient";
        abilityRank = 1;
      }
    }

    abilityByStudentId.set(student.id, {
      averagePercent: avgPercent,
      band: abilityBand,
      rank: abilityRank,
      isSupportPartner:
        !student.needs_help &&
        Number.isFinite(avgPercent) &&
        (abilityBand === "advanced" || avgPercent >= 75),
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
    const hasNeedsHelp = group.some((student) => student.needs_help);
    const hasSupportPartner = group.some(
      (student) => abilityByStudentId.get(student.id)?.isSupportPartner
    );

    if (hasNeedsHelp && !hasSupportPartner) {
      const candidate = filtered.find(
        (student) => !student.needs_help && abilityByStudentId.get(student.id)?.isSupportPartner
      );
      if (candidate) return candidate;
    }

    if (hasSupportPartner && !hasNeedsHelp) {
      const candidate = filtered.find((student) => student.needs_help);
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
  const size = Math.max(2, groupSize);
  let available = [...studentList];

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
    available.sort((a, b) => (a.needs_help ? 0 : 1) - (b.needs_help ? 0 : 1));
  } else {
    available = shuffleArray(available);
  }

  if (options.balanceGender) {
    const targetGroupCount = Math.max(1, Math.ceil(studentList.length / size));
    const groupsDraft = Array.from({ length: targetGroupCount }, () => []);
    let attempts = 0;

    while (available.length > 0 && attempts < maxAttempts) {
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

    while (available.length > 0 && attempts < maxAttempts) {
      attempts += 1;
      const group = [];

      while (group.length < size && available.length > 0 && attempts < maxAttempts) {
        const candidate = pickBestStudent(available, group, constraintSet, options, abilityByStudentId);
        if (!candidate) break;
        group.push(candidate);
        available = available.filter((student) => student.id !== candidate.id);
      }

      if (group.length === 0) break;
      finalized.push(group);
    }

    return finalized;
  }

  const groupsDraft = [];
  let attempts = 0;

  while (available.length > 0 && attempts < maxAttempts) {
    attempts += 1;
    const group = [];

    while (group.length < size && available.length > 0 && attempts < maxAttempts) {
      const candidate = pickBestStudent(available, group, constraintSet, options, abilityByStudentId);
      if (!candidate) break;
      group.push(candidate);
      available = available.filter((student) => student.id !== candidate.id);
    }

    if (group.length > 0) groupsDraft.push(group);
  }

  return groupsDraft;
}
