import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const STUDENTS_COLLECTION = 'students';

export const studentService = {
  async createStudent(studentData, teacherId) {
    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
      ...studentData,
      teacherId,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...studentData };
  },

  async getStudentsByTeacher(teacherId) {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async updateStudent(studentId, updates) {
    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteStudent(studentId) {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
  }
};