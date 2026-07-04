import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Timer, Sparkles, ListTodo, Clock } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Todo } from '../types';

interface Props {
  todo: Todo | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onComplete: (id: string) => void;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function FocusMode({ todo, onClose, onUpdate, onComplete }: Props) {
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showQuote, setShowQuote] = useState(true);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (todo) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [todo, onClose]);

  useEffect(() => {
    if (todo?.timerStartedAt != null) {
      intervalRef.current = setInterval(() => forceUpdate(c => c + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [todo?.timerStartedAt, todo?.id]);

  useEffect(() => {
    const t = setTimeout(() => setShowQuote(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!todo) return null;

  const dur = todo.timerDuration ?? 0;
  const elapsed = todo.timerElapsed ?? 0;
  const remaining = todo.timerStartedAt != null
    ? Math.max(0, dur - elapsed - (Date.now() - todo.timerStartedAt) / 1000)
    : Math.max(0, dur - elapsed);
  const isFinished = dur > 0 && remaining <= 0;
  const isRunning = todo.timerStartedAt != null && !isFinished;
  const hasTimer = todo.timerDuration != null;
  const progress = hasTimer && dur > 0 ? 1 - remaining / dur : 0;

  const start = () => onUpdate(todo.id, { timerStartedAt: Date.now() });
  const pause = () => {
    const newElapsed = elapsed + (Date.now() - (todo.timerStartedAt ?? Date.now())) / 1000;
    onUpdate(todo.id, { timerStartedAt: null, timerElapsed: newElapsed });
  };
  const reset = () => onUpdate(todo.id, { timerStartedAt: null, timerElapsed: 0 });

  const quotes = [
    'The secret of getting ahead is getting started.',
    'Focus on being productive instead of busy.',
    'Do the hard jobs first. The easy jobs will take care of themselves.',
    'Start where you are. Use what you have. Do what you can.',
    'The way to get started is to quit talking and begin doing.',
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  const circumference = 2 * Math.PI * 130;
  const offset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center" onClick={onClose}>
      {/* Background sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-indigo-300">Focus Mode</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition-all"
            title="Exit (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task info */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            {hasTimer && (
              <span className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
                isRunning
                  ? "bg-indigo-500/20 text-indigo-300"
                  : isFinished
                  ? "bg-red-500/20 text-red-300"
                  : "bg-slate-700/50 text-slate-400"
              )}>
                <Timer className="w-3 h-3" />
                {hasTimer ? `${Math.round(dur / 60)} min` : 'No timer'}
              </span>
            )}
            <span className={cn(
              "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
              todo.priority === 'high' ? "bg-red-500/20 text-red-300" :
              todo.priority === 'medium' ? "bg-amber-500/20 text-amber-300" :
              "bg-emerald-500/20 text-emerald-300"
            )}>
              <ListTodo className="w-3 h-3" />
              {todo.priority}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            {todo.text}
          </h1>
        </div>

        {/* Timer display */}
        {hasTimer && (
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <svg className="w-72 h-72 -rotate-90" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r="130" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                <circle
                  cx="150" cy="150" r="130"
                  fill="none" strokeWidth="6"
                  strokeLinecap="round"
                  className="transition-all duration-300 drop-shadow-lg"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: offset,
                    stroke: isFinished ? '#ef4444' : isRunning ? '#818cf8' : '#475569',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  "text-6xl sm:text-7xl font-extrabold tabular-nums tracking-tight",
                  isFinished ? "text-red-400" : isRunning ? "text-white" : "text-slate-300"
                )}>
                  {formatTimer(isFinished ? 0 : remaining)}
                </span>
                <span className="text-sm text-slate-500 mt-2 font-medium">
                  {isRunning ? 'Focusing...' : isFinished ? 'Time is up!' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={reset}
                disabled={!hasTimer}
                className="p-3 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition-all disabled:opacity-30"
                title="Reset timer"
              >
                <RotateCcw className="w-6 h-6" />
              </button>

              {!isRunning ? (
                <button
                  onClick={start}
                  disabled={isFinished}
                  className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 rounded-full transition-all active:scale-95 shadow-2xl shadow-indigo-500/30 disabled:opacity-50"
                  title={isFinished ? 'Timer complete' : 'Start'}
                >
                  <Play className="w-9 h-9 text-white ml-1" />
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex items-center justify-center w-20 h-20 bg-white/10 hover:bg-white/20 border-2 border-indigo-400/50 rounded-full transition-all active:scale-95"
                  title="Pause"
                >
                  <Pause className="w-9 h-9 text-white" />
                </button>
              )}

              <button
                onClick={() => onComplete(todo.id)}
                className="p-3 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                title="Mark complete"
              >
                <CheckCircle2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {!hasTimer && (
          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="p-6 bg-white/5 rounded-full">
              <Clock className="w-16 h-16 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg font-medium">No timer set for this task</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdate(todo.id, { timerDuration: 600, timerElapsed: 0, timerStartedAt: null })}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-300 text-sm font-semibold rounded-xl hover:bg-indigo-500/30 transition-all"
              >
                Start 10 min Timer
              </button>
              <button
                onClick={() => onUpdate(todo.id, { timerDuration: 1500, timerElapsed: 0, timerStartedAt: null })}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-300 text-sm font-semibold rounded-xl hover:bg-indigo-500/30 transition-all"
              >
                Start 25 min Timer
              </button>
              <button
                onClick={() => onComplete(todo.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-300 text-sm font-semibold rounded-xl hover:bg-emerald-500/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete
              </button>
            </div>
          </div>
        )}

        {/* Motivational quote */}
        {showQuote && (
          <div className="text-center animate-slide-up">
            <p className="text-sm text-slate-500 italic">"{quote}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
