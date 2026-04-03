"use client";

import { use, useEffect, useState } from 'react';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { TrendingUp, ArrowUpRight, ArrowDownRight, LayoutList, CalendarDays, FileText, Download, Share2 } from 'lucide-react';
import * as motion from "framer-motion/client";
import { createClient } from '@/utils/supabase/client';
import { getSystemParameters } from '@/features/ledger/actions';
import { cn } from '@/lib/utils';
import { kabinRapor } from '@/lib/kabinRapor';

export default function ReportsPage() {
  const [data, setData] = useState<{
    processedData: any[];
    totals: any;
    liveTotals?: any;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const params = await getSystemParameters();
      const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;

      // Fetch Live Data
      let liveData = null;
      try {
        liveData = await kabinRapor.getDashboardTotals('Tüm Zamanlar');
      } catch (e) {
        console.error("Live data fetch failed on reports:", e);
      }

      const { data: performances } = await supabase
        .from('MonthlyPerformance')
        .select('*, location:Location(*)')
        .order('month', { ascending: false });

      const processedData = (performances || []).map((perf: any) => {
        const calc = calculateMonthlyCashFlow(perf.sessionCount, perf.extraExpenseAmount, {
          sessionPrice, iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
          fixedRent: perf.location.fixedRent, duesAmount: perf.location.duesAmount,
          revenueShareRate: perf.location.revenueShareRate || 0,
        });

        return {
          id: perf.id,
          month: new Date(perf.month).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
          locationName: perf.location.name,
          sessionCount: perf.sessionCount,
          grossRevenue: calc.grossRevenue,
          totalAvmExpense: calc.totalAvmExpense,
          iyzico: calc.iyzicoCommission,
          nayax: calc.nayaxCommission,
          extraExpense: perf.extraExpenseAmount || 0,
          netCash: calc.netCash,
          shares: { ok: calc.okanShare, tl: calc.talhaShare, fk: calc.furkanShare, al: calc.alpShare }
        };
      });

      setData({
        processedData,
        totals: {
          revenue: processedData.reduce((s: number, r: any) => s + r.grossRevenue, 0),
          profit: processedData.reduce((s: number, r: any) => s + r.netCash, 0),
          sessions: processedData.reduce((s: number, r: any) => s + r.sessionCount, 0),
        },
        liveTotals: liveData
      });
    }
    fetchData();
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1500px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10">Finansal Kayıtlar</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <LayoutList className="w-8 h-8 text-zinc-500" />
             Performans Arşivi
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Geçmiş ayların seans verileri, kesintiler ve ortaklık payı dökümleri.
          </p>
        </div>

        <div className="flex gap-4">
           <button className="px-5 py-3 rounded-xl glass-panel text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center gap-2 border border-white/5">
              <Download size={14} />
              Dışa Aktar (CSV)
           </button>
           <button className="px-5 py-3 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              <Share2 size={14} />
              Raporu Paylaş
           </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "TOPLAM CİRO (ARŞİV)", value: data.totals.revenue, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: "+12.4%", trendLabel: "geçen aya göre" },
          { label: "NET NAKİT AKIŞI", value: data.totals.profit, icon: ArrowUpRight, color: "text-indigo-400", bg: "bg-indigo-500/10", trend: "%32 Marj", trendLabel: "ortalama" },
          { label: "TOPLAM SEANS", value: data.totals.sessions, icon: CalendarDays, color: "text-amber-400", bg: "bg-amber-500/10", trend: data.liveTotals?.total_paid_sessions || 0, trendLabel: "canlı veri eşleşmesi" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="premium-card p-8 group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
               <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                 <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
               </div>
               <div className="text-right">
                  <div className={cn("text-[10px] font-black uppercase tracking-wider mb-1", kpi.color)}>
                    {kpi.trend}
                  </div>
                  <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{kpi.trendLabel}</div>
               </div>
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{kpi.label}</p>
               <h2 className="text-3xl font-black tracking-tight text-white italic">
                 {typeof kpi.value === 'number' ? `₺${kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : kpi.value}
               </h2>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main Content Table */}
      <section className="pb-20">
        <div className="premium-card overflow-hidden bg-zinc-950/40">
          <div className="p-6 border-b border-white/[0.04] bg-white/[0.01] flex justify-between items-center">
             <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-zinc-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Aylık Performans Detayları</h3>
             </div>
             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Son {data.processedData.length} Kayıt Listeleniyor</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04]">Dönem</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04]">Lokasyon</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-center">Seans</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">Brüt Ciro</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-rose-500/50 uppercase tracking-widest border-b border-white/[0.04] text-right">AVM Payı + Kira</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-rose-500/50 uppercase tracking-widest border-b border-white/[0.04] text-right">iyzico/Nayax</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/[0.04] text-right">Net Nakit</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-white uppercase tracking-widest border-b border-white/[0.04] text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {data.processedData.map((row: any) => (
                  <tr key={row.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-5 font-bold text-zinc-200 text-sm italic">{row.month}</td>
                    <td className="px-4 py-5 font-medium text-zinc-400 text-sm">{row.locationName}</td>
                    <td className="px-4 py-5 text-center text-zinc-200 font-mono text-xs">{row.sessionCount}</td>
                    <td className="px-4 py-5 text-right font-bold text-white text-sm whitespace-nowrap">₺{row.grossRevenue.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-5 text-right font-medium text-rose-400/60 text-xs">₺{row.totalAvmExpense.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-5 text-right font-medium text-amber-500/60 text-xs">₺{(row.iyzico + row.nayax).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-5 text-right font-black text-emerald-400 text-sm">₺{row.netCash.toLocaleString('tr-TR')}</td>
                    <td className="px-6 py-5">
                       <div className="flex items-center justify-center gap-2">
                          <button className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 transition-all border border-white/5">
                             <FileText size={14} />
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
