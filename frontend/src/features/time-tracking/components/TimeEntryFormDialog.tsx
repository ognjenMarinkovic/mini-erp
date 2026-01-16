import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { timeTrackingApi, type TimeEntry, type CreateTimeEntryDto } from '../api/time-tracking.api';
import { tasksApi } from '@/features/kanban/api/tasks.api';

interface TimeEntryFormDialogProps {
  clientId: string;
  clientName: string;
  entry?: TimeEntry | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TimeEntryFormDialog({
  clientId,
  clientName,
  entry,
  onClose,
  onSuccess,
}: TimeEntryFormDialogProps) {
  const isEdit = !!entry;

  const [formData, setFormData] = useState({
    taskId: entry?.taskId || '',
    description: entry?.description || '',
    date: entry ? format(new Date(entry.startTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: entry ? format(new Date(entry.startTime), 'HH:mm') : '09:00',
    endTime: entry?.endTime ? format(new Date(entry.endTime), 'HH:mm') : '17:00',
    billable: entry?.billable ?? true,
    hourlyRate: entry?.hourlyRate?.toString() || '',
  });

  // Fetch taskovi za klijenta
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', clientId],
    queryFn: () => tasksApi.getByClient(clientId),
    enabled: !!clientId,
  });

  const tasks = tasksData?.columns
    ? Object.values(tasksData.columns).flat()
    : [];

  const createMutation = useMutation({
    mutationFn: (dto: CreateTimeEntryDto) => timeTrackingApi.create(dto),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; data: any }) =>
      timeTrackingApi.update(dto.id, dto.data),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    const dto: CreateTimeEntryDto = {
      clientId: clientId,
      taskId: formData.taskId || undefined,
      description: formData.description || undefined,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      billable: formData.billable,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
    };

    if (isEdit && entry) {
      updateMutation.mutate({ id: entry.id, data: dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Izmeni unos' : 'Ručni unos vremena'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Klijent */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Klijent
              </label>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <span className="font-medium text-blue-700">{clientName}</span>
              </div>
            </div>

            {/* Task (opciono) */}
            {tasks.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Task (opciono)
                </label>
                <select
                  value={formData.taskId}
                  onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Bez taska</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Opis */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Opis
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Šta si radio?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Datum i vreme */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Datum *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Početak *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Kraj *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Naplativo i satnica */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="billable"
                  checked={formData.billable}
                  onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="billable" className="text-sm font-medium text-gray-700">
                  Naplativo
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Satnica (RSD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Čuvanje...' : isEdit ? 'Sačuvaj' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
