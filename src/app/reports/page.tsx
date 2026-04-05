import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { TrendingUp, ArrowUpRight, CalendarDays, FileText, ArrowRight } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getSystemParameters } from '@/features/ledger/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Raporlar — NextGenBox',
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const params = await searchParams;
  const filterLocation = params.location || 'all';

  const supabase = await createClient();
  const sysParams = await getSystemParameters();
  const sessionPrice = sysParams['SESSION_PRICE_INCL_VAT'] || 300;

  const { data: locations } = await supabase.from('Location').select('*').eq('isActive', true);
  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: false });

  const processed = (performances || []).map((perf: any) => {
    const perfMonthId = new Date(perf.month).toISOString().slice(0, 7);
    
    let sessions = perf.sessionCount;

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
      isLive: false,
    };
  });

  const filteredData = processed.filter((row: any) => 
    filterLocation === 'all' || row.locationId === filterLocation
  );

  const currentTotals = {
    revenue: filteredData.reduce((s: number, r: any) => s + r.grossRevenue, 0),
    profit: filteredData.reduce((s: number, r: any) => s + r.netCash, 0),
    sessions: filteredData.reduce((s: number, r: any) => s + r.sessionCount, 0),
  };

  const kpis = [
    { label: "Toplam Ciro", value: `₺${currentTotals.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, icon: TrendingUp, cardClass: "stat-card-green", iconColor: "text-emerald-600", iconBg: "bg-emerald-100 border-emerald-200", tag: "Kayıt Bazlı" },
    { label: "Net Nakit Akışı", value: `₺${currentTotals.profit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, icon: ArrowUpRight, cardClass: "stat-card-blue", iconColor: "text-blue-600", iconBg: "bg-blue-100 border-blue-200", tag: "Arşiv Bazlı" },
    { label: "Toplam Seans", value: currentTotals.sessions.toLocaleString('tr-TR'), icon: CalendarDays, cardClass: "stat-card-amber", iconColor: "text-amber-600", iconBg: "bg-amber-100 border-amber-200", tag: "Manuel Mod" },
  ];

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg inline-block mb-2">
            Performans Arşivi
          </span>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-slate-400" />
            Nakit Akışı Raporu
          </h1>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
          <Link href="/reports?location=all" className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", filterLocation === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}>Tümü</Link>
          {(locations || []).map(loc => (
            <Link key={loc.id} href={`/reports?location=${loc.id}`} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", filterLocation === loc.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}>{loc.name.split(' ')[0]}</Link>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className={cn("premium-card p-5 border", kpi.cardClass)}>
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", kpi.iconBg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.iconColor)} />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{kpi.tag}</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
            <h2 className="text-xl font-bold text-slate-900">{kpi.value}</h2>
          </motion.div>
        ))}
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Finansal Denetim Listesi</h2>
          <div className="flex-1 section-divider" />
        </div>

        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Dönem</th>
                  <th>Lokasyon</th>
                  <th className="text-center">Oturum</th>
                  <th className="text-right">Brüt Ciro</th>
                  <th className="text-right">Gider (KDV Dahil)</th>
                  <th className="text-right">Net Nakit</th>
                  <th className="text-center w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row: any, idx: number) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="group">
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{row.month}</span>
                      </div>
                    </td>
                    <td><span className="text-sm text-slate-700">{row.locationName}</span></td>
                    <td className="text-center"><span className="text-sm font-mono font-semibold text-slate-700">{row.sessionCount}</span></td>
                    <td className="text-right"><span className="text-sm font-semibold text-slate-900">₺{row.grossRevenue.toLocaleString('tr-TR')}</span></td>
                    <td className="text-right"><span className="text-sm text-red-500 font-medium">₺{(row.totalAvmExpense + row.iyzico + row.nayax + row.extraExpense).toLocaleString('tr-TR')}</span></td>
                    <td className={cn("text-right text-sm font-bold", row.netCash >= 0 ? "text-emerald-700" : "text-red-600")}>₺{row.netCash.toLocaleString('tr-TR')}</td>
                    <td className="text-center">
                      <button className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100">
                        <ArrowRight size={14} />
                      </button>
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
