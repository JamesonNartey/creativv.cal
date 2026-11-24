import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const LoadingScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'initial' | 'zoom' | 'done'>('initial');

  useEffect(() => {
    // Phase 1: Logo display & pulse (1.2s)
    const t1 = setTimeout(() => {
      setPhase('zoom');
    }, 1200);

    // Phase 2: Zoom in and dissolve into the app (0.6s)
    const t2 = setTimeout(() => {
      setPhase('done');
      onFinish();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="loading-screen"
        initial={{ opacity: 1 }}
        animate={{
          opacity: phase === 'zoom' ? 0 : 1,
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d16] text-white overflow-hidden pointer-events-auto"
      >
        {/* Ambient background glow */}
        <motion.div
          animate={{
            scale: phase === 'zoom' ? 2.5 : [1, 1.2, 1],
            opacity: phase === 'zoom' ? 0 : [0.15, 0.28, 0.15],
          }}
          transition={{
            duration: phase === 'zoom' ? 0.6 : 2.5,
            repeat: phase === 'zoom' ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"
        />

        {/* The Inverted Logo with Zoom-In */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 10 }}
          animate={
            phase === 'zoom'
              ? {
                  scale: 3.2,
                  opacity: 0,
                  filter: 'blur(8px)',
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                }
              : {
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                }
          }
          className="relative z-10 flex flex-col items-center"
        >
          {/* Logo Text Lockup: Inverted Colors (White on Obsidian Dark) */}
          <div className="flex items-baseline gap-1 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight select-none">
            <span className="text-white drop-shadow-sm">creativv</span>
            <span className="text-indigo-400 drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]">.cal</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: phase === 'zoom' ? 0 : 0.7, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-2 mt-3"
          >
            <span className="text-[11px] font-semibold tracking-widest uppercase text-indigo-300">
              Student Academic OS
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">Fall 2026</span>
          </motion.div>

          {/* Minimalist loading progress bar line */}
          <div className="w-36 h-[2px] bg-slate-800 rounded-full overflow-hidden mt-6">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.1,
                ease: 'easeInOut',
                repeat: phase === 'zoom' ? 0 : Infinity,
              }}
              className="w-full h-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
            />
          </div>
        </motion.div>

        {/* Skip button in corner */}
        <button
          onClick={() => {
            setPhase('done');
            onFinish();
          }}
          className="absolute bottom-6 text-[11px] text-slate-500 hover:text-slate-300 font-mono transition-colors tracking-wide px-3 py-1 rounded cursor-pointer"
        >
          Press to Skip
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
