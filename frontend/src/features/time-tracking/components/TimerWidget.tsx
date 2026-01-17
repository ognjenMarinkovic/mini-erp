import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock } from 'lucide-react';
import { timeTrackingApi } from '../api/time-tracking.api';

interface TimerWidgetProps {
  clientId: string;
  clientName: string;
}

export function TimerWidget({ clientId, clientName }: TimerWidgetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch aktivni timeri
  const { data: activeTimers } = useQuery({
    queryKey: ['active-timers'],
    queryFn: timeTrackingApi.getActiveTimers,
    refetchInterval: 30000, // Refetch svake 30 sekundi
  });

  const activeTimer = activeTimers?.[0];

  // Update elapsed time
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(activeTimer.startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Start timer mutation
  const startMutation = useMutation({
    mutationFn: (dto: { clientId: string; description?: string; startTime: string }) =>
      timeTrackingApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timers'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setDescription('');
    },
  });

  // Stop timer mutation
  const stopMutation = useMutation({
    mutationFn: ({ id, endTime }: { id: string; endTime: string }) =>
      timeTrackingApi.stopTimer(id, endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timers'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-stats'] });
    },
  });

  const handleStart = () => {
    startMutation.mutate({
      clientId: clientId,
      description: description || undefined,
      startTime: new Date().toISOString(),
    });
  };

  const handleStop = () => {
    if (!activeTimer) return;

    stopMutation.mutate({
      id: activeTimer.id,
      endTime: new Date().toISOString(),
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
      {activeTimer ? (
        // Aktivni timer
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('timeTracking.activeTimer')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{activeTimer.client.name}</p>
              {activeTimer.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeTimer.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-mono text-3xl font-bold text-gray-900 dark:text-white">
                {formatTime(elapsedTime)}
              </p>
            </div>

            <button
              onClick={handleStop}
              disabled={stopMutation.isPending}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 dark:bg-red-700 text-white shadow-lg transition-all hover:bg-red-700 dark:hover:bg-red-600 hover:shadow-xl disabled:opacity-50"
            >
              <Square className="h-6 w-6" fill="currentColor" />
            </button>
          </div>
        </div>
      ) : (
        // Start timer forma
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex flex-1 items-center gap-3">
            <div className="rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-4 py-2.5">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{clientName}</span>
            </div>

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('timeTracking.whatAreYouDoingOptional')}
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
            />

            <button
              onClick={handleStart}
              disabled={startMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-700 px-6 py-2.5 font-medium text-white transition-all hover:bg-blue-700 dark:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-5 w-5" fill="currentColor" />
              {t('timeTracking.start')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
