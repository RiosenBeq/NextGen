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

  if (!data) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1500px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10">Archive</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <FileText className="w-8 h-8 text-zinc-500" />
             Performans Arşivi
          </h1>
          <p className="text-sm text-zinc-500 font-medium">Tüm dönemlerin kümülatif finansal dökümü ve nakit akış analizi.</p>
        </div>

        <div className="flex gap-4">
           <div className="premium-card px-8 py-5 bg-white/[0.02] flex items-center gap-8 divide-x divide-white/[0.04]">
              <div>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Kümülatif Ciro</p>
                 <p className="text-2xl font-bold text-white italic">₺{data.totals.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="pl-8">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Toplam Net</p>
                 <p className="text-2xl font-bold text-emerald-400 italic">₺{data.totals.profit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
              </div>
           </div>
        </div>
      </header>

      {/* Main Report Table */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <CalendarDays className="w-5 h-5 text-zinc-600" />
              <h2 className="text-lg font-bold text-white tracking-tight">Dönemsel Kayıtlar</h2>
           </div>
           <div className="flex gap-2">
              <button className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-400 hover:text-white transition-all">
                 <Download className="w-4 h-4" />
              </button>
              <button className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-400 hover:text-white transition-all">
                 <Share2 className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04]">Dönem / Lokasyon</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-center">İşlem</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">Brüt (KDV+)</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">AVM Kesinti</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">iyzico (%2)</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">Nayax (%2)</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-white/[0.04] text-right">Reel Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {data.processedData.map((row, idx) => (
                  <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight italic">
                          {row.month}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                          {row.locationName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center text-xs font-bold text-zinc-500">
                      {row.sessionCount}
                    </td>
                    <td className="px-6 py-6 text-right text-sm font-medium text-zinc-300">
                      ₺{row.grossRevenue.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-6 text-right text-sm font-medium text-rose-500/60">
                      ₺{row.totalAvmExpense.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-6 text-right text-sm font-medium text-rose-500/60 font-mono">
                      ₺{row.iyzico.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-6 text-right text-sm font-medium text-indigo-500/60 font-mono">
                      ₺{row.nayax.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-base font-bold text-emerald-400 italic">
                        ₺{row.netCash.toLocaleString('tr-TR')}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

