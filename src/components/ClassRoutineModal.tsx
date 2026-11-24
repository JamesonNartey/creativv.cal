import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { ScheduleItem, ScheduleItemType } from '../types';
import { X, Plus, Trash2, Edit2, Clock, MapPin, Calendar, Check, BookOpen } from 'lucide-react';

const DAYS_OF_WEEK = [
  { dayIndex: 1, label: 'Mon', full: 'Monday' },
  { dayIndex: 2, label: 'Tue', full: 'Tuesday' },
  { dayIndex: 3, label: 'Wed', full: 'Wednesday' },
  { dayIndex: 4, label: 'Thu', full: 'Thursday' },
  { dayIndex: 5, label: 'Fri', full: 'Friday' },
  { dayIndex: 6, label: 'Sat', full: 'Saturday' },
  { dayIndex: 0, label: 'Sun', full: 'Sunday' },
];

export const ClassRoutineModal: React.FC = () => {
  const {
    isClassRoutineOpen,
    setIsClassRoutineOpen,
    schedule,
    courses,
    getCourseById,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
  } = usePlanner();

  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [className, setClassName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState<ScheduleItemType>('lecture');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Default Mon, Wed, Fri
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  if (!isClassRoutineOpen) return null;

  // Filter only recurring classes/schedules
  const recurringClasses = schedule.filter(s => s.recurringDays && s.recurringDays.length > 0);

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const setPresetDays = (preset: 'MWF' | 'TR' | 'DAILY') => {
    if (preset === 'MWF') setSelectedDays([1, 3, 5]);
    if (preset === 'TR') setSelectedDays([2, 4]);
    if (preset === 'DAILY') setSelectedDays([1, 2, 3, 4, 5]);
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setClassName(item.title);
    setCourseId(item.courseId || '');
    setType(item.type);
    setSelectedDays(item.recurringDays || [1, 3, 5]);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setLocation(item.location || '');
    setNotes(item.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setClassName('');
    setCourseId('');
    setType('lecture');
    setSelectedDays([1, 3, 5]);
    setStartTime('10:00');
    setEndTime('11:00');
    setLocation('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      alert('Please enter a class name.');
      return;
    }
    if (selectedDays.length === 0) {
      alert('Please select at least one day of the week.');
      return;
    }

    if (editingId) {
      updateScheduleItem(editingId, {
        title: className.trim(),
        courseId: courseId || undefined,
        type,
        recurringDays: selectedDays,
        startTime,
        endTime,
        location: location.trim(),
        notes: notes.trim() || undefined,
      });
      setEditingId(null);
    } else {
      addScheduleItem({
        title: className.trim(),
        courseId: courseId || undefined,
        type,
        recurringDays: selectedDays,
        startTime,
        endTime,
        location: location.trim(),
        notes: notes.trim() || undefined,
      });
    }

    handleCancelEdit();
  };

  // Calculate total weekly hours in class
  const totalWeeklyMinutes = recurringClasses.reduce((sum, item) => {
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    const daysCount = item.recurringDays?.length || 1;
    return sum + (Math.max(0, duration) * daysCount);
  }, 0);

  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Recurring Class Schedules & Weekly Routine
            </h2>
          </div>
          <button
            onClick={() => setIsClassRoutineOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6 text-xs">
          {/* Top summary info */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl flex items-center justify-between">
            <span className="text-indigo-900 font-medium">
              Active Weekly Schedule: <strong className="font-mono tabular-nums">{recurringClasses.length} recurring courses/blocks</strong>
            </span>
            <span className="text-indigo-700 font-mono tabular-nums font-semibold">
              {totalWeeklyHours} hrs/week
            </span>
          </div>

          {/* Form: Add or Edit Class */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">
                {editingId ? 'Edit Recurring Class' : 'Add New Recurring Class'}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Cancel editing
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Class / Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 189 Lecture: Neural Nets"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Enrolled Course (Optional)
                </label>
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">No Course (General)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Days of the Week Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 block">
                  Days of the Week *
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setPresetDays('MWF')}
                    className="hover:underline cursor-pointer"
                  >
                    MWF
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setPresetDays('TR')}
                    className="hover:underline cursor-pointer"
                  >
                    Tue/Thu
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setPresetDays('DAILY')}
                    className="hover:underline cursor-pointer"
                  >
                    Mon–Fri
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {DAYS_OF_WEEK.map(d => {
                  const isChecked = selectedDays.includes(d.dayIndex);
                  return (
                    <button
                      key={d.dayIndex}
                      type="button"
                      onClick={() => toggleDay(d.dayIndex)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                        isChecked
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time & Class Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Class Type
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as ScheduleItemType)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="lecture">Lecture</option>
                  <option value="lab">Lab</option>
                  <option value="discussion">Discussion</option>
                  <option value="seminar">Seminar</option>
                  <option value="office_hours">Office Hours</option>
                  <option value="study_session">Study Group</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Classroom / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wheeler Hall 150"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discussion questions released Tuesdays"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {editingId ? 'Save Class Schedule Changes' : '+ Add Recurring Class to Calendar'}
            </button>
          </form>

          {/* Current Recurring Classes List */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 block">
              Active Recurring Classes ({recurringClasses.length})
            </span>

            {recurringClasses.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No recurring classes set yet. Add your lectures, labs, or seminars above.
              </div>
            ) : (
              <div className="space-y-2">
                {recurringClasses.map(item => {
                  const course = getCourseById(item.courseId);
                  const dayNames = item.recurringDays
                    ?.map(d => DAYS_OF_WEEK.find(dw => dw.dayIndex === d)?.label)
                    .join(' / ');

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: course?.color || '#6366f1' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{item.title}</span>
                            {course && (
                              <span className="text-[11px] text-slate-500 font-medium">({course.code})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                            <span className="font-semibold text-indigo-700">{dayNames}</span>
                            <span>·</span>
                            <span className="font-mono tabular-nums">{item.startTime} – {item.endTime}</span>
                            {item.location && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{item.location}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit recurring class"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${item.title}" from recurring schedule?`)) {
                              deleteScheduleItem(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
