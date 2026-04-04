import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/LandingPage/Navbar';
import Hero from './components/LandingPage/Hero';
import StatsBar from './components/LandingPage/StatsBar';
import FeaturesGrid from './components/LandingPage/FeaturesGrid';
import CTASection from './components/LandingPage/CTASection';
import Footer from './components/LandingPage/Footer';
import LoginPage from './components/LoginPage/LoginPage';
import SignupPage from './components/SignupPage/SignupPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import ManagerDashboard from './components/Manager/ManagerDashboard';
import ProjectDetail from './components/Manager/ProjectDetail';
import DeveloperDashboard from './components/Developer/DeveloperDashboard';
import ProjectLogs from './components/Developer/ProjectLogs';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface-dim selection:bg-primary-container selection:text-on-primary-container">
      <Navbar onSignIn={() => navigate('/login')} />
      <main>
        <Hero onSignUp={() => navigate('/login')} />
        <StatsBar />
        <FeaturesGrid />
        <CTASection onSignUp={() => navigate('/login')} />
      </main>
      <Footer />
    </div>
  );
};

// Smart redirect based on user role
const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  const paths: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    MANAGER: '/manager/dashboard',
    DEVELOPER: '/developer/dashboard',
  };
  return <Navigate to={paths[user.role] || '/login'} replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/loginpage" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Smart redirects */}
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="/logs" element={<RoleRedirect />} />
      <Route path="/projects" element={<RoleRedirect />} />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/organizations"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/developers"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Manager routes */}
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/projects"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/projects/:id"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/requests"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/team"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/settings"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Developer routes */}
      <Route
        path="/developer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['DEVELOPER']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/projects"
        element={
          <ProtectedRoute allowedRoles={['DEVELOPER']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/projects/:id/logs"
        element={
          <ProtectedRoute allowedRoles={['DEVELOPER']}>
            <ProjectLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/browse"
        element={
          <ProtectedRoute allowedRoles={['DEVELOPER']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/logs"
        element={
          <ProtectedRoute allowedRoles={['DEVELOPER']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/settings"
        element={
          <ProtectedRoute allowedRoles={['DEVELOPER']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
