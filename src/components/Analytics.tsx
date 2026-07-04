import {
  TrendingUp, CheckCircle2, Circle, Target, Clock, CalendarDays,
  Flame, BarChart3, Brain, ListTodo, Zap
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

export default function Analytics({ todos, events, notes }: Props) {
  const today = getToday();
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;
  const overdue = todos.filter(t => !t.completed && isOverdue(t.dueDate)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 30-day completion data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const completedByDay = last30Days.map(date => ({
    date,
    count: todos.filter(t => t.completed && t.dueDate === date).length,
    label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  }));
  const maxDayCount = Math.max(...completedByDay.map(d => d.count), 1);

  // Weekly completion (last 4 weeks)
  const thisWeek = completedByDay.slice(-7).reduce((s, d) => s + d.count, 0);
  const lastWeek = completedByDay.slice(-14, -7).reduce((s, d) => s + d.count, 0);

  // Streak
  let streak = 0;
  for (let i = todos.length - 1; i >= 0; i--) {
    if (todos[i].completed) streak++;
    else break;
  }

  // Tasks by priority
  const byPriority: Record<Priority, { active: number; done: number }> = {
    high: { active: 0, done: 0 },
    medium: { active: 0, done: 0 },
    low: { active: 0, done: 0 },
  };
  todos.forEach(t => {
    if (t.completed) byPriority[t.priority].done++;
    else byPriority[t.priority].active++;
  });

  const maxPriorityTotal = Math.max(
    ...Object.values(byPriority).map(p => p.active + p.done), 1
  );

  // Day of week productivity
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = dayNames.map((_, dayIndex) => {
    const count = todos.filter(t => {
      if (!t.completed) return false;
      const d = new Date(t.createdAt);
      return d.getDay() === dayIndex;
    }).length;
    return { day: dayNames[dayIndex], count };
  });
  const maxDay = Math.max(...byDay.map(d => d.count), 1);

  // Pomodoro sessions
  const pomodoroSessions = parseInt(localStorage.getItem('pomodoro_sessions') || '0');

  // Productivity score (weighted: completion rate * 0.5 + streak * 0.3 + weekly rate * 0.2)
  const maxStreak = 30;
  const streakScore = Math.min(streak / maxStreak, 1);
  const weeklyScore = Math.min(thisWeek / 21, 1);
  const productivityScore = Math.round((completionRate / 100 * 0.4 + streakScore * 0.35 + weeklyScore * 0.25) * 100);

  const getProductivityColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/40 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-200" />
            <h2 className="text-sm font-bold text-indigo-100 uppercase tracking-wider">Productivity Score</h2>
          </div>
          <span className="text-xs text-indigo-200">Today</span>
        </div>
        <div className="flex items-end gap-4">
          <span className="text-6xl font-extrabold">{productivityScore}</span>
          <span className="text-lg font-medium text-indigo-200 mb-1">/100</span>
        </div>
        <p className="text-sm text-indigo-200 mt-1">
          {productivityScore >= 70 ? "Great momentum! Keep it up!" :
           productivityScore >= 40 ? "You're making progress. Stay consistent!" :
           "Let's turn things around. Start with one small task."}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Done</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{completed}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">This Week</span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{thisWeek}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Streak</span>
          </div>
          <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{streak}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Pomodoros</span>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{pomodoroSessions}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 30-Day Activity */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">30-Day Completion</h3>
            <div className="flex-1" />
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> This week: {thisWeek}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Last: {lastWeek}</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1 h-32">
            {completedByDay.map((d, i) => {
              const isThisWeek = i >= completedByDay.length - 7;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full relative flex-1 flex items-end" style={{ minHeight: 20 }}>
                    <div
                      className={cn(
                        "w-full rounded-full transition-all duration-500",
                        isThisWeek
                          ? "bg-gradient-to-t from-indigo-500 to-violet-500 dark:from-indigo-500 dark:to-violet-400"
                          : "bg-slate-300 dark:bg-slate-600"
                      )}
                      style={{ height: `${Math.max((d.count / maxDayCount) * 100, 3)}%` }}
                    />
                  </div>
                  {(i % 5 === 0 || i === completedByDay.length - 1) && (
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                      {d.label.split(' ')[0]}
                    </span>
                  )}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {d.count} tasks · {d.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Rate Circle */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Completion Rate</h3>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width={160} height={160} className="-rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-700" />
                <circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="text-indigo-500 dark:text-indigo-400 transition-all duration-700"
                  style={{
                    strokeDasharray: 2 * Math.PI * 70,
                    strokeDashoffset: 2 * Math.PI * 70 * (1 - completionRate / 100),
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-200">{completionRate}%</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{completed}/{total} tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">By Priority</h3>
          </div>
          <div className="space-y-5">
            {(['high', 'medium', 'low'] as Priority[]).map(p => {
              const total = byPriority[p].active + byPriority[p].done;
              const pct = total > 0 ? Math.round((byPriority[p].done / total) * 100) : 0;
              return (
                <div key={p}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[p].bar)} />
                      <span className={cn("text-xs font-bold uppercase tracking-wider", PRIORITY_COLORS[p].text)}>{p}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{byPriority[p].done}</span>
                        /{total}
                      </span>
                      <span className={cn("text-xs font-bold w-10 text-right", pct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      className={cn("h-full rounded-l-full transition-all", PRIORITY_COLORS[p].bar)}
                      style={{ width: `${(byPriority[p].done / Math.max(total, 1)) * 100}%` }}
                    />
                    <div
                      className="h-full bg-slate-200 dark:bg-slate-600 transition-all"
                      style={{ width: `${(byPriority[p].active / Math.max(total, 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-emerald-500 font-medium">{byPriority[p].done} done</span>
                    <span className="text-[9px] text-slate-400 font-medium">{byPriority[p].active} active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day of Week */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Day of Week</h3>
          </div>
          <div className="space-y-3">
            {byDay.map(d => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">{d.day}</span>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-500 dark:to-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${(d.count / Math.max(maxDay, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Completion Rate</p>
            <p className={cn("text-lg font-bold", getProductivityColor(completionRate))}>{completionRate}%</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">vs. Last Week</p>
            <p className={cn("text-lg font-bold", thisWeek >= lastWeek ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {lastWeek > 0 ? `${Math.round(((thisWeek - lastWeek) / lastWeek) * 100)}%` : '—'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Avg / Day (30d)</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {(completedByDay.reduce((s, d) => s + d.count, 0) / 30).toFixed(1)}
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Active Tasks</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{active}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
