import React, { useState } from 'react';
import {
  Plus, Trash2, Pin, PinOff, X, Search, FileText, Edit3
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { Note } from '../types';

const NOTE_COLORS = [
  { name: 'Default', bg: 'bg-white', border: 'border-slate-100', header: 'bg-slate-50' },
  { name: 'Yellow', bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100/60' },
  { name: 'Green', bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100/60' },
  { name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100/60' },
  { name: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100/60' },
  { name: 'Pink', bg: 'bg-pink-50', border: 'border-pink-200', header: 'bg-pink-100/60' },
  { name: 'Orange', bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100/60' },
  { name: 'Red', bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100/60' },
];

interface Props {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

export default function Notes({ notes, setNotes }: Props) {
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('bg-white');

  const openNew = () => {
    setTitle(''); setContent(''); setColor('bg-white');
    setEditingNote(null);
    setShowEditor(true);
  };

  const openEdit = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setEditingNote(note);
    setShowEditor(true);
  };

  const saveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    if (editingNote) {
      setNotes(prev =>
        prev.map(n =>
          n.id === editingNote.id
            ? { ...n, title: title.trim(), content: content.trim(), color, updatedAt: Date.now() }
            : n
        )
      );
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        color,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes(prev => [newNote, ...prev]);
    }
    closeEditor();
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
    setTitle(''); setContent(''); setColor('bg-white');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingNote?.id === id) closeEditor();
  };

  const togglePin = (id: string) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const filtered = notes.filter(n => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const pinned = filtered.filter(n => n.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
  const unpinned = filtered.filter(n => !n.pinned).sort((a, b) => b.updatedAt - a.updatedAt);

  const getNoteColors = (c: string) => NOTE_COLORS.find(nc => nc.bg === c) || NOTE_COLORS[0];

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Editor modal overlay */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeEditor}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={saveNote}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h3>
                <button type="button" onClick={closeEditor} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Note title"
                  className="w-full px-4 py-3 text-lg font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                  autoFocus
                />
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={8}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none placeholder:text-slate-400 leading-relaxed"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 mr-1">Color:</span>
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.bg)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all",
                        c.bg, c.border,
                        color === c.bg ? "ring-2 ring-offset-1 ring-slate-400 scale-110" : "opacity-70 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                <button type="button" onClick={closeEditor} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() && !content.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-200"
                >
                  {editingNote ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" /> Pinned
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinned.map(note => {
              const colors = getNoteColors(note.color);
              return (
                <div
                  key={note.id}
                  className={cn(
                    "group rounded-2xl border overflow-hidden transition-all hover:shadow-lg cursor-pointer",
                    colors.bg, colors.border
                  )}
                  onClick={() => openEdit(note)}
                >
                  <div className={cn("px-4 py-2.5 flex items-center justify-between", colors.header)}>
                    <h4 className="text-sm font-bold text-slate-800 truncate flex-1">
                      {note.title || 'Untitled'}
                    </h4>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); togglePin(note.id); }}
                        className="p-1 hover:bg-white/60 rounded transition-colors text-amber-500"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                        className="p-1 hover:bg-white/60 rounded transition-colors text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap leading-relaxed">
                      {note.content || 'No content'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">{formatDate(note.updatedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Others</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpinned.map(note => {
              const colors = getNoteColors(note.color);
              return (
                <div
                  key={note.id}
                  className={cn(
                    "group rounded-2xl border overflow-hidden transition-all hover:shadow-lg cursor-pointer",
                    colors.bg, colors.border
                  )}
                  onClick={() => openEdit(note)}
                >
                  <div className={cn("px-4 py-2.5 flex items-center justify-between", colors.header)}>
                    <h4 className="text-sm font-bold text-slate-800 truncate flex-1">
                      {note.title || 'Untitled'}
                    </h4>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); togglePin(note.id); }}
                        className="p-1 hover:bg-white/60 rounded transition-colors text-slate-400 hover:text-amber-500"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(note); }}
                        className="p-1 hover:bg-white/60 rounded transition-colors text-slate-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                        className="p-1 hover:bg-white/60 rounded transition-colors text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap leading-relaxed">
                      {note.content || 'No content'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">{formatDate(note.updatedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-slate-50 rounded-full">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">
            {search ? 'No notes match your search.' : 'No notes yet. Create your first note!'}
          </p>
        </div>
      )}
    </div>
  );
}
