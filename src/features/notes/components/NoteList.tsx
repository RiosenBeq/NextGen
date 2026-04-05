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
      case 'zinc': return 'bg-white border-slate-200 hover:border-slate-300';
      case 'blue': return 'bg-blue-50/50 border-blue-100 hover:border-blue-200';
      case 'emerald': return 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200';
      case 'amber': return 'bg-amber-50/50 border-amber-100 hover:border-amber-200';
      case 'rose': return 'bg-rose-50/50 border-rose-100 hover:border-rose-200';
      default: return 'bg-white border-slate-200';
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      
      {/* 1. COMPACT TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
              <StickyNote size={20} strokeWidth={2.5} className="italic" />
           </div>
           <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Notlarda asenkron ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[20px] text-sm font-black italic uppercase tracking-tighter text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-300"
              />
           </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-[22px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
        >
          <Plus size={18} strokeWidth={3} />
          Yeni Protokol Ekle
        </button>
      </div>

      {/* 2. GRID SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 && !isAdding && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[48px] bg-slate-50/50 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                 <Search size={32} />
              </div>
              <p className="text-[11px] font-black italic text-slate-400 uppercase tracking-[0.3em]">Henüz bir not tanımlanmadı veya sonuç bulunamadı.</p>
            </motion.div>
          )}

          {filteredNotes.map((note, idx) => (
            <motion.div
              layout
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "group p-8 rounded-[40px] border shadow-sm transition-all duration-500 flex flex-col justify-between h-full min-h-[280px] relative overflow-hidden active:scale-[0.98]",
                getCardColor(note.color)
              )}
            >
              <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                     <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12", 
                        note.color === 'blue' ? 'bg-blue-600 text-white' : 
                        note.color === 'emerald' ? 'bg-emerald-600 text-white' :
                        note.color === 'amber' ? 'bg-amber-600 text-white' :
                        note.color === 'rose' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                     )}>
                        <StickyNote size={20} strokeWidth={2.5} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Sistem Notu</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-white transition-all shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                   <h3 className="font-black text-slate-900 leading-tight text-xl italic uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                     {note.title}
                   </h3>
                   {note.content && (
                     <p className="text-sm text-slate-500 leading-relaxed font-bold italic line-clamp-5">
                       {note.content}
                     </p>
                   )}
                </div>
              </div>

              <footer className="mt-8 pt-6 border-t border-slate-900/5 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-300" strokeWidth={2} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                      {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm",
                    note.color === 'blue' ? 'border-blue-200 text-blue-600 bg-white' : 
                    note.color === 'emerald' ? 'border-emerald-200 text-emerald-600 bg-white' :
                    note.color === 'amber' ? 'border-amber-200 text-amber-600 bg-white' :
                    note.color === 'rose' ? 'border-rose-200 text-rose-600 bg-white' : 'border-slate-200 text-slate-400 bg-white'
                  )}>
                    {note.color}
                  </div>
              </footer>

              {/* Glassmorphic Background Shine */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none group-hover:bg-white/40 transition-colors duration-500" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. PREMIUM MODALS */}
      <PremiumModal 
        isOpen={isAdding || !!editingNote} 
        onClose={() => { setIsAdding(false); setEditingNote(null); }} 
        title={editingNote ? "Notu Güncelle" : "Yeni Sistem Notu Tanımla"}
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
