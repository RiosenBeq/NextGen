import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { TrendingUp, ArrowUpRight, ArrowDownRight, LayoutList, CalendarDays } from 'lucide-react';
import * as motion from "framer-motion/client";

export const metadata = {
  title: 'Nakit Akış Raporu - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();

  // Performans verilerini çek
  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: false });

  // Sistem parametrelerini çek
  const { data: paramsData } = await supabase
    .from('SystemParameter')
    .select('*');

  const paramMap = (paramsData || []).reduce((acc: any, p) => {
    acc[p.key] = p.value;
    return acc;
  }, {});

  const processedData = (performances || []).map((perf: any) => {
    const calc = calculateMonthlyCashFlow(
      perf.sessionCount, 
      perf.extraExpenseAmount, 
      {
        sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
        kdvRate: paramMap['VAT_RATE'] || 20,
        iyzicoCommissionRate: 2,
        nayaxCommissionRate: 2,
        fixedRent: perf.location.fixedRent,
        duesAmount: perf.location.duesAmount,
        rentKdvRate: perf.location.rentVatRate,
        revenueShareRate: perf.location.revenueShareRate || 0,
        revenueThreshold: perf.location.revenueThreshold || 0,
        applyRentVat: true,
      }
    );

    const perfDate = new Date(perf.month);

    return {
      id: perf.id,
      month: perfDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
      locationName: perf.location.name,
      sessionCount: perf.sessionCount,
      grossRevenue: calc.grossRevenue,
      totalExpense: calc.totalExpense,
      netCash: calc.netCash,
      okanShare: calc.okanShare,
      talhaShare: calc.talhaShare,
      furkanShare: calc.furkanShare,
      alpShare: calc.alpShare,
      revenueShare: calc.revenueShare,
      totalAvmExpense: calc.totalAvmExpense,
      iyzicoCommission: calc.iyzicoCommission,
      nayaxCommission: calc.nayaxCommission,
      totalCommission: calc.totalCommission,
      extraExpense: perf.extraExpenseAmount,
    };
  });

  const totals = processedData.reduce((acc, curr) => {
    acc.revenue += curr.grossRevenue;
    acc.profit += curr.netCash;
    acc.sessions += curr.sessionCount;
    return acc;
  }, { revenue: 0, profit: 0, sessions: 0 });

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-[2px] bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
              Financial Reporting
            </span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter heading-elite leading-tight">
            Nakit Akış<br/>Analiz Raporu
          </h1>
        </div>

        <div className="flex gap-4">
          <div className="premium-card px-10 py-6 flex items-center gap-10 divide-x divide-white/5 shadow-2xl bg-zinc-950 border-white/5">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">KÜMÜLATİF CİRO</p>
              <p className="text-3xl font-black text-white italic">₺{totals.revenue.toLocaleString('tr-TR')}</p>
            </div>
            <div className="pl-10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">TOPLAM NET NAKİT</p>
              <p className="text-3xl font-black text-emerald-400 italic">₺{totals.profit.toLocaleString('tr-TR')}</p>
            </div>
            <div className="pl-10 flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
               </div>
            </div>
          </div>
        </div>
      </header>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card overflow-hidden shadow-2xl bg-zinc-950 border-white/5"
      >
        <div className="p-10 border-b border-white/10 bg-white/[0.01] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <CalendarDays className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">Performans Arşivi</h3>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Tüm dönemlerin finansal dökümü</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                Dışa Aktar (PDF)
             </button>
             <button className="px-6 py-3 rounded-xl bg-emerald-500 text-[10px] font-black text-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
                Excel Kaydet
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] border-b border-white/10">Dönem / Lokasyon</th>
                <th className="px-8 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] border-b border-white/10 text-center">Hacim</th>
                <th className="px-8 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] border-b border-white/10 text-right">Brüt</th>
                <th className="px-8 py-8 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] border-b border-white/10 text-right">AVM Kesinti</th>
                <th className="px-8 py-8 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] border-b border-white/10 text-right">Sanal Pos (%4)</th>
                <th className="px-8 py-8 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] border-b border-white/10 text-right">Gider</th>
                <th className="px-10 py-8 text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] border-b border-white/10 text-right">Net Nakit</th>
                <th className="px-8 py-8 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] border-b border-white/10 text-right italic">Ortaklık Dağılımı (%25)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {processedData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-20">
                      <LayoutList size={64} />
                      <p className="text-sm font-black uppercase tracking-[0.5em]">Veri Mevcut Değil</p>
                    </div>
                  </td>
                </tr>
              )}
              {processedData.map((row, idx) => (
                <motion.tr 
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-widest italic">
                        {row.month}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">
                        {row.locationName}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center text-xs font-black text-zinc-400 group-hover:text-white">
                    {row.sessionCount}
                  </td>
                  <td className="px-8 py-8 text-right text-sm font-mono font-bold text-white italic" title="KDV Dahil Toplam Ciro">
                    ₺{row.grossRevenue.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-8 py-8 text-right text-sm font-mono font-bold text-rose-500/60 transition-opacity group-hover:opacity-100" title="Kira + Aidat + Ciro Payı + KDV">
                    ₺{row.totalAvmExpense.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-8 py-8 text-right text-sm font-mono font-bold text-rose-500/60">
                    <div className="flex flex-col items-end gap-0.5">
                       <span className="text-white">₺{row.totalCommission.toLocaleString('tr-TR')}</span>
                       <div className="flex gap-2 text-[8px] font-black opacity-40 group-hover:opacity-100 transition-opacity">
                          <span title="Netten Düşen">%2 IY: ₺{row.iyzicoCommission.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                          <span title="Faturalanan">%2 NX: ₺{row.nayaxCommission.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right text-sm font-mono font-bold text-rose-500/60">
                    ₺{row.extraExpense.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter">
                      ₺{row.netCash.toLocaleString('tr-TR')}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-black italic opacity-40 group-hover:opacity-100 transition-opacity">
                       <div className="flex justify-between gap-2"><span>OKAN:</span> <span className="text-white">₺{row.okanShare.toLocaleString('tr-TR')}</span></div>
                       <div className="flex justify-between gap-2"><span>TALHA:</span> <span className="text-white">₺{row.talhaShare.toLocaleString('tr-TR')}</span></div>
                       <div className="flex justify-between gap-2"><span>FURKAN:</span> <span className="text-white">₺{row.furkanShare.toLocaleString('tr-TR')}</span></div>
                       <div className="flex justify-between gap-2"><span>ALP:</span> <span className="text-emerald-500">₺{row.alpShare.toLocaleString('tr-TR')}</span></div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
