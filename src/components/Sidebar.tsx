import React, { useRef } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  Calendar as CalendarIcon,
  BookOpen,
  GraduationCap,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flame,
  Camera,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_AVATAR } from '../data/avatars';

export const Sidebar: React.FC = () => {
  const {
    courses,
    selectedCourseFilter,
    setSelectedCourseFilter,
    selectedDate,
    setSelectedDate,
    setIsCourseManagerOpen,
    tasks,
    tests,
    essays,
    totalFocusMinutesToday,
    resetToSampleData,
    exportDataJSON,
    importDataJSON,
    profile,
    setIsProfileOpen,
    aiDayPlans,
    setActiveTab,
    setAiFocusAssignmentId,
  } = usePlanner();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse current selectedDate into year, month, day
  const [currentYear, currentMonth] = selectedDate.split('-').map(Number);
  const [calYear, setCalYear] = React.useState<number>(currentYear || 2026);
  const [calMonth, setCalMonth] = React.useState<number>(currentMonth ? currentMonth - 1 : 9); // 0-indexed, 9 = Oct

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  // Generate mini calendar grid
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Helper to format date string YYYY-MM-DD
  const formatCellDate = (day: number) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${calYear}-${m}-${d}`;
  };

  // Quick stats
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const nearestTest = tests
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          alert('Academic schedule imported successfully!');
        } else {
          alert('Failed to parse schedule backup file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* Student Identity Card & Photo Trigger */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between gap-3 group">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="relative cursor-pointer shrink-0"
            onClick={() => setIsProfileOpen(true)}
            title="Click to edit profile picture or academic info"
          >
            <img
              src={profile.avatarUrl || DEFAULT_AVATAR}
              alt={profile.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-500/70 transition-all bg-white"
            />
            <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="min-w-0">
            <h4
              onClick={() => setIsProfileOpen(true)}
              className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {profile.name}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">{profile.major}</p>
          </div>
        </div>

        <button
          onClick={() => setIsProfileOpen(true)}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0"
        >
          Edit
        </button>
      </div>

      {/* Mini Calendar Widget */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-900 tracking-tight">
            {monthNames[calMonth]} {calYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCalYear(2026);
                setCalMonth(9);
                setSelectedDate('2026-10-12');
              }}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400 mb-1">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatCellDate(dayNum);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === '2026-10-12';

            // Check if there are events, exams or tasks on this day
            const hasTest = tests.some(t => t.date === dateStr);
            const hasEssay = essays.some(e => e.dueDate === dateStr);
            const hasTask = tasks.some(t => t.dueDate === dateStr && !t.completed);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-7 w-7 mx-auto rounded-lg text-xs font-mono tabular-nums flex flex-col items-center justify-center relative transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : isToday
                    ? 'text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{dayNum}</span>
                {/* Event Indicators */}
                {!isSelected && (hasTest || hasEssay || hasTask) && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Filter & Enrollment */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Enrolled Courses</span>
          </div>
          <button
            onClick={() => setIsCourseManagerOpen(true)}
            className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span>Manage</span>
          </button>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setSelectedCourseFilter(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              selectedCourseFilter === null
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Semester Courses</span>
            <span className="font-mono tabular-nums text-[11px] opacity-75">
              {courses.reduce((acc, c) => acc + c.credits, 0)} Units
            </span>
          </button>

          {courses.map((course) => {
            const isSelected = selectedCourseFilter === course.id;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseFilter(isSelected ? null : course.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-900 font-medium border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="truncate">{course.code}</span>
                </div>
                <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                  {course.credits}u
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Academic Status Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <span className="text-xs font-semibold text-slate-900 block">
          Today's Academic Pulse
        </span>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Focus logged today
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {totalFocusMinutesToday} mins
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              Pending tasks
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {pendingTasksCount} items
            </span>
          </div>

          {nearestTest && (
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 truncate pr-2">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Next exam</span>
              </span>
              <span className="font-mono tabular-nums font-medium text-amber-600 shrink-0">
                {nearestTest.date.substring(5)}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              setAiFocusAssignmentId(null);
              setActiveTab('ai_plan');
            }}
            className="w-full mt-1 flex items-center justify-between px-2.5 py-2 rounded-lg bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/70 text-indigo-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Day Breakdown</span>
            </span>
            <span className="font-mono tabular-nums text-[11px] font-bold text-indigo-700">
              {aiDayPlans[selectedDate]
                ? `${aiDayPlans[selectedDate].steps.filter(s => s.completed).length}/${aiDayPlans[selectedDate].steps.length}`
                : 'Plan Day'}
            </span>
          </button>
        </div>
      </div>

      {/* Backup & Data Actions */}
      <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 text-xs space-y-2">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
          Planner Storage & Backup
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={exportDataJSON}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Download your full semester data as a JSON file"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Load a saved JSON backup file"
          >
            <Upload className="w-3 h-3 text-slate-500" />
            <span>Import</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </div>

        <button
          onClick={() => {
            if (confirm('Reset schedule and assignments back to sample semester data?')) {
              resetToSampleData();
            }
          }}
          className="w-full flex items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-700 text-[11px] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset to Sample Schedule</span>
        </button>
      </div>
    </aside>
  );
};
