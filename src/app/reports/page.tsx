import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { TrendingUp, ArrowUpRight, ArrowDownRight, LayoutList, CalendarDays } from 'lucide-react';
import * as motion from "framer-motion/client";

export const metadata = {
  title: 'Nakit Akış Raporu - NextGenBox',
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();

  // Prisma: prisma.monthlyPerformance.findMany({ include: { location: true }, orderBy: { month: 'desc' } })
  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: false });

  // MVP Mock parameters since SystemParameter isn't fully seeded yet.
  const DEFAULT_PARAMS = {
    sessionPrice: 300,
    kdvRate: 20,
    totalCommissionRate: 4, // 2% + 2%
    alpShareRate: 50,
    ngbShareRate: 50,
  };

  const processedData = (performances || []).map((perf: any) => {
    const calc = calculateMonthlyCashFlow(
      perf.sessionCount, 
      perf.extraExpenseAmount, 
      {
        ...DEFAULT_PARAMS,
        fixedRent: perf.location.fixedRent,
        duesAmount: perf.location.duesAmount,
        rentKdvRate: perf.location.rentVatRate,
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
      alpShare: calc.alpShare,
      ngbShare: calc.ngbShare,
    };
  });

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
          <div className="premium-card px-8 py-5 flex items-center gap-6 divide-x divide-white/5 shadow-2xl bg-gradient-to-br from-emerald-500/10 to-transparent">
            <div className="pr-6">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">AYLIK ORT. NET NAKİT</p>
              <p className="text-2xl font-black text-emerald-400">Canlı Veri</p>
            </div>
            <div className="pl-6 flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
               </div>
            </div>
          </div>
        </div>
      </header>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-white tracking-tight leading-none mb-1">Aylık Performans Özeti</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kabin ve Lokasyon Bazlı Dağılım</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button className="px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                EXCEL EXPORT
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5">Ay / Lokasyon</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 text-center">Oturum</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 text-right">Brüt Gelir</th>
                <th className="px-8 py-6 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] border-b border-white/5 text-right">Giderler</th>
                <th className="px-8 py-6 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] border-b border-white/5 text-right font-black">Net Nakit</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] border-b border-white/5 text-right">Partner Payı</th>
                <th className="px-8 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-white/5 text-right">NGB Payı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {processedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <LayoutList size={48} />
                      <p className="text-sm font-black uppercase tracking-widest tracking-widest">Henüz veri girişi yapılmamış</p>
                    </div>
                  </td>
                </tr>
              )}
              {processedData.map((row, idx) => (
                <motion.tr 
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-8 py-7">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tighter">
                        {row.month}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic opacity-60">
                        {row.locationName}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <span className="text-xs font-black text-zinc-400 bg-white/5 px-3 py-1 rounded-full">
                      {row.sessionCount}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-right text-sm font-mono font-bold text-white">
                    ₺{row.grossRevenue.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-8 py-7 text-right text-sm font-mono font-bold text-rose-500/80">
                    -₺{row.totalExpense.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-8 py-7 text-right">
                    <span className="text-base font-black text-emerald-400 font-mono shadow-emerald-500/20">
                      ₺{row.netCash.toLocaleString('tr-TR')}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-right text-sm font-mono font-bold text-cyan-400/80">
                    ₺{row.alpShare.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-8 py-7 text-right text-sm font-mono font-bold text-indigo-400/80">
                    ₺{row.ngbShare.toLocaleString('tr-TR')}
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
