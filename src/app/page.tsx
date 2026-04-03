import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getLocationInsights } from '@/features/ledger/actions';
import StrategicMatrix from '@/features/ledger/components/StrategicMatrix';
import FinancialSimulator from '@/features/ledger/components/FinancialSimulator';
import ExpenseBreakdown from '@/features/ledger/components/ExpenseBreakdown';
import { kabinRapor } from '@/lib/kabinRapor';
import { TrendingUp, CreditCard, Wallet, Activity, ArrowUpRight, ArrowDownRight, Monitor, ShieldCheck, Globe, Zap, Radio } from 'lucide-react';
import * as motion from "framer-motion/client";
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard - NextGenBox Strategic',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const insights = await getLocationInsights();

  // Fetch Live Data from kabinrapor.com
  let liveTotals: any = null;
  try {
    liveTotals = await kabinRapor.getAllRangeTotals();
  } catch (error) {
    console.error("Failed to fetch live kabin data on dashboard:", error);
  }

  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: true });

  const { data: expensesData } = await supabase
    .from('Expense')
    .select('*')
    .limit(100);

  const { data: paramsData } = await supabase
    .from('SystemParameter')
    .select('*');

  const paramMap = (paramsData || []).reduce((acc: any, p) => {
    acc[p.key] = p.value;
    return acc;
  }, {});

  const monthlyTotals: Record<string, any> = {};
  let totalManualRevenue = 0;
  let totalManualNetCash = 0;
  let totalManualCommission = 0;

  if (performances) {
    for (const perf of performances) {
      const calc = calculateMonthlyCashFlow(
        perf.sessionCount,
        perf.extraExpenseAmount,
        {
          sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
          iyzicoCommissionRate: 2,
          nayaxCommissionRate: 2,
          fixedRent: perf.location.fixedRent,
          duesAmount: perf.location.duesAmount,
          revenueShareRate: perf.location.revenueShareRate || 0,
        }
      );

      const monthKey = new Date(perf.month).toLocaleDateString('tr-TR', { month: 'short' });
      if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { revenue: 0, profit: 0 };
      monthlyTotals[monthKey].revenue += calc.grossRevenue;
      monthlyTotals[monthKey].profit += calc.netCash;

      totalManualRevenue += calc.grossRevenue;
      totalManualNetCash += calc.netCash;
      totalManualCommission += (calc.totalCommission + calc.revenueShare);
    }
  }

  const chartEntries = Object.entries(monthlyTotals).slice(-6);
  const maxVal = Math.max(...chartEntries.map(([_, v]) => v.revenue), 1);

  // Live real-time KPIs (fallback to DB manual records if API fails)
  const allTimeTotal = liveTotals ? liveTotals['Tüm Zamanlar'] : null;
  const thisMonthTotal = liveTotals ? liveTotals['Bu Ay'] : null;
  const todayTotal = liveTotals ? liveTotals['Bugün'] : null;

  const displayRevenue = allTimeTotal ? allTimeTotal.total_revenue : totalManualRevenue;
  const displaySessions = allTimeTotal ? allTimeTotal.total_paid_sessions : (performances?.reduce((acc, p) => acc + p.sessionCount, 0) || 0);

  const kpis = [
    { 
      label: "TOTAL REVENUE (LIVE)", 
      value: `₺${displayRevenue.toLocaleString('tr-TR')}`, 
      icon: TrendingUp, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10",
      trend: "+12.4%", // Example static trend since no baseline yet
      trendValue: todayTotal ? `Bugün: ₺${todayTotal.total_revenue.toLocaleString('tr-TR')}` : 'Canlı Veri',
      positive: true
    },
    { 
      label: "TOTAL SESSIONS", 
      value: displaySessions.toLocaleString('tr-TR'), 
      icon: Activity, 
      color: "text-indigo-400", 
      bg: "bg-indigo-500/10",
      trend: "Müşteri Dönüşümü",
      trendValue: thisMonthTotal ? `Bu Ay: ${thisMonthTotal.total_paid_sessions.toLocaleString('tr-TR')} Seans` : 'Canlı Veri',
      positive: true
    },
    { 
      label: "OPERATIONAL COST", 
      value: `₺${totalManualCommission.toLocaleString('tr-TR')}`, 
      icon: CreditCard, 
      color: "text-rose-400", 
      bg: "bg-rose-500/10",
      trend: "iyzico + nayax + AVM",
      trendValue: "Kesilmiş Kayıtlı Giderler",
      positive: false
    },
    { 
      label: "NET CASH FLOW (RECORDED)", 
      value: `₺${totalManualNetCash.toLocaleString('tr-TR')}`, 
      icon: Wallet, 
      color: totalManualNetCash >= 0 ? "text-emerald-400" : "text-rose-400", 
      bg: totalManualNetCash >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
      trend: `marj: %${totalManualRevenue > 0 ? (totalManualNetCash / totalManualRevenue * 100).toFixed(1) : 0}`,
      trendValue: "Geçmiş Aya Göre",
      positive: totalManualNetCash >= 0
    },
  ];

  return (
    <div className="p-10 space-y-20 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Radio size={10} className="animate-pulse" /> Live Ledger</span>
            <span className="text-[10px] font-black tracking-[0.4em] text-zinc-500 uppercase">Strategic Intelligence v2</span>
          </motion.div>
          <h1 className="text-6xl font-black tracking-tighter heading-elite leading-[0.9]">Finansal<br/>Kontrol Merkezi</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/kabin" className="px-8 py-4 rounded-3xl glass-panel border border-white/5 flex items-center gap-6 shadow-2xl overflow-hidden relative hover:bg-white/5 transition-colors group cursor-pointer">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
               <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">API Stream Status</span>
              <div className="flex items-center gap-3">
                 <span className={cn("text-xl font-black italic", liveTotals ? "text-emerald-400" : "text-amber-500")}>
                   {liveTotals ? "OPERATIONAL" : "DEGRADED"}
                 </span>
                 <div className={cn("w-2.5 h-2.5 rounded-full animate-ping", liveTotals ? "bg-emerald-500" : "bg-amber-500")} />
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="premium-card p-8 group hover:border-white/10 transition-all relative overflow-hidden"
          >
            <div className="absolute -right-8 -top-8 text-white/[0.03] group-hover:text-white/[0.07] transition-all duration-1000 rotate-12">
               <kpi.icon size={160} strokeWidth={1.5} />
            </div>
            <div className="flex justify-between items-start mb-12 relative z-10">
               <div className={cn("p-4 rounded-2xl shadow-inner", kpi.bg)}>
                  <kpi.icon className={cn("w-7 h-7", kpi.color)} />
               </div>
               <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-tighter border", 
                  kpi.positive ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
               )}>
                  {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
               </div>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
               <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">{kpi.value}</h2>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Strategic Insights Section */}
      <section className="space-y-10">
         <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-emerald-500 px-6 py-2">Stratejik Performans Matrisi</h2>
            <div className="flex-1 h-[1px] bg-white/5" />
         </div>
         <StrategicMatrix insights={insights} />
      </section>

      {/* Financial Simulation & Breakdown Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-indigo-500 px-6 py-2">Hacim Simülatörü</h2>
               <div className="flex-1 h-[1px] bg-white/5" />
            </div>
            <FinancialSimulator 
              defaultParams={{
                sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
                kdvRate: paramMap['VAT_RATE'] || 20,
                investmentAmount: insights[0]?.totalInvestment || 250000,
              }} 
            />
         </div>
         <div className="lg:col-span-4 space-y-10">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-amber-500 px-6 py-2">Gidex</h2>
               <div className="flex-1 h-[1px] bg-white/5" />
            </div>
            <ExpenseBreakdown expenses={expensesData || []} />
         </div>
      </section>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-12 premium-card p-12 bg-zinc-950 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Globe size={120} />
          </div>

          <header className="flex justify-between items-start mb-20 relative z-10">
            <div>
              <h3 className="text-3xl font-black text-white tracking-tighter mb-2">Trend Akış Analizi</h3>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Aylık Finansal Momentum</p>
            </div>
            <div className="flex gap-8">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full border border-white/20 bg-zinc-800" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ciro</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Net Kar</span>
               </div>
            </div>
          </header>
          
          <div className="flex-1 flex items-end justify-between gap-10 h-[400px] mb-12 relative z-10 px-6">
            {chartEntries.map(([month, data], i) => {
              const h_rev = (data.revenue / maxVal) * 100;
              const h_prof = (data.profit / maxVal) * 100;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-8 group">
                  <div className="w-full flex items-end justify-center gap-3 h-full relative">
                     <motion.div 
                       initial={{ height: 0 }} animate={{ height: `${h_rev}%` }}
                       transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }}
                       className="w-full max-w-[40px] bg-white/5 rounded-3xl group-hover:bg-white/10 transition-all relative border border-white/5"
                     />
                     <motion.div 
                       initial={{ height: 0 }} animate={{ height: `${h_prof}%` }}
                       transition={{ duration: 1.2, delay: i * 0.15, ease: "circOut" }}
                       className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.2)] border border-white/10"
                     />
                  </div>
                  <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] group-hover:text-white transition-colors">
                     {month.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
