import { MARKS_SYSTEM, GRADES } from '../config/marksSystem';

const BEHAVIOR_SUBCATEGORIES = ['seriousOffences', 'majorOffences'];

/** Grand total for a single weekly performance record. */
export function calcWeekGrandTotal(rec) {
  if (!rec) return 0;
  const dr  = rec.dailyRoutine    ? Object.values(rec.dailyRoutine).reduce((a, b) => a + Number(b || 0), 0)     : 0;
  const hy  = rec.hygiene         ? Object.values(rec.hygiene).reduce((a, b) => a + Number(b || 0), 0)          : 0;
  const sd  = rec.studyDiscipline ? Object.values(rec.studyDiscipline).reduce((a, b) => a + Number(b || 0), 0)  : 0;
  const acF = rec.academics?.marks ? Object.values(rec.academics.marks).reduce((a, b) => a + Number(b || 0), 0)  : 0;
  const acP = rec.academics?.penalties?.classBunking ? -1 : 0;
  const sk  = rec.skillsProgram?.days
    ? Object.values(rec.skillsProgram.days).reduce((a, b) => a + Number(b || 0), 0)
    : 0;
  let pen = 0;
  if (rec.penalties) {
    Object.entries(MARKS_SYSTEM.penalties.subcategories).forEach(([subKey, sub]) => {
      sub.factors.forEach(f => {
        if (rec.penalties[subKey]?.[f.key]) pen += f.deduction;
      });
    });
  }
  const bon = rec.bonus ? Object.values(rec.bonus).reduce((a, b) => a + Number(b || 0), 0) : 0;
  return dr + hy + sd + acF + acP + sk + pen + bon;
}

/** Serious + major offence flags on one weekly record. */
export function getSeriousMajorOffencesFromRecord(rec) {
  const offences = [];
  if (!rec?.penalties) return offences;

  for (const subKey of BEHAVIOR_SUBCATEGORIES) {
    const sub = MARKS_SYSTEM.penalties.subcategories[subKey];
    const vals = rec.penalties[subKey];
    if (!sub || !vals) continue;

    sub.factors.forEach(f => {
      if (vals[f.key]) {
        offences.push({ key: f.key, label: f.label, category: sub.label });
      }
    });
  }
  return offences;
}

export function filterRecordsForPeriod(records, periodType, week) {
  if (!records?.length) return [];
  if (periodType === 'month') return records;
  return records.filter(r => r.week === week);
}

/** Average grand total across weekly records in the selected period. */
export function averageScoreForPeriod(records, periodType, week) {
  const filtered = filterRecordsForPeriod(records, periodType, week);
  if (filtered.length === 0) return null;
  const total = filtered.reduce((sum, rec) => sum + calcWeekGrandTotal(rec), 0);
  return Math.round((total / filtered.length) * 10) / 10;
}

const TOP_BOTTOM_COUNT = 3;

/**
 * Build admin dashboard insights for the selected time window.
 * Optional filterGrade / filterHouse narrow the student scope.
 * @returns {{ behavioralStudents, rankingsByGrade }}
 */
export function buildAdminInsights(students, recordsByStudentId, periodType, week, filters = {}) {
  const { filterGrade = '', filterHouse = '' } = filters;

  const scopedStudents = students.filter(s => {
    if (filterGrade && s.grade !== filterGrade) return false;
    if (filterHouse && s.house !== filterHouse) return false;
    return true;
  });

  const behavioralMap = new Map();
  const scoresByGrade = {};

  scopedStudents.forEach(student => {
    const records = recordsByStudentId[student.id] ?? [];
    const periodRecords = filterRecordsForPeriod(records, periodType, week);

    periodRecords.forEach(rec => {
      getSeriousMajorOffencesFromRecord(rec).forEach(offence => {
        if (!behavioralMap.has(student.id)) {
          behavioralMap.set(student.id, {
            student,
            offences: new Map(),
          });
        }
        const entry = behavioralMap.get(student.id);
        entry.offences.set(offence.key, offence);
      });
    });

    const avg = averageScoreForPeriod(records, periodType, week);
    if (avg == null || !student.grade) return;

    if (!scoresByGrade[student.grade]) scoresByGrade[student.grade] = [];
    scoresByGrade[student.grade].push({ student, avgScore: avg });
  });

  const behavioralStudents = [...behavioralMap.values()]
    .map(({ student, offences }) => ({
      student,
      offences: [...offences.values()],
    }))
    .sort((a, b) => a.student.name.localeCompare(b.student.name));

  const rankingsByGrade = GRADES
    .map(grade => {
      if (filterGrade && grade !== filterGrade) return null;

      const ranked = (scoresByGrade[grade] ?? [])
        .sort((a, b) => b.avgScore - a.avgScore);

      if (ranked.length === 0) return null;

      return {
        grade,
        top: ranked.slice(0, TOP_BOTTOM_COUNT),
        bottom: [...ranked].reverse().slice(0, TOP_BOTTOM_COUNT),
      };
    })
    .filter(Boolean);

  return { behavioralStudents, rankingsByGrade };
}

export function formatPeriodLabel(periodType, year, month, week) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = months[month - 1] ?? month;
  if (periodType === 'month') return `${monthLabel} ${year} (full month)`;
  return `Week ${week} · ${monthLabel} ${year}`;
}
