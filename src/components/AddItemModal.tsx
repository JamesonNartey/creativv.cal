import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  ScheduleItemType,
  CitationFormat,
  ExamType,
  TaskPriority,
  TaskCategory,
  ExamReminderTiming,
} from '../types';
import { REMINDER_OPTIONS } from '../utils/reminderUtils';
import {
  X,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckSquare,
  Plus,
  Bell,
  Repeat,
  Check,
  AlertTriangle,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { dayIndex: 1, label: 'M', full: 'Mon' },
  { dayIndex: 2, label: 'Tu', full: 'Tue' },
  { dayIndex: 3, label: 'W', full: 'Wed' },
  { dayIndex: 4, label: 'Th', full: 'Thu' },
  { dayIndex: 5, label: 'F', full: 'Fri' },
  { dayIndex: 6, label: 'Sa', full: 'Sat' },
  { dayIndex: 0, label: 'Su', full: 'Sun' },
];

export const AddItemModal: React.FC = () => {
  const {
    isAddModalOpen,
    closeAddModal,
    addModalDefaultTab,
    courses,
    selectedDate,
    addScheduleItem,
    addEssay,
    addTest,
    addTask,
  } = usePlanner();

  const [activeTab, setActiveTab] = useState<'task' | 'essay' | 'test' | 'event'>('task');

  // Reset tab when opened
  useEffect(() => {
    if (isAddModalOpen) {
      if (addModalDefaultTab === 'recurring_class') {
        setActiveTab('event');
        setEventIsRecurring(true);
      } else {
        setActiveTab(addModalDefaultTab);
      }
    }
  }, [isAddModalOpen, addModalDefaultTab]);

  // Form states - Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourseId, setTaskCourseId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(selectedDate);
  const [taskMinutes, setTaskMinutes] = useState(45);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('homework');
  const [taskNotes, setTaskNotes] = useState('');

  // Form states - Essay
  const [essayTitle, setEssayTitle] = useState('');
  const [essayCourseId, setEssayCourseId] = useState('');
  const [essayDueDate, setEssayDueDate] = useState(selectedDate);
  const [essayWordCount, setEssayWordCount] = useState(2000);
  const [essayCitation, setEssayCitation] = useState<CitationFormat>('APA 7');
  const [essayPrompt, setEssayPrompt] = useState('');
  const [essayThesis, setEssayThesis] = useState('');

  // Form states - Test
  const [testTitle, setTestTitle] = useState('');
  const [testCourseId, setTestCourseId] = useState('');
  const [testType, setTestType] = useState<ExamType>('midterm');
  const [testDate, setTestDate] = useState(selectedDate);
  const [testStartTime, setTestStartTime] = useState('10:00');
  const [testEndTime, setTestEndTime] = useState('12:00');
  const [testLocation, setTestLocation] = useState('');
  const [testWeight, setTestWeight] = useState(25);
  const [testTopics, setTestTopics] = useState('');
  const [testReminderTiming, setTestReminderTiming] = useState<ExamReminderTiming>('1_day');
  const [testReminderCustomTime, setTestReminderCustomTime] = useState('');

  // Form states - Event / Class Schedule
  const [eventTitle, setEventTitle] = useState('');
  const [eventCourseId, setEventCourseId] = useState('');
  const [eventType, setEventType] = useState<ScheduleItemType>('lecture');
  const [eventIsRecurring, setEventIsRecurring] = useState(true); // Default to recurring for classes
  const [eventRecurringDays, setEventRecurringDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [eventDate, setEventDate] = useState(selectedDate);
  const [eventStartTime, setEventStartTime] = useState('10:00');
  const [eventEndTime, setEventEndTime] = useState('11:30');
  const [eventLocation, setEventLocation] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  if (!isAddModalOpen) return null;

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      title: taskTitle.trim(),
      courseId: taskCourseId || undefined,
      dueDate: taskDueDate,
      estimatedMinutes: Number(taskMinutes) || 30,
      priority: taskPriority,
      category: taskCategory,
      notes: taskNotes.trim() || undefined,
      completed: false,
    });

    closeAddModal();
  };

  const handleSubmitEssay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayTitle.trim() || !essayCourseId) {
      alert('Please enter an essay title and select a course.');
      return;
    }

    const dueDateObj = new Date(essayDueDate);
    const m1Date = new Date(dueDateObj);
    m1Date.setDate(dueDateObj.getDate() - 14);
    const m2Date = new Date(dueDateObj);
    m2Date.setDate(dueDateObj.getDate() - 7);
    const m3Date = new Date(dueDateObj);
    m3Date.setDate(dueDateObj.getDate() - 3);

    addEssay({
      title: essayTitle.trim(),
      courseId: essayCourseId,
      dueDate: essayDueDate,
      targetWordCount: Number(essayWordCount) || 1500,
      currentWordCount: 0,
      citationStyle: essayCitation,
      prompt: essayPrompt.trim(),
      thesisStatement: essayThesis.trim() || undefined,
      status: 'not_started',
      milestones: [
        {
          id: `m-${Date.now()}-1`,
          title: 'Compile Annotated Bibliography & Sources',
          dueDate: m1Date.toISOString().split('T')[0],
          completed: false,
        },
        {
          id: `m-${Date.now()}-2`,
          title: 'Complete First Draft',
          dueDate: m2Date.toISOString().split('T')[0],
          completed: false,
        },
        {
          id: `m-${Date.now()}-3`,
          title: 'Peer Review & Workshop Revisions',
          dueDate: m3Date.toISOString().split('T')[0],
          completed: false,
        },
        {
          id: `m-${Date.now()}-4`,
          title: 'Final Proofread & Citations Check',
          dueDate: essayDueDate,
          completed: false,
        },
      ],
    });

    closeAddModal();
  };

  const handleSubmitTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testCourseId) {
      alert('Please enter an exam title and select a course.');
      return;
    }

    const topicsArray = testTopics
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addTest({
      title: testTitle.trim(),
      courseId: testCourseId,
      type: testType,
      date: testDate,
      startTime: testStartTime,
      endTime: testEndTime,
      location: testLocation.trim() || 'Main Campus',
      weightPercentage: Number(testWeight) || 20,
      topics: topicsArray.length > 0 ? topicsArray : ['Comprehensive syllabus topics'],
      studyChecklist: [
        { id: `sc-${Date.now()}-1`, text: 'Review past lecture slides & notes', completed: false },
        { id: `sc-${Date.now()}-2`, text: 'Solve past practice exam questions', completed: false },
        { id: `sc-${Date.now()}-3`, text: 'Prepare formula summary / cheat sheet', completed: false },
      ],
      reminderTiming: testReminderTiming,
      reminderCustomTime:
        testReminderTiming === 'custom' ? testReminderCustomTime : undefined,
      reminderDismissed: false,
    });

    closeAddModal();
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if (eventIsRecurring && eventRecurringDays.length === 0) {
      alert('Please choose at least one day of the week for the recurring class.');
      return;
    }

    addScheduleItem({
      title: eventTitle.trim(),
      courseId: eventCourseId || undefined,
      type: eventType,
      recurringDays: eventIsRecurring ? eventRecurringDays : undefined,
      date: eventIsRecurring ? undefined : eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      location: eventLocation.trim(),
      notes: eventNotes.trim() || undefined,
    });

    closeAddModal();
  };

  const toggleDayOfWeek = (dayNum: number) => {
    setEventRecurringDays(prev =>
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum].sort()
    );
  };

  const setPresetDays = (preset: 'MWF' | 'TR' | 'DAILY') => {
    if (preset === 'MWF') setEventRecurringDays([1, 3, 5]);
    if (preset === 'TR') setEventRecurringDays([2, 4]);
    if (preset === 'DAILY') setEventRecurringDays([1, 2, 3, 4, 5]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Add to creativv.cal</h2>
          <button
            onClick={closeAddModal}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-4 p-2 bg-slate-50 border-b border-slate-100 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('task')}
            className={`py-2 px-1 text-center font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'task'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
          <button
            onClick={() => setActiveTab('essay')}
            className={`py-2 px-1 text-center font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'essay'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Essay</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-2 px-1 text-center font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'test'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Exam</span>
          </button>
          <button
            onClick={() => setActiveTab('event')}
            className={`py-2 px-1 text-center font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'event'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Class / Schedule</span>
          </button>
        </div>

        {/* Tab Content & Form */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* TASK FORM WITH PRIORITIZATION */}
          {activeTab === 'task' && (
            <form onSubmit={handleSubmitTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Problem Set 5 on Eigenvalues"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Task Priority Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Priority Level * (Represented on Calendar)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'urgent' as TaskPriority, label: 'Urgent', color: 'border-rose-300 text-rose-800 bg-rose-50', active: 'ring-2 ring-rose-500 ring-offset-1 font-bold' },
                    { id: 'high' as TaskPriority, label: 'High', color: 'border-amber-300 text-amber-800 bg-amber-50', active: 'ring-2 ring-amber-500 ring-offset-1 font-bold' },
                    { id: 'medium' as TaskPriority, label: 'Medium', color: 'border-indigo-300 text-indigo-800 bg-indigo-50', active: 'ring-2 ring-indigo-500 ring-offset-1 font-bold' },
                    { id: 'low' as TaskPriority, label: 'Low', color: 'border-slate-300 text-slate-700 bg-slate-100', active: 'ring-2 ring-slate-500 ring-offset-1 font-bold' },
                  ].map(p => {
                    const isSelected = taskPriority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTaskPriority(p.id)}
                        className={`py-2 px-2 rounded-lg border text-xs text-center transition-all cursor-pointer ${p.color} ${
                          isSelected ? p.active : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course</label>
                  <select
                    value={taskCourseId}
                    onChange={e => setTaskCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">General (No Course)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value as TaskCategory)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="homework">Homework</option>
                    <option value="reading">Reading</option>
                    <option value="problem_set">Problem Set</option>
                    <option value="project">Project</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={taskMinutes}
                    onChange={e => setTaskMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Submission format, Gradescope link, tips..."
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Create Prioritized Assignment
              </button>
            </form>
          )}

          {/* ESSAY FORM */}
          {activeTab === 'essay' && (
            <form onSubmit={handleSubmitEssay} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Essay / Paper Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cognitive Biases in Neural Decision Architectures"
                  value={essayTitle}
                  onChange={e => setEssayTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course *</label>
                  <select
                    required
                    value={essayCourseId}
                    onChange={e => setEssayCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">Select Enrolled Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Final Due Date *</label>
                  <input
                    type="date"
                    required
                    value={essayDueDate}
                    onChange={e => setEssayDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Word Count</label>
                  <input
                    type="number"
                    min="250"
                    step="100"
                    value={essayWordCount}
                    onChange={e => setEssayWordCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Citation Format</label>
                  <select
                    value={essayCitation}
                    onChange={e => setEssayCitation(e.target.value as CitationFormat)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="APA 7">APA 7th Edition</option>
                    <option value="MLA 9">MLA 9th Edition</option>
                    <option value="Chicago">Chicago / Turabian</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Harvard">Harvard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prompt / Research Question</label>
                <textarea
                  rows={2}
                  placeholder="Paste professor's prompt or writing prompt here..."
                  value={essayPrompt}
                  onChange={e => setEssayPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Working Thesis (Optional)</label>
                <input
                  type="text"
                  placeholder="Your main argument or core claim..."
                  value={essayThesis}
                  onChange={e => setEssayThesis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Track Essay & Generate Milestones
              </button>
            </form>
          )}

          {/* EXAM FORM WITH EXAM REMINDERS */}
          {activeTab === 'test' && (
            <form onSubmit={handleSubmitTest} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Exam / Test Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 189 Midterm Exam 1"
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course *</label>
                  <select
                    required
                    value={testCourseId}
                    onChange={e => setTestCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">Select Enrolled Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Format Type</label>
                  <select
                    value={testType}
                    onChange={e => setTestType(e.target.value as ExamType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="midterm">Midterm Exam</option>
                    <option value="final">Final Exam</option>
                    <option value="quiz">Quiz</option>
                    <option value="practical">Lab Practical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={testDate}
                    onChange={e => setTestDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={testStartTime}
                    onChange={e => setTestStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={testEndTime}
                    onChange={e => setTestEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Exam Reminder Feature */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Set Exam Reminder</span>
                </div>

                <div className="space-y-2">
                  <select
                    value={testReminderTiming}
                    onChange={e => setTestReminderTiming(e.target.value as ExamReminderTiming)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800 font-medium"
                  >
                    {REMINDER_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {testReminderTiming === 'custom' && (
                    <div>
                      <label className="font-medium text-slate-600 block mb-1">
                        Select Exact Alert Date & Time:
                      </label>
                      <input
                        type="datetime-local"
                        required={testReminderTiming === 'custom'}
                        value={testReminderCustomTime}
                        onChange={e => setTestReminderCustomTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums text-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Wheeler 150"
                    value={testLocation}
                    onChange={e => setTestLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Weight (% of Grade)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={testWeight}
                    onChange={e => setTestWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Syllabus Topics (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Regularization, SVM Dual, Decision Trees"
                  value={testTopics}
                  onChange={e => setTestTopics(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Add Exam with Reminder to Radar
              </button>
            </form>
          )}

          {/* RECURRING CLASS / SCHEDULE FORM */}
          {activeTab === 'event' && (
            <form onSubmit={handleSubmitEvent} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Class / Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 189 Lecture: Neural Nets or Study Session"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course (Optional)</label>
                  <select
                    value={eventCourseId}
                    onChange={e => setEventCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">Personal / General</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Session Type</label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as ScheduleItemType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="discussion">Discussion Section</option>
                    <option value="seminar">Seminar / Workshop</option>
                    <option value="office_hours">Office Hours</option>
                    <option value="study_session">Study Group</option>
                    <option value="personal">Personal Event</option>
                  </select>
                </div>
              </div>

              {/* Recurring Class Schedule Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={eventIsRecurring}
                      onChange={e => setEventIsRecurring(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Recurring Class Schedule (Every Week)</span>
                  </label>

                  {eventIsRecurring && (
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-600">
                      <button type="button" onClick={() => setPresetDays('MWF')} className="hover:underline">
                        MWF
                      </button>
                      <span>·</span>
                      <button type="button" onClick={() => setPresetDays('TR')} className="hover:underline">
                        Tu/Th
                      </button>
                      <span>·</span>
                      <button type="button" onClick={() => setPresetDays('DAILY')} className="hover:underline">
                        M-F
                      </button>
                    </div>
                  )}
                </div>

                {eventIsRecurring ? (
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1.5">
                      Days of the Week *
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map(d => {
                        const isChecked = eventRecurringDays.includes(d.dayIndex);
                        return (
                          <button
                            key={d.dayIndex}
                            type="button"
                            onClick={() => toggleDayOfWeek(d.dayIndex)}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center ${
                              isChecked
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Specific Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={eventStartTime}
                    onChange={e => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={eventEndTime}
                    onChange={e => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Classroom / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Evans Hall 10 or Zoom link"
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {eventIsRecurring ? 'Add Recurring Class to Calendar' : 'Add Schedule Slot'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
