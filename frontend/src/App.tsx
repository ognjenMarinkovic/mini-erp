import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import { useClientAuthStore } from './stores/client-auth-store';
import { AuthLayout } from './features/auth/components/AuthLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { DashboardPage } from './features/reports/pages/DashboardPage';
import { ClientsListPage } from './features/clients/pages/ClientsListPage';
import { InvoicesListPage } from './features/invoices/pages/InvoicesListPage';
import { ExpensesListPage } from './features/expenses/pages/ExpensesListPage';
import { KanbanPage } from './features/kanban/pages/KanbanPage';
import { GanttPage } from './features/gantt/pages/GanttPage';
import { TimeTrackingPage } from './features/time-tracking/pages/TimeTrackingPage';
// Client Hub
import { ClientLoginPage } from './features/client-hub/pages/ClientLoginPage';
import { ClientHubLayout } from './features/client-hub/components/ClientHubLayout';
import { ClientHubPage } from './features/client-hub/pages/ClientHubPage';
import { ClientTasksPage } from './features/client-hub/pages/ClientTasksPage';
import { ClientFilesPage } from './features/client-hub/pages/ClientFilesPage';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { isClientAuthenticated } = useClientAuthStore();

  return (
    <Routes>
      {/* ==================== PUBLIC ROUTES ==================== */}
      
      {/* Admin Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Client Login */}
      <Route path="/client/login" element={<ClientLoginPage />} />

      {/* ==================== ADMIN ROUTES ==================== */}
      {isAuthenticated && (
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/gantt" element={<GanttPage />} />
          <Route path="/time-tracking" element={<TimeTrackingPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/expenses" element={<ExpensesListPage />} />
        </Route>
      )}

      {/* ==================== CLIENT HUB ROUTES ==================== */}
      {isClientAuthenticated && (
        <Route path="/client" element={<ClientHubLayout />}>
          <Route index element={<ClientHubPage />} />
          <Route path="tasks" element={<ClientTasksPage />} />
          <Route path="files" element={<ClientFilesPage />} />
        </Route>
      )}

      {/* ==================== REDIRECTS ==================== */}
      
      {/* Client routes - redirect to login if not authenticated */}
      {!isClientAuthenticated && (
        <Route path="/client/*" element={<Navigate to="/client/login" replace />} />
      )}

      {/* Admin routes - redirect to login if not authenticated */}
      {!isAuthenticated && <Route path="*" element={<Navigate to="/login" replace />} />}
    </Routes>
  );
}

export default App;
