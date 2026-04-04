'use client';

import { useState } from 'react';
import { addNote, updateNote } from '../actions';
import { Loader2, Plus, X, Save, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Props {
  initialData?: any;
  onClose?: () => void;
}

const COLORS = [
  { name: 'Silver', value: 'zinc' },
  { name: 'Blue', value: 'blue' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Amber', value: 'amber' },
  { name: 'Rose', value: 'rose' },
];

export function NoteForm({ initialData, onClose }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [color, setColor] = useState(initialData?.color || 'zinc');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    let result;
    if (initialData?.id) {
      result = await updateNote(initialData.id, title, content, color);
    } else {
      result = await addNote(title, content, color);
    }

    if (result.success) {
      router.refresh();
      if (onClose) onClose();
      else {
        setTitle('');
        setContent('');
        setColor('zinc');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="premium-card p-6 border-slate-200 bg-white shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          {initialData ? <Edit3 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-emerald-500" />}
          {initialData ? 'Notu Düzenle' : 'Yeni Not Ekle'}
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Başlık</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="elite-input w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Not başlığı..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İçerik (Opsiyonel)</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="elite-input w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all min-h-[120px] resize-none"
            placeholder="Detaylı açıklama..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Renk Etiketi</label>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  color === c.value ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'
                }`}
                title={c.name}
                style={{ backgroundColor: `var(--elite-${c.value === 'zinc' ? 'indigo' : c.value})`, border: color === c.value ? '2px solid #1e293b' : 'none' }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl w-full mt-4 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          {initialData ? 'GÜNCELLE' : 'KAYDET'}
        </button>
      </form>
    </div>
  );
}
