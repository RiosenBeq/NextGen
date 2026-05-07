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
  { id: 'zinc', dot: 'bg-[--text]', label: 'Nötr' },
  { id: 'blue', dot: 'bg-[--accent]', label: 'Mavi' },
  { id: 'emerald', dot: 'bg-[--text-secondary]', label: 'Yeşil' },
  { id: 'amber', dot: 'bg-[--text-tertiary]', label: 'Amber' },
  { id: 'rose', dot: 'bg-[--danger]', label: 'Pembe' },
];

const inputBase =
  'w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px]';

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
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[--text]">Başlık</label>
        <input
          autoFocus
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Nisan operasyon toplantı kararı"
          className={inputBase}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[--text]">İçerik</label>
        <textarea
          required
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Not detayları…"
          className={cn(inputBase, 'resize-none leading-relaxed')}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[--text]">Renk</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setColor(item.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium transition-colors min-h-[36px]',
                color === item.id
                  ? 'bg-[--text] text-white'
                  : 'bg-[--bg-elevated] text-[--text-secondary] hover:text-[--text]'
              )}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full', item.dot)} />
              {item.label}
              {color === item.id && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-[--danger-soft] px-4 py-3 text-[14px] font-medium text-[--danger]">{error}</p>
      )}

      <div className="pt-6 border-t border-[--border] flex justify-end gap-3">
        <button type="button" onClick={() => onClose?.()} className="elite-button-secondary">
          Vazgeç
        </button>
        <button type="submit" disabled={isSubmitting} className="elite-button-primary">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
          {initialData ? 'Kaydet' : 'Not Oluştur'}
        </button>
      </div>
    </form>
  );
}
