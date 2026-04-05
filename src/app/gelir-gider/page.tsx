import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import { 
  TrendingUp, TrendingDown, Wallet, BarChart3, 
  Calendar, CreditCard, Percent,
  ListFilter, PiggyBank, Building2, Activity, HandCoins, PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/server';
import ExpenseDetailCard from '@/features/ledger/components/ExpenseDetailCard';

const EXPENSE_CATEGORIES: Record<string, { label: string; color: string; dot: string }> = {
  rent:        { label: 'Kira',         color: 'metric-pill-red',   dot: 'bg-red-500' },
  utilities:   { label: 'Faturalar',    color: 'metric-pill-blue',  dot: 'bg-blue-500' },
  maintenance: { label: 'Bakım/Onarım', color: 'metric-pill-green', dot: 'bg-amber-500' },
  marketing:   { label: 'Pazarlama',    color: 'metric-pill-blue',  dot: 'bg-purple-500' },
  equipment:   { label: 'Ekipman',      color: 'metric-pill-blue',  dot: 'bg-pink-500' },
  operational: { label: 'Operasyonel',  color: 'metric-pill-green', dot: 'bg-emerald-500' },
  other:       { label: 'Diğer',        color: 'metric-pill-blue',  dot: 'bg-slate-400' },
};

export default async function GelirGiderPage(props: {
  searchParams: Promise<{ month?: string; location?: string; category?: string }>
}) {
  const searchParams = await props.searchParams;
  const filterMonth    = searchParams.month    || '';
  const filterLocation = searchParams.location || 'all';
  const filterCategory = searchParams.category || 'all';

  const supabase = await createClient();
  const sysParams = await getSystemParameters();
  const sessionPrice = sysParams['SESSION_PRICE_INCL_VAT'] || 300;

  // Parallel fetch database records
  const [
    { data: locations },
    { data: performances },
    { data: expenses }
  ] = await Promise.all([
    supabase.from('Location').select('*').eq('isActive', true),
    supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false }),
    supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false }),
  ]);

  const activeLocationCount = (locations || []).length || 1;

  const monthlyEntries: any[] = [];
  
  const formatMonthSafe = (isoStringOrMonthId: any) => {
    if (!isoStringOrMonthId) return '—';
    
    // Ensure we have a string
    const str = String(isoStringOrMonthId);
    let y, m;
    
    if (str.includes('T')) {
      [y, m] = str.split('T')[0].split('-');
    } else {
      [y, m] = str.split('-');
    }
    
    if (!y || !m) return 'Bilinmiyor';
    
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    if (isNaN(d.getTime())) return 'Hatalı Tarih';
    
    return d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
  };

  let totalGrossSum = 0;
  let totalExpenseSumValue = 0;
  let totalNetCashSum = 0;
  let totalCommissionSum = 0;
  let trueSessionsSum = 0;
  let revenueShareSum = 0;
  
  // Breakdown accumulation
  let avmRentTotal = 0;
  let avmDuesTotal = 0;
  let operationalExpensesTotalValue = 0;

  if (performances) {
    for (const perf of performances) {
      const loc = perf.location;
      if (!loc || !perf.month) continue;

      const monthValue = String(perf.month);
      const [y, m] = monthValue.split('T')[0].split('-');
      const perfMonthStr = `${y}-${m}`;
      
      // Recurring expenses:
      //   - Location-specific recurring  → full amount only for that location
      //   - Global recurring (locationId=null) → split equally across all active locations
      const recurringTotal = (expenses || [])
        .filter(e => e.type === 'RECURRING')
        .reduce((s, e) => {
          if (!e.locationId) {
            // Global expense — split across all active locations
            return s + (e.amountWithVat || 0) / activeLocationCount;
          } else if (e.locationId === loc.id) {
            // Location-specific — full amount
            return s + (e.amountWithVat || 0);
          }
          return s;
        }, 0);

      // One-time expenses for this month/location
      const oneTimeTotal = (expenses || [])
        .filter(e => {
          if (e.type === 'RECURRING') return false;
          const expMonth = e.month ? (e.month.includes('T') ? e.month.split('T')[0].slice(0, 7) : e.month.slice(0, 7)) : '';
          if (expMonth !== perfMonthStr) return false;
          // Match global (locationId=null) or same location
          if (e.locationId && e.locationId !== loc.id) return false;
          return true;
        })
        .reduce((s, e) => {
          if (!e.locationId) {
            // Global one-time — split across all active locations
            return s + (e.amountWithVat || 0) / activeLocationCount;
          }
          return s + (e.amountWithVat || 0);
        }, 0);

      const totalExtraExpense = (perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

      const calc = calculateMonthlyCashFlow(perf.sessionCount, totalExtraExpense, {
        sessionPrice,
        iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
        revenueShareRate: loc.revenueShareRate || 15,
      });

      const entry = {
        monthId: perfMonthStr,
        month: formatMonthSafe(perfMonthStr),
        locationName: loc.name,
        locationId: loc.id,
        sessions: perf.sessionCount,
        grossRevenue: calc.grossRevenue,
        totalExpense: calc.totalExpense,
        netCash: calc.netCash,
        totalCommission: calc.totalCommission,
        revenueShare: calc.revenueShare,
        avmExpense: calc.totalAvmExpense,
      };

      monthlyEntries.push(entry);

      // Aggregate only if it matches filters
      if (!filterMonth || entry.monthId === filterMonth) {
        if (filterLocation === 'all' || entry.locationId === filterLocation) {
          totalGrossSum += calc.grossRevenue;
          totalExpenseSumValue += calc.totalExpense;
          totalNetCashSum += calc.netCash;
          totalCommissionSum += calc.totalCommission;
          trueSessionsSum += perf.sessionCount;
          revenueShareSum += calc.revenueShare;
          
          // Breakdown details (aggregated for filtered view)
          avmRentTotal += loc.fixedRent * 1.2;
          avmDuesTotal += loc.duesAmount;
          operationalExpensesTotalValue += totalExtraExpense;
        }
      }
    }
  }

  const filteredMonthlyEntries = monthlyEntries.filter(entry => {
    if (filterMonth && entry.monthId !== filterMonth) return false;
    if (filterLocation !== 'all' && entry.locationId !== filterLocation) return false;
    return true;
  });

  const expenseBreakdownData = [
    { id: 'rent', label: 'AVM Kirası (+KDV)', value: avmRentTotal, icon: Building2, subLabel: 'Stopaj/Tevkifat Dahil', color: 'bg-red-500' },
    { id: 'dues', label: 'AVM Aidat & Ortak', value: avmDuesTotal, icon: Activity, subLabel: 'İşletme Giderleri', color: 'bg-orange-500' },
    { id: 'rev', label: 'Ciro Payı (Sözleşme)', value: revenueShareSum, icon: HandCoins, subLabel: 'Kira Üstü Hakediş', color: 'bg-amber-500' },
    { id: 'comm', label: 'Ödeme Komisyonları', value: totalCommissionSum, icon: CreditCard, subLabel: 'iyzico + Nayax (%4)', color: 'bg-rose-500' },
    { id: 'ops', label: 'Operasyonel Giderler', value: operationalExpensesTotalValue, icon: PlusCircle, subLabel: 'Faturalar & Diğer', color: 'bg-emerald-500' },
  ].filter(x => x.value > 0);

  const filteredExpenses = (expenses || []).filter(exp => {
    const isRecurring = exp.type === 'RECURRING';
    if (filterCategory !== 'all' && exp.categoryId !== filterCategory) return false;
    if (filterLocation !== 'all' && exp.locationId !== filterLocation) return false;
    if (filterMonth && !isRecurring) {
       const expMonth = exp.month ? (exp.month.includes('T') ? exp.month.split('T')[0].slice(0, 7) : exp.month.slice(0, 7)) : '';
       if (expMonth !== filterMonth) return false;
    }
    return true;
  });

  const categoryTotals: Record<string, number> = {};
  for (const exp of filteredExpenses) {
    const cat = exp.categoryId || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (exp.amountWithVat || 0);
  }

  const kpis = [
    { label: 'Brüt Gelir', value: totalGrossSum, icon: TrendingUp, cardClass: 'stat-card-green', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100 border-emerald-200', tag: 'Kayıtlı Ciro' },
    { label: 'Toplam Gider', value: totalExpenseSumValue, isExpense: true, tag: 'KDV Dahil' },
    { label: 'Net Durum', value: totalNetCashSum, icon: Wallet, cardClass: totalNetCashSum >= 0 ? 'stat-card-blue' : 'stat-card-red', iconColor: totalNetCashSum >= 0 ? 'text-blue-600' : 'text-red-600', iconBg: totalNetCashSum >= 0 ? 'bg-blue-100 border-blue-200' : 'bg-red-100 border-red-200', tag: 'Nakit Akışı' },
    { label: 'Toplam Seans', value: trueSessionsSum, icon: BarChart3, cardClass: 'bg-white', iconColor: 'text-slate-600', iconBg: 'bg-slate-100 border-slate-200', tag: 'Hacim', isCurrency: false },
  ];

  const insightSub = [
    { label: 'iyzico %2 + Nayax %2', sub: 'Toplam Operasyonel Kesinti', value: totalCommissionSum, icon: CreditCard, iconColor: 'text-red-500', cardClass: 'stat-card-red' },
    { label: 'AVM Ciro Payı', sub: 'Kira ve Hakediş Gideri', value: revenueShareSum, icon: Percent, iconColor: 'text-amber-600', cardClass: 'stat-card-amber' },
    { label: 'Operasyonel Marj', sub: 'Net Verimlilik Oranı', value: totalGrossSum > 0 ? ((totalNetCashSum / totalGrossSum) * 100) : 0, icon: PiggyBank, iconColor: 'text-blue-600', cardClass: 'stat-card-blue', isPercent: true },
  ];

  const maxCatTotal = Math.max(...Object.values(categoryTotals), 0.1);

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg inline-block mb-2">Financial Ledger</span>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5"><Wallet className="w-6 h-6 text-slate-400" />Gelir & Gider Paneli</h1>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
            <Link href={`/gelir-gider?location=all&month=${filterMonth}&category=${filterCategory}`} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", filterLocation === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>Tümü</Link>
            {(locations || []).map(loc => (
              <Link key={loc.id} href={`/gelir-gider?location=${loc.id}&month=${filterMonth}&category=${filterCategory}`} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", filterLocation === loc.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>{loc.name.split(' ')[0]}</Link>
            ))}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          (kpi as any).isExpense ? (
             <ExpenseDetailCard 
                key={kpi.label} 
                total={totalExpenseSumValue} 
                breakdown={expenseBreakdownData} 
                tag={kpi.tag}
             />
          ) : (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className={cn("premium-card p-5 border", (kpi as any).cardClass)}>
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center", (kpi as any).iconBg)}>
                   {kpi.icon && <kpi.icon className={cn("w-4.5 h-4.5", (kpi as any).iconColor)} />}
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{kpi.tag}</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
              <h2 className="text-xl font-bold text-slate-900 italic tracking-tighter uppercase">{(kpi as any).isCurrency === false ? kpi.value.toLocaleString('tr-TR') : `₺${kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}</h2>
            </motion.div>
          )
        ))}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insightSub.map((item) => (
          <div key={item.label} className={cn("premium-card p-5 flex items-center gap-4 border", item.cardClass)}>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm"><item.icon className={cn("w-5 h-5", item.iconColor)} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">{item.label}</p>
              <p className="text-lg font-bold text-slate-900">{item.isPercent ? `%${item.value.toFixed(1)}` : `₺${item.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8">
          <div className="premium-card overflow-hidden">
            <table className="data-table min-w-[680px]">
              <thead><tr><th>Ay / Lokasyon</th><th className="text-center">Oturum</th><th className="text-right">Brüt Ciro</th><th className="text-right">Gider (AVM+Pay)</th><th className="text-right">Net Nakit</th></tr></thead>
              <tbody>
                {filteredMonthlyEntries.map((entry, idx) => (
                  <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}>
                    <td><div className="flex items-center gap-3"><div><p className="font-semibold text-slate-900 text-sm">{entry.month}</p><p className="text-xs text-slate-400 mt-0.5">{entry.locationName}</p></div></div></td>
                    <td className="text-center font-mono font-semibold text-slate-700">{entry.sessions}</td>
                    <td className="text-right font-semibold text-slate-900">₺{entry.grossRevenue.toLocaleString('tr-TR')}</td>
                    <td className="text-right text-red-500 font-medium text-sm">₺{entry.avmExpense.toLocaleString('tr-TR')}</td>
                    <td className={cn("text-right font-bold", entry.netCash >= 0 ? "text-emerald-700" : "text-red-600")}>₺{entry.netCash.toLocaleString('tr-TR')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="xl:col-span-4">
          <div className="premium-card p-5 space-y-5">
            {Object.entries(categoryTotals).map(([cat, amount]) => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", EXPENSE_CATEGORIES[cat]?.dot || 'bg-slate-400')} />
                    <span className="text-xs font-semibold text-slate-700">{EXPENSE_CATEGORIES[cat]?.label || cat}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₺{amount.toLocaleString('tr-TR')}</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(amount / maxCatTotal) * 100}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-[#2563EB]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
