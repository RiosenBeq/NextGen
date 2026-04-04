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
    <div className="p-6 md:p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] font-black tracking-[0.4em] text-indigo-400 uppercase bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">Knowledge Base</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white heading-elite leading-[0.9] italic">
            Sistem Notları &<br/>Ortak Ajanda
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-xl">
            Kurumsal hafıza, stratejik kararlar ve operasyonel protokollerin merkezi kayıt noktası.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="premium-card px-8 py-6 flex items-center gap-5 bg-white/[0.02] border-white/5 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                 <MessageSquareText className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">DOKÜMANTASYON</p>
                 <p className="text-2xl font-black text-white tracking-tighter italic">{notes.length} Aktif Kayıt</p>
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
