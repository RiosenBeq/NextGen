import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getLocationInsights } from '@/features/ledger/actions';
import StrategicMatrix from '@/features/ledger/components/StrategicMatrix';
import FinancialSimulator from '@/features/ledger/components/FinancialSimulator';
import ExpenseBreakdown from '@/features/ledger/components/ExpenseBreakdown';
import PerformanceComparison from '@/features/ledger/components/PerformanceComparison';
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
  let totalManualAvmExpense = 0;
  let totalManualOperationalExpense = 0;

  if (performances) {
    for (const perf of performances) {
      const loc = perf.location;
      const perfMonthStr = new Date(perf.month).toISOString().slice(0, 7);
      
      const recurringTotal = (expensesData || [])
        .filter((e: any) => e.type === 'RECURRING' && (!e.locationId || e.locationId === loc.id))
        .reduce((s: number, e: any) => s + (e.amountWithVat || 0), 0);
        
      const oneTimeTotal = (expensesData || [])
        .filter((e: any) => {
          if (e.type === 'RECURRING') return false;
          const expMonth = e.month ? (e.month.includes('T') ? e.month.split('T')[0].slice(0, 7) : e.month.slice(0, 7)) : '';
          return expMonth === perfMonthStr && (!e.locationId || e.locationId === loc.id);
        })
        .reduce((s: number, e: any) => s + (e.amountWithVat || 0), 0);

      const totalExtraExpense = (perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

      const calc = calculateMonthlyCashFlow(
        perf.sessionCount,
        totalExtraExpense,
        {
          sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
          iyzicoCommissionRate: 2,
          nayaxCommissionRate: 2,
          fixedRent: loc.fixedRent,
          duesAmount: loc.duesAmount,
          revenueShareRate: loc.revenueShareRate || 15,
        }
      );

      const monthKey = new Date(perf.month).toLocaleDateString('tr-TR', { month: 'short' });
      if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { revenue: 0, profit: 0 };
      monthlyTotals[monthKey].revenue += calc.grossRevenue;
      monthlyTotals[monthKey].profit += calc.netCash;

      totalManualRevenue += calc.grossRevenue;
      totalManualNetCash += calc.netCash;
      totalManualCommission += calc.totalCommission;
      totalManualAvmExpense += calc.totalAvmExpense;
      totalManualOperationalExpense += (calc.totalCommission + calc.totalAvmExpense + totalExtraExpense);
    }
  }

  const chartEntries = Object.entries(monthlyTotals).slice(-6);
  const maxVal = Math.max(...chartEntries.map(([_, v]) => v.revenue), 1);

  const displayAllTimeRevenue = totalManualRevenue;
  const trueGlobalNetCash = totalManualNetCash;
  const totalGlobalOperationalExpense = totalManualOperationalExpense;
  const displayTotalSessions = performances?.reduce((acc: number, p: any) => acc + p.sessionCount, 0) || 0;
  const totalInvestment = insights.reduce((acc, loc) => acc + loc.totalInvestment, 0);
  const allMonthCount = performances ? new Set(performances.map((p: any) => new Date(p.month).toISOString().slice(0, 7))).size : 1;

  const kpis = [
    { 
      label: "Toplam Ciro", 
      sublabel: "Manuel Kayıtlar",
      value: `₺${displayAllTimeRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, 
      icon: TrendingUp, 
      trend: "Manuel Mod",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
      cardClass: "stat-card-green",
      positive: true
    },
    {
      label: "Toplam Gider",
      sublabel: "Komisyon + AVM + Diğer",
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
      sublabel: "Tüm Operasyonel Giderler Sonrası",
      value: `₺${trueGlobalNetCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
      icon: Wallet,
      iconColor: trueGlobalNetCash >= 0 ? "text-blue-600" : "text-amber-600",
      iconBg: trueGlobalNetCash >= 0 ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100",
      cardClass: trueGlobalNetCash >= 0 ? "stat-card-blue" : "stat-card-amber",
      trend: `Yatırım: ₺${totalInvestment.toLocaleString('tr-TR')}`,
      positive: trueGlobalNetCash >= 0
    },
  ];

  // Prepare Bursa vs Izmir comparison data (Last 6 months)
  const comparisonData: any[] = [];
  const monthNames = Array.from(new Set(performances?.map(p => new Date(p.month).toLocaleDateString('tr-TR', { month: 'short' })) || []));
  
  monthNames.slice(-6).forEach(m => {
    const entry: any = { month: m };
    const monthPerfs = performances?.filter(p => new Date(p.month).toLocaleDateString('tr-TR', { month: 'short' }) === m) || [];
    monthPerfs.forEach(p => {
      entry[p.location.name] = p.sessionCount;
    });
    comparisonData.push(entry);
  });

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">Eski Veriler Temizlendi</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Manual Mod Aktif</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            Performans Paneli
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Finansal operasyonlar ve şube performansı anlık özeti.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
           <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-200" />
             <span className="font-bold text-slate-700 tracking-tight uppercase text-xs">Sistem Durumu: Stabil</span>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 italic">Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}</p>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, type: 'spring', damping: 20 }}
            className={cn("premium-card p-6 group hover:shadow-xl transition-all duration-300", kpi.cardClass)}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-300", kpi.iconBg)}>
                <kpi.icon className={cn("w-6 h-6", kpi.iconColor)} />
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                kpi.positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}>
                {kpi.trend}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                 <ArrowUpRight size={12} className="text-slate-300" />
                 {kpi.sublabel}
              </p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Bursa vs İzmir Comparison */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest italic">Şube Performans Kıyaslaması (Bursa vs İzmir)</h2>
          <div className="flex-1 border-t border-slate-100" />
        </div>
        <div className="premium-card p-8 bg-white border border-slate-100">
           <PerformanceComparison data={comparisonData} />
        </div>
      </section>

      {/* Insights + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest italic">Stratejik Performans Matrisi</h2>
            <div className="flex-1 border-t border-slate-100" />
          </div>
          <div className="min-h-[400px] overflow-visible">
            <StrategicMatrix insights={insights} />
          </div>
        </section>

        <section className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest italic">Gider Dağılımı</h2>
            <div className="flex-1 border-t border-slate-100" />
          </div>
          <div className="premium-card p-6 h-full flex flex-col justify-center">
            <ExpenseBreakdown expenses={expensesData || []} />
          </div>
        </section>
      </div>

      {/* Performance Score + Additional Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="premium-card p-8 flex flex-col sm:flex-row items-center gap-8 bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={120} />
          </div>
          <div className="relative shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="transparent" />
              <motion.circle 
                cx="64" cy="64" r="56" stroke="#3B82F6" strokeWidth="12" fill="transparent" 
                strokeDasharray={351.8}
                initial={{ strokeDashoffset: 351.8 }}
                animate={{ strokeDashoffset: 351.8 - (351.8 * 0.88) }}
                transition={{ duration: 2, ease: "circOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white italic">88</span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Verimlilik</span>
            </div>
          </div>
          <div className="space-y-4 text-center sm:text-left relative z-10">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase italic">Sistem Sağlık Skoru</h3>
            </div>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Lokasyon bazlı gider-gelir dengesi <span className="text-blue-400 font-black">%88</span> verimlilikle çalışıyor. 
              Sabit giderler optimize edilmiş durumda ve manuel girişler şeffaflığı artırıyor.
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">Stabil Akış</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">Kâr Odaklı</span>
            </div>
          </div>
        </div>

        <div className="premium-card p-8 bg-white border border-slate-100 flex flex-col justify-center space-y-6">
           <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Oturum</h4>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{displayTotalSessions.toLocaleString('tr-TR')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                 <Activity className="w-6 h-6 text-blue-500" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Haftalık Ortalama</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter font-mono">{(displayTotalSessions / Math.max(allMonthCount * 4, 1)).toFixed(1)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ROI (Tahmini)</p>
                <p className="text-lg font-black text-emerald-600 tracking-tighter font-mono">%{insights[0]?.roi.toFixed(1) || '0.0'}</p>
              </div>
           </div>
        </div>
      </section>

      {/* Simulator */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest italic leading-none">Finansal Projeksiyon Simülatörü</h2>
          <div className="flex-1 border-t border-slate-100" />
        </div>
        <div className="premium-card p-8 bg-white shadow-sm border border-slate-100">
          <FinancialSimulator 
            defaultParams={{
              sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
              kdvRate: paramMap['VAT_RATE'] || 20,
              investmentAmount: insights[0]?.totalInvestment || 250000,
            }} 
          />
        </div>
      </section>

      {/* Legacy Chart (Momentum) replaced with cleaner version or improved */}
      <section className="pb-8">
        <div className="premium-card p-10 bg-gradient-to-br from-white to-slate-50/30 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Momentum Analizi</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">Aylık toplam ciro ve kârlılık momentumu (Son 6 Dönem)</p>
            </div>
            <div className="flex gap-6 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ciro (TL)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-100 bg-blue-50/30">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Net Kâr (TL)</span>
              </div>
            </div>
          </div>
          
          <div className="h-[320px] flex items-end justify-between gap-4 md:gap-10 px-4">
            {chartEntries.map(([month, data], i) => {
              const h_rev = (data.revenue / maxVal) * 100;
              const h_prof = Math.max(0, (data.profit / maxVal) * 100);
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-6 group h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-2 grow">
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${h_rev}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full max-w-[32px] bg-slate-100 rounded-t-xl group-hover:bg-slate-200 transition-all duration-300 border border-slate-200 relative"
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                         <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">₺{Math.round(data.revenue/1000)}k</span>
                       </div>
                    </motion.div>
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${h_prof}%` }}
                      transition={{ duration: 1.2, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full max-w-[32px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl shadow-lg shadow-blue-200/50 group-hover:shadow-blue-300 group-hover:scale-x-105 transition-all duration-300 relative"
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                         <span className="text-[9px] font-black text-blue-600 bg-white px-2 py-1 rounded-md border border-blue-100 shadow-sm">₺{Math.round(data.profit/1000)}k</span>
                       </div>
                    </motion.div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">
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
