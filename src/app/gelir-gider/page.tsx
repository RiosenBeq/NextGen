"use client";

import { use, useEffect, useState } from 'react';
import { calculateMonthlyCashFlow, CalculationResult } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { kabinRapor } from '@/lib/kabinRapor';
import * as motion from "framer-motion/client";
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3, 
  Filter, Calendar, MapPin, DollarSign, CreditCard, Percent,
  ChevronDown, FileText, PiggyBank, Wallet, ListFilter, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

const EXPENSE_CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  rent: { label: 'Kira', color: 'text-blue-400', bg: 'bg-blue-400' },
  utilities: { label: 'Faturalar', color: 'text-cyan-400', bg: 'bg-cyan-400' },
  maintenance: { label: 'Bakım/Onarım', color: 'text-amber-400', bg: 'bg-amber-400' },
  marketing: { label: 'Pazarlama', color: 'text-purple-400', bg: 'bg-purple-400' },
  equipment: { label: 'Ekipman', color: 'text-pink-400', bg: 'bg-pink-400' },
  operational: { label: 'Operasyonel', color: 'text-emerald-400', bg: 'bg-emerald-400' },
  other: { label: 'Diğer', color: 'text-zinc-400', bg: 'bg-zinc-400' },
};

export default function GelirGiderPage(props: {
  searchParams: Promise<{ month?: string; location?: string; category?: string }>
}) {
  const searchParams = use(props.searchParams);
  const filterMonth = searchParams.month || '';
  const filterLocation = searchParams.location || 'all';
  const filterCategory = searchParams.category || 'all';

  const [data, setData] = useState<{
    locations: any[];
    monthlyEntries: any[];
    filteredExpenses: any[];
    totals: any;
    categoryTotals: Record<string, number>;
    uniqueMonths: string[];
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const params = await getSystemParameters();
      const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;

      const { data: locations } = await supabase.from('Location').select('*').eq('isActive', true);
      const { data: performances } = await supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false });
      const { data: expenses } = await supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false });
      
      // Live Data Sync for the selected month
      let liveData: any = null;
      try {
        const rangeToFetch = filterMonth || 'Bu Ay';
        liveData = await kabinRapor.getComprehensiveData(rangeToFetch as any);
      } catch (e) {
        console.error("Live Sync Error:", e);
      }

      const monthlyEntries: any[] = [];
      
      // Step 1: Process Database Performances
      if (performances) {
        for (const perf of performances) {
          const loc = perf.location;
          if (!loc) continue;

          const perfMonthStr = new Date(perf.month).toISOString().slice(0, 7);
          
          const calc = calculateMonthlyCashFlow(perf.sessionCount, perf.extraExpenseAmount || 0, {
            sessionPrice,
            iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
            fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
            revenueShareRate: loc.revenueShareRate || 15,
          });

          monthlyEntries.push({
            monthId: perfMonthStr,
            month: new Date(perf.month).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
            locationName: loc.name,
            locationId: loc.id,
            sessions: perf.sessionCount,
            grossRevenue: calc.grossRevenue,
            totalExpense: calc.totalExpense,
            netCash: calc.netCash,
            totalCommission: calc.totalCommission,
            revenueShare: calc.revenueShare,
            okanShare: calc.okanShare,
            talhaShare: calc.talhaShare,
            furkanShare: calc.furkanShare,
            alpShare: calc.alpShare,
            iyzicoComm: calc.iyzicoCommission,
            nayaxComm: calc.nayaxCommission,
            avmExpense: calc.totalAvmExpense,
          });
        }
      }

      // Step 2: Inject Live Data for the filter month or current month
      const currentMonthId = new Date().toISOString().slice(0, 7);
      const targetMonthId = filterMonth || currentMonthId;

      if (liveData?.citySplit?.cities) {
        const cities = liveData.citySplit.cities;
        
        for (const [cityName, cityData] of Object.entries(cities) as any) {
           const matchingLoc = (locations || []).find(l => l.name.toLowerCase().includes(cityName.toLowerCase()));
           if (!matchingLoc) continue;

           const liveSessions = cityData.sessions;
           const calc = calculateMonthlyCashFlow(liveSessions, 0, {
             sessionPrice,
             iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
             fixedRent: matchingLoc.fixedRent, duesAmount: matchingLoc.duesAmount,
             revenueShareRate: matchingLoc.revenueShareRate || 15,
           });

           const liveEntry = {
             monthId: targetMonthId,
             month: filterMonth ? new Date(filterMonth + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) : new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
             locationName: matchingLoc.name,
             locationId: matchingLoc.id,
             sessions: liveSessions,
             grossRevenue: calc.grossRevenue,
             totalExpense: calc.totalExpense,
             netCash: calc.netCash,
             totalCommission: calc.totalCommission,
             revenueShare: calc.revenueShare,
             okanShare: calc.okanShare,
             talhaShare: calc.talhaShare,
             furkanShare: calc.furkanShare,
             alpShare: calc.alpShare,
             iyzicoComm: calc.iyzicoCommission,
             nayaxComm: calc.nayaxCommission,
             avmExpense: calc.totalAvmExpense,
             isLive: true
           };

           // Override DB entry if live data is present for the same month/loc
           const existingIndex = monthlyEntries.findIndex(e => e.monthId === targetMonthId && e.locationId === matchingLoc.id);
           if (existingIndex > -1) {
             monthlyEntries[existingIndex] = liveEntry;
           } else {
             monthlyEntries.unshift(liveEntry);
           }
        }
      }

      // Apply Page Filters
      const filteredMonthlyEntries = monthlyEntries.filter(entry => {
        if (filterMonth && entry.monthId !== filterMonth) return false;
        if (filterLocation !== 'all' && entry.locationId !== filterLocation) return false;
        return true;
      });

      const filteredExpenses = (expenses || []).filter(exp => {
        if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
        if (filterMonth && exp.month && exp.month !== filterMonth) return false;
        if (filterLocation !== 'all' && exp.locationId !== filterLocation) return false;
        return true;
      });

      const categoryTotals: Record<string, number> = {};
      for (const exp of filteredExpenses) {
        const cat = exp.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (exp.amountWithVat || 0);
      }

      setData({
        locations: locations || [],
        monthlyEntries: filteredMonthlyEntries,
        filteredExpenses,
        totals: {
          gross: filteredMonthlyEntries.reduce((s, e) => s + e.grossRevenue, 0),
          expense: filteredMonthlyEntries.reduce((s, e) => s + e.totalExpense, 0) + filteredExpenses.reduce((s, e) => s + (e.amountWithVat || 0), 0),
          net: filteredMonthlyEntries.reduce((s, e) => s + e.netCash, 0),
          sessions: filteredMonthlyEntries.reduce((s, e) => s + e.sessions, 0),
          commission: filteredMonthlyEntries.reduce((s, e) => s + e.totalCommission, 0),
          revShare: filteredMonthlyEntries.reduce((s, e) => s + e.revenueShare, 0)
        },
        categoryTotals,
        uniqueMonths: Array.from(new Set(monthlyEntries.map(e => e.monthId))).sort().reverse()
      });
    }
    fetchData();
  }, [filterMonth, filterLocation, filterCategory]);

  if (!data) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-emerald-500/10 border-t-emerald-500 animate-spin" />
    </div>
  );

  const maxCatTotal = Math.max(...Object.values(data.categoryTotals), 0.1);

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1500px] mx-auto min-h-screen animate-fade-in pb-20">
      {/* Header & Global Filters */}
      <header className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/10">Financial Ledger</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white heading-elite italic leading-[0.9]">
               Gelir & Gider<br/>Paneli
            </h1>
            <p className="text-sm text-zinc-500 font-medium max-w-xl leading-relaxed">
              Operasyonel nakit akışı, anlık komisyon kesintileri ve lokasyon bazlı performans dökümü.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
             <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
                <Link
                  href={`/gelir-gider?location=all&month=${filterMonth}&category=${filterCategory}`}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all uppercase", 
                    filterLocation === 'all' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white')}
                >Tümü</Link>
                {data.locations.map(loc => (
                  <Link key={loc.id}
                    href={`/gelir-gider?location=${loc.id}&month=${filterMonth}&category=${filterCategory}`}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all uppercase", 
                      filterLocation === loc.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white')}
                  >{loc.name.split(' ')[0]}</Link>
                ))}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6 py-6 border-y border-white/[0.04]">
           <Link
             href={`/gelir-gider?location=${filterLocation}&month=&category=${filterCategory}`}
             className={cn("px-6 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] whitespace-nowrap transition-all shadow-xl flex items-center gap-3 border", 
               !filterMonth ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20' : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:text-white')}
           >
             <ListFilter className="w-4 h-4" />
             TÜM DÖNEMLER
           </Link>

           <div className="h-10 w-[1px] bg-white/[0.06]" />

           <div className="relative group max-w-[240px] w-full">
              <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>
              <input 
                type="month" 
                value={filterMonth}
                onChange={(e) => {
                  const m = e.target.value;
                  window.location.href = `/gelir-gider?location=${filterLocation}&month=${m}&category=${filterCategory}`;
                }}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
           </div>
        </div>
      </header>

      {/* Main Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'BRÜT GELİR', value: data.totals.gross, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', tag: 'CİRO' },
          { label: 'TOPLAM GİDER', value: data.totals.expense, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10', tag: 'KDV DAHİL' },
          { label: 'NET DURUM', value: data.totals.net, icon: Wallet, color: data.totals.net >= 0 ? 'text-indigo-400' : 'text-rose-400', bg: data.totals.net >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10', tag: 'NAKİT AKIŞ' },
          { label: 'TOPLAM SEANS', value: data.totals.sessions, icon: BarChart3, color: 'text-zinc-400', bg: 'bg-white/5', tag: 'HACİM', isCurrency: false },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="premium-card p-8 group overflow-hidden"
          >
            <div className="flex justify-between items-start mb-10">
               <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center border border-white/5`}>
                 <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
               </div>
               <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/5">{kpi.tag}</span>
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{kpi.label}</p>
               <h2 className="text-3xl font-black tracking-tighter text-white italic">
                 {kpi.isCurrency === false ? kpi.value.toLocaleString('tr-TR') : `₺${kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
               </h2>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Commission & Model Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-8 bg-rose-500/[0.02] border-rose-500/10 group hover:bg-rose-500/5 transition-all">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <CreditCard className="w-5 h-5 text-rose-500" />
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">iyzico %2 + Nayax %2</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-rose-500 transition-colors" />
           </div>
           <p className="text-3xl font-black text-white italic tracking-tighter">₺{data.totals.commission.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
           <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Toplam Operasyonel Kesinti</p>
        </div>
        <div className="premium-card p-8 bg-amber-500/[0.02] border-amber-500/10 group hover:bg-amber-500/5 transition-all">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <Percent className="w-5 h-5 text-amber-500" />
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">AVM Ciro Payı %15</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-amber-500 transition-colors" />
           </div>
           <p className="text-3xl font-black text-white italic tracking-tighter">₺{data.totals.revShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
           <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Kira ve Hakediş Gideri</p>
        </div>
        <div className="premium-card p-8 bg-indigo-500/[0.02] border-indigo-500/10 group hover:bg-indigo-500/5 transition-all">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <PiggyBank className="w-5 h-5 text-indigo-500" />
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Operasyonel Marj</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-indigo-500 transition-colors" />
           </div>
           <p className="text-3xl font-black text-white italic tracking-tighter">%{data.totals.gross > 0 ? ((data.totals.net / data.totals.gross) * 100).toFixed(1) : 0}</p>
           <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Net Verimlilik Oranı</p>
        </div>
      </div>

      {/* Main Ledger & Expenses */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Monthly Ledger */}
         <section className="xl:col-span-8 space-y-8">
            <div className="flex items-center gap-4">
               <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Dönemsel Gelir Dökümü</h2>
               <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>

            <div className="premium-card overflow-hidden border-white/5">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                     <thead>
                        <tr className="bg-white/[0.02]">
                           <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06]">Ay / Lokasyon</th>
                           <th className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06] text-center">Oturum</th>
                           <th className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06] text-right">Brüt Ciro</th>
                           <th className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06] text-right">Gider (KDV+Pay)</th>
                           <th className="px-8 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] border-b border-white/[0.06] text-right">Net Nakit</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.03]">
                        {data.monthlyEntries.map((entry, idx) => (
                           <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                       <span className="text-sm font-black text-white italic tracking-tight">{entry.month}</span>
                                       <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{entry.locationName}</span>
                                    </div>
                                    {entry.isLive && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black">LIVE</span>}
                                 </div>
                              </td>
                              <td className="px-6 py-6 text-center text-xs font-black text-zinc-400 font-mono tracking-tighter">{entry.sessions}</td>
                              <td className="px-6 py-6 text-right font-black text-sm text-zinc-100">₺{entry.grossRevenue.toLocaleString('tr-TR')}</td>
                              <td className="px-6 py-6 text-right font-bold text-xs text-rose-500/60 font-mono">₺{entry.avmExpense.toLocaleString('tr-TR')}</td>
                              <td className={cn("px-8 py-6 text-right font-black text-base italic tracking-tighter", entry.netCash >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                 ₺{entry.netCash.toLocaleString('tr-TR')}
                              </td>
                           </motion.tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </section>

         {/* Expense Categories Breakdown */}
         <section className="xl:col-span-4 space-y-8">
            <div className="flex items-center gap-4">
               <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Gider Analizi</h2>
               <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>

            <div className="premium-card p-10 space-y-10 bg-zinc-950/40 border-white/5">
              <div className="space-y-8">
                {Object.entries(data.categoryTotals).map(([cat, amount]) => (
                  <div key={cat} className="space-y-4">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{EXPENSE_CATEGORIES[cat]?.label.toUpperCase() || cat.toUpperCase()}</p>
                           <p className="text-lg font-black text-white tracking-tighter">₺{amount.toLocaleString('tr-TR')}</p>
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">%{data.totals.expense > 0 ? ((amount / data.totals.expense) * 100).toFixed(1) : 0} Pay</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${(amount / maxCatTotal) * 100}%` }}
                          className={cn("h-full rounded-full", cat === 'rent' ? 'bg-rose-500' : 'bg-indigo-500')}
                        />
                     </div>
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-white/[0.05]">
                 <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex flex-col items-center text-center space-y-3">
                    <PiggyBank className="w-8 h-8 text-indigo-500 mb-2" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Kayıtlı Harcamalar</h4>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Bu filtrelere göre toplam <span className="text-white font-bold">{data.filteredExpenses.length} adet</span> operasyonel harcama kalemi bulunmaktadır.</p>
                 </div>
              </div>
            </div>
         </section>
      </div>
    </div>
  );
}

