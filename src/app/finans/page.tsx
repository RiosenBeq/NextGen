import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { createClient } from '@/utils/supabase/server';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import FlipFinanceCard from '@/components/premium/FlipFinanceCard';
import ScenarioAnalysisSection from '@/components/premium/ScenarioAnalysisSection';
import FinanceSummaryCards from '@/components/premium/FinanceSummaryCards';

type LocationRow = {
  id: string;
  name: string;
  fixedRent: number;
  duesAmount: number;
  revenueShareRate?: number | null;
  isActive?: boolean | null;
};

type ExpenseRow = {
  id: string;
  type: string;
  description?: string | null;
  amountWithVat?: number | null;
  locationId?: string | null;
  month?: string | null;
  location?: { name?: string } | null;
};

type PerformanceRow = {
  id: string;
  month: string;
  locationId: string;
  sessionCount: number;
  extraExpenseAmount?: number | null;
  extraExpenseNotes?: string | null;
  location?: LocationRow | null;
};

type AvmSummary = {
  name: string;
  totalSessions: number;
  totalGrossRevenue: number;
  totalCommission: number;
  totalRevenueShare: number;
  totalAvmExpense: number;
  totalNetCash: number;
  fixedRent: number;
  duesAmount: number;
  totalIyzico: number;
  totalNayax: number;
  totalExtraExpense: number;
};

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

  // Recurring expenses (split global ones proportionally)
  const recurringExpenses = (expenses || []).filter((e: ExpenseRow) => e.type === 'RECURRING');
  const getRecurringTotal = (locationId?: string) => {
    return recurringExpenses.reduce((s: number, e: ExpenseRow) => {
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

  const avmSummaries: Record<string, AvmSummary> = {};

  if (performances && locations) {
    for (const perf of performances as PerformanceRow[]) {
      const loc = perf.location;
      if (!loc) continue;

      const perfMonthStr = new Date(perf.month).toISOString().slice(0, 7);
      if (filterMonth !== 'all' && perfMonthStr !== filterMonth) continue;

      const sessions = perf.sessionCount;

      // Calculate recurring + one-time expenses for THIS month/location
      // Recurring: global split + location-specific full
      const recurringTotal = (expenses || [])
        .filter((e: ExpenseRow) => e.type === 'RECURRING')
        .reduce((s: number, e: ExpenseRow) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
          return s;
        }, 0);

      // One-time: global split + location-specific full
      const oneTimeTotal = (expenses || [])
        .filter((e: ExpenseRow) => {
          if (e.type === 'RECURRING') return false;
          const d = e.description || '';
          if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
          const expMonth = e.month ? (e.month.includes('T') ? e.month.split('T')[0].slice(0, 7) : e.month.slice(0, 7)) : '';
          if (expMonth !== perfMonthStr) return false;
          if (e.locationId && e.locationId !== loc.id) return false;
          return true;
        })
        .reduce((s: number, e: ExpenseRow) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          return s + (e.amountWithVat || 0);
        }, 0);

      const totalExtraExpense = (perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

      const calc = calculateMonthlyCashFlow(sessions, totalExtraExpense, {
        sessionPrice, iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
        revenueShareRate: loc.revenueShareRate || 15,
        month: perfMonthStr,
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

  const totalGross = Object.values(avmSummaries).reduce((s: number, a: AvmSummary) => s + a.totalGrossRevenue, 0);
  const totalIyzico = Object.values(avmSummaries).reduce((s: number, a: AvmSummary) => s + a.totalIyzico, 0);
  const totalNayax = Object.values(avmSummaries).reduce((s: number, a: AvmSummary) => s + a.totalNayax, 0);
  const totalAvmExpense = Object.values(avmSummaries).reduce((s: number, a: AvmSummary) => s + a.totalAvmExpense, 0);
  const totalNetCash = Object.values(avmSummaries).reduce((s: number, a: AvmSummary) => s + a.totalNetCash, 0);

  const totalExtraExpenseAll = Object.values(avmSummaries).reduce((s: number, a: AvmSummary) => s + a.totalExtraExpense, 0);

  const recurringGlobalTotal = (expenses || []).filter((e: ExpenseRow) => e.type === 'RECURRING').reduce((s: number, e: ExpenseRow) => s + (e.amountWithVat || 0), 0);
  const monthlyFixedTotal = (locations || []).reduce((s: number, loc: LocationRow) => s + (loc.fixedRent * 1.20) + loc.duesAmount, 0) + recurringGlobalTotal;
  const netRevenuePerSession = sessionPrice * 0.96;
  const breakEvenTotal = netRevenuePerSession > 0 ? Math.ceil(monthlyFixedTotal / netRevenuePerSession) : 0;

  const scenarios = [200, 370, 500, 750, 1000, 1500, 2000, 3000].map(totalSessions => {
    let mockNetCash = 0;
    let mockOkanShare = 0;
    let totalRevenueShare = 0;
    let totalCommissions = 0;
    let totalRentWithVat = 0;
    let totalDues = 0;

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
        revenueShareRate: loc.revenueShareRate || 15,
        month: filterMonth !== 'all' ? filterMonth : undefined,
      });
      const locRecurring = recurringGlobalTotal / locs.length;
      mockNetCash += (mockCalc.netCash - locRecurring);
      mockOkanShare += ((mockCalc.netCash - locRecurring) * 0.25);

      totalRevenueShare += mockCalc.revenueShare;
      totalCommissions += mockCalc.totalCommission;
      totalRentWithVat += (loc.fixedRent || 40000) * 1.2;
      totalDues += (loc.duesAmount || 6000);
    }

    return {
      sessions: totalSessions,
      monthlyNet: totalSessions * netRevenuePerSession,
      monthlyProfit: mockNetCash,
      yearlyProfit: mockNetCash * 12,
      monthlyPerPartner: mockOkanShare,
      totalRevenueShare,
      totalCommissions,
      totalRentWithVat,
      totalDues,
      totalRecurringOps: recurringGlobalTotal,
    };
  });

  // Filter options for months
  const allMonths = performances
    ? [...new Set((performances as PerformanceRow[]).map((p: PerformanceRow) => new Date(p.month).toISOString().slice(0, 7)))]
    : [];
  allMonths.sort().reverse();

  const operationalItems = [
    ...(expenses || [])
      .filter((e: ExpenseRow) => {
        const d = e.description || '';
        if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
        if (!filterMonth || filterMonth === 'all') return true;
        const expMonth = e.month ? (String(e.month).includes('T') ? String(e.month).split('T')[0].slice(0, 7) : String(e.month).slice(0, 7)) : '';
        return expMonth === filterMonth;
      })
      .map((e: ExpenseRow) => ({
        id: `exp_${e.id}`,
        label: e.description || 'Gider kaydı',
        amount: Number(e.amountWithVat || 0),
        month: e.month ? String(e.month).slice(0, 7) : undefined,
        location: e.location?.name,
        source: 'expense' as const,
      })),
    ...((performances || []) as PerformanceRow[])
      .filter((p: PerformanceRow) => Number(p.extraExpenseAmount || 0) > 0)
      .filter((p: PerformanceRow) => {
        if (!filterMonth || filterMonth === 'all') return true;
        return new Date(p.month).toISOString().slice(0, 7) === filterMonth;
      })
      .map((p: PerformanceRow) => ({
        id: `manual_${p.id}`,
        label: p.extraExpenseNotes || 'Manuel ekstra gider',
        amount: Number(p.extraExpenseAmount || 0),
        month: new Date(p.month).toISOString().slice(0, 7),
        location: p.location?.name,
        source: 'manual' as const,
      })),
  ].filter((item) => item.amount > 0);

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Tahmini Verimlilik</p>
          <h1 className="apple-headline mt-3">Finansal Analiz</h1>
          <p className="mt-4 apple-body max-w-2xl">
            Karlılık senaryoları, başabaş noktası ve lokasyon bazlı sabit gider dökümü.
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[--bg-elevated] rounded-full">
            <Link
                href={`/finans?month=all`}
                className={cn(
                  "px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap min-h-[36px] flex items-center",
                  filterMonth === 'all' ? "bg-[--surface] text-[--text]" : "text-[--text-secondary] hover:text-[--text]"
                )}
              >
                Hepsi
              </Link>
            {allMonths.map(m => {
              const label = new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
              return (
                <Link
                  key={m}
                  href={`/finans?month=${m}`}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap min-h-[36px] flex items-center",
                    filterMonth === m ? "bg-[--surface] text-[--text]" : "text-[--text-secondary] hover:text-[--text]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="apple-card px-4 py-2 flex items-center gap-2">
            <span className="text-[12px] text-[--text-tertiary]">Bilet</span>
            <span className="text-[14px] font-medium tabular-nums text-[--text]">₺{sessionPrice}</span>
          </div>
        </div>
      </header>

      <FinanceSummaryCards
        totalGross={totalGross}
        totalCommission={totalIyzico + totalNayax}
        totalAvmExpense={totalAvmExpense}
        totalOperational={totalExtraExpenseAll}
        totalNetCash={totalNetCash}
        operationalItems={operationalItems}
      />

      {/* Fixed Expenses per AVM */}
      <section className="space-y-6">
        <div>
          <p className="apple-eyebrow">Lokasyonlar</p>
          <h2 className="apple-title-1 mt-2">Sabit Giderler</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {((locations || []) as LocationRow[]).map((loc: LocationRow) => {
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
      <section className="space-y-6">
        <div>
          <p className="apple-eyebrow">Bilgi</p>
          <h2 className="apple-title-1 mt-2">Parametre Bilgi Merkezi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
             { q: "Sistem cirosu nasıl hesaplanır?", a: "Seans başına brüt ücret (şu an ₺300) üzerinden KDV düşülmeden hesaplanır. KabinRapor senkronizasyonu her 5 dakikada bir güncellenir." },
             { q: "Kesintiler (iyzico/Nayax) nedir?", a: "Pos ve ödeme sistemleri komisyonlarıdır. iyzico %2 anlık olarak banka hesabından düşerken, Nayax %2 aylık olarak ayrıca fatura edilir." },
             { q: "AVM kira ve ciro payı modeli nedir?", a: "Sözleşmeli kira tutarı (Ham Kira + %20 KDV) ve aidata ek olarak, cironun belirli bir yüzdesini aşarsa 'Ciro Payı' devreye girer." },
             { q: "Bütün giderlere KDV dahil mi?", a: "Evet, bu tablodaki tüm giderler (Kira, Aidat, Komisyon ve Ek Masraflar) KDV dahil reel ödeme tutarlarını yansıtır." },
           ].map((item, idx) => (
             <div key={idx} className="apple-card p-6 transition-colors">
                <h4 className="apple-title-2">{item.q}</h4>
                <p className="mt-2 text-[14px] text-[--text-secondary] leading-relaxed">{item.a}</p>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
