import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { SEED_STUDENTS } from '../config/seedStudents';
import { studentService } from './studentService';
import { MAX_TEACHER_CLASSES } from '../config/marksSystem';

const HOUSE_ROLES = ['housemaster', 'housemistress', 'assistantHousemaster', 'houseTeam'];

const USERS_COLLECTION = 'users';

export const authService = {
  async signUp(email, password, profileData) {
    const {
      name,
      role,
      houseAssignment,
      subjectAssignment,
      // Teachers may provide an array of up to MAX_TEACHER_CLASSES classes
      assignedClasses,
      // Legacy single-class field — normalise into assignedClasses
      classAssignment,
    } = profileData;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    // Normalise class assignment: prefer assignedClasses array, fall back to
    // classAssignment string, default to empty array.
    const resolvedClasses = (() => {
      if (Array.isArray(assignedClasses) && assignedClasses.length > 0) {
        return assignedClasses.slice(0, MAX_TEACHER_CLASSES);
      }
      if (classAssignment) return [classAssignment];
      return [];
    })();

    // roles[] supports future multi-role accounts on the same email.
    // primary role is stored in `role` for backward-compat.
    const primaryRole = role || 'teacher';

    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      uid: user.uid,
      name,
      email,
      role: primaryRole,
      roles: [primaryRole],
      houseAssignment: houseAssignment || null,
      subjectAssignment: subjectAssignment || null,
      // Legacy single field kept for backward-compat
      classAssignment: resolvedClasses[0] ?? null,
      // New array field for multi-class teachers
      assignedClasses: resolvedClasses,
      createdAt: new Date().toISOString(),
    });

    // Auto-seed roster for class-based or house-based assignments
    let importResult = null;
    try {
      if (resolvedClasses.length > 0 && role === 'teacher') {
        for (const cls of resolvedClasses) {
          const alreadyExists = await studentService.hasStudentsForGrade(cls);
          if (!alreadyExists) {
            const students = SEED_STUDENTS.filter(s => s.grade === cls);
            if (students.length > 0) {
              const result = await studentService.bulkImportStudents(students, user.uid);
              importResult = { type: 'class', assignment: cls, imported: result.imported };
            }
          }
        }
      } else if (HOUSE_ROLES.includes(primaryRole) && houseAssignment) {
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
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      // Ensure roles[] is always present (migrate older single-role docs)
      if (!data.roles || !Array.isArray(data.roles)) {
        const migrated = { ...data, roles: [data.role ?? 'teacher'] };
        await setDoc(userRef, migrated, { merge: true });
        return migrated;
      }
      // Ensure assignedClasses[] is always present
      if (!data.assignedClasses) {
        const classes = data.classAssignment ? [data.classAssignment] : [];
        const migrated = { ...data, assignedClasses: classes };
        await setDoc(userRef, migrated, { merge: true });
        return migrated;
      }
      return data;
    }

    // Fallback: legacy 'teachers' collection
    const legacyRef = doc(db, 'teachers', uid);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      const legacyData = legacySnap.data();
      const migratedProfile = {
        ...legacyData,
        role: 'teacher',
        roles: ['teacher'],
        houseAssignment: null,
        subjectAssignment: null,
        classAssignment: null,
        assignedClasses: [],
      };
      await setDoc(userRef, migratedProfile);
      return migratedProfile;
    }

    return null;
  },

  /**
   * Add an additional role to an existing account.
   * Enforces a maximum of 4 roles per account.
   * For teacher roles, merges assignedClasses arrays (up to MAX_TEACHER_CLASSES).
   * Returns the updated profile.
   */
  async addRoleToAccount(uid, newRole, roleExtras = {}) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error('User profile not found');

    const profile = snap.data();
    const existingRoles = profile.roles ?? [profile.role];

    if (existingRoles.includes(newRole)) {
      throw new Error(`This account already has the "${newRole}" role.`);
    }
    if (existingRoles.length >= 4) {
      throw new Error('An account can hold a maximum of 4 roles.');
    }

    // For teachers: merge assignedClasses rather than replace
    let mergedClasses = profile.assignedClasses ?? [];
    if (newRole === 'teacher' && Array.isArray(roleExtras.assignedClasses)) {
      const combined = [...new Set([...mergedClasses, ...roleExtras.assignedClasses])];
      mergedClasses = combined.slice(0, MAX_TEACHER_CLASSES);
    }

    const updates = {
      roles: arrayUnion(newRole),
      ...(newRole === 'teacher' ? { assignedClasses: mergedClasses, classAssignment: mergedClasses[0] ?? null } : {}),
      // Other role-specific extras
      ...(roleExtras.houseAssignment   ? { houseAssignment: roleExtras.houseAssignment }     : {}),
      ...(roleExtras.subjectAssignment ? { subjectAssignment: roleExtras.subjectAssignment } : {}),
    };

    await updateDoc(userRef, updates);
    return { ...profile, ...updates, roles: [...existingRoles, newRole] };
  },

  /**
   * Persist the user's chosen active role so Firestore rules can read it.
   * Called after the user selects a role in the RolePicker UI.
   */
  async persistActiveRole(uid, activeRole) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { activeRole });
  },
};
