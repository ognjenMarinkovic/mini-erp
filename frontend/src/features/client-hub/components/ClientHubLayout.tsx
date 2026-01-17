import { useTranslation } from 'react-i18next';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useClientAuthStore } from '@/stores/client-auth-store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  LogOut,
  Building2,
  LayoutGrid,
  CalendarRange,
  Settings,
} from 'lucide-react';

export function ClientHubLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { clientUser, clientLogout } = useClientAuthStore();

  const navigation = [
    { name: t('nav.dashboard'), href: '/client', icon: LayoutDashboard },
    { name: t('nav.kanban'), href: '/client/kanban', icon: LayoutGrid },
    { name: t('nav.gantt'), href: '/client/gantt', icon: CalendarRange },
    { name: t('nav.invoices'), href: '/client/invoices', icon: FileText },
    { name: t('clientHub.files'), href: '/client/files', icon: FolderKanban },
    { name: 'Podešavanja', href: '/client/settings', icon: Settings },
  ];

  const handleLogout = () => {
    clientLogout();
    window.location.href = '/client/login';
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-gray-800 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 dark:bg-purple-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold">Client Hub</h1>
              <p className="text-xs text-slate-400 dark:text-gray-400">{clientUser?.client.name}</p>
            </div>
          </div>
        </div>

        <nav className="mt-4 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600 dark:bg-purple-700 text-white'
                    : 'text-slate-400 dark:text-gray-400 hover:bg-slate-800 dark:hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="absolute bottom-0 w-64 border-t border-slate-800 dark:border-gray-700 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ThemeToggle />
            <div className="flex-1">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 dark:bg-purple-700 text-sm font-medium">
              {clientUser?.firstName?.[0]}
              {clientUser?.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium">
                {clientUser?.firstName} {clientUser?.lastName}
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-400">{clientUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-gray-400 transition-colors hover:bg-slate-800 dark:hover:bg-gray-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
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
