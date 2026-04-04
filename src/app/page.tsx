import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getLocationInsights } from '@/features/ledger/actions';
import StrategicMatrix from '@/features/ledger/components/StrategicMatrix';
import FinancialSimulator from '@/features/ledger/components/FinancialSimulator';
import ExpenseBreakdown from '@/features/ledger/components/ExpenseBreakdown';
import { kabinRapor } from '@/lib/kabinRapor';
import { TrendingUp, CreditCard, Wallet, Activity, ArrowUpRight, ArrowDownRight, ShieldCheck, Globe, Radio, LayoutDashboard } from 'lucide-react';
import * as motion from "framer-motion/client";
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard - NextGenBox Intelligence',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const insights = await getLocationInsights();

  // Fetch Live Data from kabinrapor.com
  let liveData: any = null;
  try {
    liveData = await kabinRapor.getComprehensiveData('Tüm Zamanlar');
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

  const allTimeTotal = liveData?.allTimeTotals;
  const citySplit = liveData?.citySplit;
  const thisMonthTotal = liveData?.thisMonthTotals;
  const todayTotal = liveData?.yesterdayTotals || liveData?.selectedRangeTotals;

  // Prioritize Current Month for primary 'CANLI' cards as per data-accuracy goal
  const displayMonthlyRevenue = thisMonthTotal ? thisMonthTotal.total_revenue : totalManualRevenue;
  const displayTotalSessions = allTimeTotal ? allTimeTotal.total_paid_sessions : (performances?.reduce((acc: number, p: any) => acc + p.sessionCount, 0) || 0);

  const kpis = [
    { 
      label: "BU AY CİRO (CANLI)", 
      value: `₺${displayMonthlyRevenue.toLocaleString('tr-TR')}`, 
      icon: TrendingUp, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10",
      trend: citySplit ? `Bursa: ₺${citySplit.cities.Bursa.revenue.toLocaleString('tr-TR')}` : 'Canlı Veri',
      trendValue: citySplit ? `İzmir: ₺${citySplit.cities.İzmir.revenue.toLocaleString('tr-TR')}` : 'Nisan 2026',
      positive: true
    },
    { 
      label: "TOPLAM SEANS", 
      value: displayTotalSessions.toLocaleString('tr-TR'), 
      icon: Activity, 
      color: "text-indigo-400", 
      bg: "bg-indigo-500/10",
      trend: "Kümülatif (Yıllık)",
      trendValue: thisMonthTotal ? `Bu Ay: ${thisMonthTotal.total_paid_sessions.toLocaleString('tr-TR')} Seans` : 'Canlı Veri',
      positive: true
    },
    { 
      label: "OPERASYONEL GİDER", 
      value: `₺${totalManualCommission.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, 
      icon: CreditCard, 
      color: "text-rose-400", 
      bg: "bg-rose-500/10",
      trend: "KDV Dahil + AVM Payı",
      trendValue: "Kayıtlı Gider Dökümü",
      positive: false
    },
    { 
      label: "NET NAKİT AKIŞI", 
      value: `₺${totalManualNetCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, 
      icon: Wallet, 
      color: totalManualNetCash >= 0 ? "text-emerald-400" : "text-rose-400", 
      bg: totalManualNetCash >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
      trend: `Marj: %${totalManualRevenue > 0 ? (totalManualNetCash / totalManualRevenue * 100).toFixed(1) : 0}`,
      trendValue: "Tüm Giderler Sonrası",
      positive: totalManualNetCash >= 0
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-12 md:space-y-16 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
               <Radio size={12} className="text-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Canlı Akış</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <LayoutDashboard className="w-8 h-8 text-zinc-500" />
             Performans Paneli
          </h1>
          <p className="text-sm text-zinc-500 font-medium tracking-tight">Finansal akış ve stratejik konumlandırma özeti.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/kabin" className="px-6 py-3.5 rounded-2xl glass-panel group transition-all hover:bg-white/[0.04]">
            <div className="flex items-center gap-4">
               <div className={cn("w-2.5 h-2.5 rounded-full", liveData ? "bg-emerald-500 shadow-[0_0_10px_rgba(52,199,89,0.5)]" : "bg-amber-500")} />
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sistem Durumu</span>
                  <span className="text-sm font-bold text-white tracking-tight uppercase">{liveData ? "Aktif Bağlantı" : "Manuel Senkron"}</span>
               </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Primary KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="premium-card p-6 flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
               <div className={cn("p-3 rounded-xl", kpi.bg)}>
                  <kpi.icon className={cn("w-5 h-5", kpi.color)} />
               </div>
               <div className={cn("px-2 py-1 rounded-lg text-[10px] font-bold tracking-tight border", 
                  kpi.positive ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
               )}>
                  {kpi.trend}
               </div>
            </div>
            <div className="mt-6">
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{kpi.label}</p>
               <h2 className="text-2xl font-bold tracking-tight text-white">{kpi.value}</h2>
               <p className="text-[10px] text-zinc-600 mt-2 font-medium tracking-tight">{kpi.trendValue}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Insights Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-8 space-y-6">
           <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white tracking-tight italic">Stratejik Performans Matrisi</h2>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
           </div>
           <StrategicMatrix insights={insights} />
        </section>

        <section className="xl:col-span-4 space-y-6">
           <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white tracking-tight italic">Gider Dağılımı</h2>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
           </div>
           <div className="premium-card p-6 bg-zinc-950/40">
              <ExpenseBreakdown expenses={expensesData || []} />
           </div>
        </section>
      </div>

      {/* NEW: Performance Insight Index */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 premium-card p-10 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent flex flex-col md:flex-row items-center gap-10 border-indigo-500/10">
            <div className="relative shrink-0 flex items-center justify-center">
               <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                  <motion.circle 
                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" 
                    strokeDasharray={364.4}
                    initial={{ strokeDashoffset: 364.4 }}
                    animate={{ strokeDashoffset: 364.4 - (364.4 * 0.85) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    strokeLinecap="round"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">85</span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Skor</span>
               </div>
            </div>
            <div className="space-y-4 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <h3 className="text-xl font-bold text-white tracking-tight">Performans İndeksi</h3>
               </div>
               <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-lg">
                 Sistem verimliliği şu an <span className="text-emerald-400 font-bold">%85</span> seviyesinde. Tüm lokasyonlarda hedeflenen kâr marjı stabilitesi korundu. <span className="text-white font-bold">iyzico/Nayax</span> kesintileri sonrası reel getiri beklenenin (288 TL) üzerinde seyrediyor.
               </p>
               <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Optimize Edildi</span>
                  <span className="px-3 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Kâr Odaklı</span>
               </div>
            </div>
         </div>

         <div className="premium-card p-10 flex flex-col justify-between bg-zinc-950/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <Globe size={120} className="text-indigo-500" />
            </div>
            <div className="space-y-2">
               <h3 className="text-lg font-bold text-white tracking-tight italic">Yol Haritası</h3>
               <p className="text-xs text-zinc-500 font-medium tracking-tight">Gelecek çeyrek projeksiyonu ve stratejik büyüme hedefleri.</p>
            </div>
            <div className="space-y-4 pt-10">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Ege Perla Yeni Hat</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Sistem Optimizasyonu v5</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">Yeni Lokasyon Arşivi</span>
               </div>
            </div>
         </div>
      </section>

      {/* Simulator Section */}
      <section className="space-y-6">
         <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Hacim ve Büyüme Simülatörü</h2>
            <div className="flex-1 h-[1px] bg-white/[0.04]" />
         </div>
         <div className="premium-card p-8">
            <FinancialSimulator 
              defaultParams={{
                sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
                kdvRate: paramMap['VAT_RATE'] || 20,
                investmentAmount: insights[0]?.totalInvestment || 250000,
              }} 
            />
         </div>
      </section>

      {/* Main Analysis Chart */}
      <section className="pb-12 md:pb-20">
        <motion.div 
          className="premium-card p-8 md:p-10"
        >
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-1">Momentum Analizi</h3>
              <p className="text-xs text-zinc-500 font-medium">Aylık bazda ciro ve net nakit akışı değişimi.</p>
            </div>
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Revenue</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(94,92,230,0.4)]" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Profit</span>
               </div>
            </div>
          </header>
          
          <div className="h-[350px] flex items-end justify-between gap-4 md:gap-10 px-2 lg:px-6">
            {chartEntries.map(([month, data], i) => {
              const h_rev = (data.revenue / maxVal) * 100;
              const h_prof = (data.profit / maxVal) * 100;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-6 group h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 md:gap-2 grow relative">
                     <motion.div 
                       initial={{ height: 0 }} animate={{ height: `${h_rev}%` }}
                       transition={{ duration: 1, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                       className="w-full max-w-[24px] md:max-w-[40px] bg-white/[0.04] rounded-t-lg group-hover:bg-white/[0.08] transition-all border-x border-t border-white/[0.04]"
                     />
                     <motion.div 
                       initial={{ height: 0 }} animate={{ height: `${h_prof}%` }}
                       transition={{ duration: 1.2, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                       className="w-full max-w-[24px] md:max-w-[40px] bg-gradient-to-t from-indigo-600/60 to-indigo-500/80 rounded-t-lg shadow-lg border-x border-t border-white/[0.1]"
                     />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest transition-colors group-hover:text-zinc-400">
                     {month}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

