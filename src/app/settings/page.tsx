"use client";

import { useEffect, useState } from 'react';
import { getActiveLocations, getSystemParameters } from '@/features/ledger/actions';
import { LocationSettingsForm } from '@/features/ledger/components/LocationSettingsForm';
import { SystemParametersForm } from '@/features/ledger/components/SystemParametersForm';
import { Settings, ShieldCheck, Database, HelpCircle, MapPin, Sliders, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';
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

  if (!data) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#2F6BFF] animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in relative bg-slate-50 text-slate-900">
      <SystemDocs isOpen={showDocs} onClose={() => setShowDocs(false)} />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-200 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border" style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>Yönetim Konsolu</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4 italic" style={{ color: '#1E2A44' }}>
             <Settings className="w-10 h-10" style={{ color: '#2F6BFF' }} />
             Sistem Yapılandırması
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-lg">
            Uygulama davranışlarını, hesaplama algoritmalarını ve lokasyon bazlı finansal parametreleri tek noktadan yönetin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-6 py-3 rounded-2xl bg-white border border-slate-200 flex items-center gap-5 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Yetki Seviyesi</span>
              <span className="text-xs font-black uppercase italic" style={{ color: '#2F6BFF' }}>Tam Yetkili Yönetici</span>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm" style={{ background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)', color: '#2F6BFF' }}>
               <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <aside className="xl:col-span-4 space-y-8">
           <div className="p-10 border rounded-[40px] bg-white shadow-sm" style={{ borderColor: 'rgba(47,107,255,0.1)' }}>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-3 italic uppercase">
                 <Database size={20} style={{ color: '#2F6BFF' }} /> 
                 Parametre Bilgi Merkezi
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed mb-8">
                Bu paneldeki tüm değişiklikler <span className="font-bold italic" style={{ color: '#1E2A44' }}>Raporlar</span> ve <span className="font-bold italic" style={{ color: '#1E2A44' }}>Dashboard</span> üzerindeki finansal algoritmaları anlık olarak tetikler.
              </p>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-200 transition-all shadow-sm">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black italic border" style={{ background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)', color: '#2F6BFF' }}>01</div>
                    <div>
                       <p className="text-xs font-black text-slate-900 mb-1 uppercase tracking-tight">Dinamik Ayarlar</p>
                       <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">Pop-up konumu ve animasyon hızı gibi kullanıcı deneyimi ayarları anlık olarak değişir.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-200 transition-all shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-[11px] font-black text-emerald-600 italic border border-emerald-200">02</div>
                    <div>
                       <p className="text-xs font-black text-slate-900 mb-1 uppercase tracking-tight">Finansal Algoritma</p>
                       <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">Ciro eşiği algoritmaları, her şubenin özel mülkiyet anlaşmasına göre hassas şekilde ayarlanmalıdır.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowDocs(true)}
                className="w-full mt-10 py-5 px-6 rounded-2xl border text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3 group italic shadow-sm"
                style={{ background: 'white', color: '#64748B', borderColor: '#E2E8F0' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2F6BFF'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#2F6BFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
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
                <Sliders className="w-6 h-6" style={{ color: '#2F6BFF' }} />
                <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Finansal Değişkenler</h2>
                <div className="flex-1 h-[1px] bg-slate-200" />
             </div>
             <SystemParametersForm parameters={data.parameters} />
          </div>

          {/* User Management Link */}
          <div className="space-y-6 pt-4">
             <div className="flex items-center gap-4">
                <Users className="w-6 h-6" style={{ color: '#1E2A44' }} />
                <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Platform Erişimi</h2>
                <div className="flex-1 h-[1px] bg-slate-200" />
             </div>
             
             <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="space-y-2 text-center sm:text-left">
                   <h3 className="text-lg font-bold text-slate-900">Yetkilendirme ve Kullanıcılar</h3>
                   <p className="text-sm font-medium text-slate-500 max-w-sm">Sisteme giriş yapabilen yetkili hesapları ve sistem rollerini yönetin. Sadece Üst Yöneticiler işlem yapabilir.</p>
                </div>
                <Link href="/users" className="px-6 py-4 rounded-xl flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] text-white shadow-md transition-all hover:scale-105 active:scale-95 shrink-0" style={{ background: '#1E2A44' }}>
                   Kullanıcı Yönetimi <ChevronRight size={14} />
                </Link>
             </div>
          </div>
          
          {/* Location Parameters */}
          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight italic">Şube Lokasyon Ayarları</h2>
                <div className="flex-1 h-[1px] bg-slate-200" />
             </div>

             <div className="space-y-6">
                {data.locations.map((loc: any) => (
                  <LocationSettingsForm key={loc.id} location={loc} />
                ))}

                {data.locations.length === 0 && (
                  <div className="premium-card p-20 text-center border-dashed border-slate-200 bg-transparent shadow-none">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Aktif Lokasyon Verisi Bulunmuyor</p>
                  </div>
                )}
             </div>
          </div>
        </main>
      </section>
    </div>
  );
}
