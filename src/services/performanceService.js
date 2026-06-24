import {
  collection,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const LOGS_COLLECTION = 'performance_logs';

// Doc ID format: studentId_YYYY_MM_Wn  (e.g. abc123_2026_04_W1)
function weekDocId(studentId, year, month, week) {
  const mm = String(month).padStart(2, '0');
  return `${studentId}_${year}_${mm}_W${week}`;
}

export const performanceService = {

  // Save (merge) a single section for a weekly record.
  // sectionData: { [sectionKey]: { ...fields } }
  async saveWeeklySection(studentId, year, month, week, sectionData, editorUid) {
    const uid = editorUid || auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const docId  = weekDocId(studentId, year, month, week);
    const docRef = doc(db, LOGS_COLLECTION, docId);

    await setDoc(docRef, {
      studentId,
      year,
      month,
      week,
      ...sectionData,
      updatedAt: new Date().toISOString(),
      updatedBy: uid,
    }, { merge: true });

    return docId;
  },

  // Get a specific week's full record
  async getWeeklyRecord(studentId, year, month, week) {
    const docRef = doc(db, LOGS_COLLECTION, weekDocId(studentId, year, month, week));
    const snap   = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // Get all weekly records for a student in a given month
  async getMonthlyRecords(studentId, year, month) {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('studentId', '==', studentId),
      where('year',      '==', year),
      where('month',     '==', month),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.week - b.week);
  },

  // Get all monthly records for a house (for principal / full-view dashboards)
  async getMonthlyRecordsByHouse(house, year, month) {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('house',  '==', house),
      where('year',   '==', year),
      where('month',  '==', month),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async deleteRecord(docId) {
    await deleteDoc(doc(db, LOGS_COLLECTION, docId));
  },

  // ── Legacy compat: daily detailed marks (kept for old data) ─────────────────
  async createDetailedMarks(logData, teacherId) {
    const uid = teacherId || auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const docId  = `${uid}_${logData.studentId}_${logData.date}`;
    const docRef = doc(db, LOGS_COLLECTION, docId);
    await setDoc(docRef, { ...logData, teacherId: uid, type: 'detailed_marks', updatedAt: new Date().toISOString() }, { merge: true });
    return { id: docId };
  },

  async getDetailedMarksByDate(studentId, date) {
    const uid    = auth.currentUser?.uid;
    const docId  = `${uid}_${studentId}_${date}`;
    const snap   = await getDoc(doc(db, LOGS_COLLECTION, docId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.type === 'detailed_marks' ? { id: snap.id, ...data } : null;
  },

  async getLogsByStudent(studentId, startDate, endDate) {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};
