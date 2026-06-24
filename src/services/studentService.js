import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const STUDENTS_COLLECTION = 'students';

export const studentService = {
  async createStudent(studentData, teacherId) {
    const createdAt = new Date().toISOString();
    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
      ...studentData,
      teacherId,
      createdAt,
    });
    return { id: docRef.id, ...studentData, teacherId, createdAt };
  },

  async getStudentsByTeacher(teacherId) {
    // No orderBy to avoid needing a composite Firestore index — sort client-side
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('teacherId', '==', teacherId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  },

  async getStudentsByGrade(grade) {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('grade', '==', grade)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  },

  async getStudentsByHouse(house) {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('house', '==', house)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  },

  async getAllStudents() {
    const q = query(collection(db, STUDENTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
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
  },

  async hasStudentsForGrade(grade) {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('grade', '==', grade),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async hasStudentsForHouse(house) {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('house', '==', house),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async bulkImportStudents(students, importerUid) {
    // Fetch all existing rollNumbers to skip duplicates
    const existingSnap = await getDocs(query(collection(db, STUDENTS_COLLECTION)));
    const existingRollNumbers = new Set(
      existingSnap.docs.map(d => d.data().rollNumber).filter(Boolean)
    );

    const toImport = students.filter(s => !existingRollNumbers.has(s.rollNumber));
    const createdAt = new Date().toISOString();

    // Firestore batches cap at 500 writes each
    const BATCH_SIZE = 500;
    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      toImport.slice(i, i + BATCH_SIZE).forEach(student => {
        const ref = doc(collection(db, STUDENTS_COLLECTION));
        batch.set(ref, { ...student, teacherId: importerUid, createdAt });
      });
      await batch.commit();
    }

    return { imported: toImport.length, skipped: students.length - toImport.length };
  },
};