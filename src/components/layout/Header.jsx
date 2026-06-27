import { useLocation } from 'react-router-dom';

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
    </header>
  );
}
