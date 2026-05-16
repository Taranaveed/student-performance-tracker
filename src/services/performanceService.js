import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where, 
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';

const LOGS_COLLECTION = 'performance_logs';

export const performanceService = {
  // ========== SIMPLE RATINGS (0-5 scale) ==========
  /*
  async createLog(logData, teacherId) {
    const actualTeacherId = teacherId || auth.currentUser?.uid;
    
    if (!actualTeacherId) {
      throw new Error('No teacherId available - user not authenticated');
    }

    const dataToSave = {
      ...logData,
      teacherId: actualTeacherId,
      type: 'simple_ratings'
    };
    const existingLog = await this.getLogByDate(logData.studentId, logData.date);
    
    if (existingLog) {
      await updateDoc(doc(db, LOGS_COLLECTION, existingLog.id), {
        ...dataToSave,
        updatedAt: new Date().toISOString()
      });
      return { id: existingLog.id, ...dataToSave };
    }
    
    const docRef = await addDoc(collection(db, LOGS_COLLECTION), {
      ...dataToSave,
      createdAt: new Date().toISOString()
    });
    
    return { id: docRef.id, ...dataToSave };
  },

  async getLogByDate(studentId, date) {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },*/

  // ========== DETAILED MARKS (100-point system) ==========
  
  async createDetailedMarks(logData, teacherId) {
    const actualTeacherId = teacherId || auth.currentUser?.uid;
    
    if (!actualTeacherId) {
      throw new Error('No teacherId available - user not authenticated');
    }

    const dataToSave = {
      ...logData,
      teacherId: actualTeacherId,
      type: 'detailed_marks'
    };

    // Use composite ID for deterministic updates
    const docId = `${actualTeacherId}_${logData.studentId}_${logData.date}`;
    const docRef = doc(db, LOGS_COLLECTION, docId);
    
    await setDoc(docRef, {
      ...dataToSave,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return { id: docId, ...dataToSave };
  },

  async getDetailedMarksByDate(studentId, date) {
    const teacherId = auth.currentUser?.uid;
    const docId = `${teacherId}_${studentId}_${date}`;
    const docRef = doc(db, LOGS_COLLECTION, docId);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return data.type === 'detailed_marks' ? { id: docSnap.id, ...data } : null;
  },

  // ========== SHARED QUERIES ==========
  
  async getLogsByStudent(studentId, startDate, endDate) {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getLogsByTeacher(teacherId, startDate, endDate) {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('teacherId', '==', teacherId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async deleteLog(logId) {
    await deleteDoc(doc(db, LOGS_COLLECTION, logId));
  }
};