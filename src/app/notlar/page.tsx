import { getNotes } from '@/features/notlar/actions';
import NoteList from '@/features/notlar/components/NoteList';
import { Clock3 } from 'lucide-react';

export const metadata = {
  title: 'Notlar & Dökümanlar — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Hafıza Merkezi</p>
          <h1 className="apple-headline mt-3">Notlar & Ajanda</h1>
          <p className="mt-4 apple-body max-w-2xl">
            Operasyonel kararları, protokolleri ve ekip notlarını tek noktadan yönetin.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="apple-card px-5 py-4 min-w-[140px]">
            <p className="text-[12px] text-[--text-tertiary]">Aktif Kayıt</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>
              {notes.length}
            </p>
          </div>
          <div className="apple-card px-5 py-4 min-w-[140px]">
            <p className="text-[12px] text-[--text-tertiary]">Son Durum</p>
            <p className="mt-1 text-[14px] font-medium text-[--accent] inline-flex items-center gap-1">
              <Clock3 className="w-4 h-4" strokeWidth={1.75} /> Güncel
            </p>
          </div>
        </div>
      </header>

      <section>
        <NoteList initialNotes={notes} />
      </section>
    </div>
  );
}
