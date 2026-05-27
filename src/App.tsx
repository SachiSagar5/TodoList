import React, { useState } from 'react';
import { ListTodo, CalendarRange, StickyNote, Sparkles, LogOut, Loader2, Cloud, HardDrive } from 'lucide-react';
import { cn } from './utils/cn';
import { AuthProvider, useAuth, type AppUser } from './contexts/AuthContext';
import { useFirestoreCollection } from './hooks/useFirestore';
import { useLocalStorage } from './hooks/useLocalStorage';
import TodoList from './components/TodoList';
import Planner from './components/Planner';
import Notes from './components/Notes';
import AuthPage from './components/AuthPage';
import type { Tab, Todo, PlannerEvent, Note } from './types';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tasks', label: 'Tasks', icon: <ListTodo className="w-5 h-5" /> },
  { key: 'planner', label: 'Planner', icon: <CalendarRange className="w-5 h-5" /> },
  { key: 'notes', label: 'Notes', icon: <StickyNote className="w-5 h-5" /> },
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
      isLoading={isLoading} user={user} signOut={signOut} cloudSync
    />
  );
}

/* ───────── Dashboard with localStorage ───────── */
function LocalDashboard({ user }: { user: AppUser }) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const uid = user.uid;
  const [todos, setTodos] = useLocalStorage<Todo[]>(`taskmaster-todos-${uid}`, []);
  const [events, setEvents] = useLocalStorage<PlannerEvent[]>(`taskmaster-events-${uid}`, []);
  const [notes, setNotes] = useLocalStorage<Note[]>(`taskmaster-notes-${uid}`, []);

  return (
    <Shell
      activeTab={activeTab} setActiveTab={setActiveTab}
      todos={todos} events={events} notes={notes}
      setTodos={setTodos} setEvents={setEvents} setNotes={setNotes}
      isLoading={false} user={user} signOut={signOut} cloudSync={false}
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
  user: AppUser;
  signOut: () => Promise<void>;
  cloudSync: boolean;
}

function Shell({
  activeTab, setActiveTab,
  todos, events, notes,
  setTodos, setEvents, setNotes,
  isLoading, user, signOut, cloudSync,
}: ShellProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const photoURL = user.photoURL;

  const todoBadge = todos.filter(t => !t.completed).length;
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === today).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900 font-sans selection:bg-indigo-100">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-14">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-200/60">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                TaskMaster
              </h1>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(s => !s)}
                className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all"
              >
                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
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
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        {photoURL ? (
                          <img src={photoURL} alt="" className="w-11 h-11 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sync badge */}
                    <div className="px-4 pt-3 pb-1">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold",
                        cloudSync
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-amber-50 text-amber-600 border border-amber-200"
                      )}>
                        {cloudSync ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                        {cloudSync ? 'Cloud sync enabled' : 'Local storage mode'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-slate-50 rounded-xl">
                          <p className="text-lg font-bold text-indigo-600">{todos.length}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Tasks</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-xl">
                          <p className="text-lg font-bold text-violet-600">{events.length}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Events</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-xl">
                          <p className="text-lg font-bold text-purple-600">{notes.length}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Notes</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button
                        onClick={async () => { setShowProfileMenu(false); await signOut(); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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

          {/* Welcome line */}
          <div className="text-center">
            <p className="text-slate-400 text-sm font-medium">
              Welcome back, <span className="text-slate-600 font-semibold">{displayName.split(' ')[0]}</span> 👋
            </p>
          </div>
        </header>

        {/* Tabs */}
        <nav className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all",
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.key === 'tasks' && todoBadge > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                    activeTab === 'tasks' ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600"
                  )}>{todoBadge}</span>
                )}
                {tab.key === 'planner' && todayEvents > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                    activeTab === 'planner' ? "bg-white/20 text-white" : "bg-violet-100 text-violet-600"
                  )}>{todayEvents}</span>
                )}
                {tab.key === 'notes' && notes.length > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                    activeTab === 'notes' ? "bg-white/20 text-white" : "bg-purple-100 text-purple-600"
                  )}>{notes.length}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-slate-400 text-sm font-medium">Loading your data...</p>
          </div>
        ) : (
          <main>
            {activeTab === 'tasks' && <TodoList todos={todos} setTodos={setTodos} />}
            {activeTab === 'planner' && <Planner events={events} setEvents={setEvents} />}
            {activeTab === 'notes' && <Notes notes={notes} setNotes={setNotes} />}
          </main>
        )}

        <footer className="mt-14 text-center text-slate-300 text-xs">
          <p>TaskMaster — Your personal productivity hub</p>
        </footer>
      </div>
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200/60">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <span className="text-slate-500 text-sm font-medium">Loading TaskMaster...</span>
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
