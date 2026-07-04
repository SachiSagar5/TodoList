import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, Settings, Coffee, Brain, PartyPopper,
  Minus, Plus, ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';

type Phase = 'work' | 'shortBreak' | 'longBreak';

const DEFAULT_WORK = 25;
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;
const POMODOROS_BEFORE_LONG_BREAK = 4;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playNotification() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const ctx2 = new AudioContext();
      const osc2 = ctx2.createOscillator();
      const gain2 = ctx2.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx2.destination);
      osc2.frequency.value = 880;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx2.currentTime + 0.3);
    }, 200);
  } catch {
    // Audio not available
  }
}

export default function Pomodoro() {
  const [phase, setPhase] = useState<Phase>('work');
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(DEFAULT_SHORT_BREAK);
  const [longBreakMinutes, setLongBreakMinutes] = useState(DEFAULT_LONG_BREAK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDuration = phase === 'work'
    ? workMinutes * 60
    : phase === 'shortBreak'
    ? shortBreakMinutes * 60
    : longBreakMinutes * 60;

  const progress = 1 - timeLeft / currentDuration;
  const phaseLabel = phase === 'work' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break';
  const isFinished = timeLeft <= 0 && !isRunning;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setIsRunning(true);
  }, [clearTimer]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    const dur = phase === 'work'
      ? workMinutes * 60
      : phase === 'shortBreak'
      ? shortBreakMinutes * 60
      : longBreakMinutes * 60;
    setTimeLeft(dur);
  }, [phase, workMinutes, shortBreakMinutes, longBreakMinutes, clearTimer]);

  const skipToNext = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    if (phase === 'work') {
      setCompletedPomodoros(prev => prev + 1);
      const totalCompleted = completedPomodoros + 1;
      if (totalCompleted % POMODOROS_BEFORE_LONG_BREAK === 0) {
        setPhase('longBreak');
        setTimeLeft(longBreakMinutes * 60);
      } else {
        setPhase('shortBreak');
        setTimeLeft(shortBreakMinutes * 60);
      }
    } else {
      setPhase('work');
      setTimeLeft(workMinutes * 60);
    }
  }, [phase, completedPomodoros, workMinutes, shortBreakMinutes, longBreakMinutes, clearTimer]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            playNotification();
            if (phase === 'work') {
              setCompletedPomodoros(p => {
                const n = p + 1;
                if (n % POMODOROS_BEFORE_LONG_BREAK === 0) {
                  setPhase('longBreak');
                  setTimeLeft(longBreakMinutes * 60);
                } else {
                  setPhase('shortBreak');
                  setTimeLeft(shortBreakMinutes * 60);
                }
                return n;
              });
            } else {
              setPhase('work');
              setTimeLeft(workMinutes * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [isRunning, phase, workMinutes, shortBreakMinutes, longBreakMinutes, clearTimer]);

  useEffect(() => {
    if (!isRunning && timeLeft <= 0) {
      // already handled in the interval
    }
  }, [timeLeft, isRunning]);

  const changeWork = (delta: number) => {
    const next = Math.max(1, Math.min(120, workMinutes + delta));
    setWorkMinutes(next);
    if (phase === 'work') {
      setTimeLeft(next * 60);
      setIsRunning(false);
      clearTimer();
    }
  };

  const changeShortBreak = (delta: number) => {
    const next = Math.max(1, Math.min(60, shortBreakMinutes + delta));
    setShortBreakMinutes(next);
    if (phase === 'shortBreak') {
      setTimeLeft(next * 60);
      setIsRunning(false);
      clearTimer();
    }
  };

  const changeLongBreak = (delta: number) => {
    const next = Math.max(1, Math.min(60, longBreakMinutes + delta));
    setLongBreakMinutes(next);
    if (phase === 'longBreak') {
      setTimeLeft(next * 60);
      setIsRunning(false);
      clearTimer();
    }
  };

  const trackColor = phase === 'work'
    ? 'stroke-indigo-200 dark:stroke-indigo-800'
    : phase === 'shortBreak'
    ? 'stroke-emerald-200 dark:stroke-emerald-800'
    : 'stroke-amber-200 dark:stroke-amber-800';

  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - progress);

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Phase indicator */}
      <div className="flex items-center justify-center gap-3">
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border",
          phase === 'work'
            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700"
            : phase === 'shortBreak'
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
            : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
        )}>
          {phase === 'work' ? <Brain className="w-4 h-4" /> : phase === 'shortBreak' ? <Coffee className="w-4 h-4" /> : <PartyPopper className="w-4 h-4" />}
          {phaseLabel}
        </div>
      </div>

      {/* Timer circle */}
      <div className="relative flex items-center justify-center">
        <svg className="w-56 sm:w-64 h-56 sm:h-64 -rotate-90 max-w-full" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            strokeWidth="8"
            className={trackColor}
          />
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(
              "drop-shadow-lg transition-all duration-300",
              isFinished ? "stroke-red-500" : `stroke-[url(#gradient)]`
            )}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={cn("stop-color", phase === 'work' ? 'text-indigo-500' : phase === 'shortBreak' ? 'text-emerald-500' : 'text-amber-500')} />
              <stop offset="100%" className={cn("stop-color", phase === 'work' ? 'text-violet-500' : phase === 'shortBreak' ? 'text-teal-500' : 'text-orange-500')} />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-5xl font-extrabold tabular-nums tracking-tight",
            isFinished
              ? "text-red-500 dark:text-red-400"
              : phase === 'work'
              ? "text-slate-800 dark:text-slate-200"
              : "text-slate-800 dark:text-slate-200"
          )}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            {isRunning ? 'Running...' : isFinished ? (phase === 'work' ? 'Time for a break!' : 'Ready to focus!') : 'Paused'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={resetTimer}
          className="p-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {!isRunning ? (
          <button
            onClick={startTimer}
            disabled={isFinished}
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-full transition-all active:scale-95 shadow-lg",
              phase === 'work'
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200/60 dark:shadow-indigo-900/40"
                : phase === 'shortBreak'
                ? "bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200/60 dark:shadow-emerald-900/40"
                : "bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-200/60 dark:shadow-amber-900/40",
              isFinished && "opacity-50 cursor-not-allowed"
            )}
            title={isFinished ? 'Session complete!' : 'Start'}
          >
            <Play className="w-7 h-7 text-white ml-0.5" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-full transition-all active:scale-95 shadow-lg",
              "bg-white dark:bg-slate-700 border-2",
              phase === 'work'
                ? "border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : phase === 'shortBreak'
                ? "border-emerald-300 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400"
            )}
            title="Pause"
          >
            <Pause className="w-7 h-7" />
          </button>
        )}

        <button
          onClick={skipToNext}
          className="p-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          title="Skip to next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Pomodoro count & Settings toggle */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-full">
          <Brain className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-bold text-slate-600 dark:text-slate-400">x{completedPomodoros}</span>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
            showSettings
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          )}
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Timer Durations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <DurationControl label="Focus" value={workMinutes} onChange={changeWork} color="indigo" />
            <DurationControl label="Short Break" value={shortBreakMinutes} onChange={changeShortBreak} color="emerald" />
            <DurationControl label="Long Break" value={longBreakMinutes} onChange={changeLongBreak} color="amber" />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          Every 4 pomodoros you'll get a long break.<br />
          Stay focused and productive!
        </p>
      </div>
    </div>
  );
}

function DurationControl({ label, value, onChange, color }: {
  label: string;
  value: number;
  onChange: (delta: number) => void;
  color: 'indigo' | 'emerald' | 'amber';
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(-1)}
          className={cn(
            "p-1 rounded-lg transition-colors",
            color === 'indigo' ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" :
            color === 'emerald' ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" :
            "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          )}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-10 text-center text-lg font-bold text-slate-700 dark:text-slate-300 tabular-nums">{value}</span>
        <button
          onClick={() => onChange(1)}
          className={cn(
            "p-1 rounded-lg transition-colors",
            color === 'indigo' ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" :
            color === 'emerald' ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" :
            "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
