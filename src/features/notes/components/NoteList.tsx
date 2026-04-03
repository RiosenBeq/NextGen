'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Clock, StickyNote, Plus } from 'lucide-react';
import { deleteNote } from '../actions';
import { NoteForm } from './NoteForm';

interface Note {
  id: string | number;
  title: string;
  content?: string;
  color: string;
  created_at: string;
}

interface Props {
  initialNotes: Note[];
}

export default function NoteList({ initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAdding, setIsAdding] = useState(false);

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
      case 'zinc': return 'border-slate-200 bg-slate-50/50';
      case 'blue': return 'border-blue-200 bg-blue-50/50';
      case 'emerald': return 'border-emerald-200 bg-emerald-50/50';
      case 'amber': return 'border-amber-200 bg-amber-50/50';
      case 'rose': return 'border-rose-200 bg-rose-50/50';
      default: return 'border-slate-200 bg-slate-50/50';
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case 'zinc': return 'text-slate-600';
      case 'blue': return 'text-blue-600';
      case 'emerald': return 'text-emerald-600';
      case 'amber': return 'text-amber-600';
      case 'rose': return 'text-rose-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2">
          <StickyNote size={20} className="text-indigo-500" />
          Kayıtlı Notlar
        </h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="elite-button-primary flex items-center gap-2"
        >
          <Plus size={16} />
          YENİ NOT EKLE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {notes.length === 0 && !isAdding && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="col-span-full py-20 text-center premium-card border-dashed border-slate-300 bg-slate-50/30"
            >
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Henüz not eklenmemiş</p>
            </motion.div>
          )}

          {notes.map((note) => (
            <motion.div
              layout
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`premium-card p-6 flex flex-col justify-between ${getCardColor(note.color)}`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-black text-slate-800 tracking-tight leading-tight">{note.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => setEditingNote(note)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {note.content}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock size={10} />
                    {new Date(note.created_at).toLocaleDateString('tr-TR')}
                 </div>
                 <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${getTextColor(note.color)}`}>
                    {note.color}
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAdding || editingNote) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 20, scale: 0.95 }}
               className="w-full max-w-lg shadow-2xl"
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
