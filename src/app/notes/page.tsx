import { createClient } from '@/utils/supabase/server';

export default async function Notes() {
  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-950 text-white font-sans">
      <div className="max-w-2xl w-full p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Supabase Notes
        </h1>
        
        <div className="space-y-4">
          {notes && notes.length > 0 ? (
            notes.map((note: any) => (
              <div 
                key={note.id} 
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-emerald-500/50 transition-all duration-300"
              >
                <p className="text-zinc-300">{note.title}</p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              <p>No notes found. Have you run the SQL script in Supabase Dashboard?</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800">
          <pre className="text-xs p-4 bg-black rounded-lg overflow-auto max-h-60 text-emerald-500/80">
            {JSON.stringify(notes, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
