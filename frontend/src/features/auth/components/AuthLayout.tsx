import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Mini ERP</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sistem za evidenciju poslovanja</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
