import React, { useState } from 'react';
import {
  Plus, Trash2, CheckCircle2, Circle, ClipboardList,
  Eye, EyeOff, ChevronDown, ChevronRight, CalendarDays, AlertTriangle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getToday, formatDateLabel, isOverdue } from '../utils/dates';
import type { Todo } from '../types';

interface Props {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}

export default function TodoList({ todos, setTodos }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [dueDate, setDueDate] = useState(getToday());
  const [hideCompleted, setHideCompleted] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDate || getToday(),
    };

    setTodos(prev => [newTodo, ...prev]);
    setInputValue('');
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
    // Overdue first, then today, then future
    const today = getToday();
    if (a < today && b >= today) return -1;
    if (b < today && a >= today) return 1;
    return a.localeCompare(b);
  });

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;
  const overdueCount = todos.filter(t => !t.completed && isOverdue(t.dueDate)).length;

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 p-2 border border-slate-100">
        <form onSubmit={addTodo} className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-1 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-5 py-3.5 text-base bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">
            <div className="relative flex items-center">
              <CalendarDays className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
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
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            {activeCount} active
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {overdueCount} overdue
            </span>
          )}
          {completedCount > 0 && (
            <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
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
                ? "bg-amber-50 text-amber-600"
                : "bg-slate-100 text-slate-500 hover:text-slate-700"
            )}
          >
            {hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideCompleted ? 'Hidden' : 'Hide'} completed
          </button>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
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
                  className={cn(
                    "flex items-center gap-2 w-full text-left mb-2 px-1 group",
                  )}
                >
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-bold uppercase tracking-wider",
                      overdue && !isToday ? "text-red-500" : isToday ? "text-indigo-600" : "text-slate-400"
                    )}
                  >
                    {formatDateLabel(date)}
                  </span>
                  {overdue && !isToday && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {completedInGroup}/{items.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-100 ml-2" />
                </button>

                {/* Items */}
                {!collapsed && (
                  <div className="space-y-2 ml-1">
                    {items
                      .sort((a, b) => Number(a.completed) - Number(b.completed))
                      .map(todo => (
                        <div
                          key={todo.id}
                          className={cn(
                            "group flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border transition-all hover:shadow-md",
                            todo.completed
                              ? "bg-slate-50/60 border-slate-100"
                              : overdue && !isToday
                              ? "border-red-100 hover:border-red-200"
                              : "border-slate-100 hover:border-indigo-100"
                          )}
                        >
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className={cn(
                              "flex-shrink-0 transition-colors focus:outline-none",
                              todo.completed
                                ? "text-emerald-500"
                                : "text-slate-300 hover:text-indigo-400"
                            )}
                          >
                            {todo.completed ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>

                          <span
                            className={cn(
                              "flex-1 text-[15px] font-medium transition-all",
                              todo.completed
                                ? "text-slate-400 line-through"
                                : "text-slate-700"
                            )}
                          >
                            {todo.text}
                          </span>

                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all outline-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-slate-50 rounded-full">
            <ClipboardList className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">
            {hideCompleted
              ? "All tasks are completed! Toggle visibility to see them."
              : "Your task list is empty. Start adding some tasks!"}
          </p>
        </div>
      )}
    </div>
  );
}
