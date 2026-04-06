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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Not Başlığı</label>
        <input
          autoFocus
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Başlık giriniz..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-bold text-lg outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Not Detayları</label>
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hafızaya alınacak detaylar, kararlar veya hatırlatıcılar..."
          rows={6}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium leading-relaxed resize-none outline-none"
        />
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">Kategori Rengi</label>
        <div className="flex justify-center gap-3">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.id)}
              className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center relative ${
                color === c.id ? `scale-110 -translate-y-0.5 border-blue-500 shadow-lg ${c.bg}` : 'border-slate-100 bg-white opacity-40 hover:opacity-100'
              } ${c.bg}`}
            >
              {color === c.id && (
                <motion.div layoutId="activeColor" className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all hover:bg-slate-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Kaydediliyor...' : (initialData ? 'Notu Güncelle' : 'Notu Kaydet')}
          </button>
      </div>
    </form>
  );
}
