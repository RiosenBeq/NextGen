import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getLocationInsights } from '@/features/ledger/actions';
import StrategicMatrix from '@/features/ledger/components/StrategicMatrix';
import FinancialSimulator from '@/features/ledger/components/FinancialSimulator';
import ExpenseBreakdown from '@/features/ledger/components/ExpenseBreakdown';
import { kabinRapor } from '@/lib/kabinRapor';
import { 
  TrendingUp, CreditCard, Wallet, Activity, 
  ArrowUpRight, Radio, LayoutDashboard, BarChart3, 
  Globe, ShieldCheck 
} from 'lucide-react';
import * as motion from "framer-motion/client";
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const insights = await getLocationInsights();

  // Live Data from kabinrapor.com
  let liveData: any = null;
  try {
    liveData = await kabinRapor.getComprehensiveData('Tüm Zamanlar');
  } catch (error) {
    console.error("Failed to fetch live kabin data:", error);
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

  const displayMonthlyRevenue = thisMonthTotal ? thisMonthTotal.total_revenue : totalManualRevenue;
  
  // Use KabinRapor All-Time revenue if available
  const displayAllTimeRevenue = allTimeTotal?.total_revenue || totalManualRevenue;
  const displayTotalSessions = allTimeTotal 
    ? allTimeTotal.total_paid_sessions 
    : (performances?.reduce((acc: number, p: any) => acc + p.sessionCount, 0) || 0);

  // Truer Global Net Cash Flow
  // KabinRapor All-Time Revenue - Base 4% Commission - Total AVM Expenses (from db) - Total Investment (from db)
  const totalInvestment = insights.reduce((acc, loc) => acc + loc.totalInvestment, 0);
  const globalCommission = displayAllTimeRevenue * 0.04;
  
  // Manual AVM Expenses = NetCash is derived from Brüt - Commission - AVm Expense. So AVM Expense = Brüt - Commission - NetCash.
  // Instead of recalculating, we know totalManualCommission includes generic 4% + AVM revenue share. 
  // Let's just use the differential logic: 
  const totalManualAvmExpense = performances?.reduce((acc, perf) => {
    return acc + (perf.location.fixedRent * 1.20) + perf.location.duesAmount;
  }, 0) || 0;
  
  const trueGlobalNetCash = displayAllTimeRevenue - globalCommission - totalManualAvmExpense - totalInvestment;
  const totalGlobalOperationalExpense = globalCommission + totalManualAvmExpense;

  const kpis = [
    { 
      label: "Toplam Ciro", 
      sublabel: "Canlı Senkron",
      value: `₺${displayAllTimeRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, 
      icon: TrendingUp, 
      trend: allTimeTotal ? "API Güncel" : "Manuel Kayıt",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
      cardClass: "stat-card-green",
      positive: true
    },
    { 
      label: "Toplam Gider", 
      sublabel: "KDV + Komisyon + AVM",
      value: `₺${totalGlobalOperationalExpense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, 
      icon: CreditCard, 
      iconColor: "text-red-600",
      iconBg: "bg-red-50 border-red-100",
      cardClass: "stat-card-red",
      trend: "Tüm Zamanlar",
      positive: false
    },
    { 
      label: "Net Nakit Akışı", 
      sublabel: "Yatırım & Tüm Giderler Sonrası",
      value: `₺${trueGlobalNetCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, 
      icon: Wallet, 
      iconColor: trueGlobalNetCash >= 0 ? "text-blue-600" : "text-amber-600",
      iconBg: trueGlobalNetCash >= 0 ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100",
      cardClass: trueGlobalNetCash >= 0 ? "stat-card-blue" : "stat-card-amber",
      trend: `Yatırım: -₺${totalInvestment.toLocaleString('tr-TR')}`,
      positive: trueGlobalNetCash >= 0
    },
  ];

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {liveData ? (
              <span className="live-dot">Canlı Akış</span>
            ) : (
              <span className="text-xs text-amber-600 font-semibold">Manuel Mod</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-slate-400" />
            Performans Paneli
          </h1>
          <p className="text-sm text-slate-500 mt-1">Finansal akış ve stratejik konumlandırma özeti.</p>
        </div>
        
        <Link href="/kabin" className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl premium-card hover:shadow-md transition-all text-sm">
          <div className={cn("w-2 h-2 rounded-full", liveData ? "bg-emerald-500 animate-pulse" : "bg-amber-400")} />
          <span className="font-medium text-slate-700">
            {liveData ? "Sistem Aktif" : "Bağlantı Bekleniyor"}
          </span>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Link>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className={cn("premium-card p-5 border", kpi.cardClass)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", kpi.iconBg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.iconColor)} />
              </div>
              <span className={cn(
                "metric-pill",
                kpi.positive ? "metric-pill-green" : "metric-pill-red"
              )}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{kpi.label}</p>
            <p className="text-slate-400 text-[10px] mb-2">{kpi.sublabel}</p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{kpi.value}</h2>
          </motion.div>
        ))}
      </section>

      {/* Insights + Expense Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Stratejik Performans Matrisi</h2>
            <div className="flex-1 section-divider" />
          </div>
          <StrategicMatrix insights={insights} />
        </section>

        <section className="xl:col-span-4 space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Gider Dağılımı</h2>
            <div className="flex-1 section-divider" />
          </div>
          <div className="premium-card p-5">
            <ExpenseBreakdown expenses={expensesData || []} />
          </div>
        </section>
      </div>

      {/* Performance Score */}
      <section className="grid grid-cols-1 gap-6">
        <div className="premium-card p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
              <motion.circle 
                cx="56" cy="56" r="48" stroke="#2563EB" strokeWidth="9" fill="transparent" 
                strokeDasharray={301.6}
                initial={{ strokeDashoffset: 301.6 }}
                animate={{ strokeDashoffset: 301.6 - (301.6 * 0.85) }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">85</span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Skor</span>
            </div>
          </div>
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck size={16} className="text-blue-500" />
              <h3 className="text-base font-bold text-slate-900">Performans İndeksi</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
              Sistem verimliliği <span className="text-blue-600 font-bold">%85</span> seviyesinde. 
              iyzico/Nayax kesintileri senaryosunda reel getiri hedeflenen projeksiyonların üzerinde seyrediyor.
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
              <span className="metric-pill metric-pill-green">Sistem Stabil</span>
              <span className="metric-pill metric-pill-blue">Kâr Odaklı</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Hacim Simülatörü</h2>
          <div className="flex-1 section-divider" />
        </div>
        <div className="premium-card p-6">
          <FinancialSimulator 
            defaultParams={{
              sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
              kdvRate: paramMap['VAT_RATE'] || 20,
              investmentAmount: insights[0]?.totalInvestment || 250000,
            }} 
          />
        </div>
      </section>

      {/* Chart */}
      <section className="pb-4">
        <div className="premium-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-base font-bold text-slate-900">Momentum Analizi</h3>
              <p className="text-xs text-slate-400 mt-1">Aylık ciro ve net nakit akışı değişimi</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-200" />
                <span className="text-xs font-medium text-slate-500">Ciro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-xs font-medium text-slate-500">Net Kâr</span>
              </div>
            </div>
          </div>
          
          <div className="h-[280px] flex items-end justify-between gap-3 md:gap-6 px-2">
            {chartEntries.map(([month, data], i) => {
              const h_rev = (data.revenue / maxVal) * 100;
              const h_prof = Math.max(0, (data.profit / maxVal) * 100);
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 grow">
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${h_rev}%` }}
                      transition={{ duration: 0.9, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full max-w-[28px] bg-slate-100 rounded-t-lg group-hover:bg-slate-200 transition-colors border border-slate-200"
                    />
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${h_prof}%` }}
                      transition={{ duration: 1, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full max-w-[28px] bg-blue-500 rounded-t-lg shadow-sm group-hover:bg-blue-600 transition-colors"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide group-hover:text-slate-600 transition-colors">
                    {month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
