"use client";

import { use, useEffect, useState } from 'react';
import { calculateMonthlyCashFlow, CalculationResult } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { kabinRapor } from '@/lib/kabinRapor';
import * as motion from "framer-motion/client";
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3, 
  Filter, Calendar, MapPin, DollarSign, CreditCard, Percent,
  ChevronDown, FileText, PiggyBank, Wallet, ListFilter
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
      
      // Live Data Sync
      let liveData: any = null;
      try {
        liveData = await kabinRapor.getComprehensiveData('Tüm Zamanlar');
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

      // Step 2: Inject Live Data if not present in DB or for the CURRENT month
      if (liveData?.citySplit?.cities) {
        const currentMonthId = new Date().toISOString().slice(0, 7);
        const cities = liveData.citySplit.cities;
        
        for (const [cityName, cityData] of Object.entries(cities) as any) {
           const matchingLoc = (locations || []).find(l => l.name.toLowerCase().includes(cityName.toLowerCase()));
           if (!matchingLoc) continue;

           // Check if we already have this month in the list
           const existingIndex = monthlyEntries.findIndex(e => e.monthId === currentMonthId && e.locationId === matchingLoc.id);
           
           const liveSessions = cityData.sessions;
           const calc = calculateMonthlyCashFlow(liveSessions, 0, {
             sessionPrice,
             iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
             fixedRent: matchingLoc.fixedRent, duesAmount: matchingLoc.duesAmount,
             revenueShareRate: matchingLoc.revenueShareRate || 15,
           });

           const liveEntry = {
             monthId: currentMonthId,
             month: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
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

           if (existingIndex > -1) {
             monthlyEntries[existingIndex] = liveEntry; // Override with live data
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

  if (!data) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" /></div>;

  const maxCatTotal = Math.max(...Object.values(data.categoryTotals), 0.1);

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      {/* Header & Global Filters */}
      <header className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10">Ledger</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
               <Wallet className="w-8 h-8 text-zinc-500" />
               Gelir & Gider Paneli
            </h1>
            <p className="text-sm text-zinc-500 font-medium">Finansal döküm ve kategorize edilmiş operasyonel gider takip sistemi.</p>
          </div>

          <div className="flex flex-wrap gap-3">
             <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-x-auto max-w-full">
                <Link
                  href={`/gelir-gider?location=all&month=${filterMonth}&category=${filterCategory}`}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all whitespace-nowrap uppercase", 
                    filterLocation === 'all' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white')}
                >Tümü</Link>
                {data.locations.map(loc => (
                  <Link key={loc.id}
                    href={`/gelir-gider?location=${loc.id}&month=${filterMonth}&category=${filterCategory}`}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all whitespace-nowrap uppercase", 
                      filterLocation === loc.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white')}
                  >{loc.name.split(' ')[0]}</Link>
                ))}
             </div>
          </div>
        </div>

        {data.uniqueMonths.length > 0 && (
          <div className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar">
             <Link
               href={`/gelir-gider?location=${filterLocation}&month=&category=${filterCategory}`}
               className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest whitespace-nowrap border transition-all", 
                 !filterMonth ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'border-white/5 text-zinc-500 hover:border-white/20 hover:text-white')}
             >Tüm Aylar</Link>
             {data.uniqueMonths.slice(0, 12).map(m => (
               <Link key={m}
                 href={`/gelir-gider?location=${filterLocation}&month=${m}&category=${filterCategory}`}
                 className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest whitespace-nowrap border transition-all", 
                   filterMonth === m ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'border-white/5 text-zinc-500 hover:border-white/20 hover:text-white')}
               >{m}</Link>
             ))}
          </div>
        )}
      </header>

      {/* Main Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'BRÜT GELİR', value: data.totals.gross, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'TOPLAM GİDER', value: data.totals.expense, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'NET DURUM', value: data.totals.net, icon: Wallet, color: data.totals.net >= 0 ? 'text-indigo-400' : 'text-rose-400', bg: data.totals.net >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10' },
          { label: 'TOPLAM OTURUM', value: data.totals.sessions, icon: BarChart3, color: 'text-zinc-300', bg: 'bg-white/5', isCurrency: false },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="premium-card p-6"
          >
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-6`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h2 className="text-2xl font-bold tracking-tight text-white italic">
              {kpi.isCurrency === false ? kpi.value.toLocaleString('tr-TR') : `₺${kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
            </h2>
          </motion.div>
        ))}
      </section>

      {/* Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-rose-500/[0.02]">
           <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">iyzico %2 + Nayax %2</span>
           </div>
           <p className="text-xl font-bold text-white">₺{data.totals.commission.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="premium-card p-6 bg-amber-500/[0.02]">
           <div className="flex items-center gap-3 mb-4">
              <Percent className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">AVM Ciro Payı %15</span>
           </div>
           <p className="text-xl font-bold text-white">₺{data.totals.revShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="premium-card p-6 bg-indigo-500/[0.02]">
           <div className="flex items-center gap-3 mb-4">
              <PiggyBank className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Operasyonel Marj</span>
           </div>
           <p className="text-xl font-bold text-white">%{data.totals.gross > 0 ? ((data.totals.net / data.totals.gross) * 100).toFixed(1) : 0}</p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Monthly Ledger */}
         <section className="xl:col-span-8 space-y-6">
            <div className="flex items-center gap-4">
               <ListFilter className="w-5 h-5 text-zinc-600" />
               <h2 className="text-lg font-bold text-white tracking-tight">Dönemsel Gelir Dökümü</h2>
               <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>

            <div className="premium-card overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                     <thead>
                        <tr className="bg-white/[0.01]">
                           <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04]">Ay (Lokasyon)</th>
                           <th className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-center">Hacim</th>
                           <th className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">Brüt</th>
                           <th className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">AVM Gider</th>
                           <th className="px-4 py-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/[0.04] text-right">Net Nakit</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.02]">
                        {data.monthlyEntries.map((entry, idx) => (
                           <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white tracking-tight">{entry.month}</span>
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">{entry.locationName}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-5 text-center text-xs font-bold text-zinc-500">{entry.sessions}</td>
                              <td className="px-4 py-5 text-right font-medium text-sm text-zinc-200">₺{entry.grossRevenue.toLocaleString('tr-TR')}</td>
                              <td className="px-4 py-5 text-right font-medium text-sm text-rose-500/80">₺{entry.avmExpense.toLocaleString('tr-TR')}</td>
                              <td className={cn("px-4 py-5 text-right font-bold text-sm", entry.netCash >= 0 ? "text-indigo-400" : "text-rose-400")}>
                                 ₺{entry.netCash.toLocaleString('tr-TR')}
                              </td>
                           </motion.tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </section>

         {/* Categories & Operational Expenses */}
         <section className="xl:col-span-4 space-y-10">
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-white tracking-tight">Kategorize</h2>
                  <div className="flex-1 h-[1px] bg-white/[0.04]" />
               </div>
               <div className="premium-card p-6 space-y-6">
                  {Object.entries(data.categoryTotals).sort(([,a],[,b]) => b - a).map(([cat, total]) => {
                    const info = EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other;
                    const pct = (total / maxCatTotal) * 100;
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className={cn("text-[10px] font-bold uppercase tracking-widest", info.color)}>{info.label}</span>
                          <span className="text-xs font-bold text-white">₺{total.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                            className={cn("h-full rounded-full transition-all duration-1000", info.bg)}
                          />
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-white tracking-tight">İşlemler</h2>
                  <div className="flex-1 h-[1px] bg-white/[0.04]" />
               </div>
               <div className="space-y-3">
                  {data.filteredExpenses.slice(0, 10).map(exp => (
                    <div key={exp.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between hover:bg-white/[0.04] transition-all">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-white leading-tight">{exp.description}</span>
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                             {EXPENSE_CATEGORIES[exp.category || 'other']?.label || 'Other'}
                          </span>
                       </div>
                       <span className="text-xs font-bold text-zinc-300">₺{exp.amountWithVat?.toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
               </div>
            </div>
         </section>
      </div>
    </div>
  );
}

