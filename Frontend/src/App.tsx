import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/LandingPage/Navbar';
import Hero from './components/LandingPage/Hero';
import AboutSection from './components/LandingPage/AboutSection';
import ContactSection from './components/LandingPage/ContactSection';
import LoginPage from './components/LoginPage/LoginPage';
import SignupPage from './components/SignupPage/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import { useAuth } from './context/AuthContext';

// ── Admin ─────────────────────────────────────────────────────────────────────
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminProjectsPage from './components/Admin/AdminProjectsPage';
import ManageOrgPage from './components/Admin/ManageOrgPage';
import AdminSettingsPage from './components/Admin/AdminSettingsPage';

// ── Manager ───────────────────────────────────────────────────────────────────
import ManagerDashboard from './components/Manager/ManagerDashboard';
import ProjectsListPage from './components/Manager/ProjectsListPage';
import ProjectDetail from './components/Manager/ProjectDetail';
import JoinRequestsPage from './components/Manager/JoinRequestsPage';

// ── Developer ─────────────────────────────────────────────────────────────────
import DeveloperDashboard from './components/Developer/DeveloperDashboard';
import MyProjectsPage from './components/Developer/MyProjectsPage';
import InvitationsPage from './components/Developer/InvitationsPage';
import DeveloperProfilePage from './components/Developer/DeveloperProfilePage';
import ProjectLogs from './components/Developer/ProjectLogs';

// ─────────────────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="landing min-h-screen flex flex-col bg-[hsl(var(--lp-bg))] selection:bg-[hsl(var(--lp-accent))] selection:text-white">
      <Navbar onSignIn={() => navigate('/login')} />
      <Hero onSignUp={() => navigate('/signup')} />
      <AboutSection />
      <ContactSection />
    </div>
  );
};

/** Redirect logged-in user to their role-appropriate dashboard. */
const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  const paths: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    MANAGER: '/manager/dashboard',
    DEVELOPER: '/developer/dashboard',
  };
  return <Navigate to={paths[user.role] ?? '/login'} replace />;
};

function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/loginpage" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ── Generic smart redirects ─────────────────────────────────────────── */}
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="/logs" element={<RoleRedirect />} />
      <Route path="/projects" element={<RoleRedirect />} />

      {/* ── Authenticated dashboard shell (persistent Sidebar) ──────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DEVELOPER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-org"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManageOrgPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Manager */}
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
              <ProjectsListPage />
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
              <JoinRequestsPage />
            </ProtectedRoute>
          }
        />

        {/* Developer */}
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
              <MyProjectsPage />
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
          path="/developer/invitations"
          element={
            <ProtectedRoute allowedRoles={['DEVELOPER']}>
              <InvitationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/developer/profile"
          element={
            <ProtectedRoute allowedRoles={['DEVELOPER']}>
              <DeveloperProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ── Catch-all ───────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
