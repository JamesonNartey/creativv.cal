import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Course,
  ScheduleItem,
  EssayItem,
  TestItem,
  TaskItem,
  StudentProfile,
  MainNavTab,
  CalendarGranularity,
  ExamReminderTiming,
  AIDayPlan,
} from '../types';
import {
  INITIAL_COURSES,
  INITIAL_SCHEDULE,
  INITIAL_ESSAYS,
  INITIAL_TESTS,
  INITIAL_TASKS,
  INITIAL_STUDENT_PROFILE,
} from '../data/initialData';

interface FocusLog {
  id: string;
  courseId?: string;
  taskId?: string;
  durationMinutes: number;
  timestamp: string;
}

interface PlannerContextType {
  // Navigation & View State
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  calendarView: CalendarGranularity;
  setCalendarView: (view: CalendarGranularity) => void;
  selectedDate: string; // 'YYYY-MM-DD'
  setSelectedDate: (date: string) => void;
  selectedCourseFilter: string | null;
  setSelectedCourseFilter: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Student Profile
  profile: StudentProfile;
  updateProfile: (profile: Partial<StudentProfile>) => void;

  // Courses
  courses: Course[];
  addCourse: (course: Omit<Course, 'id'>) => Course;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourseById: (id?: string) => Course | undefined;

  // Schedule Items
  schedule: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => ScheduleItem;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;

  // Essays
  essays: EssayItem[];
  addEssay: (essay: Omit<EssayItem, 'id'>) => EssayItem;
  updateEssay: (id: string, essay: Partial<EssayItem>) => void;
  deleteEssay: (id: string) => void;
  updateEssayWordCount: (id: string, words: number) => void;
  toggleEssayMilestone: (essayId: string, milestoneId: string) => void;

  // Tests & Exams
  tests: TestItem[];
  addTest: (test: Omit<TestItem, 'id'>) => TestItem;
  updateTest: (id: string, test: Partial<TestItem>) => void;
  deleteTest: (id: string) => void;
  toggleStudyChecklist: (testId: string, checklistId: string) => void;
  updateTestReminder: (testId: string, reminderTiming: ExamReminderTiming, reminderCustomTime?: string) => void;
  dismissTestReminder: (testId: string) => void;

