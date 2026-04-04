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
      case 'zinc': return 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60';
      case 'blue': return 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10';
      case 'emerald': return 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10';
      case 'amber': return 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10';
      case 'rose': return 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10';
      default: return 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60';
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case 'zinc': return 'text-zinc-400';
      case 'blue': return 'text-blue-400';
      case 'emerald': return 'text-emerald-400';
      case 'amber': return 'text-amber-400';
      case 'rose': return 'text-rose-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shadow-inner">
              <StickyNote size={18} className="text-zinc-400" />
           </div>
           <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
             Tüm Kayıtlar
           </h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-zinc-100 hover:bg-white text-black text-[10px] font-black tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 uppercase flex items-center gap-2"
        >
          <Plus size={14} />
          Yeni Not Oluştur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {notes.length === 0 && !isAdding && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]"
            >
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Henüz bir kayıt bulunmamaktadır</p>
            </motion.div>
          )}

          {notes.map((note, idx) => (
            <motion.div
              layout
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.03 }}
              className={`group p-8 rounded-[2.5rem] border transition-all flex flex-col justify-between h-full relative overflow-hidden ${getCardColor(note.color)}`}
            >
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start gap-6">
                  <h3 className="font-black text-white tracking-tighter leading-[1.1] text-2xl italic group-hover:text-indigo-400 transition-colors">
                    {note.title}
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingNote(note)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-500 hover:text-white hover:bg-indigo-600 transition-all border border-white/5"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-white/5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-[13px] text-zinc-400 leading-relaxed font-medium line-clamp-6 opacity-80 group-hover:opacity-100 transition-opacity">
                    {note.content}
                  </p>
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5 text-[10px] font-black text-zinc-600 uppercase tracking-widest italic font-mono">
                    <Clock size={12} className="text-zinc-700" />
                    {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                  <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border bg-black/20 ${getTextColor(note.color)} border-current/20`}>
                    {note.color}
                  </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -translate-y-16 translate-x-16 blur-3xl pointer-events-none group-hover:bg-white/[0.05] transition-colors" />
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
               className="fixed inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
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
