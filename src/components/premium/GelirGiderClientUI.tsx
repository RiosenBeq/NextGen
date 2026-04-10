'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
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
  availableMonths: string[];
}

export default function GelirGiderClientUI({ 
  summary, 
  entries, 
  categories, 
  locations, 
  filters, 
  breakdown,
  availableMonths
}: GelirGiderProps) {
  const router = useRouter();
  const { toast } = useToast();
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
        router.refresh();
      } else {
        toast.error("Silme hatası: " + res.error);
      }
    }
  };

  const getMonthName = (monthId: string) => {
    if (!monthId) return 'Tümü';
    const [y, m] = monthId.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <Wallet size={20} />
           </div>
           <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Gelir & Gider Analizi</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Ticari Döküm & Performans</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <select
                value={filters.month}
                onChange={(e) => window.location.href = `/gelir-gider?month=${e.target.value}&location=${filters.location}&category=${filters.category}`}
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm cursor-pointer"
              >
                <option value="">Tüm Dönemler</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{getMonthName(m)}</option>
                ))}
              </select>
           </div>

           <button
             onClick={() => setIsModalOpen(true)}
             className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50 active:scale-[0.97]"
           >
              <Plus size={18} />
              <span className="hidden sm:inline">Yeni Kayıt</span>
           </button>
        </div>
      </header>

      {/* Location Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
         <FilterLink
            href={`/gelir-gider?month=${filters.month}&location=all&category=${filters.category}`}
            active={filters.location === 'all'}
            label="Tüm Şubeler"
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

      {/* Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <KPICard label="Brüt Gelir" value={formatCurrency(summary.gross)} icon={<TrendingUp />} color="blue" subtitle="Ticari Ciro Akışı" />
         <KPICard label="Toplam Gider" value={formatCurrency(summary.expense)} icon={<TrendingDown />} color="rose" subtitle="Operasyonel Maliyetler" />
         <KPICard label="Net Nakit" value={formatCurrency(summary.net)} icon={<Activity />} color="emerald" subtitle="Serbest Nakit (KDV Dahil)" />
         <KPICard label="Kar Marjı" value={`%${summary.margin.toFixed(1)}`} icon={<Zap />} color="amber" subtitle="İşletme Verimliliği" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* Ledgers / Table */}
         <section className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Aylık Finansal Döküm</h3>
               <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{entries.length} kayıt</span>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4">Dönem & Lokasyon</th>
                        <th className="px-4 py-4 text-center">Seans</th>
                        <th className="px-4 py-4 text-right">Brüt Ciro</th>
                        <th className="px-4 py-4 text-right">Net Gider</th>
                        <th className="px-6 py-4 text-right">Net Kâr</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {entries.map((entry, idx) => (
                        <tr
                          key={idx}
                          className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => { setSelectedEntry(entry); setIsDrawerOpen(true); }}
                        >
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-sm font-semibold text-slate-800">{entry.month}</span>
                                 <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{entry.locationName}</span>
                              </div>
                           </td>
                           <td className="px-4 py-4 text-center">
                              <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold font-mono border border-slate-100">{entry.sessions}</span>
                           </td>
                           <td className="px-4 py-4 text-right text-sm font-bold text-slate-900 tabular-nums">₺{entry.grossRevenue?.toLocaleString('tr-TR')}</td>
                           <td className="px-4 py-4 text-right text-sm font-bold text-rose-500 tabular-nums">-₺{entry.avmExpense?.toLocaleString('tr-TR')}</td>
                           <td className="px-6 py-4 text-right">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold tabular-nums",
                                entry.netCash >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                              )}>
                                 ₺{entry.netCash?.toLocaleString('tr-TR')}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
               {entries.map((entry, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setSelectedEntry(entry); setIsDrawerOpen(true); }}
                    className="px-5 py-4 active:bg-slate-50 transition-colors cursor-pointer"
                  >
                     <div className="flex items-center justify-between mb-3">
                        <div>
                           <p className="text-sm font-semibold text-slate-800">{entry.month}</p>
                           <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{entry.locationName}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-bold font-mono border border-slate-100">{entry.sessions} seans</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div>
                              <p className="text-[10px] font-medium text-slate-400">Ciro</p>
                              <p className="text-sm font-bold text-slate-900 tabular-nums">₺{entry.grossRevenue?.toLocaleString('tr-TR')}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-medium text-slate-400">Gider</p>
                              <p className="text-sm font-bold text-rose-500 tabular-nums">₺{entry.avmExpense?.toLocaleString('tr-TR')}</p>
                           </div>
                        </div>
                        <div className={cn(
                           "px-3 py-1.5 rounded-lg text-sm font-bold tabular-nums",
                           entry.netCash >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                           ₺{entry.netCash?.toLocaleString('tr-TR')}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Distribution / Breakdown Analysis */}
         <section className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Gider Dağılımı</h3>
            </div>

            <div className="p-5 space-y-6">
               {breakdown.map((item, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex items-end justify-between">
                       <div>
                          <span className="text-xs font-bold text-slate-700">{item.label}</span>
                          {item.subLabel && <span className="text-[10px] text-slate-400 ml-2">{item.subLabel}</span>}
                       </div>
                       <span className="text-sm font-bold text-slate-900 tabular-nums">₺{item.value?.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: `${(item.value / summary.expense) * 100}%` }}
                         transition={{ duration: 0.8, ease: "easeOut" }}
                         className={cn("h-full rounded-full", item.color)}
                       />
                    </div>
                 </div>
               ))}

               <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Maliyet</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Operasyonel + AVM</p>
                     </div>
                     <span className="text-lg font-bold tabular-nums">₺{summary.expense?.toLocaleString('tr-TR')}</span>
                  </div>
               </div>
            </div>
         </section>
      </div>

      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Gider Girişi" maxWidth="max-w-xl">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); router.refresh(); }} />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => { setIsDrawerOpen(false); setIsEditing(false); }} title={isEditing ? "Verileri Güncelle" : "Dönem Finansal Detayı"}>
        {selectedEntry && (
          <div className="space-y-10 py-6">
             {isEditing ? (
               <MonthlyPerformanceForm id={selectedEntry.perfId} locationId={selectedEntry.locationId} initialData={{ sessions: selectedEntry.sessions, extraExpense: selectedEntry.extraExpense, extraNotes: selectedEntry.extraNotes, month: selectedEntry.monthId, locationName: selectedEntry.locationName }} onClose={() => setIsEditing(false)} onDelete={handleDelete} />
             ) : (
               <div className="space-y-8">
                  {/* Drawer Header Card */}
                  <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-400">
                           <Calendar size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{selectedEntry.month}</span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{selectedEntry.locationName}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brüt Ciro</p>
                           <p className="text-xl font-bold tabular-nums">₺{selectedEntry.grossRevenue?.toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seans</p>
                           <p className="text-xl font-bold font-mono">{selectedEntry.sessions}</p>
                        </div>
                     </div>
                  </div>

                  {/* Expense Breakdown in Drawer */}
                  <div className="space-y-8 px-1">
                     <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Receipt size={16} className="text-slate-300" />
                           GİDER ANALİZİ
                        </h4>
                        <div className="flex items-center gap-3">
                           <button onClick={() => setIsEditing(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 transition-all active:scale-90"><Edit2 size={16} /></button>
                           <button onClick={() => handleDelete(selectedEntry.perfId)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-all active:scale-90"><Trash2 size={16} /></button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <DetailMetric label="Sözleşme Ciro Payı" value={formatCurrency(selectedEntry.revenueShare)} icon={<HandCoins size={14} />} color="emerald" />
                        <DetailMetric label="AVM Sabit Kira & Aidat" value={formatCurrency(selectedEntry.avmExpense - selectedEntry.revenueShare)} icon={<Building2 size={14} />} color="blue" />
                        <DetailMetric label="Altyapı Komisyonları" value={formatCurrency(selectedEntry.totalCommission)} icon={<CreditCard size={14} />} color="amber" />
                        {selectedEntry.extraExpense > 0 && <DetailMetric label="Operasyonel Ekstra" value={formatCurrency(selectedEntry.extraExpense)} icon={<Zap size={14} />} color="rose" />}
                     </div>
                     
                     {selectedEntry.extraNotes && (
                        <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                           <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Operasyonel Notlar</p>
                           <p className="text-sm font-medium text-amber-800 italic leading-relaxed">{selectedEntry.extraNotes}</p>
                        </div>
                     )}
                  </div>

                  {/* Net Result in Drawer */}
                  <div className="pt-6 border-t border-slate-100">
                     <div className={cn(
                        "p-5 rounded-2xl flex items-center justify-between border",
                        selectedEntry.netCash >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-rose-50 border-rose-100 text-rose-900"
                     )}>
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Net Nakit Akışı</p>
                           <p className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(selectedEntry.netCash)}</p>
                        </div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedEntry.netCash >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                           <TrendingUp size={20} />
                        </div>
                     </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.98] mt-4"
                  >
                    Kapat
                  </button>
               </div>
             )}
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function KPICard({ label, value, icon, color, subtitle }: any) {
  const themes: any = {
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
       <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", themes[color])}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
       </div>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
       <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-1">{value}</p>
       <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">{subtitle}</p>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string, active: boolean, label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap",
        active
          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
          : "text-slate-500 border-slate-200 bg-white hover:text-slate-700 hover:border-slate-300"
      )}
    >
      {label}
    </Link>
  );
}

function DetailMetric({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  const bgColors: any = {
    emerald: "bg-emerald-50 text-emerald-500 border-emerald-100/50",
    blue: "bg-blue-50 text-blue-500 border-blue-100/50",
    amber: "bg-amber-50 text-amber-500 border-amber-100/50",
    rose: "bg-rose-50 text-rose-500 border-rose-100/50"
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-default">
       <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", bgColors[color] || "bg-slate-50 text-slate-400")}>
             {icon}
          </div>
          <span className="text-sm font-bold text-slate-600">{label}</span>
       </div>
       <span className="text-lg font-bold text-slate-900 tabular-nums italic tracking-tighter">{value}</span>
    </div>
  );
}
