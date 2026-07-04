import React, { useState, useEffect, useRef } from 'react';
import { Plus, ListTodo, CalendarDays, X, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { getToday } from '../utils/dates';
import type { Todo, Priority } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (todo: Todo) => void;
}

const PRIORITIES: { key: Priority; label: string; dot: string }[] = [
  { key: 'high', label: 'High', dot: 'bg-red-500' },
  { key: 'medium', label: 'Medium', dot: 'bg-amber-500' },
  { key: 'low', label: 'Low', dot: 'bg-emerald-500' },
];

export default function QuickAdd({ open, onClose, onAdd }: Props) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState(getToday());
  const [priority, setPriority] = useState<Priority>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setText('');
      setDueDate(getToday());
      setPriority('medium');
    }
  }, [open]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDate || getToday(),
      priority,
      tags: [],
      timerDuration: null,
      timerStartedAt: null,
      timerElapsed: 0,
      sortOrder: 0,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Quick Add Task</span>
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200"
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[140px]">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all text-slate-900 dark:text-slate-200"
                />
              </div>
              <div className="flex items-center gap-1">
                {PRIORITIES.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-lg border transition-all",
                      priority === p.key
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                        : "text-slate-400 dark:text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 pb-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </form>
        <div className="px-4 pb-3">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Tip: Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">Q</kbd> to open this anytime
          </p>
        </div>
      </div>
    </div>
  );
}
