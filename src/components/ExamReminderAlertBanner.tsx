import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Bell, BellRing, X, ArrowRight, GraduationCap } from 'lucide-react';
import { triggerExamNotification } from '../utils/reminderUtils';

export const ExamReminderAlertBanner: React.FC = () => {
  const { tests, getCourseById, setActiveTab, dismissTestReminder } = usePlanner();

  // Find active upcoming exam with reminder
  const activeReminderTests = tests.filter(test => {
    if (test.reminderDismissed) return false;
    if (!test.reminderTiming || test.reminderTiming === 'none') return false;

    // Check if test date is upcoming (Oct 12, 2026 current date baseline)
    const today = new Date('2026-10-12');
    const examDate = new Date(`${test.date}T${test.startTime}:00`);
    const diffMs = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Display banner if within 5 days of exam
    return diffDays >= 0 && diffDays <= 7;
  });

  if (activeReminderTests.length === 0) return null;

  const currentTest = activeReminderTests[0];
  const course = getCourseById(currentTest.courseId);

  const handleTestAlert = () => {
    triggerExamNotification(
      currentTest.title,
      `Exam scheduled on ${currentTest.date} at ${currentTest.startTime} (${currentTest.location})`
    );
    alert(`🔔 Exam Reminder: "${currentTest.title}"\nDate: ${currentTest.date} (${currentTest.startTime} - ${currentTest.endTime})\nVenue: ${currentTest.location}\nWeight: ${currentTest.weightPercentage}% of final grade`);
  };

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2.5 border-b border-amber-600/30 text-xs shadow-xs transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-amber-600 text-white rounded-md shrink-0">
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
          </div>
          <div>
            <span className="font-bold">Exam Reminder: </span>
            <span>
              <strong>{currentTest.title}</strong> {course ? `(${course.code})` : ''} on{' '}
              <strong className="font-mono tabular-nums">{currentTest.date}</strong> at{' '}
              <strong className="font-mono tabular-nums">{currentTest.startTime}</strong> ({currentTest.location || 'Campus'}).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={handleTestAlert}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[11px] transition-colors cursor-pointer"
          >
            Preview Alert
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded font-semibold text-[11px] transition-colors cursor-pointer"
          >
            <span>View Exam & Checklist</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => dismissTestReminder(currentTest.id)}
            className="p-1 text-slate-800 hover:text-slate-950 rounded hover:bg-amber-400 transition-colors cursor-pointer"
            title="Dismiss this reminder alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
