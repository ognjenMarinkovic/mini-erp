import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reportsApi } from '../api/reports.api';
import { tasksApi } from '@/features/kanban/api/tasks.api';
import { useClientStore } from '@/stores/client-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  AlertCircle, 
  DollarSign,
  CheckCircle2,
  Clock,
  PlayCircle,
  Eye,
  LayoutGrid,
  CalendarRange,
  ArrowRight,
} from 'lucide-react';

const statusConfig = {
  ONBOARDING: { label: 'Onboarding', color: 'bg-purple-100 text-purple-700', icon: Users },
  BACKLOG: { label: 'Backlog', color: 'bg-gray-100 text-gray-700', icon: Clock },
  IN_PROGRESS: { label: 'U toku', color: 'bg-blue-100 text-blue-700', icon: PlayCircle },
  REVIEW: { label: 'Review', color: 'bg-amber-100 text-amber-700', icon: Eye },
  DONE: { label: 'Završeno', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  ARCHIVE: { label: 'Arhiva', color: 'bg-slate-100 text-slate-700', icon: FileText },
};

export function DashboardPage() {
  const { t } = useTranslation();
  const { selectedClient } = useClientStore();

  // Fetch global dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
  });

  // Fetch kanban data for selected client
  const { data: kanbanData, isLoading: kanbanLoading } = useQuery({
    queryKey: ['kanban', selectedClient?.id],
    queryFn: () => tasksApi.getKanban(selectedClient!.id),
    enabled: !!selectedClient?.id,
  });

  if (isLoading) {
    return <div className="p-8 text-center">{t('common.loading')}</div>;
  }

  // Calculate task stats for selected client
  const taskStats = kanbanData?.columns ? {
    total: Object.values(kanbanData.columns).flat().length,
    onboarding: kanbanData.columns.ONBOARDING?.length || 0,
    backlog: kanbanData.columns.BACKLOG?.length || 0,
    inProgress: kanbanData.columns.IN_PROGRESS?.length || 0,
    review: kanbanData.columns.REVIEW?.length || 0,
    done: kanbanData.columns.DONE?.length || 0,
    archive: kanbanData.columns.ARCHIVE?.length || 0,
  } : null;

  // Get recent tasks (last 5)
  const recentTasks = kanbanData?.columns 
    ? [...kanbanData.columns.IN_PROGRESS || [], ...kanbanData.columns.REVIEW || []]
        .slice(0, 5)
    : [];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">{t('nav.dashboard')}</h1>

      {/* Client specific section */}
      {selectedClient ? (
        <div className="mb-8">
          {/* Task stats for selected client */}
          <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Taskovi za: <span className="text-blue-600">{selectedClient.name}</span>
              </h2>
              <div className="flex gap-2">
                <Link
                  to="/kanban"
                  className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/gantt"
                  className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <CalendarRange className="h-4 w-4" />
                  Gantt
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {kanbanLoading ? (
              <div className="py-8 text-center text-gray-500">Učitavanje...</div>
            ) : taskStats ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const Icon = config.icon;
                  const count = status === 'ONBOARDING' ? taskStats.onboarding
                    : status === 'BACKLOG' ? taskStats.backlog
                    : status === 'IN_PROGRESS' ? taskStats.inProgress
                    : status === 'REVIEW' ? taskStats.review
                    : status === 'DONE' ? taskStats.done
                    : taskStats.archive;
                  
                  return (
                    <div
                      key={status}
                      className={`rounded-lg ${config.color} p-4 text-center`}
                    >
                      <Icon className="mx-auto mb-2 h-6 w-6" />
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs font-medium">{config.label}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">Nema podataka</div>
            )}
          </div>

          {/* Recent active tasks */}
          {recentTasks.length > 0 && (
            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <PlayCircle className="h-5 w-5 text-blue-500" />
                Aktivni taskovi
              </h3>
              <div className="space-y-3">
                {recentTasks.map((task) => {
                  const config = statusConfig[task.status as keyof typeof statusConfig];
                  return (
                    <Link
                      key={task.id}
                      to="/kanban"
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${config.color}`}>
                          <config.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-500">{task.serviceType}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Izaberite klijenta</h3>
          <p className="mt-2 text-sm text-gray-500">
            Koristite dropdown iznad da izaberete klijenta i vidite njegove taskove
          </p>
        </div>
      )}

      {/* Global Stats cards */}
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Pregled poslovanja</h2>
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

      {/* Overdue invoices */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-semibold">{t('dashboard.overdueInvoices')}</h2>
        </div>
        {data?.overdueInvoices && data.overdueInvoices.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
            Nema prekoračenih faktura!
          </div>
        )}
      </div>
    </div>
  );
}
