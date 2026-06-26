import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Trash2, Edit3
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getToday, formatTime, getDaysInMonth, getFirstDayOfMonth } from '../utils/dates';
import type { PlannerEvent } from '../types';

const EVENT_COLORS = [
  { name: 'Blue', value: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Indigo', value: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Purple', value: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Pink', value: 'bg-pink-500', light: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Red', value: 'bg-red-500', light: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Orange', value: 'bg-orange-500', light: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Green', value: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Teal', value: 'bg-teal-500', light: 'bg-teal-50 text-teal-700 border-teal-200' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  events: PlannerEvent[];
  setEvents: React.Dispatch<React.SetStateAction<PlannerEvent[]>>;
}

export default function Planner({ events, setEvents }: Props) {
  const today = getToday();
  const todayDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [color, setColor] = useState(EVENT_COLORS[0].value);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToToday = () => {
    setCurrentMonth(todayDate.getMonth());
    setCurrentYear(todayDate.getFullYear());
    setSelectedDate(today);
  };

  const dateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const eventsForDate = (d: string) => events.filter(e => e.date === d).sort((a, b) => a.time.localeCompare(b.time));

  const resetForm = () => {
    setTitle(''); setDescription(''); setTime('09:00'); setColor(EVENT_COLORS[0].value);
    setEditingId(null); setShowForm(false);
  };

  const openNewEvent = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditEvent = (ev: PlannerEvent) => {
    setTitle(ev.title);
    setDescription(ev.description);
    setTime(ev.time);
    setColor(ev.color);
    setEditingId(ev.id);
    setShowForm(true);
  };

  const saveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDate) return;

    if (editingId) {
      setEvents(prev => prev.map(ev =>
        ev.id === editingId
          ? { ...ev, title: title.trim(), description: description.trim(), time, color }
          : ev
      ));
    } else {
      const newEvent: PlannerEvent = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
        time,
        color,
        createdAt: Date.now(),
      };
      setEvents(prev => [...prev, newEvent]);
    }
    resetForm();
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  // Upcoming events (next 7 days from today)
  const upcomingDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    upcomingDates.push(d.toISOString().split('T')[0]);
  }
  const upcomingEvents = events
    .filter(e => upcomingDates.includes(e.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const getColorLight = (c: string) => EVENT_COLORS.find(ec => ec.value === c)?.light || EVENT_COLORS[0].light;

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Cal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={goToToday} className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
          {DAYS.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} className="h-16 sm:h-20 border-b border-r border-slate-50 dark:border-slate-800" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = dateStr(day);
            const dayEvents = eventsForDate(ds);
            const isToday = ds === today;
            const isSelected = ds === selectedDate;
            const isPast = ds < today;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(ds)}
                className={cn(
                  "h-16 sm:h-20 border-b border-r border-slate-50 dark:border-slate-800 p-1.5 text-left transition-all hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 relative",
                  isSelected && "bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-300 dark:ring-indigo-500",
                  isPast && !isSelected && "bg-slate-50/40 dark:bg-slate-800/20"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full",
                    isToday
                      ? "bg-indigo-600 text-white"
                      : isPast
                      ? "text-slate-400 dark:text-slate-500"
                      : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} className={cn("w-1.5 h-1.5 rounded-full", ev.color)} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </h3>
            <button
              onClick={openNewEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          {/* Event form modal */}
          {showForm && (
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <form onSubmit={saveEvent} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {editingId ? 'Edit Event' : 'New Event'}
                  </span>
                  <button type="button" onClick={resetForm} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-200"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-200 resize-none"
                />
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <Clock className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Color:</span>
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={cn(
                        "w-6 h-6 rounded-full transition-all", c.value,
                        color === c.value ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-60 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-200"
                >
                  {editingId ? 'Update Event' : 'Create Event'}
                </button>
              </form>
            </div>
          )}

          {/* Events list */}
          {selectedEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <div
                  key={ev.id}
                  className={cn("group flex items-start gap-3 p-3 rounded-xl border transition-all", getColorLight(ev.color))}
                >
                  <div className={cn("w-1 h-full min-h-[2rem] rounded-full self-stretch flex-shrink-0", ev.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{ev.title}</span>
                      <span className="text-xs opacity-70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(ev.time)}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-xs mt-1 opacity-70 line-clamp-2">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditEvent(ev)}
                      className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEvent(ev.id)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showForm && (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                No events for this day. Click "Add Event" to create one.
              </p>
            )
          )}
        </div>
      )}

      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 p-5">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3">📅 Upcoming (7 days)</h3>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 8).map(ev => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", ev.color)} />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate flex-1">{ev.title}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' · '}
                  {formatTime(ev.time)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
