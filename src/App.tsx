import React, { useState } from 'react';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { EssaysView } from './components/EssaysView';
import { TestsView } from './components/TestsView';
import { TasksView } from './components/TasksView';
import { AIDayBreakdownView } from './components/AIDayBreakdownView';
import { FocusTimer } from './components/FocusTimer';
import { AddItemModal } from './components/AddItemModal';
import { CourseManagerModal } from './components/CourseManagerModal';
import { ProfileModal } from './components/ProfileModal';
import { ClassRoutineModal } from './components/ClassRoutineModal';
import { ExamReminderAlertBanner } from './components/ExamReminderAlertBanner';
import { LoadingScreen } from './components/LoadingScreen';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    selectedCourseFilter,
    setSelectedCourseFilter,
    getCourseById,
    isProfileOpen,
    setIsProfileOpen,
  } = usePlanner();

  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const activeCourse = getCourseById(selectedCourseFilter || undefined);

  return (
    <>
      {/* Cinematic Inverted Color Logo Zoom-In Loading Screen */}
      {showLoadingScreen && (
        <LoadingScreen onFinish={() => setShowLoadingScreen(false)} />
      )}

      {/* Main App Container with Zoom-In Entrance Reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{
          opacity: showLoadingScreen ? 0 : 1,
          scale: showLoadingScreen ? 0.98 : 1,
        }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white"
      >
        {/* Exam Reminder Alert Banner */}
        <ExamReminderAlertBanner />

        {/* 3-Zone Top Navigation Contract */}
        <Navbar onOpenProfile={() => setIsProfileOpen(true)} />

        {/* Main Workspace Frame */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Active Filter or Search Banner if active */}
          {(searchQuery || selectedCourseFilter) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Filtering by:{' '}
                  {selectedCourseFilter && (
                    <strong>Course: {activeCourse?.code || selectedCourseFilter} </strong>
                  )}
                  {searchQuery && (
                    <span>
                      Query: "<strong>{searchQuery}</strong>"
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCourseFilter(null);
                }}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear filters</span>
              </button>
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Sidebar with Intro Replay trigger */}
            <div className="w-full lg:w-72 shrink-0 space-y-4">
              <Sidebar />

              {/* Replay intro animation button */}
              <div className="text-center pt-1">
                <button
                  onClick={() => setShowLoadingScreen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                  title="Watch the intro zoom animation again"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Replay Intro Animation</span>
                </button>
              </div>
            </div>

            {/* Active View Container with Tab Smooth Transition */}
            <div className="flex-1 w-full min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === 'calendar' && <CalendarView />}
                  {activeTab === 'timetable' && <CalendarView />}
                  {activeTab === 'essays' && <EssaysView />}
                  {activeTab === 'tests' && <TestsView />}
                  {activeTab === 'tasks' && <TasksView />}
                  {activeTab === 'ai_plan' && <AIDayBreakdownView />}
                  {activeTab === 'focus' && <FocusTimer />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Modals */}
        <AddItemModal />
        <CourseManagerModal />
        <ClassRoutineModal />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </motion.div>
    </>
  );
};

export default function App() {
  return (
    <PlannerProvider>
      <MainContent />
    </PlannerProvider>
  );
}
