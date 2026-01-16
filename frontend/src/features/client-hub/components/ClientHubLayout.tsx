import { Outlet, Link, useLocation } from 'react-router-dom';
import { useClientAuthStore } from '@/stores/client-auth-store';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  LogOut,
  Building2,
} from 'lucide-react';

export function ClientHubLayout() {
  const location = useLocation();
  const { clientUser, clientLogout } = useClientAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/client', icon: LayoutDashboard },
    { name: 'Taskovi', href: '/client/tasks', icon: FolderKanban },
    { name: 'Fajlovi', href: '/client/files', icon: FileText },
  ];

  const handleLogout = () => {
    clientLogout();
    window.location.href = '/client/login';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold">Client Hub</h1>
              <p className="text-xs text-slate-400">{clientUser?.client.name}</p>
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
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="absolute bottom-0 w-64 border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-sm font-medium">
              {clientUser?.firstName?.[0]}
              {clientUser?.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium">
                {clientUser?.firstName} {clientUser?.lastName}
              </p>
              <p className="text-xs text-slate-400">{clientUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Odjavi se
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
