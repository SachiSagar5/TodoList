export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate: string; // YYYY-MM-DD
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

export type Tab = 'tasks' | 'planner' | 'notes';
