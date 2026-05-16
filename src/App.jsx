import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard, PublicGuard } from './components/auth/AuthGuard';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignUpForm } from './components/auth/SignUpForm';
import { DashboardPage } from './pages/DashboardPage';
import { RosterGrid } from './components/roster/RosterGrid';
import { TrackerPage } from './pages/TrackerPage';
import { ReportsPage } from './pages/ReportsPage';

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
            path="/signup" 
            element={
              <PublicGuard>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-md">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
                      <SignUpForm />
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