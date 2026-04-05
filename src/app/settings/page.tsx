"use client";

import { useEffect, useState } from 'react';
import { getActiveLocations, getSystemParameters } from '@/features/ledger/actions';
import { LocationSettingsForm } from '@/features/ledger/components/LocationSettingsForm';
import { SystemParametersForm } from '@/features/ledger/components/SystemParametersForm';
import { Settings, ShieldCheck, Database, HelpCircle, HardDrive, MapPin, Sliders } from 'lucide-react';
import * as motion from "framer-motion/client";
import { SystemDocs } from '@/features/ledger/components/SystemDocs';

import AppSettingsPanel from '@/features/ledger/components/AppSettingsPanel';

export default function SettingsPage() {
  const [showDocs, setShowDocs] = useState(false);
  const [data, setData] = useState<{
    locations: any[];
    parameters: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const locations = await getActiveLocations();
      const parameters = await getSystemParameters();
      setData({ locations: locations || [], parameters: parameters || {} });
    }
    fetchData();
  }, []);

  if (!data) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in relative">
      <SystemDocs isOpen={showDocs} onClose={() => setShowDocs(false)} />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10">Yönetim Konsolu</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4 uppercase italic tracking-tighter">
             <Settings className="w-10 h-10 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
             Sistem Yapılandırması
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Uygulama davranışlarını, hesaplama algoritmalarını ve lokasyon bazlı finansal parametreleri tek noktadan yönetin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Yetki Seviyesi</span>
              <span className="text-xs font-black text-blue-400 uppercase italic">Tam Yetkili Yönetici</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
               <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <aside className="xl:col-span-4 space-y-8">
           <div className="premium-card p-10 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent border-white/5 rounded-[40px]">
              <h3 className="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-3 italic uppercase">
                 <Database size={20} className="text-blue-400" /> 
                 Parametre Bilgi Merkezi
              </h3>
              <p className="text-xs font-medium text-zinc-500 leading-relaxed mb-8">
                Bu paneldeki tüm değişiklikler <span className="text-zinc-300 font-bold italic underline decoration-blue-500/30 underline-offset-4">Raporlar</span> ve <span className="text-zinc-300 font-bold italic underline decoration-blue-500/30 underline-offset-4">Dashboard</span> üzerindeki finansal algoritmaları anlık olarak tetikler.
              </p>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.01] border border-white/5 group hover:border-blue-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-[11px] font-black text-blue-400 italic border border-blue-500/10">01</div>
                    <div>
                       <p className="text-xs font-black text-zinc-300 mb-1 uppercase tracking-tight">Dinamik Ayarlar</p>
                       <p className="text-[10px] text-zinc-500 leading-relaxed font-medium italic">Pop-up konumu ve animasyon hızı gibi kullanıcı deneyimi ayarları anlık olarak değişir.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.01] border border-white/5 group hover:border-emerald-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-[11px] font-black text-emerald-400 italic border border-emerald-500/10">02</div>
                    <div>
                       <p className="text-xs font-black text-zinc-300 mb-1 uppercase tracking-tight">Finansal Algoritma</p>
                       <p className="text-[10px] text-zinc-500 leading-relaxed font-medium italic">Ciro eşiği algoritmaları, her şubenin özel mülkiyet anlaşmasına göre hassas şekilde ayarlanmalıdır.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowDocs(true)}
                className="w-full mt-10 py-5 px-6 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center gap-3 group italic shadow-xl"
              >
                 <HelpCircle size={16} className="group-hover:rotate-12 transition-transform" />
                 Sistem Dökümantasyonu
              </button>
           </div>
        </aside>

        <main className="xl:col-span-8 space-y-16">
          {/* App UI Settings */}
          <AppSettingsPanel initialParams={data.parameters} />

          {/* Global Parameters */}
          <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Sliders className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-black text-white tracking-tight italic uppercase">Finansal Değişkenler</h2>
                <div className="flex-1 h-[1px] bg-white/[0.06] shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
             </div>
             <SystemParametersForm parameters={data.parameters} />
          </div>
          
          {/* Location Parameters */}
          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white tracking-tight italic">Şube Lokasyon Ayarları</h2>
                <div className="flex-1 h-[1px] bg-white/[0.04]" />
             </div>

             <div className="space-y-6">
                {data.locations.map((loc: any) => (
                  <LocationSettingsForm key={loc.id} location={loc} />
                ))}

                {data.locations.length === 0 && (
                  <div className="premium-card p-20 text-center border-dashed border-white/5 bg-transparent">
                     <p className="text-xs font-bold text-zinc-600 uppercase tracking-[0.4em]">Aktif Lokasyon Verisi Bulunmuyor</p>
                  </div>
                )}
             </div>
          </div>
        </main>
      </section>
    </div>
  );
}
