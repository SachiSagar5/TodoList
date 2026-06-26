import { useState, useEffect, useRef } from 'react';
import { Search, X, ListTodo, CalendarRange, StickyNote, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../utils/cn';
import { isOverdue } from '../utils/dates';
import type { Todo, PlannerEvent, Note } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  todos: Todo[];
  events: PlannerEvent[];
  notes: Note[];
}

function highlight(text: string, query: string) {
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded font-semibold">{part}</span>
      : part
  );
}

export default function SearchModal({ open, onClose, todos, events, notes }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  if (!q) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tasks, notes, events..."
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-200 outline-none placeholder:text-slate-400"
            />
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-3">
              <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Type to search across all your data</p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">⌘K</kbd> to open</p>
          </div>
        </div>
      </div>
    );
  }

  const matchingTodos = todos.filter(t =>
    t.text.toLowerCase().includes(q) ||
    (t.tags ?? []).some(tag => tag.toLowerCase().includes(q))
  );

  const matchingEvents = events.filter(e =>
    e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
  );

  const matchingNotes = notes.filter(n =>
    n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );

  const totalMatches = matchingTodos.length + matchingEvents.length + matchingNotes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, notes, events..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-200 outline-none placeholder:text-slate-400"
            autoFocus
          />
          <span className="text-xs text-slate-400 font-medium">{totalMatches} results</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {totalMatches === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No results found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchingTodos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <ListTodo className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Tasks</span>
                    <span className="text-[11px] text-slate-400">{matchingTodos.length}</span>
                  </div>
                  {matchingTodos.map(todo => {
                    const overdue = !todo.completed && isOverdue(todo.dueDate);
                    return (
                      <div key={todo.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        {todo.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{highlight(todo.text, query)}</p>
                          <p className={cn("text-[11px] font-medium", overdue ? "text-red-500" : "text-slate-400")}>
                            {todo.dueDate} {overdue ? '(overdue)' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {matchingEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <CalendarRange className="w-4 h-4 text-violet-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">Events</span>
                    <span className="text-[11px] text-slate-400">{matchingEvents.length}</span>
                  </div>
                  {matchingEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <CalendarRange className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{highlight(event.title, query)}</p>
                        <p className="text-[11px] text-slate-400">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {matchingNotes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <StickyNote className="w-4 h-4 text-purple-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500">Notes</span>
                    <span className="text-[11px] text-slate-400">{matchingNotes.length}</span>
                  </div>
                  {matchingNotes.map(note => (
                    <div key={note.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <StickyNote className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{highlight(note.title, query)}</p>
                        <p className="text-[11px] text-slate-400 truncate">{note.content.slice(0, 80)}{note.content.length > 80 ? '...' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
