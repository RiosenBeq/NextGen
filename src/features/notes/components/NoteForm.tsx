'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addNote, updateNote } from '../actions';
import { motion } from 'framer-motion';

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
    { id: 'zinc', bg: 'bg-slate-100', border: 'border-slate-300' },
    { id: 'blue', bg: 'bg-blue-100', border: 'border-blue-300' },
    { id: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-300' },
    { id: 'amber', bg: 'bg-amber-100', border: 'border-amber-300' },
    { id: 'rose', bg: 'bg-rose-100', border: 'border-rose-300' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">Not Protokol Başlığı</label>
        <input
          autoFocus
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Stratejik başlık giriniz..."
          className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-black italic uppercase tracking-tighter text-lg shadow-inner"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">Dokümantasyon & Detaylar</label>
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Protokol detaylarını, kararları veya hatırlatıcıları buraya asenkron olarak not düşebilirsiniz..."
          rows={6}
          className="w-full bg-slate-50 border border-slate-200 rounded-[24px] px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold italic leading-relaxed resize-none shadow-inner"
        />
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic text-center block">Kategori Renk Segmentasyonu</label>
        <div className="flex justify-center gap-4">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.id)}
              className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center relative shadow-sm ${
                color === c.id ? `scale-110 -translate-y-1 shadow-lg ${c.border}` : 'border-transparent grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
              } ${c.bg}`}
            >
              {color === c.id && (
                <motion.div 
                   layoutId="activeColor"
                   className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-slate-900" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="group px-8 py-4 bg-white border border-slate-200 text-slate-500 font-black text-[10px] tracking-[0.2em] rounded-[22px] transition-all hover:bg-slate-50 uppercase italic"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group px-8 py-4 bg-slate-900 text-white font-black text-[10px] tracking-[0.2em] rounded-[22px] transition-all hover:bg-slate-800 shadow-xl shadow-slate-200 uppercase italic disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 active:scale-95"
          >
            {isSubmitting ? 'Senkronize Ediliyor...' : (initialData ? 'Protokolü Güncelle' : 'Kaydı Tamamla')}
          </button>
      </div>
    </form>
  );
}
