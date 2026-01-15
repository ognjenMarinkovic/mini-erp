import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import { AuthLayout } from './features/auth/components/AuthLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { DashboardPage } from './features/reports/pages/DashboardPage';
import { ClientsListPage } from './features/clients/pages/ClientsListPage';
import { InvoicesListPage } from './features/invoices/pages/InvoicesListPage';
import { ExpensesListPage } from './features/expenses/pages/ExpensesListPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes */}
      {isAuthenticated && (
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/expenses" element={<ExpensesListPage />} />
        </Route>
      )}

      {/* Redirect to login if not authenticated */}
      {!isAuthenticated && <Route path="*" element={<LoginPage />} />}
    </Routes>
  );
}

export default App;
