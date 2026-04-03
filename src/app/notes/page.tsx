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
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-[2px] bg-indigo-500 rounded-full" />
            <span className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase">Executive Knowledge Base</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter heading-elite leading-tight">
            Sistem Notları &<br/>Ortak Ajanda
          </h1>
        </div>

        <div className="flex gap-4">
           <div className="premium-card px-8 py-5 flex items-center gap-4 bg-slate-50/50 border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                 <MessageSquareText className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AKSESİBİLİTE</p>
                 <p className="text-xl font-black text-slate-800 tracking-tighter">{notes.length} Aktif Not</p>
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
