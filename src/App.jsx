import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard, PublicGuard } from './components/auth/AuthGuard';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { SignUpForm } from './components/auth/SignUpForm';
import { DashboardPage } from './pages/DashboardPage';
import { RosterGrid } from './components/roster/RosterGrid';
import { TrackerPage } from './pages/TrackerPage';
import { ReportsPage } from './pages/ReportsPage';
import bannerImg from './assets/chand-bagh-banner.png';
import schoolLogo from './assets/chand-bagh-logo.png';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicGuard>
                <LoginPage />
              </PublicGuard>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicGuard>
                <ForgotPasswordPage />
              </PublicGuard>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicGuard>
                <div className="min-h-screen flex">
                  {/* Banner panel (desktop only) */}
                  <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
                    <img src={bannerImg} alt="Chand Bagh School – Jilani Block" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-blue-950/70" />
                    <div className="relative z-10 flex flex-col items-center text-center px-10">
                      <img src={schoolLogo} alt="Chand Bagh School crest" className="w-24 h-24 rounded-full border-4 border-white/30 shadow-2xl mb-6" />
                      <h1 className="text-3xl font-bold text-white tracking-wide">Chand Bagh School</h1>
                      <p className="text-blue-200 text-sm mt-1 font-medium tracking-widest uppercase">Jilani Block</p>
                      <div className="w-16 h-px bg-white/30 my-5" />
                      <p className="text-white/80 text-base font-medium">Student Performance Portal</p>
                    </div>
                  </div>
                  {/* Form panel */}
                  <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
                    <div className="w-full max-w-md">
                      {/* Mobile logo */}
                      <div className="flex flex-col items-center mb-6 lg:hidden">
                        <img src={schoolLogo} alt="Chand Bagh School" className="w-14 h-14 rounded-full border-2 border-blue-200 shadow mb-2" />
                        <h1 className="text-lg font-bold text-blue-900">Chand Bagh School</h1>
                      </div>
                      <div className="hidden lg:block mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                        <p className="text-gray-500 mt-1 text-sm">Register as a staff member</p>
                      </div>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <SignUpForm />
                      </div>
                    </div>
                  </div>
                </div>
              </PublicGuard>
            } 
          />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="roster" element={<RosterGrid />} />
            <Route path="tracker" element={<TrackerPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;