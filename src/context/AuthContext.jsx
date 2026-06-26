import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Shield, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { authService } from '../services/authService';
import { ROLE_SECTION_PERMISSIONS, FULL_VIEW_ROLES, ROLE_LABELS } from '../config/marksSystem';

const AuthContext = createContext(null);

// ── Role Picker UI ────────────────────────────────────────────────────────────
// Shown inline (full-screen overlay) when a multi-role user logs in and hasn't
// chosen their active workspace yet for this session.

const ROLE_ICONS = {
  admin:                { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  teacher:              { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200'  },
  housemaster:          { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200'   },
  housemistress:        { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-200'   },
  assistantHousemaster: { bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-100'   },
  peHead:               { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  skillsHead:           { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  activitiesHead:       { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200'   },
  houseTeam:            { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-200'   },
};

function RolePickerScreen({ profile, onSelect }) {
  const roles = profile?.roles ?? [profile?.role ?? 'teacher'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Select Workspace</h2>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, <span className="font-medium text-gray-700">{profile?.name?.split(' ')[0]}</span>.
            Choose the role you want to work as this session.
          </p>
        </div>

        <div className="space-y-3">
          {roles.map(role => {
            const colors = ROLE_ICONS[role] ?? ROLE_ICONS.teacher;
            return (
              <button
                key={role}
                onClick={() => onSelect(role)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 ${colors.border} ${colors.bg} hover:opacity-90 transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${colors.text}`} />
                  <span className={`font-semibold text-sm ${colors.text}`}>
                    {ROLE_LABELS[role] ?? role}
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 ${colors.text} opacity-60 group-hover:translate-x-0.5 transition-transform`} />
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center mt-5">
          You can switch roles at any time from the sidebar.
        </p>
      </div>
    </div>
  );
}

// ── Auth Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [activeRole, setActiveRole] = useState(null); // null = not yet chosen
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const data = await authService.getUserProfile(firebaseUser.uid);
          setProfile(data);

          // If the account only has one role, skip the picker
          const roles = data?.roles ?? [data?.role ?? 'teacher'];
          if (roles.length === 1) {
            setActiveRole(roles[0]);
          } else {
            // Multi-role: reset activeRole so picker is shown
            setActiveRole(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
        setActiveRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Called when user picks a role from the RolePickerScreen
  const handleRoleSelect = useCallback(async (role) => {
    setActiveRole(role);
    // Persist chosen role to Firestore so security rules can read it
    if (user?.uid) {
      try {
        await authService.persistActiveRole(user.uid, role);
      } catch (err) {
        console.error('Failed to persist active role:', err);
      }
    }
  }, [user]);

  // Switch active role from the sidebar (without logging out)
  const switchRole = useCallback(async (role) => {
    const roles = profile?.roles ?? [profile?.role ?? 'teacher'];
    if (!roles.includes(role)) return;
    await handleRoleSelect(role);
  }, [profile, handleRoleSelect]);

  // Returns true if the current role can edit the given section key
  const canEditSection = useCallback((section) => {
    const role = activeRole;
    if (!role) return false;
    const allowed = ROLE_SECTION_PERMISSIONS[role] ?? [];
    return allowed.includes(section);
  }, [activeRole]);

  // Returns true if user has full cross-house/class view
  const hasFullView = useCallback(() => {
    return FULL_VIEW_ROLES.includes(activeRole);
  }, [activeRole]);

  const value = {
    user,
    profile,
    teacherData: profile,
    loading,
    isAuthenticated: !!user,
    role: activeRole,
    activeRole,
    // All roles this account can assume
    availableRoles: profile?.roles ?? (profile?.role ? [profile.role] : []),
    houseAssignment: profile?.houseAssignment ?? null,
    classAssignment: profile?.classAssignment ?? null,
    assignedClasses: profile?.assignedClasses ?? [],
    canEditSection,
    hasFullView,
    switchRole,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Multi-role user logged in but hasn't selected a workspace yet
  if (user && profile && activeRole === null) {
    return (
      <AuthContext.Provider value={value}>
        <RolePickerScreen profile={profile} onSelect={handleRoleSelect} />
      </AuthContext.Provider>
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
