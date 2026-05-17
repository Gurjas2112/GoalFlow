
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './components/Shared';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EmployeeGoalsPage from './pages/EmployeeGoalsPage';
import EmployeeCheckInPage from './pages/EmployeeCheckInPage';
import ManagerTeamPage from './pages/ManagerTeamPage';
import ManagerReviewPage from './pages/ManagerReviewPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCyclesPage from './pages/AdminCyclesPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminAuditPage from './pages/AdminAuditPage';
import AdminEscalationsPage from './pages/AdminEscalationsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminScoringDemoPage from './pages/AdminScoringDemoPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'MANAGER') return <Navigate to="/manager/team" />;
  return <Navigate to="/employee/goals" />;
}

function AppContent() {
  const { user } = useAuth();
  return (
    <>
      {user && <Sidebar />}
      <main className={user ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="/employee/goals" element={<PrivateRoute role="EMPLOYEE"><EmployeeGoalsPage /></PrivateRoute>} />
          <Route path="/employee/checkin" element={<PrivateRoute role="EMPLOYEE"><EmployeeCheckInPage /></PrivateRoute>} />
          <Route path="/manager/team" element={<PrivateRoute role="MANAGER"><ManagerTeamPage /></PrivateRoute>} />
          <Route path="/manager/sheet/:sheetId" element={<PrivateRoute role="MANAGER|ADMIN"><ManagerReviewPage /></PrivateRoute>} />
          <Route path="/admin/dashboard" element={<PrivateRoute role="ADMIN"><AdminDashboardPage /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute role="ADMIN"><AdminUsersPage /></PrivateRoute>} />
          <Route path="/admin/cycles" element={<PrivateRoute role="ADMIN"><AdminCyclesPage /></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute role="ADMIN"><AdminReportsPage /></PrivateRoute>} />
          <Route path="/admin/audit" element={<PrivateRoute role="ADMIN"><AdminAuditPage /></PrivateRoute>} />
          <Route path="/admin/escalations" element={<PrivateRoute role="ADMIN"><AdminEscalationsPage /></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute role="ADMIN"><AdminAnalyticsPage /></PrivateRoute>} />
          <Route path="/admin/scoring-demo" element={<PrivateRoute role="ADMIN"><AdminScoringDemoPage /></PrivateRoute>} />
          <Route path="/admin/notifications" element={<PrivateRoute role="ADMIN"><AdminNotificationsPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-layout">
          <AppContent />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
