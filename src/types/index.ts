export interface Course {
  id: string;
  code: string; // e.g. "COGSCI 101"
  name: string; // e.g. "Introduction to Cognitive Neuroscience"
  instructor: string;
  room: string;
  color: string; // hex color e.g. "#6366f1"
  bgLight: string; // Tailwind-friendly or rgba
  credits: number;
}

export type ScheduleItemType = 'lecture' | 'lab' | 'seminar' | 'discussion' | 'office_hours' | 'study_session' | 'personal';

export interface ScheduleItem {
  id: string;
  courseId?: string;
  title: string;
  type: ScheduleItemType;
  // If recurring weekly: days of week 0 = Sun, 1 = Mon ... 6 = Sat
  recurringDays?: number[];
  // If specific single event:
  date?: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm', 24hr format e.g. '10:00'
  endTime: string; // 'HH:mm', 24hr format e.g. '11:30'
  location: string;
  notes?: string;
}

export interface EssayMilestone {
  id: string;
  title: string;
  dueDate: string; // 'YYYY-MM-DD'
  completed: boolean;
}

export type CitationFormat = 'APA 7' | 'MLA 9' | 'Chicago' | 'IEEE' | 'Harvard';
export type EssayStatus = 'not_started' | 'outline' | 'drafting' | 'review' | 'submitted';

export interface EssayItem {
  id: string;
  courseId: string;
  title: string;
  dueDate: string; // 'YYYY-MM-DD'
  targetWordCount: number;
  currentWordCount: number;
  citationStyle: CitationFormat;
  prompt: string;
  thesisStatement?: string;
  milestones: EssayMilestone[];
  notes?: string;
  status: EssayStatus;
}

export type ExamType = 'midterm' | 'final' | 'quiz' | 'practical';

export interface StudyChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ExamReminderTiming =
  | 'none'
  | '1_hour'
  | '2_hours'
  | '1_day'
  | '2_days'
  | '3_days'
  | '1_week'
  | 'custom';

export interface TestItem {
  id: string;
  courseId: string;
  title: string;
  type: ExamType;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // '14:00'
  endTime: string; // '16:00'
  location: string;
  weightPercentage: number; // e.g. 25
  topics: string[];
  studyChecklist: StudyChecklistItem[];
  notes?: string;
  reminderTiming?: ExamReminderTiming;
  reminderCustomTime?: string; // 'YYYY-MM-DDTHH:mm'
  reminderDismissed?: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'homework' | 'reading' | 'problem_set' | 'project' | 'lab_report' | 'admin';

export interface TaskItem {
  id: string;
  courseId?: string;
  title: string;
  dueDate: string; // 'YYYY-MM-DD'
  estimatedMinutes: number;
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface StudentProfile {
  name: string;
  major: string;
  university: string;
  term: string; // "Fall 2026"
  targetGPA: string;
  avatarUrl?: string;
}

export type AIPacePreference = 'balanced' | 'morning_focus' | 'pomodoro_sprints' | 'evening_sprint';

export interface AIDayStep {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId?: string;
  courseCode: string;
  stepTitle: string;
  description: string;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  durationMinutes: number;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  priority: TaskPriority;
  focusTip?: string;
  completed: boolean;
  calendarScheduleId?: string;
}

export interface AIDayPlan {
  date: string; // 'YYYY-MM-DD'
  generatedAt: string;
  pacePreference: AIPacePreference;
  studyWindowStart: string;
  studyWindowEnd: string;
  dailyStrategySummary: string;
  steps: AIDayStep[];
}

export type MainNavTab = 'calendar' | 'timetable' | 'essays' | 'tests' | 'tasks' | 'ai_plan' | 'focus';
export type CalendarGranularity = 'month' | 'week' | 'day';

