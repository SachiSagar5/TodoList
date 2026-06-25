import {
  CheckCircle2, Circle, AlertTriangle, CalendarDays, StickyNote,
  TrendingUp, ListTodo, Timer, BarChart3, Target, Clock
} from 'lucide-react';
import { cn } from '../utils/cn';
import { isOverdue, getToday } from '../utils/dates';
import type { Todo, PlannerEvent, Note, Priority } from '../types';

interface Props {
  todos: Todo[];
  events: PlannerEvent[];
  notes: Note[];
}

const PRIORITY_COLORS: Record<Priority, { bar: string; text: string; bg: string }> = {
  high: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  medium: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  low: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
};

function CircularProgress({ value, size = 120, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-100 dark:text-slate-700" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-indigo-500 dark:text-indigo-400 transition-all duration-700" />
    </svg>
  );
}

export default function Dashboard({ todos, events, notes }: Props) {
  const today = getToday();
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const overdueTasks = todos.filter(t => !t.completed && isOverdue(t.dueDate)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const todayEvents = events.filter(e => e.date === today).length;

  const byPriority: Record<Priority, number> = { high: 0, medium: 0, low: 0 };
  todos.filter(t => !t.completed).forEach(t => byPriority[t.priority]++);
  const maxPriority = Math.max(...Object.values(byPriority), 1);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const completedByDay = last7Days.map(date => ({
    date,
    count: todos.filter(t => t.completed && t.dueDate === date).length,
    label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
  }));
  const maxDayCount = Math.max(...completedByDay.map(d => d.count), 1);

  const pomodoroSessions = parseInt(localStorage.getItem('pomodoro_sessions') || '0');

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{totalTasks}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Done</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedTasks}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <Circle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{activeTasks}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue</span>
          </div>
          <p className={cn("text-3xl font-extrabold", overdueTasks > 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200")}>{overdueTasks}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Completion Rate</h3>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <CircularProgress value={completionRate} size={140} strokeWidth={10} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{completionRate}%</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Active by Priority</h3>
          </div>
          <div className="space-y-4">
            {(['high', 'medium', 'low'] as Priority[]).map(p => (
              <div key={p}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("text-xs font-bold uppercase tracking-wider", PRIORITY_COLORS[p].text)}>{p}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{byPriority[p]}</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", PRIORITY_COLORS[p].bar)}
                    style={{ width: `${(byPriority[p] / maxPriority) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 7-Day Activity */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Last 7 Days</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-28">
            {completedByDay.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{d.count || ''}</span>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full relative flex-1 flex items-end" style={{ minHeight: 32 }}>
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-violet-500 dark:from-indigo-500 dark:to-violet-400 rounded-full transition-all duration-700"
                    style={{ height: `${Math.max((d.count / maxDayCount) * 100, 4)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Overview</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Today's Events</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{todayEvents}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <StickyNote className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Notes</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{notes.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Pomodoro Sessions</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{pomodoroSessions}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span>
              </div>
              <span className={cn("text-sm font-bold", completionRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>{completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags Cloud */}
      {todos.length > 0 && (
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const counts: Record<string, number> = {};
              todos.forEach(t => (t.tags ?? []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; }));
              return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                  {tag}
                  <span className="text-[10px] text-indigo-400 dark:text-indigo-500">({count})</span>
                </span>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
