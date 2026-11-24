import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { TaskItem, TaskCategory, TaskPriority } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  Filter,
  Sparkles,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    courses,
    getCourseById,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompleted,
    openAddModal,
    selectedCourseFilter,
    searchQuery,
    selectedDate,
    aiDayPlans,
    openAIDayPlanForTask,
    toggleAIStepCompleted,
    setActiveTab,
    setAiFocusAssignmentId,
  } = usePlanner();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activePriorityFilter, setActivePriorityFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);

  // Quick inline add state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCourseId, setQuickCourseId] = useState<string>('');
  const [quickDueDate, setQuickDueDate] = useState('2026-10-13');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('high');

  const priorityConfig: Record<TaskPriority, { label: string; textClass: string; bgClass: string }> = {
    urgent: { label: 'Urgent', textClass: 'text-rose-700', bgClass: 'bg-rose-50 border-rose-200' },
    high: { label: 'High', textClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-200' },
    medium: { label: 'Medium', textClass: 'text-indigo-700', bgClass: 'bg-indigo-50 border-indigo-200' },
    low: { label: 'Low', textClass: 'text-slate-600', bgClass: 'bg-slate-100 border-slate-200' },
  };

  const categoryLabels: Record<TaskCategory, string> = {
    homework: 'Homework',
    reading: 'Reading',
    problem_set: 'Problem Set',
    project: 'Project',
    lab_report: 'Lab Report',
    admin: 'Admin',
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedCourseFilter && task.courseId !== selectedCourseFilter) {
      return false;
    }
    if (activeCategoryFilter !== 'all' && task.category !== activeCategoryFilter) {
      return false;
    }
    if (activePriorityFilter !== 'all' && task.priority !== activePriorityFilter) {
      return false;
    }
    if (!showCompleted && task.completed) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const course = getCourseById(task.courseId);
      const matchesTitle = task.title.toLowerCase().includes(q);
      const matchesCourse = course?.code.toLowerCase().includes(q) || course?.name.toLowerCase().includes(q);
      return matchesTitle || matchesCourse;
    }
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // Total pending hours calculation
  const totalPendingMinutes = pendingTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const pendingHours = Math.floor(totalPendingMinutes / 60);
  const pendingMinsRemainder = totalPendingMinutes % 60;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle.trim(),
      courseId: quickCourseId || undefined,
      dueDate: quickDueDate || '2026-10-13',
      estimatedMinutes: 45,
      priority: quickPriority,
      category: 'homework',
      completed: false,
    });

    setQuickTitle('');
  };

  const formatDueDate = (dateStr: string) => {
    const today = new Date('2026-10-12');
    const due = new Date(dateStr);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <span className="text-rose-600 font-semibold">{Math.abs(diffDays)}d overdue</span>;
    if (diffDays === 0) return <span className="text-amber-600 font-semibold">Today</span>;
    if (diffDays === 1) return <span className="text-amber-600 font-medium">Tomorrow</span>;
    return <span className="text-slate-500 font-mono tabular-nums">{dateStr}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>Coursework & Assignments</span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>
              Pending workload:{' '}
              <strong className="text-slate-800 font-mono tabular-nums">
                {pendingHours > 0 ? `${pendingHours}h ` : ''}{pendingMinsRemainder}m
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-800 font-mono tabular-nums">{pendingTasks.length}</strong> tasks remaining
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              setAiFocusAssignmentId(null);
              setActiveTab('ai_plan');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Day Breakdown</span>
          </button>

          <button
            onClick={() => openAddModal('task')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs"
      >
        <input
          type="text"
          placeholder="Quick add task (e.g. Read Chapter 7, Practice problem set)..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          className="flex-1 w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
        />

        <select
          value={quickCourseId}
          onChange={(e) => setQuickCourseId(e.target.value)}
          className="w-full sm:w-44 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
        >
          <option value="">No Course (General)</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={quickDueDate}
          onChange={(e) => setQuickDueDate(e.target.value)}
          className="w-full sm:w-36 px-2.5 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
        />

        <select
          value={quickPriority}
          onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
          className="w-full sm:w-28 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium cursor-pointer"
        >
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟠 High</option>
          <option value="medium">🔵 Medium</option>
          <option value="low">⚪ Low</option>
        </select>

        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
        >
          Add Task
        </button>
      </form>

      {/* Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category buttons */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Work
          </button>
          {Object.entries(categoryLabels).map(([catKey, catLabel]) => (
            <button
              key={catKey}
              onClick={() => setActiveCategoryFilter(catKey)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeCategoryFilter === catKey
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {catLabel}
            </button>
          ))}
        </div>

        {/* Priority & Completed Toggles */}
        <div className="flex items-center gap-2">
          <select
            value={activePriorityFilter}
            onChange={(e) => setActivePriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Show completed</span>
          </label>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No coursework matching the current filter.
          </div>
        ) : (
          <>
            {/* Active / Pending Tasks */}
            {pendingTasks.map((task, idx) => {
              const course = getCourseById(task.courseId);
              const priority = priorityConfig[task.priority];
              const taskSteps =
                aiDayPlans[selectedDate]?.steps.filter(s => s.assignmentId === task.id) || [];

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="p-3.5 hover:bg-slate-50/70 transition-colors group space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="mt-0.5 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                      >
                        <Circle className="w-4 h-4" />
                      </motion.button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {task.title}
                          </span>

                          {course && (
                            <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: course.color }}
                              />
                              {course.code}
                            </span>
                          )}

                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${priority.bgClass} ${priority.textClass}`}
                          >
                            <option value="urgent">🔴 Urgent</option>
                            <option value="high">🟠 High</option>
                            <option value="medium">🔵 Medium</option>
                            <option value="low">⚪ Low</option>
                          </select>
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-500">{task.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Metadata and Actions */}
                    <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                      <button
                        onClick={() => openAIDayPlanForTask(task.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/70 rounded-md transition-colors cursor-pointer"
                        title="Ask AI to break this assignment into smaller steps across your day"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span className="hidden sm:inline">Break Down</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono tabular-nums">{task.estimatedMinutes}m</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDueDate(task.dueDate)}</span>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline AI Micro-Steps if generated for this assignment */}
                  {taskSteps.length > 0 && (
                    <div className="ml-7 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-900">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          AI Steps for {selectedDate} (
                          {taskSteps.filter(s => s.completed).length}/{taskSteps.length})
                        </span>
                        <button
                          onClick={() => setActiveTab('ai_plan')}
                          className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Open Day Plan
                        </button>
                      </div>
                      <div className="space-y-1">
                        {taskSteps.map(step => (
                          <div
                            key={step.id}
                            className="flex items-center justify-between gap-2 text-xs py-0.5"
                          >
                            <button
                              onClick={() => toggleAIStepCompleted(selectedDate, step.id)}
                              className="flex items-center gap-2 text-left cursor-pointer min-w-0"
                            >
                              {step.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              )}
                              <span
                                className={`truncate ${
                                  step.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                                }`}
                              >
                                {step.stepTitle}
                              </span>
                            </button>
                            <span className="font-mono tabular-nums text-[10px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                              {step.startTime}–{step.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Completed Tasks section */}
            {showCompleted && completedTasks.length > 0 && (
              <div className="bg-slate-50/40 divide-y divide-slate-100">
                <div className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Completed ({completedTasks.length})
                </div>
                {completedTasks.map(task => {
                  const course = getCourseById(task.courseId);
                  return (
                    <div
                      key={task.id}
                      className="p-3.5 hover:bg-slate-100/50 transition-colors flex items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTaskCompleted(task.id)}
                          className="text-emerald-600 hover:text-slate-400 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span className="line-through text-slate-400">
                          {task.title}
                        </span>
                        {course && (
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({course.code})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
