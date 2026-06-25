import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, CheckCircle2, Circle, ClipboardList,
  Eye, EyeOff, ChevronDown, ChevronRight, CalendarDays, AlertTriangle,
  Timer, Play, Pause, RotateCcw
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getToday, formatDateLabel, isOverdue } from '../utils/dates';
import type { Todo, Priority } from '../types';

interface Props {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}

const PRIORITIES: { key: Priority; label: string; color: string; dot: string }[] = [
  { key: 'high', label: 'High', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  { key: 'medium', label: 'Medium', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  { key: 'low', label: 'Low', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
];

const TIMER_OPTIONS = [
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '30 min', value: 1800 },
  { label: '1 hr', value: 3600 },
];

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getRemaining(todo: Todo): number | null {
  const dur = todo.timerDuration ?? null;
  if (dur === null) return null;
  const elapsed = todo.timerElapsed ?? 0;
  if (todo.timerStartedAt != null) {
    return Math.max(0, dur - elapsed - (Date.now() - todo.timerStartedAt) / 1000);
  }
  return Math.max(0, dur - elapsed);
}

function TimerDisplay({ todo, setTodos }: { todo: Todo; setTodos: React.Dispatch<React.SetStateAction<Todo[]>> }) {
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remaining = todo.timerDuration !== null ? getRemaining(todo) : null;

  useEffect(() => {
    if (todo.timerStartedAt !== null && (remaining ?? 0) > 0) {
      intervalRef.current = setInterval(() => forceUpdate(c => c + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [todo.timerStartedAt, todo.id, todo.timerDuration, todo.timerElapsed]);

  if (todo.timerDuration === null) return null;

  const isFinished = remaining !== null && remaining <= 0;
  const isRunning = todo.timerStartedAt !== null && !isFinished;

  const start = () => {
    setTodos(prev => prev.map(t =>
      t.id === todo.id ? { ...t, timerStartedAt: Date.now() } : t
    ));
  };

  const pause = () => {
    setTodos(prev => prev.map(t => {
      if (t.id !== todo.id) return t;
      const elapsed = t.timerElapsed + (Date.now() - (t.timerStartedAt ?? Date.now())) / 1000;
      return { ...t, timerStartedAt: null, timerElapsed: elapsed };
    }));
  };

  const reset = () => {
    setTodos(prev => prev.map(t =>
      t.id === todo.id ? { ...t, timerStartedAt: null, timerElapsed: 0 } : t
    ));
  };

  const displayTime = remaining !== null ? formatTimer(remaining) : formatTimer(todo.timerDuration);

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-mono font-bold tabular-nums",
      isFinished ? "text-red-500 dark:text-red-400" : isRunning ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
    )}>
      {isFinished ? (
        <span className="flex items-center gap-1">
          <Timer className="w-3 h-3" /> 00:00
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <Timer className={cn("w-3 h-3", isRunning && "animate-pulse")} />
          {displayTime}
        </span>
      )}
      <div className="flex items-center gap-0.5 ml-1">
        {!isFinished && !isRunning && remaining! > 0 && (
          <button onClick={start} className="p-0.5 hover:text-indigo-500 transition-colors" title="Start timer">
            <Play className="w-3 h-3" />
          </button>
        )}
        {isRunning && (
          <button onClick={pause} className="p-0.5 hover:text-amber-500 transition-colors" title="Pause timer">
            <Pause className="w-3 h-3" />
          </button>
        )}
        {!isRunning && remaining! > 0 && remaining !== todo.timerDuration && (
          <button onClick={reset} className="p-0.5 hover:text-red-500 transition-colors" title="Reset timer">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
        {isFinished && (
          <button onClick={reset} className="p-0.5 hover:text-indigo-500 transition-colors" title="Reset timer">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function TodoList({ todos, setTodos }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [dueDate, setDueDate] = useState(getToday());
  const [priority, setPriority] = useState<Priority>('medium');
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState('');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDate || getToday(),
      priority,
      tags,
      timerDuration: timerMinutes > 0 ? timerMinutes * 60 : null,
      timerStartedAt: null,
      timerElapsed: 0,
    };

    setTodos(prev => [newTodo, ...prev]);
    setInputValue('');
    setTagInput('');
    setTimerMinutes(0);
    setShowTimerPicker(false);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed));
  };

  const toggleCollapse = (date: string) => {
    setCollapsedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // filter & group
  const visible = hideCompleted ? todos.filter(t => !t.completed) : todos;

  const grouped: Record<string, Todo[]> = {};
  visible.forEach(t => {
    const key = t.dueDate;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const today = getToday();
    if (a < today && b >= today) return -1;
    if (b < today && a >= today) return 1;
    return a.localeCompare(b);
  });

  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  const sortByPriority = (a: Todo, b: Todo) => priorityOrder[a.priority] - priorityOrder[b.priority];

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;
  const overdueCount = todos.filter(t => !t.completed && isOverdue(t.dueDate)).length;

  const getPriorityStyle = (p: Priority | undefined) => PRIORITIES.find(pr => pr.key === (p ?? 'medium'))!;

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/50 p-2 border border-slate-100 dark:border-slate-700">
        <form onSubmit={addTodo} className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-1 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-5 py-3.5 text-base bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">
            <div className="relative flex items-center">
              <CalendarDays className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all text-slate-900 dark:text-slate-200"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Priority & Timer row */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
          {/* Priority */}
          <div className="flex items-center gap-1">
            {PRIORITIES.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPriority(p.key)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all",
                  priority === p.key
                    ? p.color + " ring-1 ring-slate-300 dark:ring-slate-500"
                    : "text-slate-400 dark:text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

          {/* Timer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTimerPicker(s => !s)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all",
                showTimerPicker || timerMinutes > 0
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 ring-1 ring-slate-300 dark:ring-slate-500"
                  : "text-slate-400 dark:text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
            >
              <Timer className="w-3 h-3" />
              {timerMinutes > 0 ? `${timerMinutes} min` : 'Timer'}
            </button>
            {showTimerPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-2 min-w-[200px]">
                <div className="flex flex-wrap gap-1 mb-2">
                  {TIMER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setTimerMinutes(opt.value / 60); setShowTimerPicker(false); }}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all",
                        timerMinutes === opt.value / 60
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                          : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={timerMinutes || ''}
                    onChange={e => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Custom"
                    className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg outline-none text-slate-900 dark:text-slate-200 placeholder:text-slate-400"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">min</span>
                </div>
                {timerMinutes > 0 && (
                  <button
                    type="button"
                    onClick={() => { setTimerMinutes(0); setShowTimerPicker(false); }}
                    className="mt-1.5 w-full text-[10px] text-red-500 hover:text-red-600 font-medium text-center"
                  >
                    Remove timer
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add tags (comma-separated)"
                className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-indigo-300 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-slate-200 placeholder:text-slate-400"
              />
              {tagInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            {activeCount} active
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {overdueCount} overdue
            </span>
          )}
          {completedCount > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
              {completedCount} done
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideCompleted(h => !h)}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-all",
              hideCompleted
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideCompleted ? 'Hidden' : 'Hide'} completed
          </button>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              Clear done
            </button>
          )}
        </div>
      </div>

      {/* Grouped List */}
      {sortedDates.length > 0 ? (
        <div className="space-y-5">
          {sortedDates.map(date => {
            const items = grouped[date];
            const collapsed = collapsedDates.has(date);
            const overdue = isOverdue(date);
            const isToday = date === getToday();
            const completedInGroup = items.filter(t => t.completed).length;

            return (
              <div key={date}>
                {/* Date header */}
                <button
                  onClick={() => toggleCollapse(date)}
                  className="flex items-center gap-2 w-full text-left mb-2 px-1 group"
                >
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-bold uppercase tracking-wider",
                      overdue && !isToday ? "text-red-500 dark:text-red-400" : isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {formatDateLabel(date)}
                  </span>
                  {overdue && !isToday && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 dark:text-red-500" />
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {completedInGroup}/{items.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700 ml-2" />
                </button>

                {/* Items */}
                {!collapsed && (
                  <div className="space-y-2 ml-1">
                    {items
                      .sort((a, b) => Number(a.completed) - Number(b.completed))
                      .sort((a, b) => {
                        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
                        return sortByPriority(a, b);
                      })
                      .map(todo => {
                        const pr = getPriorityStyle(todo.priority);
                        const hasTimer = todo.timerDuration !== null;

                        return (
                          <div
                            key={todo.id}
                            className={cn(
                              "group flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border transition-all hover:shadow-md dark:hover:shadow-slate-900/50",
                              todo.completed
                                ? "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700"
                                : overdue && !isToday
                                ? "border-red-100 dark:border-red-900/50 hover:border-red-200 dark:hover:border-red-700"
                                : "border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-800"
                            )}
                          >
                            <button
                              onClick={() => toggleTodo(todo.id)}
                              className={cn(
                                "flex-shrink-0 transition-colors focus:outline-none",
                                todo.completed
                                  ? "text-emerald-500"
                                  : "text-slate-300 dark:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-400"
                              )}
                            >
                              {todo.completed ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : (
                                <Circle className="w-6 h-6" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", pr.dot)} title={todo.priority} />
                                <span
                                  className={cn(
                                    "text-[15px] font-medium transition-all truncate",
                                    todo.completed
                                      ? "text-slate-400 dark:text-slate-500 line-through"
                                      : "text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  {todo.text}
                                </span>
                                {(todo.tags ?? []).length > 0 && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {(todo.tags ?? []).map(tag => (
                                      <span key={tag} className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {hasTimer && !todo.completed && (
                                  <TimerDisplay todo={todo} setTodos={setTodos} />
                                )}
                                {hasTimer && todo.completed && (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                                    <Timer className="w-3 h-3" />
                                    {formatTimer(todo.timerDuration!)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all outline-none"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-slate-50 dark:bg-slate-700/50 rounded-full">
            <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium">
            {hideCompleted
              ? "All tasks are completed! Toggle visibility to see them."
              : "Your task list is empty. Start adding some tasks!"}
          </p>
        </div>
      )}
    </div>
  );
}
