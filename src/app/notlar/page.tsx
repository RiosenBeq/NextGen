import { getNotes } from '@/features/notlar/actions';
import NoteList from '@/features/notlar/components/NoteList';
import { StickyNote, Clock3 } from 'lucide-react';

export const metadata = {
  title: 'Notlar & Dökümanlar - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="page-wrapper space-y-8 animate-fade-in pb-16">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 shadow-sm">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              <StickyNote className="w-3.5 h-3.5" />
              Kurumsal Hafıza Merkezi
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-slate-900">Sistem Notları & Ajanda</h1>
            <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-500">
              Operasyonel kararları, protokolleri ve ekip notlarını tek noktadan yönetin. Tüm içerikler size özel ve güvenli şekilde saklanır.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Aktif Kayıt</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{notes.length}</p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">Son Durum</p>
              <p className="mt-1 text-sm font-bold text-indigo-700 inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> Güncel</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <NoteList initialNotes={notes} />
      </section>
    </div>
  );
}
