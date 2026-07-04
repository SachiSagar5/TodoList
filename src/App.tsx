import React, { useState, useCallback, useEffect } from 'react';
import { ListTodo, CalendarRange, StickyNote, Timer, Sparkles, LogOut, Loader2, Sun, Moon, LayoutDashboard, Search, Download, Upload, Check, BarChart3 } from 'lucide-react';
import { cn } from './utils/cn';
import { AuthProvider, useAuth, type AppUser } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useFirestoreCollection } from './hooks/useFirestore';
import { useApiCollection } from './hooks/useApiCollection';
import { useNotifications } from './hooks/useNotifications';
import TodoList from './components/TodoList';
import Planner from './components/Planner';
import Notes from './components/Notes';
import Pomodoro from './components/Pomodoro';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import SearchModal from './components/SearchModal';
import QuickAdd from './components/QuickAdd';
import FocusMode from './components/FocusMode';
import AuthPage from './components/AuthPage';
import type { Tab, Todo, PlannerEvent, Note, AppData } from './types';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'tasks', label: 'Tasks', icon: <ListTodo className="w-5 h-5" /> },
  { key: 'planner', label: 'Planner', icon: <CalendarRange className="w-5 h-5" /> },
  { key: 'notes', label: 'Notes', icon: <StickyNote className="w-5 h-5" /> },
  { key: 'pomodoro', label: 'Pomodoro', icon: <Timer className="w-5 h-5" /> },
  { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
];

/* ───────── Dashboard with Firebase Firestore ───────── */
function FirebaseDashboard({ user }: { user: AppUser }) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [todos, setTodos, todosLoading] = useFirestoreCollection<Todo>('todos');
  const [events, setEvents, eventsLoading] = useFirestoreCollection<PlannerEvent>('events');
  const [notes, setNotes, notesLoading] = useFirestoreCollection<Note>('notes');
  const isLoading = todosLoading || eventsLoading || notesLoading;

  return (
    <Shell
      activeTab={activeTab} setActiveTab={setActiveTab}
      todos={todos} events={events} notes={notes}
      setTodos={setTodos} setEvents={setEvents} setNotes={setNotes}
      isLoading={isLoading} user={user} signOut={signOut}
    />
  );
}

/* ───────── Dashboard with local API server ───────── */
function LocalDashboard({ user }: { user: AppUser }) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [todos, setTodos, todosLoading, todosError] = useApiCollection<Todo>('todos');
  const [events, setEvents, eventsLoading, eventsError] = useApiCollection<PlannerEvent>('events');
  const [notes, setNotes, notesLoading, notesError] = useApiCollection<Note>('notes');
  const isLoading = todosLoading || eventsLoading || notesLoading;
  const fetchError = todosError || eventsError || notesError;

  return (
    <Shell
      activeTab={activeTab} setActiveTab={setActiveTab}
      todos={todos} events={events} notes={notes}
      setTodos={setTodos} setEvents={setEvents} setNotes={setNotes}
      isLoading={isLoading} fetchError={fetchError} user={user} signOut={signOut}
    />
  );
}

