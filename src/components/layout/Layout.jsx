import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import schoolLogo from '../../assets/chand-bagh-logo.png';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile, toggleable */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:h-full
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-200
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img src={schoolLogo} alt="Chand Bagh School" className="w-8 h-8 rounded-full" />
          <div>
            <p className="text-sm font-bold text-blue-900 leading-tight">Student Tracker</p>
            <p className="text-xs text-gray-400 leading-tight">Chand Bagh School</p>
          </div>
        </div>
        
        <div className="hidden lg:block">
          <Header />
        </div>
        
        <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}