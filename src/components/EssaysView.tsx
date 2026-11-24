import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { EssayItem, EssayStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';

export const EssaysView: React.FC = () => {
  const {
    essays,
    courses,
    getCourseById,
    updateEssay,
    deleteEssay,
    updateEssayWordCount,
    toggleEssayMilestone,
    openAddModal,
    selectedCourseFilter,
    searchQuery,
  } = usePlanner();

  const [expandedId, setExpandedId] = useState<string | null>(essays[0]?.id || null);
  const [editingWordCountId, setEditingWordCountId] = useState<string | null>(null);
  const [wordCountInput, setWordCountInput] = useState<string>('');

  // Status labels
  const statusLabels: Record<EssayStatus, { label: string; textClass: string; bgClass: string }> = {
    not_started: { label: 'Not Started', textClass: 'text-slate-600', bgClass: 'bg-slate-100' },
    outline: { label: 'Outline & Sources', textClass: 'text-sky-700', bgClass: 'bg-sky-50' },
    drafting: { label: 'Drafting', textClass: 'text-indigo-700', bgClass: 'bg-indigo-50' },
    review: { label: 'In Review / Workshop', textClass: 'text-amber-700', bgClass: 'bg-amber-50' },
    submitted: { label: 'Submitted', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
  };

  // Filter essays
  const filteredEssays = essays.filter(essay => {
    if (selectedCourseFilter && essay.courseId !== selectedCourseFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const course = getCourseById(essay.courseId);
      const matchesTitle = essay.title.toLowerCase().includes(q);
      const matchesCourse = course?.code.toLowerCase().includes(q) || course?.name.toLowerCase().includes(q);
      const matchesPrompt = essay.prompt.toLowerCase().includes(q);
      return matchesTitle || matchesCourse || matchesPrompt;
    }
    return true;
  });

  // Calculate days remaining helper
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date('2026-10-12');
    const due = new Date(dueDate);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today!';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const handleStartEditWordCount = (essay: EssayItem) => {
    setEditingWordCountId(essay.id);
    setWordCountInput(essay.currentWordCount.toString());
  };

  const handleSaveWordCount = (id: string) => {
    const num = parseInt(wordCountInput, 10);
    if (!isNaN(num)) {
      updateEssayWordCount(id, num);
    }
    setEditingWordCountId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Essays & Research Papers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track writing milestones, thesis statements, word count progress, and citation styles.
          </p>
        </div>

        <button
          onClick={() => openAddModal('essay')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Essay / Paper</span>
        </button>
      </div>

      {/* Essays List */}
      {filteredEssays.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No essays found</h3>
          <p className="text-xs text-slate-400 mt-1">Add your term papers, lab reports, or literature reviews to begin tracking.</p>
          <button
            onClick={() => openAddModal('essay')}
            className="mt-4 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Add Essay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEssays.map(essay => {
            const course = getCourseById(essay.courseId);
            const isExpanded = expandedId === essay.id;
            const progressPercent = Math.min(
              100,
              Math.round((essay.currentWordCount / essay.targetWordCount) * 100)
            );
            const statusConfig = statusLabels[essay.status];
            const completedMilestones = essay.milestones.filter(m => m.completed).length;
            const totalMilestones = essay.milestones.length;

            return (
              <div
                key={essay.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all hover:border-slate-300"
              >
                {/* Header Strip */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {course && (
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: course.color }}
                          />
                          {course.code}
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {essay.citationStyle}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-indigo-600 font-medium">
                        {getDaysRemaining(essay.dueDate)}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900">
                      {essay.title}
                    </h2>

                    {/* Word count progress bar */}
                    <div className="pt-2 max-w-xl">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600">Progress:</span>
                          {editingWordCountId === essay.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={wordCountInput}
                                onChange={e => setWordCountInput(e.target.value)}
                                className="w-20 px-1.5 py-0.5 text-xs font-mono tabular-nums border border-indigo-400 rounded focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveWordCount(essay.id)}
                                className="px-2 py-0.5 text-[11px] bg-indigo-600 text-white rounded font-medium"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditWordCount(essay)}
                              className="font-mono tabular-nums font-semibold text-slate-900 hover:text-indigo-600 transition-colors underline decoration-dotted"
                              title="Click to update word count"
                            >
                              {essay.currentWordCount.toLocaleString()} / {essay.targetWordCount.toLocaleString()} words
                            </button>
                          )}
                        </div>

                        <span className="font-mono tabular-nums font-semibold text-indigo-700">
                          {progressPercent}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <select
                      value={essay.status}
                      onChange={(e) => updateEssay(essay.id, { status: e.target.value as EssayStatus })}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${statusConfig.bgClass} ${statusConfig.textClass}`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="outline">Outline & Sources</option>
                      <option value="drafting">Drafting</option>
                      <option value="review">In Review / Workshop</option>
                      <option value="submitted">Submitted</option>
                    </select>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : essay.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={isExpanded ? 'Collapse milestones' : 'Expand milestones & prompt'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete "${essay.title}"?`)) {
                          deleteEssay(essay.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete essay"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-5 overflow-hidden"
                    >
                    {/* Prompt & Thesis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {essay.prompt && (
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                            Assignment Prompt
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {essay.prompt}
                          </p>
                        </div>
                      )}

                      {essay.thesisStatement && (
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block mb-1">
                            Working Thesis Statement
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            "{essay.thesisStatement}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Milestones Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-900">
                          Milestones & Checkpoints ({completedMilestones}/{totalMilestones})
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                          Due by {essay.dueDate}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {essay.milestones.map(m => (
                          <div
                            key={m.id}
                            onClick={() => toggleEssayMilestone(essay.id, m.id)}
                            className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80 hover:border-slate-300 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              {m.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span className={`text-xs ${m.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {m.title}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                              Target: {m.dueDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {essay.notes && (
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Notes: </span>
                        {essay.notes}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
