import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, BarChart3, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export function Sidebar({ onClose }) {
  const { teacherData } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/roster', icon: Users, label: 'Roster' },
    { to: '/tracker', icon: ClipboardList, label: 'Marks Tracker' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  return (
    <aside className="h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            TrackEd
          </h1>
          <p className="text-xs text-gray-500 mt-1">Student Performance</p>
        </div>
        {/* Mobile close button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 md:p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm md:text-base ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 md:p-4 border-t border-gray-200">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium text-gray-900 truncate">{teacherData?.name}</p>
          <p className="text-xs text-gray-500 truncate">{teacherData?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm md:text-base"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}