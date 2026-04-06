'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { addNote, updateNote } from '../actions';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type NoteDraft = {
  id: string | number;
  title: string;
  content?: string;
  color: string;
};

interface Props {
  initialData?: NoteDraft;
  onClose?: () => void;
}

const COLORS = [
  { id: 'zinc', dot: 'bg-slate-900', ring: 'ring-slate-900', label: 'Nötr' },
  { id: 'blue', dot: 'bg-blue-600', ring: 'ring-blue-600', label: 'Mavi' },
  { id: 'emerald', dot: 'bg-emerald-600', ring: 'ring-emerald-600', label: 'Yeşil' },
  { id: 'amber', dot: 'bg-amber-600', ring: 'ring-amber-600', label: 'Amber' },
  { id: 'rose', dot: 'bg-rose-600', ring: 'ring-rose-600', label: 'Pembe' },
];

export function NoteForm({ initialData, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [color, setColor] = useState(initialData?.color || 'zinc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      color,
    };

    const result = initialData
      ? await updateNote(initialData.id, payload.title, payload.content, payload.color)
      : await addNote(payload.title, payload.content, payload.color);

    if (!result.success) {
      setError(result.error || 'Not kaydedilemedi.');
      setIsSubmitting(false);
      return;
    }

    router.refresh();
    onClose?.();
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div>
        <h4 className="text-xl font-bold text-slate-900 tracking-tight">
          {initialData ? 'Notu Güncelle' : 'Yeni Not Ekle'}
        </h4>
        <p className="text-xs text-slate-500 mt-1">Kısa, net ve aranabilir notlar oluşturun.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Başlık</label>
        <input
          autoFocus
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: Nisan operasyon toplantı kararı"
          className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">İçerik</label>
        <textarea
          required
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Not detayları..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Renk</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setColor(item.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                color === item.id
                  ? 'border-slate-300 bg-white text-slate-900 ring-2 ring-offset-1'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
              )}
            >
              <span className={cn('w-3 h-3 rounded-full', item.dot)} />
              {item.label}
              {color === item.id && <Check className={cn('w-3.5 h-3.5', item.ring.replace('ring-', 'text-'))} />}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-50"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Kaydet' : 'Not Oluştur'}
        </button>
      </div>
    </form>
  );
}
