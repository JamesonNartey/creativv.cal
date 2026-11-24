import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { MainNavTab } from '../types';
import { Plus, Search, Calendar, BookOpen, GraduationCap, CheckSquare, Clock, LayoutGrid, Sparkles } from 'lucide-react';
import { DEFAULT_AVATAR } from '../data/avatars';

export const Navbar: React.FC<{ onOpenProfile: () => void }> = ({ onOpenProfile }) => {
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    searchQuery,
    setSearchQuery,
    profile,
  } = usePlanner();

  const navItems: { id: MainNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'timetable', label: 'Schedule', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'essays', label: 'Essays', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tests', label: 'Exams', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'ai_plan', label: 'AI Plan', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'focus', label: 'Focus', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <span>creativv</span>
              <span className="text-indigo-600">.cal</span>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded px-1.5 py-0.5 ml-1">
                STUDENT OS
              </span>
            </button>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap shrink-0 rounded-lg cursor-pointer ${
                    isActive
                      ? 'text-indigo-700 bg-indigo-50/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Search, Profile & 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Global Search Bar */}
            <div className="relative hidden sm:block w-48 lg:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search schedule, essays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-transparent focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
              />
            </div>

            {/* Profile Avatar trigger */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left group cursor-pointer"
              title={`${profile.name} · ${profile.term} (Click to edit profile & photo)`}
            >
              <img
                src={profile.avatarUrl || DEFAULT_AVATAR}
                alt={profile.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/50 transition-all bg-white"
              />
              <span className="hidden xl:inline text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-[90px]">
                {profile.name.split(' ')[0]}
              </span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => openAddModal('task')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 -mx-4 px-4 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg ${
                  isActive
                    ? 'text-indigo-700 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
