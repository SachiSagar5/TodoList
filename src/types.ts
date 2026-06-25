export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  tags: string[];
  timerDuration: number | null; // total seconds, null if no timer
  timerStartedAt: number | null; // Date.now() when started, null if not running
  timerElapsed: number; // seconds already elapsed
}

export interface AppData {
  todos: Todo[];
  events: PlannerEvent[];
  notes: Note[];
}

export interface PlannerEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  color: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type Tab = 'tasks' | 'planner' | 'notes' | 'pomodoro' | 'dashboard';
