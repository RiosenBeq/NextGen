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

  const themes: Record<string, any> = {
    zinc: { card: "bg-white border-slate-200", icon: "bg-slate-900", accent: "text-slate-900" },
    blue: { card: "bg-blue-50/30 border-blue-100 backdrop-blur-sm", icon: "bg-blue-600", accent: "text-blue-600" },
    emerald: { card: "bg-emerald-50/30 border-emerald-100 backdrop-blur-sm", icon: "bg-emerald-600", accent: "text-emerald-600" },
    amber: { card: "bg-amber-50/30 border-amber-100 backdrop-blur-sm", icon: "bg-amber-600", accent: "text-amber-600" },
    rose: { card: "bg-rose-50/30 border-rose-100 backdrop-blur-sm", icon: "bg-rose-600", accent: "text-rose-600" },
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      
      {/* Search & Action Bar */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center px-4">
        <div className="relative flex-1 w-full lg:max-w-md group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
             <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Kurumsal hafızada ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-[28px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none shadow-sm placeholder:text-slate-300"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <button 
             onClick={() => setIsAdding(true)}
             className="flex-1 lg:flex-none px-8 h-14 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
           >
             <Plus size={18} />
             YENİ PROTOKOL TANIMLA
           </button>
        </div>
      </div>

      {/* Staggered Masonry Grid */}
      <div className="columns-1 md:columns-2 xl:columns-3 gap-8 space-y-8 px-4">
        <AnimatePresence mode="popLayout">
           {filteredNotes.length === 0 && !isAdding && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 rounded-[48px] bg-slate-50/50 flex flex-col items-center gap-6"
             >
               <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 shadow-sm">
                  <StickyNote size={32} />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-widest italic">Henüz Bir Veri Girişi Yapılmadı</p>
                  <p className="text-[10px] font-medium text-slate-400">Sistem genelindeki tüm notlar burada listelenir.</p>
               </div>
             </motion.div>
           )}

           {filteredNotes.map((note, idx) => {
             const theme = themes[note.color] || themes.zinc;
             return (
               <motion.div
                 layout
                 key={note.id}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 transition={{ duration: 0.4, delay: idx * 0.05 }}
                 className={cn(
                   "break-inside-avoid group p-8 rounded-[40px] border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between relative",
                   theme.card
                 )}
               >
                 <div className="space-y-6">
                   <div className="flex justify-between items-start">
                     <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6", theme.icon, "text-white")}>
                       <StickyNote size={24} />
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                         className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm flex items-center justify-center"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                         className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm flex items-center justify-center"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-xl tracking-tight leading-tight">{note.title}</h3>
                      {note.content && (
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                           {note.content}
                        </p>
                      )}
                   </div>
                 </div>

                 <footer className="mt-10 pt-6 border-t border-slate-100/50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                          <Clock size={14} />
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                         {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </span>
                     </div>
                     <div className={cn("text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full", theme.accent, "bg-white/50 border border-current opacity-20")}>
                        {note.color}
                     </div>
                 </footer>
               </motion.div>
             );
           })}
        </AnimatePresence>
      </div>

      <PremiumModal 
        isOpen={isAdding || !!editingNote} 
        onClose={() => { setIsAdding(false); setEditingNote(null); }} 
        title={editingNote ? "Kaydı Güncelle" : "Yeni Sistem Notu"}
        maxWidth="max-w-xl"
      >
        <div className="p-2">
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
