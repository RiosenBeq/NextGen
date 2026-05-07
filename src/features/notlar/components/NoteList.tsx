'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Clock3, Plus, Search, StickyNote } from 'lucide-react';
import { deleteNote } from '../actions';
import { NoteForm } from './NoteForm';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/useToast';

type Note = {
  id: string | number;
  title: string;
  content?: string;
  color: string;
  createdAt: string;
};

interface Props {
  initialNotes: Note[];
}

const THEMES: Record<string, { dot: string; label: string }> = {
  zinc: { dot: 'bg-[--text-tertiary]', label: 'Nötr' },
  blue: { dot: 'bg-[--accent]', label: 'Mavi' },
  emerald: { dot: 'bg-[--text]', label: 'Yeşil' },
  amber: { dot: 'bg-[--text-secondary]', label: 'Amber' },
  rose: { dot: 'bg-[--danger]', label: 'Pembe' },
};

export default function NoteList({ initialNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
  }, [notes, searchQuery]);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    const result = await deleteNote(id);
    if (!result.success) {
      toast.error(result.error || 'Not silinemedi.');
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary]" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara…"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors min-h-[44px]"
          />
        </div>

        <button onClick={() => setIsAdding(true)} className="elite-button-primary">
          <Plus className="w-4 h-4" strokeWidth={2} />
          Yeni Not
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="empty-state apple-card">
          <StickyNote className="empty-state-icon" />
          <p className="empty-state-title">Not bulunamadı</p>
          <p className="empty-state-desc">Arama kriterini değiştirin veya yeni bir not ekleyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filteredNotes.map((note) => {
              const theme = THEMES[note.color] || THEMES.zinc;
              return (
                <motion.article
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="apple-card p-5 hover:border-[--border-strong] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', theme.dot)} />
                        <span className="text-[12px] text-[--text-tertiary]">{theme.label}</span>
                      </div>
                      <h3 className="text-[16px] font-medium text-[--text] truncate" style={{ letterSpacing: '-0.014em' }}>{note.title}</h3>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="w-9 h-9 rounded-full hover:bg-[--bg-elevated] text-[--text-tertiary] hover:text-[--text] inline-flex items-center justify-center transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="w-9 h-9 rounded-full hover:bg-[--danger-soft] text-[--text-tertiary] hover:text-[--danger] inline-flex items-center justify-center transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-5 text-[14px] leading-relaxed text-[--text-secondary] whitespace-pre-wrap break-words">
                    {note.content || 'İçerik bulunmuyor.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-[--border] pt-3 text-[12px] text-[--text-tertiary] tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <PremiumModal
        isOpen={isAdding || !!editingNote}
        onClose={() => {
          setIsAdding(false);
          setEditingNote(null);
        }}
        title={editingNote ? 'Notu Düzenle' : 'Yeni Not'}
        maxWidth="max-w-2xl"
      >
        <NoteForm
          initialData={editingNote || undefined}
          onClose={() => {
            setIsAdding(false);
            setEditingNote(null);
          }}
        />
      </PremiumModal>
    </div>
  );
}
