import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    if (window.confirm('Da li ste sigurni da želite da obrišete ovaj unos?')) {
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
          <Clock className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        </div>

        <div className="flex h-[calc(100vh-16rem)] items-center justify-center">
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Izaberite klijenta
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Koristite dropdown u header-u iznad da izaberete klijenta
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
          <Clock className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {selectedClient.name}
          </span>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Osveži
        </button>
      </div>

      {/* Timer Widget */}
      <TimerWidget clientId={selectedClient.id} clientName={selectedClient.name} />

      {/* Stats kartica */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ove nedelje</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalHours}h</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Naplativo</p>
                <p className="text-xl font-bold text-gray-900">{stats.billableHours}h</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unosa</p>
                <p className="text-xl font-bold text-gray-900">{stats.entriesCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Klijenata</p>
                <p className="text-xl font-bold text-gray-900">
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
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Clock className="h-4 w-4" />
          Ručni unos
        </button>
      </div>

      {/* Lista unosa */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Clock className="mb-4 h-12 w-12 text-gray-300" />
            <p>Nema unetog vremena</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Opis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Klijent / Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Trajanje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Naplativo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {entry.description || 'Bez opisa'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{entry.client.name}</p>
                      {entry.task && (
                        <p className="text-sm text-gray-500">{entry.task.title}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(entry.startTime), 'd. MMM yyyy', { locale: sr })}
                      <br />
                      <span className="text-xs">
                        {format(new Date(entry.startTime), 'HH:mm')} -{' '}
                        {entry.endTime
                          ? format(new Date(entry.endTime), 'HH:mm')
                          : 'u toku'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`font-medium ${
                          entry.endTime ? 'text-gray-900' : 'text-green-600'
                        }`}
                      >
                        {entry.endTime ? (
                          formatDuration(entry.duration)
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            U toku
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          entry.billable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entry.billable ? 'Da' : 'Ne'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
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
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Ukupno: {data.summary.totalEntries} unosa
                  </span>
                  <span className="font-medium text-gray-900">
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
