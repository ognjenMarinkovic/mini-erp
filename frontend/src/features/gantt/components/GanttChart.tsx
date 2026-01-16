import { useMemo, useState, useRef, useEffect } from 'react';
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

// Srpski nazivi na latinici
const daniUNedelji = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
const meseci = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

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

const statusLabels: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  BACKLOG: 'Backlog',
  IN_PROGRESS: 'U toku',
  REVIEW: 'Review',
  DONE: 'Završeno',
  ARCHIVE: 'Arhiva',
};

const serviceTypeLabels: Record<string, string> = {
  BRANDING: 'Branding',
  LOGO_DESIGN: 'Logo',
  WEB_DESIGN: 'Web',
  UI_UX: 'UI/UX',
  WEBFLOW_DEV: 'Webflow',
  SOCIAL_MEDIA: 'Social',
  PITCH_DECK: 'Pitch',
  MOTION_GRAPHICS: 'Motion',
  ILLUSTRATIONS: 'Ilustracije',
  PRINT_DESIGN: 'Print',
  OTHER: 'Ostalo',
};

type ViewMode = 'month' | 'week';

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
        <Calendar className="mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-700">Nema taskova za prikaz</h3>
        <p className="max-w-md text-center text-sm text-gray-500">
          Taskovi se prikazuju na Gantt dijagramu kada pređu u "U toku" status.
          <br />
          Početak se beleži automatski.
        </p>
        {tasksWithoutDates.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-amber-700">
            <Info className="h-4 w-4" />
            <span className="text-sm">{tasksWithoutDates.length} taskova čeka početak rada</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header sa navigacijom */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={navigatePrev}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="min-w-[200px] text-center text-xl font-bold text-gray-900">
            {meseci[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={navigateNext}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            onClick={goToToday}
            className="ml-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
          >
            Danas
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* View mode */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mesec
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nedelja
            </button>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-3">
            {['IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded ${statusColors[status].bg}`} />
                <span className="text-xs text-gray-600">{statusLabels[status]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upozorenje */}
      {tasksWithoutDates.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-700">
            <strong>{tasksWithoutDates.length}</strong> taskova čeka da uđu u fazu rada
          </p>
        </div>
      )}

      {/* Gantt tabela */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex">
          {/* Leva kolona sa nazivima taskova */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="h-20 border-b border-gray-200 bg-gray-100 px-4 py-2">
              <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Task
              </div>
            </div>
            
            {/* Task lista */}
            {tasksWithDates.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="flex h-14 cursor-pointer items-center border-b border-gray-100 px-4 hover:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">
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
              <div className="h-20 border-b border-gray-200">
                {/* Meseci/Nedelje header */}
                <div className="flex h-8 border-b border-gray-100">
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
                          className={`flex items-center justify-center border-r border-gray-200 text-sm font-bold ${
                            isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
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
                          className={`flex items-center justify-center border-r border-gray-200 text-xs font-semibold ${
                            isCurrentWeek ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
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
                        className={`flex flex-col items-center justify-center border-r border-gray-100 ${
                          isToday ? 'bg-blue-100' : isWeekend ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : isWeekend ? 'text-gray-400' : 'text-gray-500'}`}>
                          {daniUNedelji[dayOfWeek]}
                        </span>
                        <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : isWeekend ? 'text-gray-400' : 'text-gray-800'}`}>
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
                    className="relative h-14 border-b border-gray-100"
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
                            className={`border-r border-gray-50 ${
                              isToday ? 'bg-blue-50/50' : isWeekend ? 'bg-gray-50/50' : ''
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
      <div className="text-center text-xs text-gray-400">
        Klikni na task za detalje • Datumi se automatski beleže pri prelasku u "U toku" i "Završeno"
      </div>
    </div>
  );
}
