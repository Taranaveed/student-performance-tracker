import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { SEED_STUDENTS } from '../config/seedStudents';
import { studentService } from './studentService';

const HOUSE_ROLES = ['housemaster', 'housemistress', 'assistantHousemaster', 'houseTeam'];

const USERS_COLLECTION = 'users';

export const authService = {
  async signUp(email, password, profileData) {
    const { name, role, houseAssignment, subjectAssignment, classAssignment } = profileData;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      uid: user.uid,
      name,
      email,
      role: role || 'teacher',
      houseAssignment: houseAssignment || null,
      subjectAssignment: subjectAssignment || null,
      classAssignment: classAssignment || null,
      createdAt: new Date().toISOString(),
    });

    // Auto-seed the roster from seed data, gracefully skipping on error
    let importResult = null;
    try {
      if (classAssignment) {
        const alreadyExists = await studentService.hasStudentsForGrade(classAssignment);
        if (!alreadyExists) {
          const students = SEED_STUDENTS.filter(s => s.grade === classAssignment);
          if (students.length > 0) {
            const result = await studentService.bulkImportStudents(students, user.uid);
            importResult = { type: 'class', assignment: classAssignment, imported: result.imported };
          }
        }
      } else if (HOUSE_ROLES.includes(role) && houseAssignment) {
        const alreadyExists = await studentService.hasStudentsForHouse(houseAssignment);
        if (!alreadyExists) {
          const students = SEED_STUDENTS.filter(s => s.house === houseAssignment);
          if (students.length > 0) {
            const result = await studentService.bulkImportStudents(students, user.uid);
            importResult = { type: 'house', assignment: houseAssignment, imported: result.imported };
          }
        }
      }
    } catch (err) {
      console.error('Auto-seed roster failed (sign-up still succeeded):', err);
    }

    return { user, importResult };
  },

  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async logout() {
    await signOut(auth);
  },

  async getUserProfile(uid) {
    // Try new 'users' collection first
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) return userSnap.data();

    // Fallback: legacy 'teachers' collection (accounts created before role system)
    const legacyRef = doc(db, 'teachers', uid);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      const legacyData = legacySnap.data();
      // Migrate to new structure automatically
      const migratedProfile = {
        ...legacyData,
        role: 'teacher',
        houseAssignment: null,
        subjectAssignment: null,
        classAssignment: null,
      };
      // Save to new collection so future lookups are fast
      await setDoc(userRef, migratedProfile);
      return migratedProfile;
    }

    return null;
  },
};
