'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Clock, StickyNote, Plus } from 'lucide-react';
import { deleteNote } from '../actions';
import { NoteForm } from './NoteForm';

interface Note {
  id: string | number;
  title: string;
  content?: string;
  color: string;
  createdAt: string;
}

interface Props {
  initialNotes: Note[];
}

export default function NoteList({ initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleDelete = async (id: string | number) => {
    if (confirm("Bu notu silmek istediğinize emin misiniz?")) {
      const result = await deleteNote(id);
      if (result.success) {
        setNotes(notes.filter(n => n.id !== id));
      }
    }
  };

  const getCardColor = (color: string) => {
    switch (color) {
      case 'zinc': return 'border-slate-200 bg-white hover:bg-slate-50';
      case 'blue': return 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/80';
      case 'emerald': return 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/80';
      case 'amber': return 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/80';
      case 'rose': return 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/80';
      default: return 'border-slate-200 bg-white hover:bg-slate-50';
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case 'zinc': return 'text-slate-600';
      case 'blue': return 'text-blue-700';
      case 'emerald': return 'text-emerald-700';
      case 'amber': return 'text-amber-700';
      case 'rose': return 'text-rose-700';
      default: return 'text-slate-600';
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center premium-card p-4 border border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
              <StickyNote size={18} className="text-slate-500" />
           </div>
           <div className="flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Notlarda ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
           </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Yeni Not
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 && !isAdding && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Arama sonucu bulunamadı</p>
            </motion.div>
          )}

          {filteredNotes.map((note, idx) => (
            <motion.div
              layout
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.03 }}
              className={`group p-6 rounded-2xl transition-all flex flex-col justify-between h-full relative overflow-hidden shadow-sm hover:shadow-md ${getCardColor(note.color)}`}
            >
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-slate-800 leading-tight text-lg group-hover:text-blue-600 transition-colors">
                    {note.title}
                  </h3>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setEditingNote(note)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-6">
                    {note.content}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 tracking-wider">
                    <Clock size={12} className="text-slate-400" />
                    {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/50 border ${getTextColor(note.color)} border-current/20`}>
                    {note.color}
                  </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -translate-y-16 translate-x-16 blur-2xl pointer-events-none group-hover:bg-white/60 transition-colors" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAdding || editingNote) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => { setIsAdding(false); setEditingNote(null); }}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="w-full max-w-xl relative z-[101]"
            >
              <NoteForm 
                initialData={editingNote} 
                onClose={() => {
                  setIsAdding(false);
                  setEditingNote(null);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
