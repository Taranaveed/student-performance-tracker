import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, BarChart3, LogOut, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { ROLE_LABELS, FULL_VIEW_ROLES } from '../../config/marksSystem';
import schoolLogo from '../../assets/chand-bagh-logo.png';

const ROLE_COLORS = {
  principal:            'bg-purple-100 text-purple-700',
  vicePrincipal:        'bg-purple-100 text-purple-700',
  housemaster:          'bg-blue-100 text-blue-700',
  housemistress:        'bg-pink-100 text-pink-700',
  assistantHousemaster: 'bg-blue-50 text-blue-600',
  teacher:              'bg-green-100 text-green-700',
  peHead:               'bg-orange-100 text-orange-700',
  skillsHead:           'bg-yellow-100 text-yellow-700',
  activitiesHead:       'bg-teal-100 text-teal-700',
  houseTeam:            'bg-gray-100 text-gray-700',
};

export function Sidebar({ onClose }) {
  const { profile, role } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
  };

  const allNavItems = [
    { to: '/',        icon: LayoutDashboard, label: 'Dashboard',     roles: null },
    { to: '/roster',  icon: Users,           label: 'Roster',        roles: null },
    { to: '/tracker', icon: ClipboardList,   label: 'Marks Tracker', roles: null },
    { to: '/reports', icon: BarChart3,       label: 'Reports',       roles: null },
  ];

  const navItems = allNavItems.filter(item =>
    item.roles === null || item.roles.includes(role)
  );

  const roleLabel = ROLE_LABELS[role] ?? 'Staff';
  const roleBadgeClass = ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600';
  const houseLabel = profile?.houseAssignment ? ` · ${profile.houseAssignment} House` : '';

  return (
    <aside className="h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="p-4 md:p-5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img src={schoolLogo} alt="Chand Bagh School" className="w-12 h-12 rounded-full flex-shrink-0 border border-blue-100" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-blue-900 leading-tight truncate">Student Tracker</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">Chand Bagh School</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 md:p-4 border-t border-gray-200">
        <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeClass}`}>
              {roleLabel}{houseLabel}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
          <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
