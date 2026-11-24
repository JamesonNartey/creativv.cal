import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Course } from '../types';
import { X, Plus, Trash2, Edit2, BookOpen, Check } from 'lucide-react';

const PRESET_COLORS = [
  { hex: '#2563eb', bg: '#eff6ff', name: 'Blue' },
  { hex: '#7c3aed', bg: '#f5f3ff', name: 'Purple' },
  { hex: '#059669', bg: '#ecfdf5', name: 'Emerald' },
  { hex: '#d97706', bg: '#fffbeb', name: 'Amber' },
  { hex: '#e11d48', bg: '#fff1f2', name: 'Rose' },
  { hex: '#0891b2', bg: '#ecfeff', name: 'Cyan' },
  { hex: '#4f46e5', bg: '#eef2ff', name: 'Indigo' },
  { hex: '#c026d3', bg: '#fdf4ff', name: 'Fuchsia' },
];

export const CourseManagerModal: React.FC = () => {
  const {
    isCourseManagerOpen,
    setIsCourseManagerOpen,
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
  } = usePlanner();

  const [editingId, setEditingId] = useState<string | null>(null);

  // New course form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [credits, setCredits] = useState(4);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  if (!isCourseManagerOpen) return null;

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingId) {
      updateCourse(editingId, {
        code: code.trim(),
        name: name.trim(),
        instructor: instructor.trim(),
        room: room.trim(),
        credits: Number(credits) || 3,
        color: selectedColor.hex,
        bgLight: selectedColor.bg,
      });
      setEditingId(null);
    } else {
      addCourse({
        code: code.trim(),
        name: name.trim(),
        instructor: instructor.trim(),
        room: room.trim(),
        credits: Number(credits) || 3,
        color: selectedColor.hex,
        bgLight: selectedColor.bg,
      });
    }

    // Reset inputs
    setCode('');
    setName('');
    setInstructor('');
    setRoom('');
    setCredits(4);
    setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  };

  const handleEdit = (c: Course) => {
    setEditingId(c.id);
    setCode(c.code);
    setName(c.name);
    setInstructor(c.instructor);
    setRoom(c.room);
    setCredits(c.credits);
    const foundColor = PRESET_COLORS.find(col => col.hex === c.color) || PRESET_COLORS[0];
    setSelectedColor(foundColor);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setInstructor('');
    setRoom('');
    setCredits(4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Manage Enrolled Courses</h2>
          </div>
          <button
            onClick={() => setIsCourseManagerOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6 text-xs">
          {/* Add / Edit Form */}
          <form onSubmit={handleAddOrUpdate} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>{editingId ? 'Edit Course Details' : 'Enroll in New Course'}</span>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-slate-400 hover:text-slate-600 text-[11px] font-normal"
                >
                  Cancel edit
                </button>
              )}
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 189"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Machine Learning"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Instructor</label>
                <input
                  type="text"
                  placeholder="Prof. Efros"
                  value={instructor}
                  onChange={e => setInstructor(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Classroom</label>
                <input
                  type="text"
                  placeholder="Wheeler 150"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Units/Credits</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={credits}
                  onChange={e => setCredits(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Color selector */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Color Palette</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map(c => {
                  const isSelected = selectedColor.hex === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        isSelected ? 'scale-110 ring-2 ring-slate-900 ring-offset-1' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {editingId ? 'Update Course' : '+ Add Enrolled Course'}
            </button>
          </form>

          {/* Current Courses List */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block">
              Currently Enrolled ({courses.length})
            </span>

            <div className="space-y-2">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{course.code}</strong>
                        <span className="text-slate-600">— {course.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{course.instructor || 'Staff'}</span>
                        <span>·</span>
                        <span>{course.room || 'TBA'}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{course.credits} Credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(course)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit course"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${course.code}? This will not delete past schedule entries.`)) {
                          deleteCourse(course.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
