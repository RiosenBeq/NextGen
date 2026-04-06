'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Clock3, Plus, Search, StickyNote } from 'lucide-react';
import { deleteNote } from '../actions';
import { NoteForm } from './NoteForm';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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

const THEMES: Record<string, { card: string; badge: string; dot: string }> = {
  zinc: { card: 'border-slate-200 bg-white', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-600' },
  blue: { card: 'border-blue-200 bg-blue-50/40', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  emerald: { card: 'border-emerald-200 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-600' },
  amber: { card: 'border-amber-200 bg-amber-50/40', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-600' },
  rose: { card: 'border-rose-200 bg-rose-50/40', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-600' },
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
      alert(result.error || 'Not silinemedi.');
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
            className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="h-11 px-5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-slate-800 inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Not
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <StickyNote className="mx-auto w-10 h-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Not bulunamadı</p>
          <p className="mt-1 text-xs text-slate-500">Arama kriterini değiştirin veya yeni bir not ekleyin.</p>
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className={cn('rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md', theme.card)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">{note.title}</h3>
                      <span className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide', theme.badge)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', theme.dot)} />
                        {note.color}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap break-words">
                    {note.content || 'İçerik bulunmuyor.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
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
