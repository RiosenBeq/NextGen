'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addNote, updateNote } from '../actions';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  initialData?: any;
  onClose?: () => void;
}

export function NoteForm({ initialData, onClose }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [color, setColor] = useState(initialData?.color || 'zinc');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (initialData) {
        await updateNote(initialData.id, title, content, color);
      } else {
        await addNote(title, content, color);
      }
      if (onClose) onClose();
      window.location.reload();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = [
    { id: 'zinc', bg: 'bg-slate-900', light: 'bg-slate-50', border: 'border-slate-200' },
    { id: 'blue', bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'emerald', bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'amber', bg: 'bg-amber-600', light: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'rose', bg: 'bg-rose-600', light: 'bg-rose-50', border: 'border-rose-200' },
  ];

  return (
    <div className="p-4 space-y-8">
      <div className="space-y-1">
         <h4 className="text-xl font-bold text-slate-900 tracking-tight">{initialData ? 'Girişi Güncelle' : 'Yeni Hafıza Kaydı'}</h4>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">SİSTEM PROTOKOLÜ & NOTLARI</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Not Başlığı</label>
          <input
            autoFocus
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Protokol başlığı veya konu..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-lg outline-none"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">İçerik Detayları</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Hafızaya alınacak detaylar, kararlar veya hatırlatıcılar..."
            rows={5}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium leading-relaxed resize-none outline-none"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center block italic">Kategorizasyon Rengi</label>
          <div className="flex justify-center gap-4">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={cn(
                  "w-12 h-12 rounded-[18px] border-2 transition-all flex items-center justify-center relative shadow-sm hover:scale-110",
                  color === c.id 
                    ? `scale-110 border-slate-900 ${c.light}` 
                    : "border-slate-100 bg-white opacity-40 hover:opacity-100"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full shadow-inner", c.bg)} />
                {color === c.id && (
                  <motion.div layoutId="activeColor" className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-slate-900" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 h-14 bg-white border border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all hover:bg-slate-50 hover:text-slate-600 active:scale-95"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 h-14 bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all hover:bg-slate-800 shadow-xl shadow-slate-100 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Plus size={18} /></motion.div> : <Plus size={18} />}
              {initialData ? 'KAYDI GÜNCELLE' : 'HAFIZAYA AL'}
            </button>
        </div>
      </form>
    </div>
  );
}
