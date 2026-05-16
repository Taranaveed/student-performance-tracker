import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

const pageTitles = {
  '/': 'Dashboard',
  '/roster': 'Student Roster',
  '/tracker': 'Daily Performance Tracker',
  '/reports': 'Monthly Reports'
};

export function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}