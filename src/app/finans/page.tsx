import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import {
  TrendingUp, TrendingDown, BarChart3, Percent,
  Zap, CreditCard, Calendar, Target, RefreshCw, Building2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import FlipFinanceCard from '@/components/premium/FlipFinanceCard';
import ScenarioAnalysisSection from '@/components/premium/ScenarioAnalysisSection';

export const metadata = {
  title: 'Finansal Analiz — NextGenBox',
};

export const dynamic = 'force-dynamic';

export default async function FinansalTablo({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const filterMonth = params.month || 'all';

  const supabase = await createClient();
  const sysParams = await getSystemParameters();
  const sessionPrice = sysParams['SESSION_PRICE_INCL_VAT'] || 300;

  const [
    { data: locations },
    { data: performances },
    { data: expenses }
  ] = await Promise.all([
    supabase.from('Location').select('*').eq('isActive', true),
    supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: true }),
    supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false }),
  ]);

  const activeLocationCount = (locations || []).length || 1;

  const currentMonthId = new Date().toISOString().slice(0, 7);

  // Recurring expenses (split global ones proportionally)
  const recurringExpenses = (expenses || []).filter(e => e.type === 'RECURRING');
  const getRecurringTotal = (locationId?: string) => {
    return recurringExpenses.reduce((s, e) => {
      if (!e.locationId) {
        // Global recurring — split across all active locations
        return s + (e.amountWithVat || 0) / activeLocationCount;
      } else if (e.locationId === locationId) {
        // Location-specific recurring — full amount
        return s + (e.amountWithVat || 0);
      }
      return s;
    }, 0);
  };

  // One-time expenses per month
  const getOneTimeExpenses = (monthId: string, locationId?: string) => {
    return (expenses || [])
      .filter(e => {
        if (e.type === 'RECURRING') return false;
        const expMonth = e.month ? (e.month.includes('T') ? e.month.split('T')[0].slice(0, 7) : e.month.slice(0, 7)) : '';
        if (expMonth !== monthId) return false;
        if (locationId && e.locationId && e.locationId !== locationId) return false;
        return true;
      })
      .reduce((s, e) => s + (e.amountWithVat || 0), 0);
  };

  const avmSummaries: Record<string, any> = {};

  if (performances && locations) {
    for (const perf of performances) {
      const loc = perf.location;
      if (!loc) continue;

      const perfMonthStr = new Date(perf.month).toISOString().slice(0, 7);
      if (filterMonth !== 'all' && perfMonthStr !== filterMonth) continue;

      const sessions = perf.sessionCount;
      
      // Calculate recurring + one-time expenses for THIS month/location
      // Recurring: global split + location-specific full
      const recurringTotal = (expenses || [])
        .filter(e => e.type === 'RECURRING')
        .reduce((s, e) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
          return s;
        }, 0);

      // One-time: global split + location-specific full
      const oneTimeTotal = (expenses || [])
        .filter(e => {
          if (e.type === 'RECURRING') return false;
          const expMonth = e.month ? (e.month.includes('T') ? e.month.split('T')[0].slice(0, 7) : e.month.slice(0, 7)) : '';
          if (expMonth !== perfMonthStr) return false;
          if (e.locationId && e.locationId !== loc.id) return false;
          return true;
        })
        .reduce((s, e) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          return s + (e.amountWithVat || 0);
        }, 0);

      const totalExtraExpense = (perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

      const calc = calculateMonthlyCashFlow(sessions, totalExtraExpense, {
        sessionPrice, iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
        revenueShareRate: loc.revenueShareRate || 15,
      });

      if (!avmSummaries[loc.id]) {
        avmSummaries[loc.id] = {
          name: loc.name, totalSessions: 0, totalGrossRevenue: 0,
          totalCommission: 0, totalRevenueShare: 0, totalAvmExpense: 0,
          totalNetCash: 0, fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
          totalIyzico: 0, totalNayax: 0, totalExtraExpense: 0, 
        };
      }

      avmSummaries[loc.id].totalSessions += sessions;
      avmSummaries[loc.id].totalGrossRevenue += calc.grossRevenue;
      avmSummaries[loc.id].totalCommission += calc.totalCommission;
      avmSummaries[loc.id].totalIyzico += calc.iyzicoCommission;
      avmSummaries[loc.id].totalNayax += calc.nayaxCommission;
      avmSummaries[loc.id].totalRevenueShare += calc.revenueShare;
      avmSummaries[loc.id].totalAvmExpense += calc.totalAvmExpense;
      avmSummaries[loc.id].totalExtraExpense += totalExtraExpense;
      avmSummaries[loc.id].totalNetCash += calc.netCash;
    }
  }

  const totalGross = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalGrossRevenue, 0);
  const totalSessions = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalSessions, 0);
  const totalIyzico = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalIyzico, 0);
  const totalNayax = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalNayax, 0);
  const totalAvmExpense = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalAvmExpense, 0);
  const totalNetCash = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalNetCash, 0);

  const totalExtraExpenseAll = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalExtraExpense, 0);

  const recurringGlobalTotal = (expenses || []).filter(e => e.type === 'RECURRING').reduce((s, e) => s + (e.amountWithVat || 0), 0);
  const monthlyFixedTotal = (locations || []).reduce((s, loc) => s + (loc.fixedRent * 1.20) + loc.duesAmount, 0) + recurringGlobalTotal;
  const netRevenuePerSession = sessionPrice * 0.96;
  const breakEvenTotal = netRevenuePerSession > 0 ? Math.ceil(monthlyFixedTotal / netRevenuePerSession) : 0;

  const scenarios = [200, 370, 500, 750, 1000, 1500, 2000, 3000].map(totalSessions => {
    let mockNetCash = 0;
    let mockOkanShare = 0;
    
    // Fallback if no locations found in db
    const locs = locations && locations.length > 0 ? locations : [{ fixedRent: 40000, duesAmount: 6000, revenueShareRate: 15 }];
    const sessionsPerLoc = Math.floor(totalSessions / locs.length);

    for (const loc of locs) {
      const mockCalc = calculateMonthlyCashFlow(sessionsPerLoc, 0, {
        sessionPrice,
        iyzicoCommissionRate: 2,
        nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent || 40000,
        duesAmount: loc.duesAmount || 6000,
        revenueShareRate: loc.revenueShareRate || 15
      });
      // We deduct the recurring expenses for the simulation
      const locRecurring = recurringGlobalTotal / locs.length;
      mockNetCash += (mockCalc.netCash - locRecurring);
      mockOkanShare += ((mockCalc.netCash - locRecurring) * 0.25);
    }

    return {
      sessions: totalSessions,
      monthlyNet: totalSessions * netRevenuePerSession,
      monthlyProfit: mockNetCash,
      yearlyProfit: mockNetCash * 12,
      monthlyPerPartner: mockOkanShare,
    };
  });

  // Filter options for months
  const allMonths = performances
    ? [...new Set(performances.map(p => new Date(p.month).toISOString().slice(0, 7)))]
    : [];
  allMonths.sort().reverse();

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg border" style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>
              Tahmini Verimlilik
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Target className="w-6 h-6 text-slate-400" />
            Finansal Analiz
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Karlılık senaryoları, başabaş noktası analizleri ve lokasyon bazlı sabit gider dökümü.
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <Link
                href={`/finans?month=all`}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  filterMonth === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                HEPSİ
              </Link>
            {allMonths.map(m => {
              const label = new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
              return (
                <Link
                  key={m}
                  href={`/finans?month=${m}`}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                    filterMonth === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="premium-card px-4 py-2.5 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bilet Fiyatı</span>
            <span className="text-sm font-bold text-slate-900">₺{sessionPrice}</span>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Toplam Ciro", value: totalGross, icon: TrendingUp, cardClass: "stat-card-green", iconColor: "text-emerald-600", iconBg: "bg-emerald-100 border-emerald-200" },
          { label: "Komisyonlar (%4)", value: totalIyzico + totalNayax, icon: CreditCard, cardClass: "stat-card-red", iconColor: "text-red-600", iconBg: "bg-red-100 border-red-200" },
          { label: "AVM Gideri", value: totalAvmExpense, icon: Building2, cardClass: "stat-card-amber", iconColor: "text-amber-600", iconBg: "bg-amber-100 border-amber-200" },
          { label: "Operasyonel Gider", value: totalExtraExpenseAll, icon: Zap, cardClass: "stat-card-blue", iconColor: "text-blue-600", iconBg: "bg-blue-100 border-blue-200" },
          { label: "Reel Kazanç", value: totalNetCash, icon: BarChart3, cardClass: totalNetCash >= 0 ? "stat-card-green" : "stat-card-red", iconColor: totalNetCash >= 0 ? "text-emerald-600" : "text-red-600", iconBg: totalNetCash >= 0 ? "bg-emerald-100 border-emerald-200" : "bg-red-100 border-red-200" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn("premium-card p-5 border", kpi.cardClass)}
          >
            <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center mb-3", kpi.iconBg)}>
              <kpi.icon className={cn("w-4 h-4", kpi.iconColor)} />
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
            <h2 className="text-lg font-bold text-slate-900">₺{kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
          </motion.div>
        ))}
      </section>

      {/* Fixed Expenses per AVM */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Lokasyon Bazlı Sabit Giderler</h2>
          <div className="flex-1 section-divider" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {(locations || []).map((loc) => {
            const recurringForLoc = getRecurringTotal(loc.id);
            return (
              <FlipFinanceCard
                key={loc.id}
                locationName={loc.name}
                fixedRentWithVat={loc.fixedRent * 1.20}
                duesAmount={loc.duesAmount}
                recurringExpense={recurringForLoc}
              />
            );
          })}
        </div>
      </section>

      <ScenarioAnalysisSection
        scenarios={scenarios}
        breakEvenTotal={breakEvenTotal}
        locationCount={locations?.length || 1}
      />

      {/* FAQ Section */}
      <section className="space-y-4 pb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Parametre Bilgi Merkezi</h2>
          <div className="flex-1 section-divider" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
             { q: "Sistem cirosu nasıl hesaplanır?", a: "Seans başına brüt ücret (şu an ₺300) üzerinden KDV düşülmeden hesaplanır. KabinRapor senkronizasyonu her 5 dakikada bir güncellenir." },
             { q: "Kesintiler (iyzico/Nayax) nedir?", a: "Pos ve ödeme sistemleri komisyonlarıdır. iyzico %2 anlık olarak banka hesabından düşerken, Nayax %2 aylık olarak ayrıca fatura edilir." },
             { q: "AVM kira ve ciro payı modeli nedir?", a: "Sözleşmeli kira tutarı (Ham Kira + %20 KDV) ve aidata ek olarak, cironun belirli bir yüzdesini aşarsa 'Ciro Payı' devreye girer." },
             { q: "Bütün giderlere KDV dahil mi?", a: "Evet, bu tablodaki tüm giderler (Kira, Aidat, Komisyon ve Ek Masraflar) KDV dahil reel ödeme tutarlarını yansıtır." },
           ].map((item, idx) => (
             <div key={idx} className="premium-card p-5 hover:shadow-md transition-all group">
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>
                      <span className="text-[10px] font-bold" style={{ color: '#2F6BFF' }}>Q</span>
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.q}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
