import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, FileText, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
  });

  if (isLoading) {
    return <div className="p-8 text-center">{t('common.loading')}</div>;
  }

  const chartData = [
    {
      name: 'Ovaj mesec',
      Prihodi: data?.summary.monthlyRevenue || 0,
      Rashodi: data?.summary.monthlyExpenses || 0,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">{t('nav.dashboard')}</h1>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{t('dashboard.revenue')}</p>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(data?.summary.totalRevenue || 0)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Ovaj mesec: {formatCurrency(data?.summary.monthlyRevenue || 0)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{t('dashboard.expenses')}</p>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(data?.summary.totalExpenses || 0)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Ovaj mesec: {formatCurrency(data?.summary.monthlyExpenses || 0)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{t('dashboard.outstanding')}</p>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(data?.summary.outstanding || 0)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Dugovanja</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{t('dashboard.clients')}</p>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {data?.summary.clientsCount || 0}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Faktura ovog meseca: {data?.summary.invoicesThisMonth || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Prihodi vs Rashodi (ovaj mesec)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="Prihodi" fill="#10b981" />
              <Bar dataKey="Rashodi" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Profit ovog meseca:</p>
            <p
              className={`text-2xl font-bold ${
                (data?.summary.monthlyProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data?.summary.monthlyProfit || 0)}
            </p>
          </div>
        </div>

        {/* Overdue invoices */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold">{t('dashboard.overdueInvoices')}</h2>
          </div>
          {data?.overdueInvoices && data.overdueInvoices.length > 0 ? (
            <div className="space-y-3">
              {data.overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-gray-900">{invoice.number}</span>
                    </div>
                    <p className="text-sm text-gray-600">{invoice.client.name}</p>
                    <p className="text-xs text-gray-500">
                      Rok: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 p-4 text-center text-green-700">
              Nema prekoračenih faktura! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
