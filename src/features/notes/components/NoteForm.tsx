'use client';

import { useState } from 'react';
import { X, Plus, StickyNote } from 'lucide-react';
import { addNote, updateNote } from '../actions';

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
    { id: 'zinc', bg: 'bg-zinc-800', border: 'border-white/20' },
    { id: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
    { id: 'emerald', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
    { id: 'amber', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
    { id: 'rose', bg: 'bg-rose-500/20', border: 'border-rose-500/40' },
  ];

  return (
    <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
               <StickyNote className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
               {initialData ? 'Kaydı Güncelle' : 'Yeni Kayıt Oluştur'}
            </h3>
         </div>
         <button 
           onClick={onClose}
           className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
         >
           <X size={20} />
         </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">BAŞLIK</label>
          <input
            autoFocus
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Not başlığını giriniz..."
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all font-bold tracking-tight text-lg italic"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">İÇERİK / DETAYLAR</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Sistem notu veya dokümantasyon detaylarını buraya yazınız..."
            rows={6}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all font-medium leading-relaxed resize-none"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-center block">KATEGORİ RENK KODU</label>
          <div className="flex justify-center gap-4">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center ${
                  color === c.id ? `scale-110 shadow-lg shadow-${c.id}-500/20 ${c.border}` : 'border-white/5 opacity-40 hover:opacity-100'
                } ${c.bg}`}
              >
                {color === c.id && <div className="w-2 h-2 rounded-full bg-white shadow-xl" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black text-[10px] tracking-widest py-5 rounded-2xl transition-all uppercase border border-white/5"
            >
              İPTAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-zinc-200 text-black font-black text-[10px] tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-95 uppercase disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'KAYDEDİLİYOR...' : (initialData ? 'GÜNCELLE' : 'KAYDET')}
              <Plus size={14} />
            </button>
        </div>
      </form>
    </div>
  );
}
