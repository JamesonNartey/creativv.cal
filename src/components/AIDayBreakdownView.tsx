import React, { useState, useEffect, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  AIDayPlan,
  AIDayStep,
  AIPacePreference,
  TaskPriority,
} from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  CalendarPlus,
  CalendarCheck,
  RefreshCw,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  ListChecks,
  Lightbulb,
  SlidersHorizontal,
  ArrowRight,
  Check,
} from 'lucide-react';

const PRIORITY_STYLES: Record<TaskPriority, { label: string; badgeClass: string }> = {
  urgent: { label: 'Urgent', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  high: { label: 'High', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  medium: { label: 'Medium', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  low: { label: 'Low', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PACE_OPTIONS: Array<{ id: AIPacePreference; label: string; desc: string }> = [
  { id: 'balanced', label: 'Balanced Day', desc: 'Evenly paced with transition breaks' },
  { id: 'morning_focus', label: 'Morning Deep Work', desc: 'Hardest tasks tackled early' },
  { id: 'pomodoro_sprints', label: '25m Sprints', desc: 'Short crisp blocks with breaks' },
  { id: 'evening_sprint', label: 'Afternoon / Evening', desc: 'Light daytime, focused evening' },
];

export const AIDayBreakdownView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    tasks,
    essays,
    tests,
    schedule,
    courses,
    getCourseById,
    profile,
    selectedCourseFilter,
    aiDayPlans,
    aiFocusAssignmentId,
    setAiFocusAssignmentId,
    saveAIDayPlan,
    toggleAIStepCompleted,
    deleteAIStep,
    clearAIDayPlan,
    scheduleAIStepToCalendar,
    unscheduleAIStepFromCalendar,
    scheduleAllAIStepsToCalendar,
    setActiveTab,
    setCalendarView,
  } = usePlanner();

  const [studyWindowStart, setStudyWindowStart] = useState('08:00');
  const [studyWindowEnd, setStudyWindowEnd] = useState('22:00');
  const [pacePreference, setPacePreference] = useState<AIPacePreference>('balanced');
  const [includeEssays, setIncludeEssays] = useState(true);
  const [includeExamPrep, setIncludeExamPrep] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [displayMode, setDisplayMode] = useState<'timeline' | 'by_assignment'>('timeline');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pending tasks filtered by optional course filter
  const pendingTasks = useMemo(() => {
    const priorityRank: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    return tasks
      .filter(t => !t.completed)
      .filter(t => !selectedCourseFilter || t.courseId === selectedCourseFilter)
      .slice()
      .sort((a, b) => {
        const dateDiff = a.dueDate.localeCompare(b.dueDate);
        if (dateDiff !== 0) return dateDiff;
        return priorityRank[b.priority] - priorityRank[a.priority];
      });
  }, [tasks, selectedCourseFilter]);

  // Active essays (not submitted)
  const activeEssays = useMemo(() => {
    return essays
      .filter(e => e.status !== 'submitted')
      .filter(e => !selectedCourseFilter || e.courseId === selectedCourseFilter);
  }, [essays, selectedCourseFilter]);

  // Upcoming tests on or after selectedDate
  const upcomingTests = useMemo(() => {
    return tests
      .filter(t => t.date >= selectedDate)
      .filter(t => !selectedCourseFilter || t.courseId === selectedCourseFilter)
      .slice(0, 3);
  }, [tests, selectedDate, selectedCourseFilter]);

  // Initialize selected tasks cleanly
  useEffect(() => {
    if (aiFocusAssignmentId) {
      setSelectedTaskIds([aiFocusAssignmentId]);
      setShowConfigPanel(true);
    } else {
      setSelectedTaskIds(pendingTasks.map(t => t.id));
    }
  }, [aiFocusAssignmentId, pendingTasks.length]);

  // Fixed classes, labs, and tests on selectedDate
  const fixedEventsOnDate = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    const dayOfWeek = d.getDay();

    const daySchedule = schedule
      .filter(item => {
        // Exclude AI-generated study sessions we previously pushed to calendar so regeneration stays fresh
        if (item.id.startsWith('sch-ai-')) return false;
        if (item.date) return item.date === selectedDate;
        if (item.recurringDays && item.recurringDays.includes(dayOfWeek)) return true;
        return false;
      })
      .map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location,
        courseId: item.courseId,
        courseCode: getCourseById(item.courseId)?.code || 'General',
        color: getCourseById(item.courseId)?.color || '#64748b',
      }));

    const dayTests = tests
      .filter(t => t.date === selectedDate)
      .map(t => ({
        id: t.id,
        title: `EXAM: ${t.title}`,
        type: 'exam',
        startTime: t.startTime,
        endTime: t.endTime,
        location: t.location,
        courseId: t.courseId,
        courseCode: getCourseById(t.courseId)?.code || 'Exam',
        color: '#e11d48',
      }));

    return [...daySchedule, ...dayTests].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, schedule, tests, getCourseById]);

  const currentPlan: AIDayPlan | undefined = aiDayPlans[selectedDate];

  const formattedDate = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const toggleTaskSelection = (taskId: string) => {
    if (aiFocusAssignmentId) {
      setAiFocusAssignmentId(null);
    }
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Call backend /api/ai/breakdown-day
  const handleGeneratePlan = async (overrideFocusId?: string | null) => {
    setErrorMsg(null);

    const activeFocusId = overrideFocusId !== undefined ? overrideFocusId : aiFocusAssignmentId;
    const chosenTasks = activeFocusId
      ? pendingTasks.filter(t => t.id === activeFocusId)
      : pendingTasks.filter(t => selectedTaskIds.includes(t.id));

    const essaysPayload =
      includeEssays && !activeFocusId
        ? activeEssays.map(e => ({
            id: e.id,
            title: e.title,
            courseCode: getCourseById(e.courseId)?.code,
            dueDate: e.dueDate,
            currentWordCount: e.currentWordCount,
            targetWordCount: e.targetWordCount,
            status: e.status,
          }))
        : [];

    const testsPayload =
      includeExamPrep && !activeFocusId
        ? upcomingTests.map(t => ({
            id: t.id,
            title: t.title,
            courseCode: getCourseById(t.courseId)?.code,
            date: t.date,
            topics: t.topics,
          }))
        : [];

    if (chosenTasks.length === 0 && essaysPayload.length === 0 && testsPayload.length === 0) {
      setErrorMsg('Select at least one pending assignment, essay, or exam for the AI to break down.');
      setShowConfigPanel(true);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/breakdown-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDate: selectedDate,
          dayName: formattedDate,
          studyWindowStart,
          studyWindowEnd,
          pacePreference,
          studentName: profile.name,
          studentMajor: profile.major,
          existingEvents: fixedEventsOnDate.map(ev => ({
            title: ev.title,
            type: ev.type,
            startTime: ev.startTime,
            endTime: ev.endTime,
            courseCode: ev.courseCode,
          })),
          assignments: chosenTasks.map(t => ({
            id: t.id,
            title: t.title,
            courseCode: getCourseById(t.courseId)?.code || 'General',
            dueDate: t.dueDate,
            estimatedMinutes: t.estimatedMinutes,
            priority: t.priority,
            category: t.category,
            notes: t.notes,
          })),
          essays: essaysPayload,
          upcomingTests: testsPayload,
          focusAssignmentId: activeFocusId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate AI breakdown.');
      }

      // Map returned steps and match courseId from parent tasks/essays/tests
      const findCourseId = (assignmentId: string, courseCode: string) => {
        const matchedTask = tasks.find(t => t.id === assignmentId);
        if (matchedTask?.courseId) return matchedTask.courseId;
        const matchedEssay = essays.find(e => e.id === assignmentId);
        if (matchedEssay?.courseId) return matchedEssay.courseId;
        const matchedTest = tests.find(t => t.id === assignmentId);
        if (matchedTest?.courseId) return matchedTest.courseId;
        const matchedCourse = courses.find(
          c => c.code.toLowerCase() === (courseCode || '').toLowerCase()
        );
        return matchedCourse?.id;
      };

      const normalizedSteps: AIDayStep[] = (data.steps || []).map(
        (
          step: {
            assignmentId: string;
            assignmentTitle: string;
            courseCode: string;
            stepTitle: string;
            description: string;
            startTime: string;
            endTime: string;
            durationMinutes: number;
            timeOfDay: string;
            priority: string;
            focusTip?: string;
          },
          index: number
        ) => {
          const validTimeOfDay =
            step.timeOfDay === 'Morning' || step.timeOfDay === 'Afternoon' || step.timeOfDay === 'Evening'
              ? step.timeOfDay
              : Number((step.startTime || '12:00').split(':')[0]) < 12
                ? 'Morning'
                : Number((step.startTime || '12:00').split(':')[0]) < 17
                  ? 'Afternoon'
                  : 'Evening';

          const validPriority: TaskPriority =
            step.priority === 'urgent' ||
            step.priority === 'high' ||
            step.priority === 'medium' ||
            step.priority === 'low'
              ? step.priority
              : 'medium';

          return {
            id: `ai-step-${Date.now()}-${index}`,
            assignmentId: step.assignmentId,
            assignmentTitle: step.assignmentTitle,
            courseId: findCourseId(step.assignmentId, step.courseCode),
            courseCode: step.courseCode || 'General',
            stepTitle: step.stepTitle,
            description: step.description,
            startTime: step.startTime,
            endTime: step.endTime,
            durationMinutes: Number(step.durationMinutes) || 30,
            timeOfDay: validTimeOfDay,
            priority: validPriority,
            focusTip: step.focusTip,
            completed: false,
          };
        }
      );

      // Clear previous calendar blocks from old plan on same date if regenerating
      if (currentPlan) {
        clearAIDayPlan(selectedDate);
      }

      const newPlan: AIDayPlan = {
        date: selectedDate,
        generatedAt: new Date().toISOString(),
        pacePreference,
        studyWindowStart,
        studyWindowEnd,
        dailyStrategySummary: data.dailyStrategySummary,
        steps: normalizedSteps.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      };

      saveAIDayPlan(newPlan);
      setShowConfigPanel(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to connect to AI planner.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Interleaved chronological timeline (Fixed Classes + AI Steps)
  type TimelineEntry =
    | { kind: 'fixed'; startTime: string; item: (typeof fixedEventsOnDate)[number] }
    | { kind: 'ai_step'; startTime: string; step: AIDayStep };

  const combinedTimeline = useMemo<TimelineEntry[]>(() => {
    const fixedEntries: TimelineEntry[] = fixedEventsOnDate.map(item => ({
      kind: 'fixed',
      startTime: item.startTime,
      item,
    }));
    const aiEntries: TimelineEntry[] = (currentPlan?.steps || []).map(step => ({
      kind: 'ai_step',
      startTime: step.startTime,
      step,
    }));
    return [...fixedEntries, ...aiEntries].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  }, [fixedEventsOnDate, currentPlan]);

  // Group AI steps by parent assignment
  const stepsByAssignment = useMemo(() => {
    if (!currentPlan) return [];
    const groups = new Map<
      string,
      {
        assignmentId: string;
        assignmentTitle: string;
        courseCode: string;
        courseId?: string;
        steps: AIDayStep[];
      }
    >();

    for (const step of currentPlan.steps) {
      const key = step.assignmentId || step.assignmentTitle;
      const existing = groups.get(key);
      if (existing) {
        existing.steps.push(step);
      } else {
        groups.set(key, {
          assignmentId: step.assignmentId,
          assignmentTitle: step.assignmentTitle,
          courseCode: step.courseCode,
          courseId: step.courseId,
          steps: [step],
        });
      }
    }
    return Array.from(groups.values());
  }, [currentPlan]);

  const completedStepsCount = currentPlan?.steps.filter(s => s.completed).length || 0;
  const totalStepsCount = currentPlan?.steps.length || 0;
  const totalStudyMinutes =
    currentPlan?.steps.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;
  const allStepsOnCalendar =
    totalStepsCount > 0 && currentPlan?.steps.every(s => Boolean(s.calendarScheduleId));

  const focusedTask = aiFocusAssignmentId
    ? pendingTasks.find(t => t.id === aiFocusAssignmentId)
    : undefined;

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  AI Daily Assignment Breakdown
                </h1>
                <p className="text-xs text-slate-500">
                  Breaks your assignments into achievable micro-steps woven cleanly around your classes.
                </p>
              </div>
            </div>
          </div>

          {/* Date Switcher & Primary Generate CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => shiftDate(-1)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-2 py-1 text-xs font-semibold font-mono tabular-nums text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
              <button
                onClick={() => shiftDate(1)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowConfigPanel(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showConfigPanel
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize Scope</span>
            </button>

            <button
              onClick={() => handleGeneratePlan()}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Breaking Down Day...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentPlan ? 'Regenerate Day Plan' : 'Break Down My Day'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Focused single-assignment banner if triggered from a specific task */}
        {focusedTask && (
          <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Focused Mode: Breaking down <strong>"{focusedTask.title}"</strong> into smaller steps across {formattedDate}.
              </span>
            </div>
            <button
              onClick={() => {
                setAiFocusAssignmentId(null);
                setSelectedTaskIds(pendingTasks.map(t => t.id));
              }}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
            >
              Switch to All Assignments
            </button>
          </div>
        )}

        {/* Context strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{formattedDate}</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Study window:{' '}
              <strong className="font-mono tabular-nums text-slate-800">
                {studyWindowStart}–{studyWindowEnd}
              </strong>
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong className="font-mono tabular-nums text-slate-800">
                {fixedEventsOnDate.length}
              </strong>{' '}
              fixed classes/exams on day
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong className="font-mono tabular-nums text-slate-800">
                {selectedTaskIds.length}
              </strong>{' '}
              of {pendingTasks.length} pending assignments selected
            </span>
          </span>
        </div>

        {/* Collapsible Scope & Pace Config Panel */}
        <AnimatePresence>
          {showConfigPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-2 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                {/* Left: Schedule Window & Study Pace */}
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <span className="font-bold text-slate-800 block mb-2">
                      Available Study Hours
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Day Starts</label>
                        <input
                          type="time"
                          value={studyWindowStart}
                          onChange={e => setStudyWindowStart(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Day Ends</label>
                        <input
                          type="time"
                          value={studyWindowEnd}
                          onChange={e => setStudyWindowEnd(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-2">Step Pacing Style</span>
                    <div className="grid grid-cols-2 gap-2">
                      {PACE_OPTIONS.map(opt => {
                        const isSelected = pacePreference === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPacePreference(opt.id)}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500/30'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{opt.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeEssays}
                        onChange={e => setIncludeEssays(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>Include Essay Milestones ({activeEssays.length})</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeExamPrep}
                        onChange={e => setIncludeExamPrep(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>Include Exam Prep ({upcomingTests.length})</span>
                    </label>
                  </div>
                </div>

                {/* Right: Assignments Checklist */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Assignments to Break Down ({selectedTaskIds.length}/{pendingTasks.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAiFocusAssignmentId(null);
                          setSelectedTaskIds(pendingTasks.map(t => t.id));
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAiFocusAssignmentId(null);
                          setSelectedTaskIds([]);
                        }}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {pendingTasks.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-center">
                      No pending assignments found. Add tasks in the Assignments tab first.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50/40">
                      {pendingTasks.map(task => {
                        const checked = selectedTaskIds.includes(task.id);
                        const course = getCourseById(task.courseId);
                        const p = PRIORITY_STYLES[task.priority];
                        return (
                          <label
                            key={task.id}
                            className="flex items-center justify-between gap-3 p-2.5 hover:bg-white transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleTaskSelection(task.id)}
                                className="rounded text-indigo-600 focus:ring-0 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate">
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  {course && (
                                    <span className="flex items-center gap-1">
                                      <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: course.color }}
                                      />
                                      {course.code}
                                    </span>
                                  )}
                                  <span>Due {task.dueDate}</span>
                                  <span className="font-mono tabular-nums">
                                    ~{task.estimatedMinutes}m
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${p.badgeClass}`}
                            >
                              {p.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Could not generate daily breakdown</span>
              <span className="text-rose-700 mt-0.5 block">{errorMsg}</span>
            </div>
          </div>
          <button
            onClick={() => handleGeneratePlan()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isGenerating && (
        <div className="bg-white rounded-xl border border-indigo-200/80 p-8 shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Analyzing your assignments & class timetable...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gemini is splitting large tasks into concrete micro-steps and fitting them into open gaps on {formattedDate}.
            </p>
          </div>
          <div className="max-w-lg mx-auto space-y-2.5 pt-2">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="h-14 rounded-xl bg-slate-100 animate-pulse"
                style={{ opacity: 1 - n * 0.2 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no plan generated for selectedDate */}
      {!isGenerating && !currentPlan && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ready to break down {formattedDate}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You have{' '}
                <strong className="text-slate-800">{pendingTasks.length} pending assignments</strong>{' '}
                and{' '}
                <strong className="text-slate-800">{fixedEventsOnDate.length} fixed classes/exams</strong>{' '}
                on this day. Let AI split your heavy assignments into small, step-by-step blocks placed around your classes.
              </p>
            </div>

            {fixedEventsOnDate.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 text-left space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Fixed Commitments AI Will Work Around
                </span>
                <div className="flex flex-wrap gap-2">
                  {fixedEventsOnDate.map(ev => (
                    <div
                      key={ev.id}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ev.color }}
                      />
                      <span className="font-mono tabular-nums font-semibold text-slate-700">
                        {ev.startTime}–{ev.endTime}
                      </span>
                      <span className="text-slate-800 font-medium truncate max-w-[180px]">
                        {ev.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-center gap-3">
              <button
                onClick={() => handleGeneratePlan()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Break Down Assignments for Today</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Plan Workspace */}
      {!isGenerating && currentPlan && (
        <div className="space-y-4">
          {/* Strategy & Progress Summary Bar */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 text-white shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 text-indigo-100 text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Daily Game Plan · {formattedDate}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-white">
                  {currentPlan.dailyStrategySummary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => scheduleAllAIStepsToCalendar(selectedDate)}
                  disabled={allStepsOnCalendar}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    allStepsOnCalendar
                      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 cursor-default'
                      : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-xs'
                  }`}
                >
                  {allStepsOnCalendar ? (
                    <>
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>All Steps on Calendar</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Add All to Calendar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('calendar');
                    setCalendarView('day');
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-500/40 hover:bg-indigo-500/60 text-white border border-indigo-400/40 transition-colors cursor-pointer"
                >
                  <span>View Day Calendar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress & View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-indigo-500/40 text-xs">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums font-bold text-white">
                    {completedStepsCount}/{totalStepsCount}
                  </span>
                  <span className="text-indigo-100">steps completed</span>
                </div>
                <div className="flex-1 max-w-xs h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className="font-mono tabular-nums text-indigo-100 hidden sm:inline">
                  {totalStudyMinutes}m planned
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center p-0.5 bg-indigo-900/40 rounded-lg border border-indigo-400/30">
                  <button
                    onClick={() => setDisplayMode('timeline')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      displayMode === 'timeline'
                        ? 'bg-white text-indigo-700'
                        : 'text-indigo-100 hover:text-white'
                    }`}
                  >
                    Day Timeline
                  </button>
                  <button
                    onClick={() => setDisplayMode('by_assignment')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      displayMode === 'by_assignment'
                        ? 'bg-white text-indigo-700'
                        : 'text-indigo-100 hover:text-white'
                    }`}
                  >
                    By Assignment
                  </button>
                </div>

                <button
                  onClick={() => clearAIDayPlan(selectedDate)}
                  className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-500/40 rounded-lg transition-colors cursor-pointer"
                  title="Clear today's AI breakdown"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Display Mode 1: Chronological Day Timeline (Classes + Micro-Steps) */}
          {displayMode === 'timeline' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Full Day Flow ({combinedTimeline.length} blocks)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Classes + AI assignment micro-steps
                </span>
              </div>

              <div className="space-y-2.5">
                {combinedTimeline.map((entry, idx) => {
                  if (entry.kind === 'fixed') {
                    const ev = entry.item;
                    return (
                      <div
                        key={`fixed-${ev.id}`}
                        className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs"
                      >
                        <div className="w-24 shrink-0 font-mono tabular-nums text-[11px] font-semibold text-slate-500">
                          {ev.startTime} – {ev.endTime}
                        </div>
                        <div
                          className="w-1 h-7 rounded-full shrink-0"
                          style={{ backgroundColor: ev.color }}
                        />
                        <div className="flex-1 min-w-0 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-slate-700 truncate">{ev.title}</span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                              {ev.courseCode} · {ev.type.replace('_', ' ')}
                            </span>
                          </div>
                          {ev.location && (
                            <span className="text-[11px] text-slate-400">{ev.location}</span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const step = entry.step;
                  const course = getCourseById(step.courseId);
                  const priority = PRIORITY_STYLES[step.priority];
                  const isScheduled = Boolean(step.calendarScheduleId);

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        step.completed
                          ? 'bg-slate-50/70 border-slate-200 opacity-65'
                          : 'bg-white border-indigo-200/90 hover:border-indigo-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleAIStepCompleted(selectedDate, step.id)}
                          className="mt-0.5 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                          title={step.completed ? 'Mark incomplete' : 'Mark step complete'}
                        >
                          {step.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono tabular-nums text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                              {step.startTime} – {step.endTime} ({step.durationMinutes}m)
                            </span>

                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {step.timeOfDay}
                            </span>

                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${priority.badgeClass}`}
                            >
                              {priority.label}
                            </span>

                            <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: course?.color || '#6366f1' }}
                              />
                              {step.courseCode}
                            </span>
                          </div>

                          <h3
                            className={`text-sm font-bold ${
                              step.completed ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {step.stepTitle}
                          </h3>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {step.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-slate-400" />
                              <span>From: {step.assignmentTitle}</span>
                            </span>
                            {step.focusTip && (
                              <span className="flex items-center gap-1 text-amber-700 bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200/60">
                                <Lightbulb className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{step.focusTip}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-end gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            isScheduled
                              ? unscheduleAIStepFromCalendar(selectedDate, step.id)
                              : scheduleAIStepToCalendar(selectedDate, step.id)
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            isScheduled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                          }`}
                          title={
                            isScheduled
                              ? 'Remove from calendar schedule'
                              : 'Add this step as a study block on your calendar'
                          }
                        >
                          {isScheduled ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>On Calendar</span>
                            </>
                          ) : (
                            <>
                              <CalendarPlus className="w-3 h-3" />
                              <span>Add to Calendar</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => deleteAIStep(selectedDate, step.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Display Mode 2: Grouped By Assignment */}
          {displayMode === 'by_assignment' && (
            <div className="grid grid-cols-1 gap-4">
              {stepsByAssignment.map(group => {
                const course = getCourseById(group.courseId);
                const doneCount = group.steps.filter(s => s.completed).length;
                const totalMins = group.steps.reduce((sum, s) => sum + s.durationMinutes, 0);

                return (
                  <div
                    key={group.assignmentId || group.assignmentTitle}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: course?.color || '#6366f1' }}
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {group.assignmentTitle}
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            {group.courseCode} · {group.steps.length} micro-steps ·{' '}
                            <span className="font-mono tabular-nums">{totalMins}m</span> total today
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/70">
                        {doneCount}/{group.steps.length} done
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.steps.map((step, sIdx) => {
                        const isScheduled = Boolean(step.calendarScheduleId);
                        return (
                          <div
                            key={step.id}
                            className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              step.completed
                                ? 'bg-slate-50 border-slate-200 opacity-65'
                                : 'bg-slate-50/40 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <button
                                onClick={() => toggleAIStepCompleted(selectedDate, step.id)}
                                className="mt-0.5 text-slate-300 hover:text-indigo-600 cursor-pointer shrink-0"
                              >
                                {step.completed ? (
                                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-4.5 h-4.5" />
                                )}
                              </button>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-400">
                                    Step {sIdx + 1}
                                  </span>
                                  <span
                                    className={`text-xs font-bold ${
                                      step.completed
                                        ? 'line-through text-slate-400'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {step.stepTitle}
                                  </span>
                                  <span className="font-mono tabular-nums text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {step.startTime}–{step.endTime}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                isScheduled
                                  ? unscheduleAIStepFromCalendar(selectedDate, step.id)
                                  : scheduleAIStepToCalendar(selectedDate, step.id)
                              }
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border shrink-0 self-end sm:self-center cursor-pointer ${
                                isScheduled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                              }`}
                            >
                              {isScheduled ? 'On Calendar ✓' : '+ Calendar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
