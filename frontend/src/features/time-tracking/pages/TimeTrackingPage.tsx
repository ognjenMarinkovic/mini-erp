import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Trash2,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertCircle,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import {
  timeTrackingApi,
  type TimeEntry,
} from '../api/time-tracking.api';
import { useClientStore } from '@/stores/client-store';
import { TimerWidget } from '../components/TimerWidget';
import { TimeEntryFormDialog } from '../components/TimeEntryFormDialog';

export function TimeTrackingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { selectedClient } = useClientStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Fetch time entries za odabranog klijenta
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['time-entries', selectedClient?.id],
    queryFn: () =>
      timeTrackingApi.getAll(selectedClient?.id ? { clientId: selectedClient.id } : undefined),
    enabled: !!selectedClient?.id,
  });

  // Fetch statistika za odabranog klijenta
  const { data: stats } = useQuery({
    queryKey: ['time-stats', selectedClient?.id],
    queryFn: () => timeTrackingApi.getStats('week'),
    enabled: !!selectedClient?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: timeTrackingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-stats'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm(t('timeTracking.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const entries = data?.entries || [];

  // Ako nije odabran klijent
  if (!selectedClient) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('timeTracking.title')}</h1>
        </div>

        <div className="flex h-[calc(100vh-16rem)] items-center justify-center">
          <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {t('timeTracking.selectClientPrompt')}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('timeTracking.selectClientDescription')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('timeTracking.title')}</h1>
          <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedClient.name}
          </span>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Timer Widget */}
      <TimerWidget clientId={selectedClient.id} clientName={selectedClient.name} />

      {/* Stats kartica */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('timeTracking.thisWeek')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalHours}h</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('timeTracking.billable')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.billableHours}h</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('timeTracking.entries')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.entriesCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('timeTracking.clients')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Object.keys(stats.byClient).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Clock className="h-4 w-4" />
          {t('timeTracking.manualEntry')}
        </button>
      </div>

      {/* Lista unosa */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
            <Clock className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p>{t('timeTracking.noEntries')}</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('timeTracking.description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('timeTracking.client')} / {t('timeTracking.task')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('timeTracking.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('timeTracking.duration')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('timeTracking.billable')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.description || t('common.noDescription')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{entry.client.name}</p>
                      {entry.task && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{entry.task.title}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.startTime), 'd. MMM yyyy', { locale: sr })}
                      <br />
                      <span className="text-xs">
                        {format(new Date(entry.startTime), 'HH:mm')} -{' '}
                        {entry.endTime
                          ? format(new Date(entry.endTime), 'HH:mm')
                          : t('timeTracking.inProgress')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`font-medium ${
                          entry.endTime ? 'text-gray-900 dark:text-white' : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {entry.endTime ? (
                          formatDuration(entry.duration)
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            {t('timeTracking.inProgress')}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          entry.billable
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {entry.billable ? t('common.yes', { defaultValue: 'Da' }) : t('common.no', { defaultValue: 'Ne' })}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                        title="Obriši"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            {data?.summary && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('timeTracking.total')}: {data.summary.totalEntries} {t('timeTracking.entriesCount')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.summary.totalFormatted}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {showForm && (
        <TimeEntryFormDialog
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          onClose={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingEntry(null);
            queryClient.invalidateQueries({ queryKey: ['time-entries'] });
            queryClient.invalidateQueries({ queryKey: ['time-stats'] });
          }}
          entry={editingEntry}
        />
      )}
    </div>
  );
}
