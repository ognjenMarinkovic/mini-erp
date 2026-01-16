import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useClientStore } from '@/stores/client-store';
import { clientsApi } from '@/features/clients/api/clients.api';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingDown,
  LogOut,
  LayoutGrid,
  CalendarRange,
  Clock,
  ChevronDown,
  Building2,
  X,
} from 'lucide-react';

export function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { selectedClient, setSelectedClient, clearSelectedClient } = useClientStore();
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Fetch klijenti
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
  });

  const clients = clientsData?.data || [];

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.clients'), href: '/clients', icon: Users },
    { name: t('nav.kanban'), href: '/kanban', icon: LayoutGrid },
    { name: t('nav.gantt'), href: '/gantt', icon: CalendarRange },
    { name: t('nav.timeTracking'), href: '/time-tracking', icon: Clock },
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
        {/* Top header sa client selector-om */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Aktivni klijent:</span>
              
              {/* Client selector dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className={`flex min-w-[280px] items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedClient
                      ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{selectedClient?.name || 'Izaberi klijenta...'}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isClientDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsClientDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
                      {clientsLoading ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          Učitavanje...
                        </div>
                      ) : clients.length === 0 ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          Nema klijenata
                        </div>
                      ) : (
                        clients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client);
                              setIsClientDropdownOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                              client.id === selectedClient?.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700'
                            }`}
                          >
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{client.name}</p>
                              {client.city && (
                                <p className="text-xs text-gray-500">{client.city}</p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Clear button */}
              {selectedClient && (
                <button
                  onClick={clearSelectedClient}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Poništi izbor"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Right side info */}
            {selectedClient && (
              <div className="text-sm text-gray-500">
                {selectedClient.email}
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
