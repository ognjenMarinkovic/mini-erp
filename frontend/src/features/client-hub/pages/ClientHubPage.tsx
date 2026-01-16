import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClientAuthStore } from '@/stores/client-auth-store';
import { tasksApi, type Task } from '@/features/kanban/api/tasks.api';

export function ClientHubPage() {
  const { clientUser } = useClientAuthStore();

  // Fetch taskove za ovog klijenta
  const { data: kanbanData, isLoading } = useQuery({
    queryKey: ['client-tasks', clientUser?.clientId],
    queryFn: () => tasksApi.getKanban(clientUser!.clientId),
    enabled: !!clientUser?.clientId,
  });

  // Izračunaj statistiku
  const stats = {
    inProgress: kanbanData?.columns.IN_PROGRESS.length || 0,
    review: kanbanData?.columns.REVIEW.length || 0,
    done: kanbanData?.columns.DONE.length || 0,
    total: kanbanData?.totalTasks || 0,
  };

  // Poslednji taskovi
  const recentTasks: Task[] = [
    ...(kanbanData?.columns.IN_PROGRESS || []),
    ...(kanbanData?.columns.REVIEW || []),
    ...(kanbanData?.columns.BACKLOG || []),
  ].slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Dobrodošli, {clientUser?.firstName}!
        </h1>
        <p className="mt-1 text-gray-600">
          Pratite status vaših projekata i taskova
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ukupno taskova</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <LayoutGrid className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">U toku</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="rounded-lg bg-amber-100 p-3">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Na pregledu</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.review}</p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Završeno</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.done}</p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Tasks */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Aktivni taskovi</h2>
            <Link
              to="/client/tasks"
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
            >
              Vidi sve
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-gray-400">
              <LayoutGrid className="mb-2 h-8 w-8" />
              <p>Nema aktivnih taskova</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {task.status === 'IN_PROGRESS' && 'U toku'}
                      {task.status === 'REVIEW' && 'Na pregledu'}
                      {task.status === 'BACKLOG' && 'Čeka'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      task.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-700'
                        : task.status === 'REVIEW'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {task.status === 'IN_PROGRESS' && 'U toku'}
                    {task.status === 'REVIEW' && 'Review'}
                    {task.status === 'BACKLOG' && 'Backlog'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Brze akcije</h2>

          <div className="space-y-3">
            <Link
              to="/client/tasks"
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-200 hover:bg-purple-50"
            >
              <div className="rounded-lg bg-purple-100 p-2">
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Dodaj novi task</p>
                <p className="text-sm text-gray-500">
                  Zatražite novi zadatak ili izmenu
                </p>
              </div>
            </Link>

            <Link
              to="/client/files"
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-200 hover:bg-purple-50"
            >
              <div className="rounded-lg bg-blue-100 p-2">
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Upload fajlova</p>
                <p className="text-sm text-gray-500">
                  Pošaljite nam potrebne materijale
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