/* ───────── Shared Shell ───────── */
interface ShellProps {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  todos: Todo[];
  events: PlannerEvent[];
  notes: Note[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  setEvents: React.Dispatch<React.SetStateAction<PlannerEvent[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  isLoading: boolean;
  fetchError?: string | null;
  user: AppUser;
  signOut: () => Promise<void>;
}

function Shell({
  activeTab, setActiveTab,
  todos, events, notes,
  setTodos, setEvents, setNotes,
  isLoading, fetchError, user, signOut,
}: ShellProps) {
  const { dark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [focusTodo, setFocusTodo] = useState<Todo | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useNotifications(events);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'q' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          setShowQuickAdd(true);
        }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const exportData = useCallback(() => {
    const data: AppData = { todos, events, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [todos, events, notes]);

  const importData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as AppData;
        if (data.todos) setTodos(data.todos);
        if (data.events) setEvents(data.events);
        if (data.notes) setNotes(data.notes);
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 2000);
      } catch {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 2000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setTodos, setEvents, setNotes]);

  const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const photoURL = user.photoURL;

  const todoBadge = todos.filter(t => !t.completed).length;
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === today).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-800/40 overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-14">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="inline-flex items-center justify-center p-1.5 sm:p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/40 flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                TaskMaster
              </h1>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {/* Search */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex-shrink-0 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-md transition-all"
                  title="Search (⌘K)"
                >
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>

                {/* Export */}
                <button
                  onClick={exportData}
                  className="flex-shrink-0 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-md transition-all"
                  title="Export data"
                >
                  <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>

                {/* Import */}
                <label className="flex-shrink-0 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-md transition-all cursor-pointer" title="Import data">
                  {importStatus === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : importStatus === 'error' ? (
                    <span className="text-red-500 text-xs font-bold">!</span>
                  ) : (
                    <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex-shrink-0 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-md transition-all"
                  title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                </button>
              </div>

              {/* Profile — outside overflow container */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowProfileMenu(s => !s)}
                  className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-md transition-all"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block max-w-[120px] truncate">
                    {displayName}
                  </span>
                  {photoURL ? (
                    <img src={photoURL} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40 animate-fade-in" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-64 sm:w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-scale-in">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          {photoURL ? (
                            <img src={photoURL} alt="" className="w-11 h-11 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{todos.length}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Tasks</p>
                          </div>
                          <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{events.length}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Events</p>
                          </div>
                          <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{notes.length}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Notes</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={async () => { setShowProfileMenu(false); await signOut(); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Welcome line */}
          <div className="text-center">
            <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">
              Welcome back, <span className="text-slate-600 dark:text-slate-300 font-semibold">{displayName.split(' ')[0]}</span>
            </p>
          </div>

          {fetchError && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300 text-center font-medium animate-slide-down">
              {fetchError}
            </div>
          )}
        </header>

        {/* Tabs */}
        <nav className="flex items-center justify-center mb-8 overflow-x-auto scrollbar-none px-2 -mx-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 flex-shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all",
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.key === 'tasks' && todoBadge > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                    activeTab === 'tasks' ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"
                  )}>{todoBadge}</span>
                )}
                {tab.key === 'planner' && todayEvents > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                    activeTab === 'planner' ? "bg-white/20 text-white" : "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"
                  )}>{todayEvents}</span>
                )}
                {tab.key === 'notes' && notes.length > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                    activeTab === 'notes' ? "bg-white/20 text-white" : "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
                  )}>{notes.length}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin mb-3" />
            <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">Loading your data...</p>
          </div>
        ) : (
          <>
            <main>
              {activeTab === 'dashboard' && <div key="dashboard" className="animate-slide-up"><Dashboard todos={todos} events={events} notes={notes} /></div>}
              {activeTab === 'tasks' && <div key="tasks" className="animate-slide-up"><TodoList todos={todos} setTodos={setTodos} onFocusTask={setFocusTodo} /></div>}
              {activeTab === 'planner' && <div key="planner" className="animate-slide-up"><Planner events={events} setEvents={setEvents} /></div>}
              {activeTab === 'notes' && <div key="notes" className="animate-slide-up"><Notes notes={notes} setNotes={setNotes} /></div>}
              {activeTab === 'pomodoro' && <div key="pomodoro" className="animate-slide-up"><Pomodoro /></div>}
              {activeTab === 'analytics' && <div key="analytics" className="animate-slide-up"><Analytics todos={todos} events={events} notes={notes} /></div>}
            </main>
            <SearchModal open={showSearch} onClose={() => setShowSearch(false)} todos={todos} events={events} notes={notes} />
            <QuickAdd open={showQuickAdd} onClose={() => setShowQuickAdd(false)} onAdd={(todo) => setTodos(prev => [todo, ...prev])} />
          </>
        )}

        <footer className="mt-14 text-center text-slate-300 dark:text-slate-600 text-xs">
          <p>TaskMaster — Your personal productivity hub</p>
        </footer>
      </div>

      {/* Focus Mode (full-screen overlay) */}
      <FocusMode
        todo={focusTodo}
        onClose={() => setFocusTodo(null)}
        onUpdate={(id, updates) => setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))}
        onComplete={(id) => setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: true, timerStartedAt: null } : t))}
      />
    </div>
  );
}

/* ───────── Root App ───────── */
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

function AppRouter() {
  const { user, loading, isFirebase } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/40">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Loader2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-spin" />
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading TaskMaster...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return isFirebase
    ? <FirebaseDashboard user={user} />
    : <LocalDashboard user={user} />;
}
