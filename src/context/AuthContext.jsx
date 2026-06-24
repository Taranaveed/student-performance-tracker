import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authService } from '../services/authService';
import { ROLE_SECTION_PERMISSIONS, FULL_VIEW_ROLES } from '../config/marksSystem';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const data = await authService.getUserProfile(firebaseUser.uid);
          setProfile(data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Returns true if the current user can edit the given section key
  const canEditSection = useCallback((section) => {
    const role = profile?.role;
    if (!role) return false;
    const allowed = ROLE_SECTION_PERMISSIONS[role] ?? [];
    return allowed.includes(section);
  }, [profile]);

  // Returns true if user has full cross-house/class view
  const hasFullView = useCallback(() => {
    return FULL_VIEW_ROLES.includes(profile?.role);
  }, [profile]);

  const value = {
    user,
    profile,
    // convenience aliases so existing code referencing teacherData still works
    teacherData: profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role ?? null,
    houseAssignment: profile?.houseAssignment ?? null,
    classAssignment: profile?.classAssignment ?? null,
    canEditSection,
    hasFullView,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
