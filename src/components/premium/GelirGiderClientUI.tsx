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
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* Premium Header */}
      <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
        <div className="space-y-1.5">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                 <Wallet size={24} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gelir & Gider Analizi</h1>
           </div>
           <p className="text-sm text-slate-500 font-medium italic pl-1">Ticari döküm, vergi analizi ve operasyonel performans merkezi.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
           {/* Month Filter */}
           <div className="relative group min-w-[200px]">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" size={16} />
              <select 
                value={filters.month}
                onChange={(e) => window.location.href = `/gelir-gider?month=${e.target.value}&location=${filters.location}&category=${filters.category}`}
                className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm tracking-widest cursor-pointer"
              >
                <option value="">TÜM DÖNEMLER</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{getMonthName(m)}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Filter size={14} /></div>
           </div>

           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2.5 active:scale-95 uppercase tracking-widest"
           >
              <Plus size={18} />
              Yeni Kayıt Girişi
           </button>
        </div>
      </header>

      {/* Location Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
         <FilterLink 
            href={`/gelir-gider?month=${filters.month}&location=all&category=${filters.category}`} 
            active={filters.location === 'all'} 
            label="TÜM ŞUBELER" 
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

      {/* High-Impact Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard label="Brüt Gelir" value={formatCurrency(summary.gross)} icon={<TrendingUp />} color="blue" subtitle="Ticari Ciro Akışı" trend="+12.4%" />
         <KPICard label="Toplam Gider" value={formatCurrency(summary.expense)} icon={<TrendingDown />} color="rose" subtitle="Operasyonel Maliyetler" trend="-2.1%" />
         <KPICard label="Net Nakit" value={formatCurrency(summary.net)} icon={<Activity />} color="emerald" subtitle="Serbest Nakit (KDV Dahil)" trend="+8.7%" />
         <KPICard label="Kar Marjı" value={`%${summary.margin.toFixed(1)}`} icon={<Zap />} color="amber" subtitle="İşletme Verimliliği" trend="+1.5%" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Ledgers / Table - Dynamic Cards on Mobile */}
         <section className="xl:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] italic">AYLIK FİNANSAL DÖKÜM</h3>
               <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1.5 border border-slate-100 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  PDF RAPOR <Download size={14} />
               </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dönem & Lokasyon</th>
                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Seans</th>
                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Brüt Ciro</th>
                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Net Gider</th>
                        <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Net Kâr</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {entries.map((entry, idx) => (
                        <tr 
                          key={idx} 
                          className="group hover:bg-slate-50/80 transition-all cursor-pointer" 
                          onClick={() => { setSelectedEntry(entry); setIsDrawerOpen(true); }}
                        >
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all group-hover:scale-110">
                                    <Calendar size={18} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 tracking-tight">{entry.month}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.locationName}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-6 text-center">
                              <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[11px] font-bold font-mono border border-slate-100">{entry.sessions}</span>
                           </td>
                           <td className="px-6 py-6 text-right font-bold text-slate-900 tabular-nums italic tracking-tighter text-base">₺{entry.grossRevenue?.toLocaleString('tr-TR')}</td>
                           <td className="px-6 py-6 text-right">
                              <div className="flex flex-col items-end">
                                 <span className="font-bold text-rose-500 tabular-nums italic text-sm">-₺{entry.avmExpense?.toLocaleString('tr-TR')}</span>
                                 <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">+KDV DAHİL</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-xl border tabular-nums italic font-bold text-base shadow-sm ring-4 ring-transparent group-hover:ring-slate-100 transition-all",
                                entry.netCash >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                              )}>
                                 ₺{entry.netCash?.toLocaleString('tr-TR')}
                                 <ArrowRight size={16} />
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
               {entries.map((entry, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    onClick={() => { setSelectedEntry(entry); setIsDrawerOpen(true); }}
                    className="p-6 bg-white border border-slate-200 rounded-[32px] space-y-6 active:scale-[0.98] transition-all shadow-sm"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Calendar size={20} /></div>
                           <div className="flex flex-col">
                              <span className="text-base font-bold text-slate-900 tracking-tight">{entry.month}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.locationName}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">SEANS</span>
                           <span className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold font-mono border border-slate-100">{entry.sessions}</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BRÜT CİRO</p>
                           <p className="text-lg font-bold text-slate-900 italic tracking-tighter">₺{entry.grossRevenue?.toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOPLAM GİDER</p>
                           <p className="text-lg font-bold text-rose-500 italic tracking-tighter">₺{entry.avmExpense?.toLocaleString('tr-TR')}</p>
                        </div>
                     </div>

                     <div className={cn(
                        "p-5 rounded-3xl flex items-center justify-between shadow-inner border border-transparent",
                        entry.netCash >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" : "bg-rose-50 text-rose-700 border-rose-100/50"
                     )}>
                        <div>
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">NET NAKİT AKIŞI</p>
                           <p className="text-2xl font-bold italic tracking-tighter mt-1 tabular-nums">₺{entry.netCash?.toLocaleString('tr-TR')}</p>
                        </div>
                        <ChevronRight className="opacity-40" />
                     </div>
                  </motion.div>
               ))}
            </div>
         </section>

         {/* Distribution / Breakdown Analysis */}
         <section className="xl:col-span-4 space-y-6">
            <div className="px-2"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] italic">GİDER DAĞILIMI</h3></div>
            
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-8 shadow-sm">
               <div className="space-y-7">
                  {breakdown.map((item, i) => (
                    <div key={i} className="space-y-3 group">
                       <div className="flex items-end justify-between">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{item.label}</span>
                             <span className="text-[10px] font-medium text-slate-300 uppercase tracking-tighter mt-0.5">{item.subLabel}</span>
                          </div>
                          <motion.span 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-sm font-bold text-slate-900 tracking-tighter italic"
                          >
                             ₺{item.value?.toLocaleString('tr-TR')}
                          </motion.span>
                       </div>
                       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${(item.value / summary.expense) * 100}%` }} 
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn("h-full rounded-full transition-all group-hover:brightness-110", item.color)} 
                          />
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="pt-8 border-t border-slate-50">
                  <div className="flex items-center justify-between p-6 rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOPLAM MALİYET</p>
                        <p className="text-xs text-slate-500 font-medium italic">Operasyonel + AVM</p>
                     </div>
                     <span className="text-2xl font-bold italic tracking-tighter tabular-nums">₺{summary.expense?.toLocaleString('tr-TR')}</span>
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
               <div className="space-y-10">
                  {/* Drawer Header Card */}
                  <div className="p-8 rounded-[32px] bg-slate-900 text-white space-y-6 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000">
                        <Activity size={120} />
                     </div>
                     <div className="relative z-10 space-y-1.5">
                        <div className="flex items-center gap-2 text-blue-400">
                           <Calendar size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{selectedEntry.month}</span>
                        </div>
                        <p className="text-4xl font-bold italic tracking-tighter uppercase">{selectedEntry.locationName}</p>
                     </div>
                     <div className="relative z-10 grid grid-cols-2 gap-8 pt-8 border-t border-white/10 uppercase tracking-widest">
                        <div className="space-y-1">
                           <p className="text-[9px] font-bold text-slate-500">HAZIR MEVCUT</p>
                           <p className="text-2xl font-bold italic">₺{selectedEntry.grossRevenue?.toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="text-[9px] font-bold text-slate-500">SEANS HACMİ</p>
                           <p className="text-2xl font-bold italic font-mono">{selectedEntry.sessions}</p>
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
                  <div className="pt-10 border-t border-slate-100 px-1">
                     <div className={cn(
                        "p-8 rounded-[32px] flex items-center justify-between border-2 shadow-xl",
                        selectedEntry.netCash >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-rose-50 border-rose-100 text-rose-900"
                     )}>
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">NET NAKİT AKIŞI</p>
                           <p className="text-4xl font-bold italic tracking-tighter tabular-nums">{formatCurrency(selectedEntry.netCash)}</p>
                        </div>
                        <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg", selectedEntry.netCash >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                           <TrendingUp size={32} />
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold transition-all hover:bg-slate-200 active:scale-[0.98] mt-6"
                  >
                    Detayları Kapat
                  </button>
               </div>
             )}
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function KPICard({ label, value, icon, color, subtitle, trend }: any) {
  const themes: any = {
    blue: { iconBg: "bg-blue-50 text-blue-600", border: "border-blue-100", trend: "bg-blue-50 text-blue-600" },
    rose: { iconBg: "bg-rose-50 text-rose-600", border: "border-rose-100", trend: "bg-rose-50 text-rose-600" },
    emerald: { iconBg: "bg-emerald-50 text-emerald-600", border: "border-emerald-100", trend: "bg-emerald-50 text-emerald-600" },
    amber: { iconBg: "bg-amber-50 text-amber-600", border: "border-amber-100", trend: "bg-amber-50 text-amber-600" },
  };
  const theme = themes[color] || themes.blue;

  return (
    <div className={cn("bg-white border border-slate-200 p-8 rounded-[32px] space-y-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden", theme.border)}>
       <div className="flex items-center justify-between">
          <div className={cn("p-3.5 rounded-2xl transition-all shadow-inner", theme.iconBg)}>
             {React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: 2 })}
          </div>
          <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest", theme.trend)}>
             {trend}
          </div>
       </div>
       <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tighter italic tabular-nums">{value}</p>
       </div>
       <p className="text-[10px] font-bold text-slate-300 uppercase italic tracking-[0.15em] border-t border-slate-50 pt-4 group-hover:text-slate-400 transition-colors">{subtitle}</p>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string, active: boolean, label: string }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap", 
        active 
          ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
          : "text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-100"
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
