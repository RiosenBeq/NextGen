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

const inputBase =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150';

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
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div>
        <h4 className="text-xl font-semibold text-slate-900 tracking-tight">
          {initialData ? 'Notu Güncelle' : 'Yeni Not Ekle'}
        </h4>
        <p className="text-sm text-slate-500 mt-1">Kısa, net ve aranabilir notlar oluşturun.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Başlık</label>
        <input
          autoFocus
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: Nisan operasyon toplantı kararı"
          className={inputBase}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">İçerik</label>
        <textarea
          required
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Not detayları..."
          className={cn(inputBase, 'resize-none leading-relaxed')}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Renk</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setColor(item.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                color === item.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full', item.dot)} />
              {item.label}
              {color === item.id && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>
      )}

      <div className="pt-6 border-t border-slate-200/70 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Kaydet' : 'Not Oluştur'}
        </button>
      </div>
    </form>
  );
}
