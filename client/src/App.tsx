import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Environmental } from './views/Environmental';
import { Social } from './views/Social';
import { Governance } from './views/Governance';
import { Gamification } from './views/Gamification';
import { Settings } from './views/Settings';

function App() {
  return (
    <BrowserRouter>
      {/* Global Toast Notifier */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'text-sm font-semibold text-slate-800 rounded-2xl border border-slate-100 shadow-xl bg-white/90 backdrop-blur-md',
          duration: 4000,
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard and Modules */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/environmental"
          element={
            <ProtectedRoute>
              <Layout>
                <Environmental />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/social"
          element={
            <ProtectedRoute>
              <Layout>
                <Social />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance"
          element={
            <ProtectedRoute>
              <Layout>
                <Governance />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <Layout>
                <Gamification />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Role Guarded Settings View */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
