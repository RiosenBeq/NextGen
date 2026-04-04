import { getNotes } from '@/features/notes/actions';
import NoteList from '@/features/notes/components/NoteList';
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg inline-block mb-2">Knowledge Base</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            Sistem Notları & Ajanda
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xl">
            Kurumsal hafıza, stratejik kararlar ve operasyonel protokollerin merkezi kayıt noktası.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="premium-card px-8 py-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                 <MessageSquareText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DOKÜMANTASYON</p>
                 <p className="text-2xl font-bold text-slate-900">{notes.length} Aktif Kayıt</p>
              </div>
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
