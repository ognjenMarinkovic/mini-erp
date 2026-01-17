import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameDay,
  differenceInDays,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { type GanttTask } from '../api/gantt.api';

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskClick?: (task: GanttTask) => void;
}

// Mapiranje statusa na boje
const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  ONBOARDING: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  BACKLOG: { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-white' },
  IN_PROGRESS: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  REVIEW: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white' },
  DONE: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  ARCHIVE: { bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-white' },
};

type ViewMode = 'month' | 'week';

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Meseci i dani na osnovu jezika
  const meseci = useMemo(() => [
    t('gantt.months.january'),
    t('gantt.months.february'),
    t('gantt.months.march'),
    t('gantt.months.april'),
    t('gantt.months.may'),
    t('gantt.months.june'),
    t('gantt.months.july'),
    t('gantt.months.august'),
    t('gantt.months.september'),
    t('gantt.months.october'),
    t('gantt.months.november'),
    t('gantt.months.december'),
  ], [t]);

  const daniUNedelji = useMemo(() => [
    t('gantt.days.sun'),
    t('gantt.days.mon'),
    t('gantt.days.tue'),
    t('gantt.days.wed'),
    t('gantt.days.thu'),
    t('gantt.days.fri'),
    t('gantt.days.sat'),
  ], [t]);

  const statusLabels: Record<string, string> = {
    ONBOARDING: t('kanban.columns.onboarding'),
    BACKLOG: t('kanban.columns.backlog'),
    IN_PROGRESS: t('kanban.columns.inProgress'),
    REVIEW: t('kanban.columns.review'),
    DONE: t('kanban.columns.done'),
    ARCHIVE: t('kanban.columns.archive'),
  };

  const serviceTypeLabels: Record<string, string> = {
    BRANDING: t('kanban.serviceTypes.BRANDING'),
    LOGO_DESIGN: t('kanban.serviceTypes.LOGO_DESIGN'),
    WEB_DESIGN: t('kanban.serviceTypes.WEB_DESIGN'),
    UI_UX: t('kanban.serviceTypes.UI_UX'),
    WEBFLOW_DEV: t('kanban.serviceTypes.WEBFLOW_DEV'),
    SOCIAL_MEDIA: t('kanban.serviceTypes.SOCIAL_MEDIA'),
    PITCH_DECK: t('kanban.serviceTypes.PITCH_DECK'),
    MOTION_GRAPHICS: t('kanban.serviceTypes.MOTION_GRAPHICS'),
    ILLUSTRATIONS: t('kanban.serviceTypes.ILLUSTRATIONS'),
    PRINT_DESIGN: t('kanban.serviceTypes.PRINT_DESIGN'),
    OTHER: t('kanban.serviceTypes.OTHER'),
  };

  // Filtriraj taskove koji imaju startDate (endDate može biti null za aktivne taskove)
  const tasksWithDates = useMemo(() => {
    const today = new Date();
    return tasks
      .filter((task) => task.startDate) // Samo treba startDate
      .map((task) => ({
        ...task,
        // Prioritet: endDate > deadline > danas
        effectiveEndDate: task.endDate || task.deadline || today.toISOString(),
        // Da li je task još uvek aktivan (nema endDate)
        isActive: !task.endDate,
      }))
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
  }, [tasks]);

  const tasksWithoutDates = tasks.filter((t) => !t.startDate);

  // Generiši dane za prikaz - za mesec prikaži 3 meseca, za nedelju prikaži 4 nedelje
  const { days, weeks, months } = useMemo(() => {
    if (viewMode === 'month') {
      // Prikaži prethodni, trenutni i sledeći mesec (3 meseca ukupno)
      const prevMonth = subMonths(currentDate, 1);
      const nextMonth = addMonths(currentDate, 1);
      const start = startOfMonth(prevMonth);
      const end = endOfMonth(nextMonth);
      const days = eachDayOfInterval({ start, end });
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      
      // Generiši mesece za header
      const months = [
        { date: prevMonth, start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) },
        { date: currentDate, start: startOfMonth(currentDate), end: endOfMonth(currentDate) },
        { date: nextMonth, start: startOfMonth(nextMonth), end: endOfMonth(nextMonth) },
      ];
      
      return { days, weeks, months };
    } else {
      // Prikaži sve nedelje u trenutnom mesecu
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Početak prve nedelje (može biti u prethodnom mesecu)
      const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      // Kraj poslednje nedelje (može biti u sledećem mesecu)
      const lastWeekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      
      const days = eachDayOfInterval({ start: firstWeekStart, end: lastWeekEnd });
      const weeks = eachWeekOfInterval({ start: firstWeekStart, end: lastWeekEnd }, { weekStartsOn: 1 });
      
      return { days, weeks, months: [] };
    }
  }, [currentDate, viewMode]);

  // Izračunaj poziciju i širinu task bara
  const getTaskPosition = (task: GanttTask & { effectiveEndDate?: string }) => {
    const taskStart = new Date(task.startDate!);
    const taskEnd = new Date(task.effectiveEndDate || task.endDate!);
    const monthStart = days[0];
    const monthEnd = days[days.length - 1];

    // Ako task nije u ovom periodu
    if (taskEnd < monthStart || taskStart > monthEnd) {
      return null;
    }

    const effectiveStart = taskStart < monthStart ? monthStart : taskStart;
    const effectiveEnd = taskEnd > monthEnd ? monthEnd : taskEnd;

    const startOffset = differenceInDays(effectiveStart, monthStart);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

    const cellWidth = viewMode === 'month' ? 40 : 80;
    const left = startOffset * cellWidth;
    const width = Math.max(duration * cellWidth - 4, 30);

    return { left, width };
  };

  const navigatePrev = () => {
    setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const navigateNext = () => {
    setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const cellWidth = viewMode === 'month' ? 40 : 80;
  const totalWidth = days.length * cellWidth;

  // Automatski skroluj do trenutnog meseca/nedelje
  useEffect(() => {
    if (scrollRef.current && days.length > 0) {
      const today = new Date();
      const todayIndex = days.findIndex((d) => isSameDay(d, today));
      
      if (todayIndex >= 0) {
        // Skroluj tako da danas bude vidljiv (malo od centra)
        const scrollPosition = Math.max(0, todayIndex * cellWidth - 200);
        scrollRef.current.scrollLeft = scrollPosition;
      } else if (viewMode === 'month') {
        // Ako danas nije u prikazu, skroluj do početka trenutnog meseca
        const currentMonthStart = startOfMonth(currentDate);
        const currentMonthIndex = days.findIndex((d) => isSameDay(d, currentMonthStart));
        if (currentMonthIndex >= 0) {
          scrollRef.current.scrollLeft = currentMonthIndex * cellWidth;
        }
      }
    }
  }, [days, cellWidth, viewMode, currentDate]);

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <Calendar className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
        <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-white">{t('gantt.noTasks')}</h3>
        <p className="max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
          {t('gantt.noTasksDescription')}
          <br />
          {t('gantt.noTasksDescription2')}
        </p>
        {tasksWithoutDates.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 px-4 py-2 text-amber-700 dark:text-amber-300">
            <Info className="h-4 w-4" />
            <span className="text-sm">{tasksWithoutDates.length} {t('gantt.tasksWaiting')}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header sa navigacijom */}
      <div className="flex items-center justify-between rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={navigatePrev}
            className="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="min-w-[200px] text-center text-xl font-bold text-gray-900 dark:text-white">
            {meseci[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={navigateNext}
            className="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            onClick={goToToday}
            className="ml-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            {t('gantt.today')}
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* View mode */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('gantt.month')}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('gantt.week')}
            </button>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-3">
            {['IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded ${statusColors[status].bg}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{statusLabels[status]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upozorenje */}
      {tasksWithoutDates.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>{tasksWithoutDates.length}</strong> {t('gantt.tasksWaitingDescription')}
          </p>
        </div>
      )}

      {/* Gantt tabela */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex">
          {/* Leva kolona sa nazivima taskova */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {/* Header */}
            <div className="h-20 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 px-4 py-2">
              <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('kanban.taskTitle')}
              </div>
            </div>
            
            {/* Task lista */}
            {tasksWithDates.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="flex h-14 cursor-pointer items-center border-b border-gray-100 dark:border-gray-700 px-4 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {serviceTypeLabels[task.serviceType] || task.serviceType}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desna strana sa timeline-om */}
          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ minWidth: totalWidth }}>
              {/* Datumi header */}
              <div className="h-20 border-b border-gray-200 dark:border-gray-700">
                {/* Meseci/Nedelje header */}
                <div className="flex h-8 border-b border-gray-100 dark:border-gray-700">
                  {viewMode === 'month' ? (
                    // Za mesec prikaz - prikaži mesece kao header
                    months.map((month) => {
                      const monthDays = days.filter(
                        (d) => d >= month.start && d <= month.end
                      );
                      const isCurrent = month.date.getMonth() === currentDate.getMonth() && 
                                        month.date.getFullYear() === currentDate.getFullYear();
                      return (
                        <div
                          key={month.date.toISOString()}
                          style={{ width: monthDays.length * cellWidth }}
                          className={`flex items-center justify-center border-r border-gray-200 dark:border-gray-700 text-sm font-bold ${
                            isCurrent ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {meseci[month.date.getMonth()]} {month.date.getFullYear()}
                        </div>
                      );
                    })
                  ) : (
                    // Za nedelja prikaz - prikaži nedelje kao header
                    weeks.map((week) => {
                      const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
                      const isCurrentWeek = isSameDay(startOfWeek(new Date(), { weekStartsOn: 1 }), week);
                      return (
                        <div
                          key={week.toISOString()}
                          style={{ width: 7 * cellWidth }}
                          className={`flex items-center justify-center border-r border-gray-200 dark:border-gray-700 text-xs font-semibold ${
                            isCurrentWeek ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {week.getDate()}. {meseci[week.getMonth()].substring(0, 3)} - {weekEnd.getDate()}. {meseci[weekEnd.getMonth()].substring(0, 3)}
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Dani */}
                <div className="flex h-12">
                  {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                    const dayOfWeek = getDay(day);
                    return (
                      <div
                        key={day.toISOString()}
                        style={{ width: cellWidth }}
                        className={`flex flex-col items-center justify-center border-r border-gray-100 dark:border-gray-700 ${
                          isToday ? 'bg-blue-100 dark:bg-blue-900/30' : isWeekend ? 'bg-gray-100 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'
                        }`}
                      >
                        <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600 dark:text-blue-300' : isWeekend ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                          {daniUNedelji[dayOfWeek]}
                        </span>
                        <span className={`text-sm font-bold ${isToday ? 'text-blue-600 dark:text-blue-300' : isWeekend ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task barovi */}
              {tasksWithDates.map((task) => {
                const position = getTaskPosition(task);
                const colors = statusColors[task.status] || statusColors.BACKLOG;
                
                return (
                  <div
                    key={task.id}
                    className="relative h-14 border-b border-gray-100 dark:border-gray-700"
                  >
                    {/* Grid linije za dane */}
                    <div className="absolute inset-0 flex">
                      {days.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                        return (
                          <div
                            key={day.toISOString()}
                            style={{ width: cellWidth }}
                            className={`border-r border-gray-50 dark:border-gray-700 ${
                              isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : isWeekend ? 'bg-gray-50/50 dark:bg-gray-700/30' : ''
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Task bar */}
                    {position && (
                      <div
                        onClick={() => onTaskClick?.(task)}
                        className={`absolute top-2 cursor-pointer rounded-md border ${colors.bg} ${colors.border} ${colors.text} shadow-sm transition-all hover:shadow-md hover:brightness-110`}
                        style={{
                          left: position.left + 2,
                          width: position.width,
                          height: 40,
                        }}
                      >
                        <div className="flex h-full items-center px-2">
                          <span className="truncate text-xs font-medium">
                            {task.title}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        {t('gantt.clickForDetails')} • {t('gantt.autoDates')}
      </div>
    </div>
  );
}
