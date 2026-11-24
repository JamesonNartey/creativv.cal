import React, { useState, useRef, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  X,
  User,
  GraduationCap,
  Award,
  BookOpen,
  CheckSquare,
  Clock,
  Camera,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Check,
  Sparkles,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { PRESET_AVATARS, DEFAULT_AVATAR, AvatarPreset } from '../data/avatars';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AvatarTab = 'presets' | 'upload' | 'url' | 'monogram';

const MONOGRAM_PALETTES = [
  { id: 'indigo', name: 'Indigo Night', bg1: '#4f46e5', bg2: '#3730a3', text: '#ffffff' },
  { id: 'violet', name: 'Royal Violet', bg1: '#7c3aed', bg2: '#5b21b6', text: '#ffffff' },
  { id: 'emerald', name: 'Sage Emerald', bg1: '#059669', bg2: '#065f46', text: '#ffffff' },
  { id: 'rose', name: 'Sunset Rose', bg1: '#e11d48', bg2: '#9f1239', text: '#ffffff' },
  { id: 'amber', name: 'Warm Amber', bg1: '#d97706', bg2: '#92400e', text: '#ffffff' },
  { id: 'cyan', name: 'Electric Cyan', bg1: '#0891b2', bg2: '#155e75', text: '#ffffff' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, courses, tests, tasks, focusLogs } = usePlanner();

  const [name, setName] = useState(profile.name);
  const [major, setMajor] = useState(profile.major);
  const [university, setUniversity] = useState(profile.university);
  const [term, setTerm] = useState(profile.term);
  const [targetGPA, setTargetGPA] = useState(profile.targetGPA);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || DEFAULT_AVATAR);

  // Avatar editor section state
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [activeAvatarTab, setActiveAvatarTab] = useState<AvatarTab>('presets');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedMonogramPalette, setSelectedMonogramPalette] = useState('indigo');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setMajor(profile.major);
      setUniversity(profile.university);
      setTerm(profile.term);
      setTargetGPA(profile.targetGPA);
      setAvatarUrl(profile.avatarUrl || DEFAULT_AVATAR);
      setIsEditingAvatar(false);
      setUrlError(null);
      setUploadError(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // Extract initials from name
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'ST';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate SVG Data URI for Monogram Avatar
  const generateMonogramSvg = (paletteId: string, studentName: string) => {
    const palette = MONOGRAM_PALETTES.find(p => p.id === paletteId) || MONOGRAM_PALETTES[0];
    const initials = getInitials(studentName || 'Student');
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${palette.bg1}" />
            <stop offset="100%" stop-color="${palette.bg2}" />
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="128" fill="url(#grad)" />
        <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="96" fill="${palette.text}" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">
          ${initials}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  };

  // Client-side image resizing via Canvas for compact localStorage storage
  const processImageFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context unavailable');

          // Center crop (cover)
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDim, maxDim);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(resizedDataUrl);
        } catch (err) {
          console.error(err);
          setUploadError('Failed to process image. Try a smaller image.');
        }
      };
      img.onerror = () => {
        setUploadError('Could not load image file.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    setUrlError(null);
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setUrlError('Please enter an image URL');
      return;
    }
    // Verify image url loads
    const img = new Image();
    img.onload = () => {
      setAvatarUrl(trimmed);
      setCustomUrlInput('');
    };
    img.onerror = () => {
      setUrlError('Unable to load image from this URL. Please verify the link.');
    };
    img.src = trimmed;
  };

  const handleSelectMonogram = (paletteId: string) => {
    setSelectedMonogramPalette(paletteId);
    const svgUri = generateMonogramSvg(paletteId, name);
    setAvatarUrl(svgUri);
  };

  const handleResetToDefault = () => {
    setAvatarUrl(DEFAULT_AVATAR);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || profile.name,
      major: major.trim() || profile.major,
      university: university.trim() || profile.university,
      term: term.trim() || profile.term,
      targetGPA: targetGPA.trim() || profile.targetGPA,
      avatarUrl: avatarUrl || DEFAULT_AVATAR,
    });
    onClose();
  };

  const totalUnits = courses.reduce((sum, c) => sum + c.credits, 0);
  const totalTasksCompleted = tasks.filter(t => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Student Profile & Identity</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(92vh-120px)] space-y-6 text-xs">
          {/* Avatar and Academic Banner with Direct Photo Edit Trigger */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl || DEFAULT_AVATAR}
                alt={name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
                className="w-20 h-20 rounded-full object-cover ring-3 ring-indigo-500/40 shadow-sm bg-white"
              />
              <button
                type="button"
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute inset-0 rounded-full bg-slate-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer backdrop-blur-[2px]"
                title="Change student profile picture"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold">Change</span>
              </button>
              {/* Camera icon badge in corner */}
              <button
                type="button"
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                title="Change profile photo"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">{name}</h3>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                  {term}
                </span>
              </div>
              <p className="text-slate-600 font-medium truncate mt-0.5">{major}</p>
              <p className="text-slate-400 text-[11px] truncate">{university}</p>

              <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isEditingAvatar
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>{isEditingAvatar ? 'Close Photo Editor' : 'Edit Profile Picture'}</span>
                </button>

                {avatarUrl !== DEFAULT_AVATAR && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors cursor-pointer"
                    title="Reset to default picture"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Profile Picture Customizer Panel */}
          {isEditingAvatar && (
            <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Choose or Upload Profile Picture
                </span>
                <span className="text-[11px] text-slate-400">Live preview active</span>
              </div>

              {/* Sub-tabs for Photo Source */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveAvatarTab('presets')}
                  className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activeAvatarTab === 'presets'
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Presets</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAvatarTab('upload')}
                  className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activeAvatarTab === 'upload'
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAvatarTab('monogram')}
                  className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activeAvatarTab === 'monogram'
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3 h-3" />
                  <span className="hidden sm:inline">Initials</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAvatarTab('url')}
                  className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activeAvatarTab === 'url'
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Web Link</span>
                </button>
              </div>

              {/* Tab 1: Student Presets */}
              {activeAvatarTab === 'presets' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-500 block">
                    Choose one of the academic student avatars:
                  </span>
                  <div className="grid grid-cols-5 gap-2.5">
                    {PRESET_AVATARS.map((preset: AvatarPreset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={`group flex flex-col items-center p-1.5 rounded-xl border transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="relative mb-1">
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200 group-hover:scale-105 transition-transform"
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                            {preset.name}
                          </span>
                          <span className="text-[9px] text-slate-400 truncate w-full">
                            {preset.roleHint.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Upload Photo */}
              {activeAvatarTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-indigo-600 bg-indigo-50/60'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        Click or drag a photo here to upload
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        JPG, PNG, or WebP. Automatically cropped and optimized for fast local storage.
                      </span>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                  />

                  {uploadError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px]">
                      {uploadError}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Initials Monogram */}
              {activeAvatarTab === 'monogram' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-500 block">
                    Choose a color theme for your initials badge ({getInitials(name)}):
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {MONOGRAM_PALETTES.map((p) => {
                      const isSelected = selectedMonogramPalette === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectMonogram(p.id)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                            style={{
                              background: `linear-gradient(135deg, ${p.bg1}, ${p.bg2})`,
                            }}
                          >
                            {getInitials(name)}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-700 truncate w-full text-center">
                            {p.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Web Image URL */}
              {activeAvatarTab === 'url' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-500 block">
                    Enter the URL of any online picture or profile photo:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={customUrlInput}
                      onChange={(e) => {
                        setCustomUrlInput(e.target.value);
                        setUrlError(null);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {urlError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px]">
                      {urlError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Academic Snapshot Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Units</span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900">{totalUnits}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target GPA</span>
              <span className="text-base font-bold font-mono tabular-nums text-indigo-600">{targetGPA}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Exams</span>
              <span className="text-base font-bold font-mono tabular-nums text-rose-600">{tests.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tasks Done</span>
              <span className="text-base font-bold font-mono tabular-nums text-emerald-600">{totalTasksCompleted}</span>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <span className="font-bold text-slate-800 block text-xs">
              Academic Credentials
            </span>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Declared Major / Minor</label>
              <input
                type="text"
                value={major}
                onChange={e => setMajor(e.target.value)}
                placeholder="e.g. Cognitive Science & Computer Science"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">University / College</label>
                <input
                  type="text"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="e.g. UC Berkeley"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Current Term</label>
                <input
                  type="text"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Semester GPA</label>
              <input
                type="text"
                value={targetGPA}
                onChange={e => setTargetGPA(e.target.value)}
                placeholder="e.g. 3.92"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 font-mono tabular-nums text-slate-900"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
