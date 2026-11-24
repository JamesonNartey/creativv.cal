import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { TestItem, ExamType, ExamReminderTiming } from '../types';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  AlertCircle,
  Flame,
  Bell,
  BellRing,
} from 'lucide-react';
import {
  REMINDER_OPTIONS,
  formatReminderLabel,
  triggerExamNotification,
} from '../utils/reminderUtils';

export const TestsView: React.FC = () => {
  const {
    tests,
    courses,
    getCourseById,
    updateTest,
    deleteTest,
    toggleStudyChecklist,
    updateTestReminder,
    openAddModal,
    selectedCourseFilter,
    searchQuery,
  } = usePlanner();

  const [newChecklistText, setNewChecklistText] = useState<{ [testId: string]: string }>({});

  const examTypeLabels: Record<ExamType, string> = {
    midterm: 'Midterm Exam',
    final: 'Final Exam',
    quiz: 'In-Class Quiz',
    practical: 'Lab Practical',
  };

  // Sort tests by upcoming date
  const sortedTests = tests
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(test => {
      if (selectedCourseFilter && test.courseId !== selectedCourseFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const course = getCourseById(test.courseId);
        const matchesTitle = test.title.toLowerCase().includes(q);
        const matchesCourse = course?.code.toLowerCase().includes(q) || course?.name.toLowerCase().includes(q);
        const matchesTopics = test.topics.some(t => t.toLowerCase().includes(q));
        return matchesTitle || matchesCourse || matchesTopics;
      }
      return true;
    });

  // Calculate days remaining helper
  const getDaysRemaining = (examDate: string) => {
    const today = new Date('2026-10-12');
    const exam = new Date(examDate);
    const diffMs = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d ago`, urgent: false };
    if (diffDays === 0) return { label: 'Today!', urgent: true };
    if (diffDays === 1) return { label: 'Tomorrow', urgent: true };
    return { label: `${diffDays} days left`, urgent: diffDays <= 5 };
  };

  const handleAddStudyItem = (testId: string) => {
    const text = newChecklistText[testId]?.trim();
    if (!text) return;
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const newItem = {
      id: `sc-${Date.now()}`,
      text,
      completed: false,
    };

    updateTest(testId, {
      studyChecklist: [...test.studyChecklist, newItem],
    });

    setNewChecklistText(prev => ({ ...prev, [testId]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-rose-600" />
            <span>Upcoming Exams & Tests Radar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor countdowns, syllabus topic coverage, and pre-exam revision checklists.
          </p>
        </div>

        <button
          onClick={() => openAddModal('test')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Exam / Test</span>
        </button>
      </div>

      {/* Grid of Tests */}
      {sortedTests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No exams scheduled</h3>
          <p className="text-xs text-slate-400 mt-1">Add upcoming midterms, finals, or quizzes to start your revision checklist.</p>
          <button
            onClick={() => openAddModal('test')}
            className="mt-4 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Add Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {sortedTests.map(test => {
            const course = getCourseById(test.courseId);
            const countdown = getDaysRemaining(test.date);
            const completedCount = test.studyChecklist.filter(c => c.completed).length;
            const totalCount = test.studyChecklist.length;
            const readinessPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <motion.div
                key={test.id}
                whileHover={{ y: -3, transition: { duration: 0.16 } }}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs overflow-hidden flex flex-col justify-between transition-shadow"
              >
                <div>
                  {/* Top Exam Info Banner */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs mb-1">
                          {course && (
                            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: course.color }}
                              />
                              {course.code}
                            </span>
                          )}
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-500 font-medium">
                            {examTypeLabels[test.type]}
                          </span>
                        </div>

                        <h2 className="text-base font-bold text-slate-900">
                          {test.title}
                        </h2>
                      </div>

                      {/* Countdown badge */}
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg font-mono tabular-nums ${
                            countdown.urgent
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {countdown.label}
                        </span>
                        <span className="block text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                          {test.weightPercentage}% of final grade
                        </span>
                      </div>
                    </div>

                    {/* Time, Venue & Exam Reminder Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/60">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{test.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{test.startTime} – {test.endTime}</span>
                        </div>
                        {test.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{test.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Reminder status badge */}
                      <div className="flex items-center gap-1.5">
                        {test.reminderTiming && test.reminderTiming !== 'none' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                            <BellRing className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>{formatReminderLabel(test)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Bell className="w-3 h-3" />
                            <span>No reminder</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Exam Reminder Setting Box */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Bell className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Exam Reminder Alert</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            triggerExamNotification(
                              test.title,
                              `Upcoming exam on ${test.date} at ${test.startTime} (${test.location || 'Campus'}). Don't forget your materials!`
                            );
                            alert(`🔔 Alert test sent for: ${test.title}!\nDate: ${test.date} at ${test.startTime}\nVenue: ${test.location}`);
                          }}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
                        >
                          Test Alert
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={test.reminderTiming || 'none'}
                          onChange={e => {
                            const val = e.target.value as ExamReminderTiming;
                            updateTestReminder(test.id, val, test.reminderCustomTime);
                          }}
                          className="flex-1 min-w-[170px] px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                        >
                          {REMINDER_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {test.reminderTiming === 'custom' && (
                          <input
                            type="datetime-local"
                            value={test.reminderCustomTime || `${test.date}T${test.startTime}`}
                            onChange={e => {
                              updateTestReminder(test.id, 'custom', e.target.value);
                            }}
                            className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums text-slate-800"
                          />
                        )}
                      </div>
                    </div>

                    {/* Readiness progress meter */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">
                          Revision Readiness ({completedCount}/{totalCount} tasks completed)
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-rose-700">
                          {readinessPercent}% ready
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${readinessPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Topics Covered */}
                    {test.topics.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Syllabus Scope
                        </span>
                        <ul className="space-y-1">
                          {test.topics.map((tp, idx) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <span className="text-slate-400 font-mono text-[10px] mt-0.5">•</span>
                              <span>{tp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Study Checklist */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Pre-Exam Checklist
                      </span>
                      <div className="space-y-1.5">
                        {test.studyChecklist.map(item => (
                          <div
                            key={item.id}
                            onClick={() => toggleStudyChecklist(test.id, item.id)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-xs"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-800'}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Add quick study item */}
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Add revision item (e.g. Practice 2024 final)..."
                          value={newChecklistText[test.id] || ''}
                          onChange={(e) =>
                            setNewChecklistText(prev => ({ ...prev, [test.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddStudyItem(test.id);
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-rose-400"
                        />
                        <button
                          onClick={() => handleAddStudyItem(test.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {test.notes && (
                      <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700">Exam Rules: </span>
                        {test.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer delete */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${test.title}"?`)) {
                        deleteTest(test.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Exam</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
