'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  Filter, 
  Search, 
  Download, 
  ChevronRight,
  ArrowRight,
  Receipt,
  Calendar,
  Building2,
  Activity,
  HandCoins,
  CreditCard,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import MonthlyPerformanceForm from '@/features/ledger/components/MonthlyPerformanceForm';
import { deleteMonthlyPerformance } from '@/features/ledger/actions';
import Link from 'next/link';
import { Trash2, Edit2, Zap } from 'lucide-react';

interface GelirGiderProps {
  summary: {
    gross: number;
    expense: number;
    net: number;
    margin: number;
  };
  entries: any[];
  categories: any[];
  locations: any[];
  filters: {
    month: string;
    location: string;
    category: string;
  };
  breakdown: any[];
}

export default function GelirGiderClientUI({ summary, entries, categories, locations, filters, breakdown }: GelirGiderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const handleDelete = async (perfId: string) => {
    if (confirm("Bu performans kaydını silmek istediğinize emin misiniz? Tüm hesaplamalar etkilenecektir.")) {
      const res = await deleteMonthlyPerformance(perfId);
      if (res.success) {
        setIsDrawerOpen(false);
        window.location.reload();
      } else {
        alert("Silme hatası: " + res.error);
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      
      {/* 1. HEADER & FILTERS */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 border border-blue-100">Financial Ledger</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-3 mt-1">
              <Wallet className="w-8 h-8 text-slate-400" />
              Gelir & Gider Analizi
           </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="p-1.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-1">
              <FilterLink 
                href={`/gelir-gider?month=${filters.month}&location=all&category=${filters.category}`} 
                active={filters.location === 'all'} 
                label="Tümü" 
              />
              {locations.map(loc => (
                <FilterLink 
                   key={loc.id} 
                   href={`/gelir-gider?month=${filters.month}&location=${loc.id}&category=${filters.category}`} 
                   active={filters.location === loc.id} 
                   label={loc.name} 
                />
              ))}
           </div>
           
           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 flex items-center gap-2"
           >
              <Plus size={16} strokeWidth={2.5} />
              Gider Ekle
           </button>
        </div>
      </header>

      {/* 2. KPI SUMMARY (PREMIUM FLAT CARDS) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard 
            label="Brüt Gelir" 
            value={formatCurrency(summary.gross)} 
            icon={<TrendingUp className="text-emerald-500" />} 
            color="emerald"
            subtitle="Kayıtlı ciro akışı"
         />
         <KPICard 
            label="Toplam Gider" 
            value={formatCurrency(summary.expense)} 
            icon={<TrendingDown className="text-rose-500" />} 
            color="rose"
            subtitle="KDV Dahil Harcamalar"
         />
         <KPICard 
            label="Net Nakit Akışı" 
            value={formatCurrency(summary.net)} 
            icon={<Wallet className="text-blue-500" />} 
            color="blue"
            subtitle="Serbest Nakit (P&L)"
            highlight={true}
         />
         <KPICard 
            label="Operasyonel Marj" 
            value={`%${summary.margin.toFixed(1)}`} 
            icon={<Activity className="text-amber-500" />} 
            color="amber"
            subtitle="Verimlilik Oranı"
         />
      </section>

      {/* 3. MAIN CONTENT: TABLE + SIDEBAR BREAKDOWN */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         
         {/* Ledger Table */}
         <section className="xl:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Aylık Finansal Döküm</h3>
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4 flex items-center gap-1">
                  Dışa Aktar (CSV) <Download size={12} />
               </button>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dönem / Şube</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Oturum</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Brüt</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gider</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {entries.map((entry, idx) => (
                        <tr 
                          key={idx} 
                          className="group hover:bg-slate-50/40 transition-colors cursor-pointer"
                          onClick={() => { setSelectedEntry(entry); setIsDrawerOpen(true); }}
                        >
                           <td className="px-6 py-5">
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter decoration-slate-200 underline decoration-1 underline-offset-2">{entry.month}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{entry.locationName}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-center">
                              <span className="text-sm font-mono font-bold text-slate-500 tabular-nums">{entry.sessions}</span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <span className="text-sm font-bold text-slate-900 tabular-nums tracking-tighter">{formatCurrency(entry.grossRevenue)}</span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <span className="text-sm font-bold text-rose-500 tabular-nums tracking-tighter italic">-{formatCurrency(entry.avmExpense)}</span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <span className={cn(
                                 "text-sm font-black tabular-nums tracking-tighter italic",
                                 entry.netCash >= 0 ? "text-emerald-600" : "text-rose-600"
                              )}>
                                 {formatCurrency(entry.netCash)}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </section>

         {/* Sidebar Breakdown */}
         <section className="xl:col-span-4 space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest italic px-2">Grup Bazlı Analiz</h3>
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-8 shadow-sm">
               
               <div className="space-y-6">
                  {breakdown.map((item, i) => (
                    <div key={i} className="space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-2 h-6 rounded-full", item.color)} />
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</span>
                                <span className="text-[9px] font-medium text-slate-300 uppercase tracking-widest italic">{item.subLabel}</span>
                             </div>
                          </div>
                          <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(item.value)}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: `${(item.value / summary.expense) * 100}%` }} 
                             transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                             className={cn("h-full rounded-full opacity-80", item.color)}
                          />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kümülatif Gider</p>
                  <p className="text-lg font-black text-slate-900 tracking-tighter italic">{formatCurrency(summary.expense)}</p>
               </div>
            </div>
         </section>
      </div>

      {/* MODALS & DRAWERS */}
      <PremiumModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Yeni Finansal Veri Girişi"
      >
        <ExpenseForm 
          locations={locations} 
          onClose={() => { setIsModalOpen(false); window.location.reload(); }} 
        />
      </PremiumModal>

      <PremiumDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => { setIsDrawerOpen(false); setIsEditing(false); }} 
        title={isEditing ? "Veriyi Güncelle" : "Dönem Analizi"}
      >
        {selectedEntry && (
          <div className="space-y-12 py-6">
             {isEditing ? (
               <MonthlyPerformanceForm 
                 id={selectedEntry.perfId}
                 initialData={{
                   sessions: selectedEntry.sessions,
                   extraExpense: selectedEntry.extraExpense,
                   extraNotes: selectedEntry.extraNotes,
                   month: selectedEntry.monthId,
                   locationName: selectedEntry.locationName
                 }}
                 onClose={() => setIsEditing(false)}
                 onDelete={handleDelete}
               />
             ) : (
               <>
                 <div className="p-8 rounded-[40px] bg-slate-950 text-white space-y-6 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                       <PieChart size={120} />
                    </div>
                    <div className="relative space-y-1">
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{selectedEntry.month}</p>
                       <p className="text-4xl font-black italic tracking-tighter">{selectedEntry.locationName}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 pt-4">
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Brüt Gelir</p>
                          <p className="text-xl font-bold italic tracking-tight">{formatCurrency(selectedEntry.grossRevenue)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Toplam Seans</p>
                          <p className="text-xl font-bold italic tracking-tight">{selectedEntry.sessions}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8 px-2">
                    <div className="flex items-center justify-between">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Gider Kalemleri</h4>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(selectedEntry.perfId)}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-white transition-all shadow-sm"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <DetailMetric label="Sözleşme Ciro Payı" value={formatCurrency(selectedEntry.revenueShare)} icon={<HandCoins size={14} />} />
                       <DetailMetric label="AVM Sabit Giderler" value={formatCurrency(selectedEntry.avmExpense - selectedEntry.revenueShare)} icon={<Building2 size={14} />} />
                       <DetailMetric label="Ödeme Sistemleri Kesintisi" value={formatCurrency(selectedEntry.totalCommission)} icon={<CreditCard size={14} />} />
                       {selectedEntry.extraExpense > 0 && (
                         <DetailMetric label="Operasyonel Ekstra" value={formatCurrency(selectedEntry.extraExpense)} icon={<Zap size={14} />} />
                       )}
                    </div>
                    {selectedEntry.extraNotes && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100/50">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">NOTLAR</p>
                        <p className="text-xs font-bold text-amber-900/80 italic">{selectedEntry.extraNotes}</p>
                      </div>
                    )}
                 </div>

                 <div className="pt-8 px-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dönem Kârı</span>
                       <span className={cn(
                          "text-2xl font-black tracking-tighter italic",
                          selectedEntry.netCash >= 0 ? "text-emerald-600" : "text-rose-600"
                       )}>{formatCurrency(selectedEntry.netCash)}</span>
                    </div>
                    <div className={cn(
                       "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm",
                       selectedEntry.netCash >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                    )}>
                       {selectedEntry.netCash >= 0 ? <TrendingUp /> : <TrendingDown />}
                    </div>
                 </div>
               </>
             )}
          </div>
        )}
      </PremiumDrawer>

    </div>
  );
}

function KPICard({ label, value, icon, color, subtitle, highlight = false }: any) {
  const colors: any = {
    emerald: "bg-emerald-50/50 border-emerald-100/50",
    rose: "bg-rose-50/50 border-rose-100/50",
    blue: "bg-blue-50/50 border-blue-100/50 shadow-blue-100/20",
    amber: "bg-amber-50/50 border-amber-100/50",
  };

  return (
    <div className={cn(
      "bg-white border border-slate-200 p-8 rounded-[36px] space-y-5 shadow-sm hover:shadow-md transition-all group",
      highlight && "ring-1 ring-blue-500/10 border-blue-200/50 shadow-xl shadow-blue-500/5"
    )}>
       <div className="flex items-center justify-between">
          <div className={cn("p-2.5 rounded-2xl border flex items-center justify-center transition-colors group-hover:bg-white", colors[color])}>
             {icon}
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Live Data</p>
       </div>
       <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{value}</p>
       </div>
       <div className="pt-2 border-t border-slate-50">
          <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">{subtitle}</p>
       </div>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string, active: boolean, label: string }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        active 
          ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
          : "text-slate-400 hover:text-slate-600"
      )}
    >
      {label}
    </Link>
  );
}

function DetailMetric({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center justify-between group">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
             {icon}
          </div>
          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">{label}</span>
       </div>
       <span className="text-sm font-bold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
