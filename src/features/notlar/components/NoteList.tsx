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
  zinc: { dot: 'bg-slate-500', label: 'Nötr' },
  blue: { dot: 'bg-blue-600', label: 'Mavi' },
  emerald: { dot: 'bg-emerald-600', label: 'Yeşil' },
  amber: { dot: 'bg-amber-600', label: 'Amber' },
  rose: { dot: 'bg-rose-600', label: 'Pembe' },
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara (başlık, içerik)..."
            className="w-full px-4 py-2.5 pl-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
          />
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Not
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white p-14 text-center">
          <StickyNote className="mx-auto w-10 h-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900 tracking-tight">Not bulunamadı</p>
          <p className="mt-1 text-sm text-slate-500">Arama kriterini değiştirin veya yeni bir not ekleyin.</p>
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
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="bg-white border border-slate-200/70 rounded-2xl p-5 hover:border-slate-300/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', theme.dot)} />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{theme.label}</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 tracking-tight truncate">{note.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 inline-flex items-center justify-center transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="w-9 h-9 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 inline-flex items-center justify-center transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap break-words">
                    {note.content || 'İçerik bulunmuyor.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs text-slate-400 tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="w-3.5 h-3.5" />
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
