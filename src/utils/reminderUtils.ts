import { TestItem, ExamReminderTiming } from '../types';

export const REMINDER_OPTIONS: { id: ExamReminderTiming; label: string; offsetMinutes: number }[] = [
  { id: 'none', label: 'No Reminder', offsetMinutes: 0 },
  { id: '1_hour', label: '1 hour before exam', offsetMinutes: 60 },
  { id: '2_hours', label: '2 hours before exam', offsetMinutes: 120 },
  { id: '1_day', label: '1 day before exam', offsetMinutes: 1440 },
  { id: '2_days', label: '2 days before exam', offsetMinutes: 2880 },
  { id: '3_days', label: '3 days before exam', offsetMinutes: 4320 },
  { id: '1_week', label: '1 week before exam', offsetMinutes: 10080 },
  { id: 'custom', label: 'Specific Date & Time...', offsetMinutes: 0 },
];

/**
 * Calculates the exact reminder timestamp (Date object) for an exam
 */
export function calculateReminderDate(test: TestItem): Date | null {
  if (!test.reminderTiming || test.reminderTiming === 'none') {
    return null;
  }

  if (test.reminderTiming === 'custom' && test.reminderCustomTime) {
    return new Date(test.reminderCustomTime);
  }

  const option = REMINDER_OPTIONS.find(o => o.id === test.reminderTiming);
  if (!option || option.offsetMinutes === 0) return null;

  // Exam start datetime
  const examDateTimeStr = `${test.date}T${test.startTime}:00`;
  const examDate = new Date(examDateTimeStr);

  // Subtract offset
  return new Date(examDate.getTime() - option.offsetMinutes * 60 * 1000);
}

/**
 * Formats a user-friendly label for the reminder
 */
export function formatReminderLabel(test: TestItem): string {
  if (!test.reminderTiming || test.reminderTiming === 'none') {
    return 'No reminder set';
  }

  if (test.reminderTiming === 'custom' && test.reminderCustomTime) {
    try {
      const d = new Date(test.reminderCustomTime);
      return `Custom: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Custom reminder';
    }
  }

  const option = REMINDER_OPTIONS.find(o => o.id === test.reminderTiming);
  return option ? option.label : 'Reminder active';
}

/**
 * Trigger an in-app or browser notification
 */
export function triggerExamNotification(testTitle: string, message: string) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(`creativv.cal Exam Reminder: ${testTitle}`, {
        body: message,
        icon: '/favicon.ico',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`creativv.cal Exam Reminder: ${testTitle}`, {
            body: message,
            icon: '/favicon.ico',
          });
        }
      });
    }
  }
}
