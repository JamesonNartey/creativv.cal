import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { ScheduleItem, TestItem, EssayItem, TaskItem, CalendarGranularity, TaskPriority } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Bell,
  BellRing,
  Layers,
  AlertTriangle,
  Repeat,
  Check,
  Sparkles,
} from 'lucide-react';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; dotClass: string; badgeClass: string; textClass: string; borderClass: string }
> = {
  urgent: {
    label: 'Urgent',
    dotClass: 'bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    textClass: 'text-rose-700',
    borderClass: 'border-l-rose-500',
  },
  high: {
    label: 'High',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    textClass: 'text-amber-700',
    borderClass: 'border-l-amber-500',
  },
  medium: {
    label: 'Medium',
    dotClass: 'bg-indigo-500',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    textClass: 'text-indigo-700',
    borderClass: 'border-l-indigo-500',
  },
  low: {
    label: 'Low',
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    textClass: 'text-slate-600',
    borderClass: 'border-l-slate-400',
  },
};

export const CalendarView: React.FC = () => {
  const {
    activeTab,
    calendarView,
    setCalendarView,
    selectedDate,
    setSelectedDate,
    schedule,
    tests,
    essays,
    tasks,
    updateTask,
    toggleTaskCompleted,
    courses,
    getCourseById,
    selectedCourseFilter,
    openAddModal,
    setIsClassRoutineOpen,
    searchQuery,
    aiDayPlans,
    toggleAIStepCompleted,
    setActiveTab,
    setAiFocusAssignmentId,
  } = usePlanner();

  // If user navigated via Timetable/Schedule tab, switch calendar view to week
  React.useEffect(() => {
    if (activeTab === 'timetable') {
      setCalendarView('week');
    }
  }, [activeTab, setCalendarView]);

  // Priority filter toggle in calendar
  const [priorityOnlyFilter, setPriorityOnlyFilter] = useState<boolean>(false);

  // Parse current selectedDate
  const [year, month, day] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState<number>(year || 2026);
  const [viewMonth, setViewMonth] = useState<number>(month ? month - 1 : 9); // 0-indexed, 9 = Oct

  // Month navigation
  const handlePrev = () => {
    if (calendarView === 'month') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(y => y - 1);
      } else {
        setViewMonth(m => m - 1);
      }
    } else if (calendarView === 'week') {
      const curr = new Date(selectedDate);
      curr.setDate(curr.getDate() - 7);
      setSelectedDate(curr.toISOString().split('T')[0]);
    } else {
      const curr = new Date(selectedDate);
      curr.setDate(curr.getDate() - 1);
      setSelectedDate(curr.toISOString().split('T')[0]);
    }
  };

  const handleNext = () => {
    if (calendarView === 'month') {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(y => y + 1);
      } else {
        setViewMonth(m => m + 1);
      }
    } else if (calendarView === 'week') {
      const curr = new Date(selectedDate);
      curr.setDate(curr.getDate() + 7);
      setSelectedDate(curr.toISOString().split('T')[0]);
    } else {
      const curr = new Date(selectedDate);
      curr.setDate(curr.getDate() + 1);
      setSelectedDate(curr.toISOString().split('T')[0]);
    }
  };

  const handleGoToday = () => {
    setViewYear(2026);
    setViewMonth(9);
    setSelectedDate('2026-10-12');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Helper to test if item matches course filter and search
  const matchesFilter = (courseId?: string, title?: string) => {
    if (selectedCourseFilter && courseId !== selectedCourseFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const course = getCourseById(courseId);
      const matchesTitle = title?.toLowerCase().includes(query);
      const matchesCourse =
        course?.name.toLowerCase().includes(query) || course?.code.toLowerCase().includes(query);
      return matchesTitle || matchesCourse;
    }
    return true;
  };

  // Get items for a specific date (YYYY-MM-DD)
  const getItemsForDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon...

    // 1. Recurring or specific schedule items
    const daySchedule = schedule.filter(item => {
      if (!matchesFilter(item.courseId, item.title)) return false;
      if (item.date) {
        return item.date === dateStr;
      }
      if (item.recurringDays && item.recurringDays.includes(dayOfWeek)) {
        return true;
      }
      return false;
    });

    // 2. Tests
    const dayTests = tests.filter(
      t => t.date === dateStr && matchesFilter(t.courseId, t.title)
    );

    // 3. Essays due
    const dayEssays = essays.filter(
      e => e.dueDate === dateStr && matchesFilter(e.courseId, e.title)
    );

    // 4. Tasks due (sorted by priority descending)
    const dayTasks = tasks
      .filter(t => t.dueDate === dateStr && matchesFilter(t.courseId, t.title))
      .filter(t => {
        if (priorityOnlyFilter) {
          return t.priority === 'urgent' || t.priority === 'high';
        }
        return true;
      })
      .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);

    return {
      schedule: daySchedule,
      tests: dayTests,
      essays: dayEssays,
      tasks: dayTasks,
    };
  };

  // Month days generation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const formatCellDate = (dayNum: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  // Header Title
  const getHeaderTitle = () => {
    if (calendarView === 'month') {
      return `${monthNames[viewMonth]} ${viewYear}`;
    }
    if (calendarView === 'week') {
      const curr = new Date(selectedDate);
      const day = curr.getDay();
      const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(curr.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const curr = new Date(selectedDate);
    return curr.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render Month View
  const renderMonthView = () => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/30">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-prev-${i}`} className="min-h-[115px] bg-slate-50/50 p-1.5" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatCellDate(dayNum);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === '2026-10-12';
            const {
              schedule: dayEvents,
              tests: dayTests,
              essays: dayEssays,
              tasks: dayTasks,
            } = getItemsForDate(dateStr);

            // Determine if day has urgent or high priority tasks
            const hasUrgentTask = dayTasks.some(t => t.priority === 'urgent' && !t.completed);
            const hasHighTask = dayTasks.some(t => t.priority === 'high' && !t.completed);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[120px] p-1.5 bg-white transition-colors cursor-pointer group flex flex-col justify-between relative ${
                  hasUrgentTask
                    ? 'border-t-2 border-t-rose-500'
                    : hasHighTask
                    ? 'border-t-2 border-t-amber-500'
                    : ''
                } ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs font-mono tabular-nums inline-flex items-center justify-center w-6 h-6 rounded-md ${
                          isToday
                            ? 'bg-indigo-600 text-white font-bold'
                            : isSelected
                            ? 'text-indigo-700 font-bold'
                            : 'text-slate-700 font-medium'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Small visual priority badge flag if high/urgent tasks */}
                      {hasUrgentTask ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Urgent tasks due today" />
                      ) : hasHighTask ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="High priority tasks due today" />
                      ) : null}
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedDate(dateStr);
                        openAddModal('event');
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-opacity"
                      title="Add to this date"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Items for this day cell */}
                  <div className="space-y-1">
                    {/* Exams with Reminder Bell indicator */}
                    {dayTests.map(test => {
                      const course = getCourseById(test.courseId);
                      const hasReminder = test.reminderTiming && test.reminderTiming !== 'none';
                      return (
                        <div
                          key={test.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/90 truncate flex items-center justify-between gap-1 shadow-2xs"
                          title={`Exam: ${test.title} (${test.startTime})`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <GraduationCap className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate">
                              {course?.code || ''} {test.title}
                            </span>
                          </div>
                          {hasReminder && (
                            <Bell className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}

                    {/* Essays Due */}
                    {dayEssays.map(essay => {
                      return (
                        <div
                          key={essay.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 truncate flex items-center gap-1"
                          title={`Essay Due: ${essay.title}`}
                        >
                          <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{essay.title}</span>
                        </div>
                      );
                    })}

                    {/* Classes / Lectures (including recurring) */}
                    {dayEvents.slice(0, 2).map(item => {
                      const course = getCourseById(item.courseId);
                      const isRecurring = item.recurringDays && item.recurringDays.length > 0;
                      return (
                        <div
                          key={item.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 truncate flex items-center gap-1"
                          title={`${item.title} (${item.startTime} - ${item.endTime})`}
                        >
                          {course ? (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: course.color }}
                            />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-400" />
                          )}
                          <span className="font-mono tabular-nums text-[9px] text-slate-500 shrink-0">
                            {item.startTime}
                          </span>
                          <span className="truncate">{course?.code || item.title}</span>
                          {isRecurring && <Repeat className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                        </div>
                      );
                    })}

                    {/* More classes count */}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-500 font-medium pl-1 block">
                        +{dayEvents.length - 2} more classes
                      </span>
                    )}

                    {/* Task Prioritization Visual Representation */}
                    {dayTasks.length > 0 && (
                      <div className="pt-0.5 space-y-0.5">
                        {/* Display top priority tasks directly */}
                        {dayTasks.slice(0, 2).map(t => {
                          const priority = PRIORITY_CONFIG[t.priority];
                          return (
                            <div
                              key={t.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 truncate ${
                                t.completed ? 'opacity-50 line-through bg-slate-50 border-slate-200' : `${priority.badgeClass}`
                              }`}
                              title={`Priority: ${priority.label} · ${t.title}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priority.dotClass}`} />
                              <span className="truncate">{t.title}</span>
                            </div>
                          );
                        })}

                        {dayTasks.length > 2 && (
                          <div className="text-[9px] text-slate-500 font-medium pl-1 flex items-center gap-1">
                            <span>+{dayTasks.length - 2} more tasks</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week Timetable View
  const renderWeekView = () => {
    // Generate dates for current selected week (Mon - Sun)
    const curr = new Date(selectedDate);
    const day = curr.getDay();
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diffToMonday));

    const weekDays: { dateStr: string; dayName: string; dayNumber: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      weekDays.push({
        dateStr: iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
      });
    }

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Header row: Days of week */}
        <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
          <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 flex flex-col justify-center">
            <span>Schedule</span>
          </div>
          {weekDays.map(wd => {
            const isToday = wd.dateStr === '2026-10-12';
            const isSelected = wd.dateStr === selectedDate;
            return (
              <div
                key={wd.dateStr}
                onClick={() => setSelectedDate(wd.dateStr)}
                className={`p-2 text-center cursor-pointer border-r last:border-r-0 border-slate-200 transition-colors ${
                  isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="text-xs font-medium text-slate-500">{wd.dayName}</div>
                <div
                  className={`text-sm font-mono tabular-nums font-semibold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-md ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-900'
                  }`}
                >
                  {wd.dayNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Priority Deadlines & Tasks Strip (Visual Priority in Calendar) */}
        <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/70 text-xs">
          <div className="p-2 border-r border-slate-200 flex flex-col items-center justify-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mb-0.5" />
            <span>Priority Deadlines</span>
          </div>
          {weekDays.map(wd => {
            const { tasks: dayTasks } = getItemsForDate(wd.dateStr);
            return (
              <div
                key={`tasks-${wd.dateStr}`}
                className="p-1.5 border-r last:border-r-0 border-slate-200 min-h-[52px] space-y-1"
              >
                {dayTasks.length === 0 ? (
                  <span className="text-[10px] text-slate-300 block text-center pt-2">—</span>
                ) : (
                  dayTasks.map(t => {
                    const priority = PRIORITY_CONFIG[t.priority];
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTaskCompleted(t.id)}
                        className={`p-1 rounded text-[10px] font-medium border flex items-center gap-1 cursor-pointer transition-transform hover:scale-[1.01] ${
                          t.completed
                            ? 'opacity-40 line-through bg-slate-100 border-slate-200'
                            : `${priority.badgeClass}`
                        }`}
                        title={`Click to toggle completion · Priority: ${priority.label}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priority.dotClass}`} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>

        {/* Timetable Hourly Body */}
        <div className="overflow-y-auto max-h-[640px]">
          <div className="grid grid-cols-8 divide-x divide-slate-100">
            {/* Time labels column */}
            <div className="divide-y divide-slate-100 bg-slate-50/40 text-center">
              {hours.map(h => (
                <div
                  key={h}
                  className="h-16 text-[11px] font-mono tabular-nums text-slate-400 p-1 flex items-start justify-center"
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDays.map(wd => {
              const { schedule: dayEvents, tests: dayTests } = getItemsForDate(wd.dateStr);

              return (
                <div key={wd.dateStr} className="relative divide-y divide-slate-100 bg-white min-h-[832px]">
                  {/* Grid hour cells */}
                  {hours.map(h => (
                    <div
                      key={h}
                      onClick={() => {
                        setSelectedDate(wd.dateStr);
                        openAddModal('event');
                      }}
                      className="h-16 hover:bg-slate-50/70 cursor-pointer transition-colors"
                    />
                  ))}

                  {/* Render Schedule events positioned in column */}
                  {dayEvents.map(event => {
                    const course = getCourseById(event.courseId);
                    const [startH, startM] = event.startTime.split(':').map(Number);
                    const [endH, endM] = event.endTime.split(':').map(Number);

                    // Compute top and height based on 8:00 start (64px per hour)
                    const startOffsetHours = startH - 8 + startM / 60;
                    const durationHours = endH - startH + (endM - startM) / 60;

                    if (startOffsetHours < 0 || durationHours <= 0) return null;

                    const topPx = Math.max(0, startOffsetHours * 64);
                    const heightPx = Math.max(28, durationHours * 64 - 4);
                    const isRecurring = event.recurringDays && event.recurringDays.length > 0;

                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 rounded-lg p-1.5 text-xs border overflow-hidden shadow-2xs z-10 cursor-pointer transition-all hover:scale-[1.01]"
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          backgroundColor: course?.bgLight || '#f1f5f9',
                          borderColor: course?.color || '#cbd5e1',
                          color: '#0f172a',
                        }}
                      >
                        <div className="font-semibold text-[11px] truncate flex items-center justify-between">
                          <div className="flex items-center gap-1 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: course?.color || '#64748b' }}
                            />
                            <span className="truncate">{course?.code || event.title}</span>
                          </div>
                          {isRecurring && (
                            <Repeat className="w-2.5 h-2.5 text-slate-500 shrink-0 ml-1" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-600 truncate mt-0.5">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.location && heightPx > 45 && (
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Render Exams positioned */}
                  {dayTests.map(test => {
                    const [startH, startM] = test.startTime.split(':').map(Number);
                    const [endH, endM] = test.endTime.split(':').map(Number);
                    const startOffsetHours = startH - 8 + startM / 60;
                    const durationHours = endH - startH + (endM - startM) / 60;
                    const topPx = Math.max(0, startOffsetHours * 64);
                    const heightPx = Math.max(34, durationHours * 64 - 4);
                    const hasReminder = test.reminderTiming && test.reminderTiming !== 'none';

                    return (
                      <div
                        key={test.id}
                        className="absolute left-1 right-1 rounded-lg p-1.5 text-xs bg-rose-50 border border-rose-300 text-rose-950 overflow-hidden shadow-xs z-20 cursor-pointer"
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                        }}
                      >
                        <div className="font-semibold text-[11px] text-rose-900 truncate flex items-center justify-between">
                          <div className="flex items-center gap-1 truncate">
                            <GraduationCap className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate">{test.title}</span>
                          </div>
                          {hasReminder && <Bell className="w-2.5 h-2.5 text-amber-600 shrink-0" />}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-rose-700 truncate">
                          {test.startTime} - {test.endTime}
                        </div>
                        <div className="text-[10px] text-rose-600 truncate">{test.location}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Day Agenda View
  const renderDayView = () => {
    const {
      schedule: dayEvents,
      tests: dayTests,
      essays: dayEssays,
      tasks: dayTasks,
    } = getItemsForDate(selectedDate);
    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const isToday = selectedDate === '2026-10-12';

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{formattedDate}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              {isToday && <span className="font-semibold text-indigo-600">Today</span>}
              {isToday && <span aria-hidden="true">·</span>}
              <span>{dayEvents.length} classes/events</span>
              <span aria-hidden="true">·</span>
              <span>{dayTests.length} tests</span>
              <span aria-hidden="true">·</span>
              <span>{dayTasks.length} tasks</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setAiFocusAssignmentId(null);
                setActiveTab('ai_plan');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Day Breakdown</span>
            </button>
            <button
              onClick={() => setIsClassRoutineOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Repeat className="w-3.5 h-3.5 text-slate-500" />
              <span>Recurring Classes</span>
            </button>
            <button
              onClick={() => openAddModal('task')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Day</span>
            </button>
          </div>
        </div>

        {/* Tests / Exams with Reminder Info */}
        {dayTests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-rose-600" />
              <span>Upcoming Tests & Exams on this Date</span>
            </h3>
            {dayTests.map(test => {
              const course = getCourseById(test.courseId);
              const hasReminder = test.reminderTiming && test.reminderTiming !== 'none';
              return (
                <div
                  key={test.id}
                  className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{test.title}</span>
                      {course && <span className="text-xs text-rose-700 font-medium">{course.code}</span>}
                      <span className="text-xs font-mono tabular-nums text-rose-600">
                        {test.weightPercentage}% of Grade
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-mono tabular-nums">
                          {test.startTime} – {test.endTime}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{test.location}</span>
                      </span>
                      {hasReminder && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <BellRing className="w-3.5 h-3.5 text-amber-600" />
                          <span>Reminder set</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 italic max-w-sm">{test.notes}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Essays due */}
        {dayEssays.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Essay & Paper Deadlines</span>
            </h3>
            {dayEssays.map(essay => {
              const course = getCourseById(essay.courseId);
              return (
                <div
                  key={essay.id}
                  className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{essay.title}</span>
                      {course && <span className="text-xs text-amber-800 font-medium">{course.code}</span>}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                      <span>Target: {essay.targetWordCount.toLocaleString()} words</span>
                      <span>·</span>
                      <span>Style: {essay.citationStyle}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono tabular-nums font-medium text-amber-900 block">
                      {essay.currentWordCount.toLocaleString()} words written
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Classes & Schedule (Showing Recurring badges) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Class Timetable & Sessions</span>
            </h3>
            <button
              onClick={() => setIsClassRoutineOpen(true)}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
            >
              Manage Weekly Routine
            </button>
          </div>

          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No classes or lectures scheduled for this date.
            </div>
          ) : (
            <div className="space-y-2">
              {dayEvents
                .slice()
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(event => {
                  const course = getCourseById(event.courseId);
                  const isRecurring = event.recurringDays && event.recurringDays.length > 0;
                  return (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: course?.color || '#6366f1' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{event.title}</span>
                            {course && (
                              <span className="text-xs text-slate-500 font-medium">({course.code})</span>
                            )}
                            {isRecurring && (
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Repeat className="w-2.5 h-2.5" />
                                <span>Weekly</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="font-mono tabular-nums font-medium text-slate-700">
                              {event.startTime} – {event.endTime}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{event.location}</span>
                              </span>
                            )}
                          </div>
                          {event.notes && <p className="text-xs text-slate-500 mt-1.5">{event.notes}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Tasks Due Today with Detailed Priority Badges & Inline Priority Changer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Prioritized Coursework Due</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Sorted by Priority (Urgent → Low)
            </span>
          </div>

          {dayTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No task deadlines on this day.
            </div>
          ) : (
            <div className="space-y-2">
              {dayTasks.map(t => {
                const course = getCourseById(t.courseId);
                const priority = PRIORITY_CONFIG[t.priority];

                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white text-xs ${
                      t.completed ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTaskCompleted(t.id)}
                        className="text-slate-300 hover:text-indigo-600 cursor-pointer"
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                        ) : (
                          <Circle className="w-4.5 h-4.5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              t.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900 font-semibold'
                            }
                          >
                            {t.title}
                          </span>
                          {course && (
                            <span className="text-slate-500 font-medium">({course.code})</span>
                          )}
                        </div>
                        {t.notes && <p className="text-[11px] text-slate-400 mt-0.5">{t.notes}</p>}
                      </div>
                    </div>

                    {/* Priority Selector & Duration */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                        {t.estimatedMinutes}m
                      </span>

                      {/* Interactive Priority dropdown */}
                      <select
                        value={t.priority}
                        onChange={e =>
                          updateTask(t.id, { priority: e.target.value as TaskPriority })
                        }
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${priority.badgeClass}`}
                      >
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🔵 Medium</option>
                        <option value="low">⚪ Low</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Assignment Micro-Steps for Selected Date */}
        {aiDayPlans[selectedDate]?.steps?.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Assignment Breakdown Steps</span>
              </h3>
              <button
                onClick={() => setActiveTab('ai_plan')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Open Full AI Planner →
              </button>
            </div>
            <div className="space-y-2">
              {aiDayPlans[selectedDate].steps.map(step => {
                const course = getCourseById(step.courseId);
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      step.completed
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-indigo-50/40 border-indigo-200/80'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleAIStepCompleted(selectedDate, step.id)}
                        className="mt-0.5 text-indigo-400 hover:text-indigo-600 cursor-pointer shrink-0"
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-semibold ${
                              step.completed ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {step.stepTitle}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: course?.color || '#6366f1' }}
                            />
                            {step.courseCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{step.description}</p>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                      {step.startTime}–{step.endTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar View Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Navigation & Period Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-slate-900">{getHeaderTitle()}</h1>
        </div>

        {/* Toolbar Action Buttons & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter toggle */}
          <button
            onClick={() => setPriorityOnlyFilter(prev => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              priorityOnlyFilter
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle showing only High & Urgent priority tasks"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>High/Urgent Only</span>
          </button>

          {/* AI Breakdown Shortcut */}
          <button
            onClick={() => {
              setAiFocusAssignmentId(null);
              setActiveTab('ai_plan');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            title="Break down assignments into smaller steps across your day with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Day Plan</span>
          </button>

          {/* Manage Recurring Classes Shortcut */}
          <button
            onClick={() => setIsClassRoutineOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Add or edit recurring class timetable"
          >
            <Repeat className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recurring Classes</span>
          </button>

          {/* View Switcher Tabs (Month / Week / Day) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['month', 'week', 'day'] as CalendarGranularity[]).map(mode => {
              const isActive = calendarView === mode;
              const labels: Record<CalendarGranularity, string> = {
                month: 'Month',
                week: 'Week',
                day: 'Day',
              };
              return (
                <button
                  key={mode}
                  onClick={() => setCalendarView(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {calendarView === 'month' && renderMonthView()}
      {calendarView === 'week' && renderWeekView()}
      {calendarView === 'day' && renderDayView()}
    </div>
  );
};
