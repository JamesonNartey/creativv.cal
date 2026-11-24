import React, { useState, useEffect, useRef } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Clock, BookOpen, Sparkles } from 'lucide-react';

export const FocusTimer: React.FC = () => {
  const { courses, tasks, essays, logFocusSession, focusLogs, totalFocusMinutesToday } = usePlanner();

  const [sessionMinutes, setSessionMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [soundscape, setSoundscape] = useState<'none' | 'brown_noise' | 'soft_rain'>('none');

  // Web Audio Context reference for zero-network ambient noise & completion chime
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Initialize or resume AudioContext
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play pleasant completion chime using Web Audio API
  const playCompletionChime = () => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.6); // G5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.8);
    } catch (e) {
      console.warn('AudioContext not permitted yet', e);
    }
  };

  // Ambient sound synthesis
  const startAmbientSound = (type: 'brown_noise' | 'soft_rain') => {
    stopAmbientSound();
    try {
      const ctx = getAudioContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (type === 'brown_noise') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // Gain compensation
        }
      } else {
        // Soft rain generator
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.15;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === 'brown_noise' ? 'lowpass' : 'bandpass';
      filter.frequency.value = type === 'brown_noise' ? 400 : 1200;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseNodeRef.current = noise;
    } catch (e) {
      console.warn('Ambient audio error', e);
    }
  };

  const stopAmbientSound = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as AudioScheduledSourceNode).stop();
      } catch {}
      noiseNodeRef.current = null;
    }
  };

  // Handle ambient sound toggle
  useEffect(() => {
    if (isActive && soundscape !== 'none') {
      startAmbientSound(soundscape);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [isActive, soundscape]);

  // Timer countdown loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      // Session finished!
      setIsActive(false);
      stopAmbientSound();
      playCompletionChime();
      logFocusSession(sessionMinutes, selectedCourseId || undefined, selectedTaskId || undefined);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, sessionMinutes, selectedCourseId, selectedTaskId]);

  const handleStart = () => {
    getAudioContext();
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    stopAmbientSound();
    setSecondsRemaining(sessionMinutes * 60);
  };

  const handleSetPreset = (mins: number) => {
    setIsActive(false);
    stopAmbientSound();
    setSessionMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.round(
    ((sessionMinutes * 60 - secondsRemaining) / (sessionMinutes * 60)) * 100
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span>Academic Focus Room</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lock in for focused study blocks with built-in ambient soundscapes and course attribution.
        </p>
      </div>

      {/* Main Focus Chamber */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs text-center space-y-6">
        {/* Preset Duration Buttons */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { label: '25m Pomodoro', mins: 25 },
            { label: '50m Deep Work', mins: 50 },
            { label: '15m Quick Review', mins: 15 },
            { label: '5m Break', mins: 5 },
          ].map(preset => (
            <button
              key={preset.mins}
              onClick={() => handleSetPreset(preset.mins)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                sessionMinutes === preset.mins
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Big Tabular Digits Display */}
        <div className="relative py-6">
          {isActive && (
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"
            />
          )}

          <div className="relative text-7xl sm:text-8xl font-mono tabular-nums font-bold tracking-tight text-slate-900 select-none">
            {formatTime(secondsRemaining)}
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2 block">
            {isActive ? 'Session in Progress' : 'Ready to Focus'}
          </span>

          {/* Clean linear progress meter */}
          <div className="max-w-md mx-auto w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-6">
            <motion.div
              className="bg-indigo-600 h-full rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>

          {isActive ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePause}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Pause className="w-5 h-5" />
              <span>Pause Focus</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Studying</span>
            </motion.button>
          )}
        </div>

        {/* Session Attribution & Ambient Audio Controls */}
        <div className="pt-6 border-t border-slate-100 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {/* Course Association */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Link Course
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="">General Study (No course)</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ambient Sound Generator */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Focus Soundscape
            </label>
            <select
              value={soundscape}
              onChange={e => setSoundscape(e.target.value as 'none' | 'brown_noise' | 'soft_rain')}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="none">Muted / Silence</option>
              <option value="brown_noise">Deep Brown Noise (Synthesized)</option>
              <option value="soft_rain">Library Rain Soundscape</option>
            </select>
          </div>
        </div>
      </div>

      {/* Focus History & Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Today's Study Log</span>
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            Total today: <strong className="text-indigo-700">{totalFocusMinutesToday} minutes</strong>
          </span>
        </div>

        {focusLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg">
            Complete your first study block to log focus minutes.
          </div>
        ) : (
          <div className="space-y-2">
            {focusLogs.slice(0, 5).map(log => {
              const course = courses.find(c => c.id === log.courseId);
              const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-slate-900 font-mono tabular-nums">
                      {log.durationMinutes} mins focused
                    </span>
                    {course && (
                      <span className="text-slate-500">
                        for <strong>{course.code}</strong>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono tabular-nums text-[11px]">
                    {timeFormatted}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
