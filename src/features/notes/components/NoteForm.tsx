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
    { id: 'zinc', bg: 'bg-slate-100', border: 'border-slate-300' },
    { id: 'blue', bg: 'bg-blue-100', border: 'border-blue-300' },
    { id: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-300' },
    { id: 'amber', bg: 'bg-amber-100', border: 'border-amber-300' },
    { id: 'rose', bg: 'bg-rose-100', border: 'border-rose-300' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
               <StickyNote className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
               {initialData ? 'Kaydı Güncelle' : 'Yeni Kayıt Oluştur'}
            </h3>
         </div>
         <button 
           onClick={onClose}
           className="p-2 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"
         >
           <X size={18} />
         </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">BAŞLIK</label>
          <input
            autoFocus
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Not başlığını giriniz..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">İÇERİK / DETAYLAR</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Sistem notu veya dokümantasyon detaylarını buraya yazınız..."
            rows={5}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium resize-none"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">KATEGORİ RENK KODU</label>
          <div className="flex justify-center gap-3">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${
                  color === c.id ? `scale-110 shadow hover:shadow-md ${c.border}` : 'border-transparent opacity-60 hover:opacity-100'
                } ${c.bg}`}
              >
                {color === c.id && <div className="w-2 h-2 rounded-full bg-slate-800 shadow-sm" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] tracking-widest py-3 rounded-xl transition-all uppercase border border-slate-200"
            >
              İPTAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] tracking-widest py-3 rounded-xl transition-all shadow-sm active:scale-95 uppercase disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'KAYDEDİLİYOR...' : (initialData ? 'GÜNCELLE' : 'KAYDET')}
              <Plus size={14} />
            </button>
        </div>
      </form>
    </div>
  );
}