  // Tasks
  tasks: TaskItem[];
  addTask: (task: Omit<TaskItem, 'id'>) => TaskItem;
  updateTask: (id: string, task: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompleted: (id: string) => void;

  // Focus Timer
  focusLogs: FocusLog[];
  logFocusSession: (durationMinutes: number, courseId?: string, taskId?: string) => void;
  totalFocusMinutesToday: number;

  // Modal Triggers
  isAddModalOpen: boolean;
  openAddModal: (defaultTab?: 'event' | 'essay' | 'test' | 'task' | 'recurring_class') => void;
  closeAddModal: () => void;
  addModalDefaultTab: 'event' | 'essay' | 'test' | 'task' | 'recurring_class';

  isCourseManagerOpen: boolean;
  setIsCourseManagerOpen: (open: boolean) => void;

  isClassRoutineOpen: boolean;
  setIsClassRoutineOpen: (open: boolean) => void;

  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;

  // AI Day Breakdown Plans
  aiDayPlans: Record<string, AIDayPlan>;
  aiFocusAssignmentId: string | null;
  setAiFocusAssignmentId: (id: string | null) => void;
  openAIDayPlanForTask: (assignmentId: string) => void;
  saveAIDayPlan: (plan: AIDayPlan) => void;
  toggleAIStepCompleted: (date: string, stepId: string) => void;
  deleteAIStep: (date: string, stepId: string) => void;
  clearAIDayPlan: (date: string) => void;
  scheduleAIStepToCalendar: (date: string, stepId: string) => void;
  unscheduleAIStepFromCalendar: (date: string, stepId: string) => void;
  scheduleAllAIStepsToCalendar: (date: string) => void;

  // Data Management
  resetToSampleData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'creativv_cal_profile_v1',
  COURSES: 'creativv_cal_courses_v1',
  SCHEDULE: 'creativv_cal_schedule_v1',
  ESSAYS: 'creativv_cal_essays_v1',
  TESTS: 'creativv_cal_tests_v1',
  TASKS: 'creativv_cal_tasks_v1',
  FOCUS_LOGS: 'creativv_cal_focus_logs_v1',
  AI_DAY_PLANS: 'creativv_cal_ai_day_plans_v1',
};

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<MainNavTab>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarGranularity>('month');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-12');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState<'event' | 'essay' | 'test' | 'task' | 'recurring_class'>('task');
  const [isCourseManagerOpen, setIsCourseManagerOpen] = useState(false);
  const [isClassRoutineOpen, setIsClassRoutineOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [aiFocusAssignmentId, setAiFocusAssignmentId] = useState<string | null>(null);

  const [aiDayPlans, setAiDayPlans] = useState<Record<string, AIDayPlan>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AI_DAY_PLANS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Profile
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_STUDENT_PROFILE;
    } catch {
      return INITIAL_STUDENT_PROFILE;
    }
  });

  // Courses
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  // Schedule
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
    } catch {
      return INITIAL_SCHEDULE;
    }
  });

  // Essays
  const [essays, setEssays] = useState<EssayItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ESSAYS);
      return saved ? JSON.parse(saved) : INITIAL_ESSAYS;
    } catch {
      return INITIAL_ESSAYS;
    }
  });

  // Tests
  const [tests, setTests] = useState<TestItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TESTS);
      return saved ? JSON.parse(saved) : INITIAL_TESTS;
    } catch {
      return INITIAL_TESTS;
    }
  });

  // Tasks
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Focus Logs
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_LOGS);
      return saved ? JSON.parse(saved) : [
        { id: 'fl-1', durationMinutes: 50, timestamp: '2026-10-12T08:30:00Z', courseId: 'course-cs189' },
        { id: 'fl-2', durationMinutes: 25, timestamp: '2026-10-12T11:15:00Z', courseId: 'course-cogsci101' },
      ];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('Failed to save courses', e);
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
      console.warn('Failed to save schedule', e);
    }
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ESSAYS, JSON.stringify(essays));
    } catch (e) {
      console.warn('Failed to save essays', e);
    }
  }, [essays]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
    } catch (e) {
      console.warn('Failed to save tests', e);
    }
  }, [tests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_LOGS, JSON.stringify(focusLogs));
    } catch (e) {
      console.warn('Failed to save focus logs', e);
    }
  }, [focusLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_DAY_PLANS, JSON.stringify(aiDayPlans));
    } catch (e) {
      console.warn('Failed to save AI day plans', e);
    }
  }, [aiDayPlans]);

  // Profile actions
  const updateProfile = (data: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
  };

  // Course actions
  const addCourse = (courseData: Omit<Course, 'id'>): Course => {
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  };

  const updateCourse = (id: string, courseData: Partial<Course>) => {
    setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...courseData } : c)));
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    // Clean up course filter if current
    if (selectedCourseFilter === id) {
      setSelectedCourseFilter(null);
    }
  };

  const getCourseById = (id?: string) => {
    if (!id) return undefined;
    return courses.find(c => c.id === id);
  };

  // Schedule actions
  const addScheduleItem = (itemData: Omit<ScheduleItem, 'id'>): ScheduleItem => {
    const newItem: ScheduleItem = {
      ...itemData,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setSchedule(prev => [...prev, newItem]);
    return newItem;
  };

  const updateScheduleItem = (id: string, itemData: Partial<ScheduleItem>) => {
    setSchedule(prev => prev.map(item => (item.id === id ? { ...item, ...itemData } : item)));
  };

  const deleteScheduleItem = (id: string) => {
    setSchedule(prev => prev.filter(item => item.id !== id));
  };

  // Essay actions
  const addEssay = (essayData: Omit<EssayItem, 'id'>): EssayItem => {
    const newEssay: EssayItem = {
      ...essayData,
      id: `essay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setEssays(prev => [...prev, newEssay]);
    return newEssay;
  };

  const updateEssay = (id: string, essayData: Partial<EssayItem>) => {
    setEssays(prev => prev.map(essay => (essay.id === id ? { ...essay, ...essayData } : essay)));
  };

  const deleteEssay = (id: string) => {
    setEssays(prev => prev.filter(essay => essay.id !== id));
  };

  const updateEssayWordCount = (id: string, words: number) => {
    setEssays(prev =>
      prev.map(essay => {
        if (essay.id !== id) return essay;
        const validWords = Math.max(0, words);
        let newStatus = essay.status;
        if (validWords >= essay.targetWordCount && essay.status !== 'submitted') {
          newStatus = 'review';
        } else if (validWords > 0 && essay.status === 'not_started') {
          newStatus = 'drafting';
        }
        return {
          ...essay,
          currentWordCount: validWords,
          status: newStatus,
        };
      })
    );
  };

  const toggleEssayMilestone = (essayId: string, milestoneId: string) => {
    setEssays(prev =>
      prev.map(essay => {
        if (essay.id !== essayId) return essay;
        return {
          ...essay,
          milestones: essay.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ),
        };
      })
    );
  };

  // Tests actions
  const addTest = (testData: Omit<TestItem, 'id'>): TestItem => {
    const newTest: TestItem = {
      ...testData,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTests(prev => [...prev, newTest]);
    return newTest;
  };

  const updateTest = (id: string, testData: Partial<TestItem>) => {
    setTests(prev => prev.map(t => (t.id === id ? { ...t, ...testData } : t)));
  };

  const deleteTest = (id: string) => {
    setTests(prev => prev.filter(t => t.id !== id));
  };

  const toggleStudyChecklist = (testId: string, checklistId: string) => {
    setTests(prev =>
      prev.map(test => {
        if (test.id !== testId) return test;
        return {
          ...test,
          studyChecklist: test.studyChecklist.map(c =>
            c.id === checklistId ? { ...c, completed: !c.completed } : c
          ),
        };
      })
    );
  };

  const updateTestReminder = (testId: string, reminderTiming: ExamReminderTiming, reminderCustomTime?: string) => {
    setTests(prev =>
      prev.map(t => (t.id === testId ? { ...t, reminderTiming, reminderCustomTime, reminderDismissed: false } : t))
    );
  };

  const dismissTestReminder = (testId: string) => {
    setTests(prev =>
      prev.map(t => (t.id === testId ? { ...t, reminderDismissed: true } : t))
    );
  };

  // Task actions
  const addTask = (taskData: Omit<TaskItem, 'id'>): TaskItem => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, taskData: Partial<TaskItem>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...taskData } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const willComplete = !t.completed;
        return {
          ...t,
          completed: willComplete,
          completedAt: willComplete ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  // Focus actions
  const logFocusSession = (durationMinutes: number, courseId?: string, taskId?: string) => {
    const newLog: FocusLog = {
      id: `fl-${Date.now()}`,
      durationMinutes,
      timestamp: new Date().toISOString(),
      courseId,
      taskId,
    };
    setFocusLogs(prev => [newLog, ...prev]);
  };

  const totalFocusMinutesToday = useMemo(() => {
    // Current date prefix 'YYYY-MM-DD'
    const today = selectedDate || '2026-10-12';
    return focusLogs
      .filter(l => l.timestamp.startsWith(today))
      .reduce((sum, l) => sum + l.durationMinutes, 0);
  }, [focusLogs, selectedDate]);

  // Modal helpers
  const openAddModal = (tab: 'event' | 'essay' | 'test' | 'task' | 'recurring_class' = 'task') => {
    setAddModalDefaultTab(tab);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // AI Day Breakdown Actions
  const openAIDayPlanForTask = (assignmentId: string) => {
    setAiFocusAssignmentId(assignmentId);
    setActiveTab('ai_plan');
  };

  const saveAIDayPlan = (plan: AIDayPlan) => {
    setAiDayPlans(prev => ({
      ...prev,
      [plan.date]: plan,
    }));
  };

  const toggleAIStepCompleted = (date: string, stepId: string) => {
    setAiDayPlans(prev => {
      const plan = prev[date];
      if (!plan) return prev;
      return {
        ...prev,
        [date]: {
          ...plan,
          steps: plan.steps.map(s => (s.id === stepId ? { ...s, completed: !s.completed } : s)),
        },
      };
    });
  };

  const deleteAIStep = (date: string, stepId: string) => {
    const plan = aiDayPlans[date];
    const targetStep = plan?.steps.find(s => s.id === stepId);
    if (targetStep?.calendarScheduleId) {
      deleteScheduleItem(targetStep.calendarScheduleId);
    }
    setAiDayPlans(prev => {
      const currentPlan = prev[date];
      if (!currentPlan) return prev;
      return {
        ...prev,
        [date]: {
          ...currentPlan,
          steps: currentPlan.steps.filter(s => s.id !== stepId),
        },
      };
    });
  };

  const clearAIDayPlan = (date: string) => {
    const plan = aiDayPlans[date];
    if (plan) {
      const scheduledIds = new Set(
        plan.steps.map(s => s.calendarScheduleId).filter(Boolean) as string[]
      );
      if (scheduledIds.size > 0) {
        setSchedule(prev => prev.filter(item => !scheduledIds.has(item.id)));
      }
    }
    setAiDayPlans(prev => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  };

  const scheduleAIStepToCalendar = (date: string, stepId: string) => {
    const plan = aiDayPlans[date];
    const step = plan?.steps.find(s => s.id === stepId);
    if (!step || step.calendarScheduleId) return;

    const created = addScheduleItem({
      courseId: step.courseId,
      title: step.stepTitle,
      type: 'study_session',
      date,
      startTime: step.startTime,
      endTime: step.endTime,
      location: 'Study Session',
      notes: `AI Breakdown (${step.assignmentTitle}): ${step.description}`,
    });

    setAiDayPlans(prev => {
      const current = prev[date];
      if (!current) return prev;
      return {
        ...prev,
        [date]: {
          ...current,
          steps: current.steps.map(s =>
            s.id === stepId ? { ...s, calendarScheduleId: created.id } : s
          ),
        },
      };
    });
  };

  const unscheduleAIStepFromCalendar = (date: string, stepId: string) => {
    const plan = aiDayPlans[date];
    const step = plan?.steps.find(s => s.id === stepId);
    if (!step?.calendarScheduleId) return;

    deleteScheduleItem(step.calendarScheduleId);
    setAiDayPlans(prev => {
      const current = prev[date];
      if (!current) return prev;
      return {
        ...prev,
        [date]: {
          ...current,
          steps: current.steps.map(s =>
            s.id === stepId ? { ...s, calendarScheduleId: undefined } : s
          ),
        },
      };
    });
  };

  const scheduleAllAIStepsToCalendar = (date: string) => {
    const plan = aiDayPlans[date];
    if (!plan) return;

    const newScheduleItems: ScheduleItem[] = [];
    const updatedSteps = plan.steps.map(step => {
      if (step.calendarScheduleId) return step;
      const newId = `sch-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      newScheduleItems.push({
        id: newId,
        courseId: step.courseId,
        title: step.stepTitle,
        type: 'study_session',
        date,
        startTime: step.startTime,
        endTime: step.endTime,
        location: 'Study Session',
        notes: `AI Breakdown (${step.assignmentTitle}): ${step.description}`,
      });
      return { ...step, calendarScheduleId: newId };
    });

    if (newScheduleItems.length > 0) {
      setSchedule(prev => [...prev, ...newScheduleItems]);
      setAiDayPlans(prev => ({
        ...prev,
        [date]: {
          ...plan,
          steps: updatedSteps,
        },
      }));
    }
  };

  // Backup & Restore
  const resetToSampleData = () => {
    setProfile(INITIAL_STUDENT_PROFILE);
    setCourses(INITIAL_COURSES);
    setSchedule(INITIAL_SCHEDULE);
    setEssays(INITIAL_ESSAYS);
    setTests(INITIAL_TESTS);
    setTasks(INITIAL_TASKS);
    setAiDayPlans({});
    setSelectedCourseFilter(null);
  };

  const exportDataJSON = () => {
    const data = {
      profile,
      courses,
      schedule,
      essays,
      tests,
      tasks,
      focusLogs,
      aiDayPlans,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creativv-cal-backup-${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.courses && Array.isArray(parsed.courses)) {
        setCourses(parsed.courses);
      }
      if (parsed.schedule && Array.isArray(parsed.schedule)) {
        setSchedule(parsed.schedule);
      }
      if (parsed.essays && Array.isArray(parsed.essays)) {
        setEssays(parsed.essays);
      }
      if (parsed.tests && Array.isArray(parsed.tests)) {
        setTests(parsed.tests);
      }
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        setTasks(parsed.tasks);
      }
      if (parsed.profile) {
        setProfile(parsed.profile);
      }
      if (parsed.focusLogs && Array.isArray(parsed.focusLogs)) {
        setFocusLogs(parsed.focusLogs);
      }
      if (parsed.aiDayPlans && typeof parsed.aiDayPlans === 'object') {
        setAiDayPlans(parsed.aiDayPlans);
      }
      return true;
    } catch (err) {
      console.error('Invalid JSON file format', err);
      return false;
    }
  };

  return (
    <PlannerContext.Provider
      value={{
        activeTab,
        setActiveTab,
        calendarView,
        setCalendarView,
        selectedDate,
        setSelectedDate,
        selectedCourseFilter,
        setSelectedCourseFilter,
        searchQuery,
        setSearchQuery,
        profile,
        updateProfile,
        courses,
        addCourse,
        updateCourse,
        deleteCourse,
        getCourseById,
        schedule,
        addScheduleItem,
        updateScheduleItem,
        deleteScheduleItem,
        essays,
        addEssay,
        updateEssay,
        deleteEssay,
        updateEssayWordCount,
        toggleEssayMilestone,
        tests,
        addTest,
        updateTest,
        deleteTest,
        toggleStudyChecklist,
        updateTestReminder,
        dismissTestReminder,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompleted,
        focusLogs,
        logFocusSession,
        totalFocusMinutesToday,
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        addModalDefaultTab,
        isCourseManagerOpen,
        setIsCourseManagerOpen,
        isClassRoutineOpen,
        setIsClassRoutineOpen,
        isProfileOpen,
        setIsProfileOpen,
        aiDayPlans,
        aiFocusAssignmentId,
        setAiFocusAssignmentId,
        openAIDayPlanForTask,
        saveAIDayPlan,
        toggleAIStepCompleted,
        deleteAIStep,
        clearAIDayPlan,
        scheduleAIStepToCalendar,
        unscheduleAIStepFromCalendar,
        scheduleAllAIStepsToCalendar,
        resetToSampleData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
