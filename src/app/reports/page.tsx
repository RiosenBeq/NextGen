"use client";

import { use, useEffect, useState } from 'react';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { TrendingUp, ArrowUpRight, ArrowDownRight, LayoutList, CalendarDays, FileText, Download, Share2, ArrowRight } from 'lucide-react';
import * as motion from "framer-motion/client";
import { createClient } from '@/utils/supabase/client';
import { getSystemParameters } from '@/features/ledger/actions';
import { cn } from '@/lib/utils';
import { kabinRapor } from '@/lib/kabinRapor';

export default function ReportsPage() {
  const [data, setData] = useState<{
    processedData: any[];
    totals: any;
    locations: any[];
  } | null>(null);
  const [filterLocation, setFilterLocation] = useState('all');

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const params = await getSystemParameters();
      const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;

      // Fetch Locations for filtering
      const { data: locations } = await supabase.from('Location').select('*').eq('isActive', true);

      // Fetch Live Data for current month
      let liveData: any = null;
      try {
        liveData = await kabinRapor.getComprehensiveData('Bu Ay');
      } catch (e) {
        console.error("Live data fetch failed on reports:", e);
      }

      const { data: performances } = await supabase
        .from('MonthlyPerformance')
        .select('*, location:Location(*)')
        .order('month', { ascending: false });

      const currentMonthId = new Date().toISOString().slice(0, 7);
      
      const processed = (performances || []).map((perf: any) => {
        const perfMonthId = new Date(perf.month).toISOString().slice(0, 7);
        const isCurrentMonth = perfMonthId === currentMonthId;
        
        let sessions = perf.sessionCount;
        let isLive = false;

        // Sync with Live Data if it's the current month and live data available
        if (isCurrentMonth && liveData?.citySplit?.cities) {
          const cityName = perf.location.name.split(' ')[0];
          const cityData = liveData.citySplit.cities[cityName];
          if (cityData) {
            sessions = cityData.sessions;
            isLive = true;
          }
        }

        const calc = calculateMonthlyCashFlow(sessions, perf.extraExpenseAmount || 0, {
          sessionPrice, iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
          fixedRent: perf.location.fixedRent, duesAmount: perf.location.duesAmount,
          revenueShareRate: perf.location.revenueShareRate || 0,
        });

        return {
          id: perf.id,
          monthId: perfMonthId,
          month: new Date(perf.month).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
          locationName: perf.location.name,
          locationId: perf.location.id,
          sessionCount: sessions,
          grossRevenue: calc.grossRevenue,
          totalAvmExpense: calc.totalAvmExpense,
          iyzico: calc.iyzicoCommission,
          nayax: calc.nayaxCommission,
          extraExpense: perf.extraExpenseAmount || 0,
          netCash: calc.netCash,
          isLive,
          shares: { ok: calc.okanShare, tl: calc.talhaShare, fk: calc.furkanShare, al: calc.alpShare }
        };
      });

      // Recalculate totals based on processed data
      const calcTotals = (rows: any[]) => ({
        revenue: rows.reduce((s, r) => s + r.grossRevenue, 0),
        profit: rows.reduce((s, r) => s + r.netCash, 0),
        sessions: rows.reduce((s, r) => s + r.sessionCount, 0),
      });

      setData({
        processedData: processed,
        totals: calcTotals(processed),
        locations: locations || []
      });
    }
    fetchData();
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filteredData = data.processedData.filter((row: any) => 
    filterLocation === 'all' || row.locationId === filterLocation
  );

  const currentTotals = {
    revenue: filteredData.reduce((s: number, r: any) => s + r.grossRevenue, 0),
    profit: filteredData.reduce((s: number, r: any) => s + r.netCash, 0),
    sessions: filteredData.reduce((s: number, r: any) => s + r.sessionCount, 0),
  };

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1500px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] px-2 py-1 rounded bg-indigo-500/5 border border-indigo-500/10">Financial Archive</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white heading-elite italic">
             Performans Arşivi
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-xl leading-relaxed">
            Şirketin tarihsel büyüme verileri, operasyonel marjlar ve ortaklık hakedişlerinin dökümü.
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
           <button 
             onClick={() => setFilterLocation('all')}
             className={cn("px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all uppercase", 
               filterLocation === 'all' ? "bg-white text-black" : "text-zinc-500 hover:text-white")}
           >Tümü</button>
           {data.locations.map(loc => (
             <button 
                key={loc.id}
                onClick={() => setFilterLocation(loc.id)}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all uppercase", 
                  filterLocation === loc.id ? "bg-white text-black" : "text-zinc-500 hover:text-white")}
             >{loc.name.split(' ')[0]}</button>
           ))}
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "FİLTRELENMİŞ CİRO", value: currentTotals.revenue, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", tag: "ARŞİV" },
          { label: "NET NAKİT AKIŞI", value: currentTotals.profit, icon: ArrowUpRight, color: "text-indigo-400", bg: "bg-indigo-500/10", tag: `%${currentTotals.revenue > 0 ? (currentTotals.profit / currentTotals.revenue * 100).toFixed(1) : 0} Marj` },
          { label: "TOPLAM SEANS", value: currentTotals.sessions, icon: CalendarDays, color: "text-amber-400", bg: "bg-amber-500/10", tag: "KÜMÜLATİF" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="premium-card p-8 group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-10">
               <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                 <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
               </div>
               <span className={cn("text-[9px] font-black tracking-widest px-2 py-1 rounded-full border border-white/5 bg-white/5", kpi.color)}>
                 {kpi.tag}
               </span>
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{kpi.label}</p>
               <h2 className="text-3xl font-black tracking-tighter text-white italic">
                 {typeof kpi.value === 'number' ? `₺${kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : kpi.value}
               </h2>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main Content Table */}
      <section className="pb-20">
        <div className="premium-card overflow-hidden bg-zinc-950/40 border-white/[0.05]">
          <div className="p-8 border-b border-white/[0.04] bg-white/[0.01] flex justify-between items-center">
             <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-zinc-600" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Finansal Denetim Listesi</h3>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Canlı Senkronize</span>
                </div>
                <button className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">
                   <Download size={12} />
                   XLSX İNDİR
                </button>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06]">Ay / Dönem</th>
                  <th className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06]">Lokasyon</th>
                  <th className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06] text-center">Oturum</th>
                  <th className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06] text-right">Brüt Ciro</th>
                  <th className="px-6 py-6 text-[10px] font-black text-rose-500/50 uppercase tracking-[0.2em] border-b border-white/[0.06] text-right">Gider (KDV Dahil)</th>
                  <th className="px-6 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-white/[0.06] text-right text-base underline decoration-indigo-500/30">Net Nakit</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/[0.06] text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredData.map((row: any) => (
                  <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-white italic tracking-tight">{row.month}</span>
                          {row.isLive && (
                             <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black">LIVE</span>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-400">{row.locationName}</span>
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Sözleşmeli Portföy</span>
                       </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className="text-xs font-black text-zinc-200 font-mono tracking-tighter">{row.sessionCount}</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <span className="text-sm font-black text-white">₺{row.grossRevenue.toLocaleString('tr-TR')}</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <span className="text-xs font-bold text-rose-500/60">₺{(row.totalAvmExpense + row.iyzico + row.nayax + row.extraExpense).toLocaleString('tr-TR')}</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className={cn("text-base font-black italic tracking-tighter", row.netCash >= 0 ? "text-emerald-400" : "text-rose-500")}>
                          ₺{row.netCash.toLocaleString('tr-TR')}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-end gap-3 translate-x-2">
                          <button className="p-2 rounded-xl bg-white/5 hover:bg-indigo-500 text-zinc-500 hover:text-white transition-all border border-white/5 opacity-40 group-hover:opacity-100">
                             <ArrowRight size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
