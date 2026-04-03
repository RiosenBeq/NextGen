'use client';

import { useState } from 'react';
import { addNote, updateNote } from '../actions';
import { Loader2, Plus, X, Save, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="premium-card p-6 border-slate-200">
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
            className="elite-input"
            placeholder="Not başlığı..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İçerik (Opsiyonel)</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="elite-input min-h-[100px] resize-none"
            placeholder="Detaylı açıklama..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Renk Etiketi</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c.value ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                } bg-${c.value}-500`}
                title={c.name}
                style={{ backgroundColor: `var(--elite-${c.value === 'zinc' ? 'indigo' : c.value})` }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="elite-button-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
          {initialData ? 'GÜNCELLE' : 'KAYDET'}
        </button>
      </form>
    </div>
  );
}
