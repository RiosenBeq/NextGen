'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Clock, StickyNote, Plus, Search } from 'lucide-react';
import { deleteNote } from '../actions';
import { NoteForm } from './NoteForm';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { cn } from '@/lib/utils';

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
      case 'zinc': return 'bg-white border-slate-200';
      case 'blue': return 'bg-blue-50/50 border-blue-100';
      case 'emerald': return 'bg-emerald-50/50 border-emerald-100';
      case 'amber': return 'bg-amber-50/50 border-amber-100';
      case 'rose': return 'bg-rose-50/50 border-rose-100';
      default: return 'bg-white border-slate-200';
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* Search & Add Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-3xl">
        <div className="relative flex-1 md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Notlarda ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Yeni Not Ekle
        </button>
      </div>

      {/* Note Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 && !isAdding && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50 flex flex-col items-center gap-3">
              <Search size={32} className="text-slate-200" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Henüz bir kayıt bulunamadı.</p>
            </div>
          )}

          {filteredNotes.map((note, idx) => (
            <motion.div
              layout
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "group p-8 rounded-[32px] border shadow-sm transition-all duration-300 flex flex-col justify-between h-full min-h-[220px] relative",
                getCardColor(note.color)
              )}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", 
                    note.color === 'blue' ? 'bg-blue-600 text-white' : 
                    note.color === 'emerald' ? 'bg-emerald-600 text-white' :
                    note.color === 'amber' ? 'bg-amber-600 text-white' :
                    note.color === 'rose' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                  )}>
                    <StickyNote size={20} />
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                   <h3 className="font-bold text-slate-900 text-lg uppercase tracking-tight line-clamp-1">{note.title}</h3>
                   {note.content && (
                     <p className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-4">{note.content}</p>
                   )}
                </div>
              </div>

              <footer className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                      {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300">#{note.color}</div>
              </footer>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PremiumModal 
        isOpen={isAdding || !!editingNote} 
        onClose={() => { setIsAdding(false); setEditingNote(null); }} 
        title={editingNote ? "Notu Düzenle" : "Yeni Not Tanımla"}
        maxWidth="max-w-xl"
      >
        <div className="p-8">
           <NoteForm 
             initialData={editingNote} 
             onClose={() => {
               setIsAdding(false);
               setEditingNote(null);
             }} 
           />
        </div>
      </PremiumModal>
    </div>
  );
}
