import React, { useState } from 'react';
import {
  Plus, Trash2, Pin, PinOff, X, Search, FileText, Edit3, Sparkles, Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { API_URL } from '../config';
import type { Note } from '../types';

const NOTE_COLORS = [
  { name: 'Default', bg: 'bg-white dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-700', header: 'bg-slate-50 dark:bg-slate-700/50' },
  { name: 'Yellow', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', header: 'bg-amber-100/60 dark:bg-amber-800/40' },
  { name: 'Green', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', header: 'bg-emerald-100/60 dark:bg-emerald-800/40' },
  { name: 'Blue', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', header: 'bg-blue-100/60 dark:bg-blue-800/40' },
  { name: 'Purple', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800', header: 'bg-purple-100/60 dark:bg-purple-800/40' },
  { name: 'Pink', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-pink-200 dark:border-pink-800', header: 'bg-pink-100/60 dark:bg-pink-800/40' },
  { name: 'Orange', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', header: 'bg-orange-100/60 dark:bg-orange-800/40' },
  { name: 'Red', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', header: 'bg-red-100/60 dark:bg-red-800/40' },
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

  // AI write
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch(`${API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(err.error || 'Generation failed');
      }
      const data = await res.json();
      setContent(prev => (prev ? prev + '\n\n' : '') + data.text);
      setShowAI(false);
      setAiPrompt('');
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all shadow-sm text-slate-900 dark:text-slate-200"
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-2xl dark:shadow-slate-900/50" onClick={e => e.stopPropagation()}>
            <form onSubmit={saveNote}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h3>
                <button type="button" onClick={closeEditor} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Note title"
                  className="w-full px-4 py-3 text-lg font-semibold bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200"
                  autoFocus
                />
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={8}
                  className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200 leading-relaxed"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Color:</span>
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

                {/* AI Write */}
                {!showAI ? (
                  <button
                    type="button"
                    onClick={() => { setShowAI(true); setAiPrompt(''); setAiError(''); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-200 dark:border-indigo-800"
                  >
                    <Sparkles className="w-4 h-4" />
                    Write with AI
                  </button>
                ) : (
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Note Writer
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAI(false)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Describe what you want to write about..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200"
                    />
                    {aiError && (
                      <p className="text-xs text-red-500 dark:text-red-400">{aiError}</p>
                    )}
                    <button
                      type="button"
                      onClick={generateWithAI}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-200"
                    >
                      {aiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {aiLoading ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={closeEditor} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
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
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate flex-1">
                      {note.title || 'Untitled'}
                    </h4>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); togglePin(note.id); }}
                        className="p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded transition-colors text-amber-500"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                        className="p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded transition-colors text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 whitespace-pre-wrap leading-relaxed">
                      {note.content || 'No content'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">{formatDate(note.updatedAt)}</p>
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
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Others</h3>
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
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate flex-1">
                      {note.title || 'Untitled'}
                    </h4>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); togglePin(note.id); }}
                        className="p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded transition-colors text-slate-400 dark:text-slate-500 hover:text-amber-500"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(note); }}
                        className="p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded transition-colors text-slate-400 dark:text-slate-500"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                        className="p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded transition-colors text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 whitespace-pre-wrap leading-relaxed">
                      {note.content || 'No content'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">{formatDate(note.updatedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-slate-50 dark:bg-slate-700/50 rounded-full">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium">
            {search ? 'No notes match your search.' : 'No notes yet. Create your first note!'}
          </p>
        </div>
      )}
    </div>
  );
}
