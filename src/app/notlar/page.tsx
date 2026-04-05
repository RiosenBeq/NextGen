import { getNotes } from '@/features/notlar/actions';
import NoteList from '@/features/notlar/components/NoteList';
import * as motion from "framer-motion/client";
import { StickyNote, MessageSquareText } from 'lucide-react';

export const metadata = {
  title: 'Notlar & Dökümanlar - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg inline-block mb-3">Kurumsal Hafıza</span>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <StickyNote className="w-6 h-6 text-slate-400" />
            Sistem Notları & Ajanda
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Kurumsal hafıza, stratejik kararlar ve operasyonel protokoller.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
           <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
              <MessageSquareText className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-slate-900">{notes.length} Aktif Kayıt</span>
           </div>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <NoteList initialNotes={notes} />
      </motion.section>
    </div>
  );
}
