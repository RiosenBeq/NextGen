import { getActiveLocations, getSystemParameters } from '@/features/ledger/actions';
import { LocationSettingsForm } from '@/features/ledger/components/LocationSettingsForm';
import { SystemParametersForm } from '@/features/ledger/components/SystemParametersForm';
import { Settings, ShieldCheck, Database, HelpCircle } from 'lucide-react';
import * as motion from "framer-motion/client";

export const metadata = {
  title: 'Sistem Parametreleri - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const locations = await getActiveLocations();
  const parameters = await getSystemParameters();

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-[2px] bg-zinc-500 rounded-full"></span>
            <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
              Financial Administration
            </span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter heading-elite leading-tight">
            Sistem ve Lokasyon<br/>Parametreleri
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-6 py-3 rounded-2xl glass-panel flex items-center gap-4 shadow-xl border-zinc-500/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Role</span>
              <span className="text-sm font-black text-indigo-400">ROOT ADMINISTRATOR</span>
            </div>
            <ShieldCheck size={20} className="text-indigo-400" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <div className="xl:col-span-4 space-y-8">
           <div className="premium-card p-10 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/10">
              <h3 className="text-lg font-black text-white tracking-tighter mb-4 flex items-center gap-2">
                 <Database size={18} className="text-indigo-400" /> Bilgi Merkezi
              </h3>
              <p className="text-xs font-bold text-zinc-400 leading-relaxed uppercase tracking-widest opacity-80 mb-8">
                Bu paneldeki değişiklikler <span className="text-white">Nakit Akış Raporu</span> ve <span className="text-white">Dashboard</span> üzerindeki tüm geçmiş/gelecek hesaplamaları anlık olarak etkiler.
              </p>
              
              <ul className="space-y-4">
                 <li className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-[10px] font-black text-indigo-400">1</div>
                    <p className="text-[10px] font-bold text-zinc-500 leading-normal">Kira KDV oranları fatura türüne göre (Tevkifat vb.) güncellenmelidir.</p>
                 </li>
                 <li className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-[10px] font-black text-indigo-400">2</div>
                    <p className="text-[10px] font-bold text-zinc-500 leading-normal">Ciro eşiği aşılmadığı sürece sadece Sabit Kira ve Aidat hesaplanır.</p>
                 </li>
              </ul>
           </div>

           <div className="premium-card p-8 bg-zinc-950/20 border-dashed border-white/10 flex items-center gap-4 group cursor-help">
              <HelpCircle className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Dökümantasyonu Görüntüle</span>
           </div>
        </div>

        <div className="xl:col-span-8 space-y-8 pb-20">
          <SystemParametersForm parameters={parameters} />
          
          <div className="flex items-center gap-4 py-4">
             <div className="flex-1 h-[1px] bg-white/5" />
             <h2 className="text-sm font-black text-white/40 tracking-widest uppercase">LOKASYON BAZLI PARAMETRELER</h2>
             <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          {locations.map((loc) => (
            <LocationSettingsForm key={loc.id} location={loc} />
          ))}

          {locations.length === 0 && (
            <div className="premium-card p-20 text-center opacity-30">
               <p className="text-lg font-black uppercase tracking-widest">AKTİF LOKASYON BULUNAMADI</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
