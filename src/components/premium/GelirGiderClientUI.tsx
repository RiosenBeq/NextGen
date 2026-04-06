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
  Plus,
  Trash2, 
  Edit2, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import MonthlyPerformanceForm from '@/features/ledger/components/MonthlyPerformanceForm';
import { deleteMonthlyPerformance } from '@/features/ledger/actions';
import Link from 'next/link';

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
    if (confirm("Bu performans kaydını silmek istediğinize emin misiniz?")) {
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Wallet className="w-8 h-8 text-blue-600" />
              Gelir & Gider Analizi
           </h1>
           <p className="text-sm text-slate-500 font-medium italic">Finansal döküm ve operasyonel performans verileri.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="p-1 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
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
             className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
           >
              <Plus size={18} />
              Yeni Kayıt
           </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard label="Brüt Gelir" value={formatCurrency(summary.gross)} icon={<TrendingUp className="text-emerald-600" />} color="emerald" subtitle="Ciro Akışı" />
         <KPICard label="Toplam Gider" value={formatCurrency(summary.expense)} icon={<TrendingDown className="text-rose-600" />} color="rose" subtitle="Harcamalar" />
         <KPICard label="Net Nakit" value={formatCurrency(summary.net)} icon={<Wallet className="text-blue-600" />} color="blue" subtitle="Serbest Nakit" />
         <KPICard label="Kar Marjı" value={`%${summary.margin.toFixed(1)}`} icon={<Activity className="text-amber-600" />} color="amber" subtitle="Verimlilik" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Table */}
         <section className="xl:col-span-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aylık Döküm</h3>
               <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">Dışa Aktar <Download size={12} /></button>
            </div>
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dönem</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Oturum</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Brüt</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Gider</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Net</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {entries.map((entry, idx) => (
                     <tr key={idx} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => { setSelectedEntry(entry); setIsDrawerOpen(true); }}>
                        <td className="px-6 py-5">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{entry.month}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.locationName}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center font-mono text-xs font-bold text-slate-500">{entry.sessions}</td>
                        <td className="px-6 py-5 text-right font-bold text-slate-900 italic">₺{entry.grossRevenue?.toLocaleString('tr-TR')}</td>
                        <td className="px-6 py-5 text-right font-bold text-rose-500 italic">₺{entry.avmExpense?.toLocaleString('tr-TR')}</td>
                        <td className="px-6 py-5 text-right font-bold italic tracking-tighter" style={{ color: entry.netCash >= 0 ? '#10B981' : '#F43F5E' }}>₺{entry.netCash?.toLocaleString('tr-TR')}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </section>

         {/* Breakdown */}
         <section className="xl:col-span-4 bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Grup Analizi</h3>
            <div className="space-y-6">
               {breakdown.map((item, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                       <span className="text-xs font-bold text-slate-900 italic">₺{item.value?.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / summary.expense) * 100}%` }} className={cn("h-full rounded-full", item.color)} />
                    </div>
                 </div>
               ))}
            </div>
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Operasyonel Gider</span>
               <span className="text-lg font-bold text-slate-900 italic tracking-tighter">₺{summary.expense?.toLocaleString('tr-TR')}</span>
            </div>
         </section>
      </div>

      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Giriş">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); window.location.reload(); }} />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => { setIsDrawerOpen(false); setIsEditing(false); }} title={isEditing ? "Güncelle" : "Dönem Detayı"}>
        {selectedEntry && (
          <div className="space-y-10 py-6">
             {isEditing ? (
               <MonthlyPerformanceForm id={selectedEntry.perfId} initialData={{ sessions: selectedEntry.sessions, extraExpense: selectedEntry.extraExpense, extraNotes: selectedEntry.extraNotes, month: selectedEntry.monthId, locationName: selectedEntry.locationName }} onClose={() => setIsEditing(false)} onDelete={handleDelete} />
             ) : (
               <>
                  <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-xl">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{selectedEntry.month}</p>
                        <p className="text-3xl font-bold italic tracking-tighter">{selectedEntry.locationName}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/10">
                        <div className="space-y-1"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Brüt</p><p className="text-lg font-bold italic">₺{selectedEntry.grossRevenue?.toLocaleString('tr-TR')}</p></div>
                        <div className="space-y-1"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seans</p><p className="text-lg font-bold italic">{selectedEntry.sessions}</p></div>
                     </div>
                  </div>
                  <div className="space-y-6 px-1">
                     <div className="flex items-center justify-between"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Giderler</h4><div className="flex gap-2"><button onClick={() => setIsEditing(true)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDelete(selectedEntry.perfId)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button></div></div>
                     <DetailMetric label="Ciro Payı" value={formatCurrency(selectedEntry.revenueShare)} icon={<HandCoins size={14} />} />
                     <DetailMetric label="AVM Sabit" value={formatCurrency(selectedEntry.avmExpense - selectedEntry.revenueShare)} icon={<Building2 size={14} />} />
                     <DetailMetric label="Komisyon" value={formatCurrency(selectedEntry.totalCommission)} icon={<CreditCard size={14} />} />
                     {selectedEntry.extraExpense > 0 && <DetailMetric label="Ekstra" value={formatCurrency(selectedEntry.extraExpense)} icon={<Zap size={14} />} />}
                  </div>
                  <div className="pt-8 px-1 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Kâr</span><span className="text-2xl font-bold italic tracking-tighter" style={{ color: selectedEntry.netCash >= 0 ? '#10B981' : '#F43F5E' }}>{formatCurrency(selectedEntry.netCash)}</span></div>
                     <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", selectedEntry.netCash >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600")}><TrendingUp size={20} /></div>
                  </div>
               </>
             )}
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function KPICard({ label, value, icon, color, subtitle }: any) {
  const borderColors: any = { emerald: "border-emerald-100", rose: "border-rose-100", blue: "border-blue-100", amber: "border-amber-100" };
  return (
    <div className={cn("bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-all group", borderColors[color])}>
       <div className="flex items-center justify-between"><div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-inner group-hover:bg-slate-50 transition-colors">{icon}</div><span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">AUDITED</span></div>
       <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p><p className="text-2xl font-bold text-slate-900 tracking-tighter italic">{value}</p></div>
       <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest border-t border-slate-50 pt-2">{subtitle}</p>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string, active: boolean, label: string }) {
  return (
    <Link href={href} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", active ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>{label}</Link>
  );
}

function DetailMetric({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">{icon}</div><span className="text-xs font-bold text-slate-500">{label}</span></div><span className="text-sm font-bold text-slate-900 tabular-nums">{value}</span></div>
  );
}
