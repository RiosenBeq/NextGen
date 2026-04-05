'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Beaker, 
  Plus, 
  ChevronRight,
  ArrowRight,
  Activity,
  History,
  Info,
  MoreHorizontal,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import DailyPerformanceForm from '@/features/ledger/components/DailyPerformanceForm';
import { PremiumDrawer } from './PremiumModal';

interface PerformanceClientProps {
  locations: any[];
  history: any[];
  historyLocId: string;
}

export default function PerformanceClientUI({ locations, history, historyLocId }: PerformanceClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="space-y-2">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-2">
              <Activity size={14} className="text-blue-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Saha Operasyonları</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-slate-400" />
              Performans Yönetimi
           </h1>
           <p className="text-sm text-slate-500 font-medium">Manuel veri girişlerini ve günlük operasyonel istatistikleri yönetin.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center gap-2 shadow-sm text-[10px] font-black uppercase tracking-widest italic">
              <CheckCircle2 size={14} />
              Manuel Mod Aktif
           </div>
        </div>
      </header>

      {/* 2. MAIN GRID: FORM + HISTORY */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
         
         {/* LEFT: FORM SECTION */}
         <section className="xl:col-span-5 space-y-8">
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[40px] opacity-10 group-hover:opacity-20 blur-xl transition-opacity"></div>
               <div className="relative">
                  <DailyPerformanceForm 
                    locations={locations} 
                    onSuccess={() => window.location.reload()} 
                  />
               </div>
            </div>

            {/* INFO BOX */}
            <div className="p-8 rounded-[36px] bg-slate-950 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                  <Info size={120} />
               </div>
               <div className="relative space-y-4">
                  <div className="flex items-center gap-2">
                     <Info size={18} className="text-blue-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Veri Mimari Kılavuzu</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     Girdiğiniz günlük veriler (Oturum & Test), ilgili ayın <span className="text-white font-bold italic">Nakit Akışı (P&L)</span> tablolarına otomatik olarak yansıtılır. 
                     Hesaplama algoritmaları bu verileri temel alarak ROI ve Ciro tahminlerini günceller.
                  </p>
               </div>
            </div>
         </section>

         {/* RIGHT: HISTORY LIST */}
         <section className="xl:col-span-7 space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                  <History size={18} className="text-slate-400" />
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Giriş Geçmişi</h3>
               </div>
               <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
                  <FilterLink 
                    href="/performans?location=all" 
                    active={historyLocId === '' || historyLocId === 'all'} 
                    label="Tümü" 
                  />
                  {locations.map(loc => (
                    <FilterLink 
                      key={loc.id} 
                      href={`/performans?location=${loc.id}`} 
                      active={historyLocId === loc.id} 
                      label={loc.name} 
                    />
                  ))}
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tarih / Şube</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Oturum</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Test</th>
                        <th className="px-8 py-5"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {history.map((row, idx) => (
                        <tr 
                          key={row.id || idx} 
                          className="group hover:bg-slate-50/30 transition-all cursor-pointer"
                          onClick={() => { setSelectedRow(row); setIsDrawerOpen(true); }}
                        >
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                 <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter decoration-slate-200 underline decoration-1 underline-offset-4 group-hover:text-blue-600 transition-colors">{formatMonth(row.date)}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.location?.name || 'BELİRTİLMEMİŞ'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-mono font-bold shadow-inner">
                                 {row.sessionCount}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-mono font-bold">
                                 {row.testCount}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                 <ArrowRight size={14} strokeWidth={3} />
                              </div>
                           </td>
                        </tr>
                     ))}
                     {history.length === 0 && (
                        <tr>
                           <td colSpan={4} className="py-24 text-center">
                              <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                                 <History size={48} className="text-slate-200" />
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Henüz veri girişi yapılmadı.</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </section>
      </div>

      {/* 3. DETAIL DRAWER */}
      <PremiumDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Operasyonel Veri Detayı"
      >
        {selectedRow && (
           <div className="space-y-12 py-6">
              <div className="p-8 rounded-[40px] bg-slate-950 text-white space-y-6 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                    <TrendingUp size={120} />
                 </div>
                 <div className="relative space-y-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{formatMonth(selectedRow.date)}</p>
                    <p className="text-4xl font-black italic tracking-tighter uppercase">{selectedRow.location?.name}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8 pt-4">
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Oturum</p>
                       <p className="text-2xl font-black italic tracking-tight">{selectedRow.sessionCount}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Test Girişi</p>
                       <p className="text-2xl font-black italic tracking-tight">{selectedRow.testCount}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-6 px-2">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic border-b border-slate-50 pb-2 mb-4">Günün Notu / Ekstra Metrikler</h4>
                 {selectedRow.extraMetrics?.notlar ? (
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 italic font-medium text-slate-600 text-sm leading-relaxed">
                       "{selectedRow.extraMetrics.notlar}"
                    </div>
                 ) : (
                    <p className="text-xs text-slate-300 italic font-bold">Herhangi bir not eklenmemiş.</p>
                 )}
              </div>

              <div className="pt-8 px-2 border-t border-slate-50">
                 <button 
                   onClick={() => setIsDrawerOpen(false)}
                   className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02]"
                 >
                   Veri Penceresini Kapat
                 </button>
              </div>
           </div>
        )}
      </PremiumDrawer>

    </div>
  );
}

function FilterLink({ href, active, label }: { href: string, active: boolean, label: string }) {
  return (
    <a 
      href={href} 
      className={cn(
        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        active 
          ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
          : "text-slate-400 hover:text-slate-600"
      )}
    >
      {label}
    </a>
  );
}
