import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  TrendingDown,
  LogOut,
} from 'lucide-react';

export function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.clients'), href: '/clients', icon: Users },
    { name: t('nav.invoices'), href: '/invoices', icon: FileText },
    { name: t('nav.expenses'), href: '/expenses', icon: TrendingDown },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Mini ERP</h1>
          <p className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</p>
        </div>
        <nav className="mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-6 py-3 text-sm font-medium ${
                  isActive
                    ? 'border-r-4 border-blue-600 bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-gray-200 p-4">
          <div className="mb-2">
            <LanguageSwitcher />
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="mr-3 h-5 w-5" />
            {t('auth.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
