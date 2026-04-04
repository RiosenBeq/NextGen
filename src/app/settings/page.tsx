"use client";

import { useEffect, useState } from 'react';
import { getActiveLocations, getSystemParameters } from '@/features/ledger/actions';
import { LocationSettingsForm } from '@/features/ledger/components/LocationSettingsForm';
import { SystemParametersForm } from '@/features/ledger/components/SystemParametersForm';
import { Settings, ShieldCheck, Database, HelpCircle, HardDrive, MapPin, Sliders } from 'lucide-react';
import * as motion from "framer-motion/client";
import { SystemDocs } from '@/features/ledger/components/SystemDocs';

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
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10">Administration Console</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <Settings className="w-8 h-8 text-zinc-500" />
             Sistem Yapılandırması
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Hesaplama algoritmalarını, komisyon oranlarını ve lokasyon bazlı finansal parametreleri buradan yönetin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 shadow-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Yetki Seviyesi</span>
              <span className="text-xs font-bold text-indigo-400 uppercase">Root Administrator</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               <ShieldCheck size={20} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <aside className="xl:col-span-4 space-y-8">
           <div className="premium-card p-10 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent border-white/5">
              <h3 className="text-lg font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                 <Database size={20} className="text-indigo-400" /> 
                 Parametre Bilgi Merkezi
              </h3>
              <p className="text-xs font-medium text-zinc-500 leading-relaxed mb-8">
                Bu paneldeki tüm değişiklikler <span className="text-zinc-300 font-bold">Nakit Akış Raporu</span> ve <span className="text-zinc-300 font-bold">Dashboard</span> üzerindeki finansal hesaplamaları anlık olarak günceller.
              </p>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-indigo-400 italic">01</div>
                    <div>
                       <p className="text-xs font-bold text-zinc-300 mb-1">Vergi Hassasiyeti</p>
                       <p className="text-[10px] text-zinc-500 leading-normal font-medium italic">Kira KDV oranları fatura türüne göre (Tevkifat vb.) her lokasyon için ayrı tanımlanmalıdır.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-emerald-400 italic">02</div>
                    <div>
                       <p className="text-xs font-bold text-zinc-300 mb-1">Ciro Payı Algoritması</p>
                       <p className="text-[10px] text-zinc-500 leading-normal font-medium italic">Ciro eşiği aşılmadığı sürece sadece Sabit Kira ve Aidat hesaplanır, aşılırsa fark ciro payı olarak eklenir.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowDocs(true)}
                className="w-full mt-10 py-4 px-6 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
              >
                 <HelpCircle size={14} className="group-hover:text-indigo-400 transition-colors" />
                 Sistem Dökümantasyonu
              </button>
           </div>
        </aside>

        <main className="xl:col-span-8 space-y-12">
          {/* Global Parameters */}
          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-tight italic">Global Değişkenler</h2>
                <div className="flex-1 h-[1px] bg-white/[0.04]" />
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
