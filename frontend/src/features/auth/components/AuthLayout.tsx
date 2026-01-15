import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Mini ERP</h1>
          <p className="mt-2 text-gray-600">Sistem za evidenciju poslovanja</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
