import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import CashFlowClientUI from '@/components/premium/CashFlowClientUI';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nakit Akışı — NextGenBox',
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
  const activeLocationCount = (locations || []).length || 1;
  
  const [
    { data: performances },
    { data: expenses }
  ] = await Promise.all([
    supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false }),
    supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false }),
  ]);

  const recurringExpenses = (expenses || []).filter((e) => e.type === 'RECURRING');
  const getRecurringTotal = (locationId?: string) => {
    return recurringExpenses.reduce((s, e) => {
      if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
      if (e.locationId === locationId) return s + (e.amountWithVat || 0);
      return s;
    }, 0);
  };

  const getOneTimeExpenses = (monthId: string, locationId?: string) => {
    return (expenses || [])
      .filter((e) => {
        if (e.type === 'RECURRING') return false;
        const d = e.description || '';
        if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
        const expMonth = e.month ? (String(e.month).includes('T') ? String(e.month).split('T')[0].slice(0, 7) : String(e.month).slice(0, 7)) : '';
        if (expMonth !== monthId) return false;
        if (e.locationId && e.locationId !== locationId) return false;
        return true;
      })
      .reduce((s, e) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
        return s + (e.amountWithVat || 0);
      }, 0);
  };

  type LocationLite = {
    id: string;
    name: string;
    fixedRent: number;
    duesAmount: number;
    revenueShareRate?: number | null;
  };
  type ConsolidatedPerf = {
    id: string;
    month: string;
    locationId: string;
    location: LocationLite;
    sessionCount: number;
    extraExpenseAmount: number;
  };

  const consolidatedMap = new Map<string, ConsolidatedPerf>();
  for (const perf of performances || []) {
    if (!perf.location || !perf.month) continue;
    const monthId = new Date(perf.month).toISOString().slice(0, 7);
    const key = `${perf.locationId}_${monthId}`;
    const existing = consolidatedMap.get(key);

    if (!existing) {
      consolidatedMap.set(key, {
        ...perf,
        month: `${monthId}-01T00:00:00.000Z`,
        sessionCount: Number(perf.sessionCount || 0),
        extraExpenseAmount: Number(perf.extraExpenseAmount || 0),
      });
    } else {
      existing.sessionCount += Number(perf.sessionCount || 0);
      existing.extraExpenseAmount += Number(perf.extraExpenseAmount || 0);
    }
  }

  const processed = Array.from(consolidatedMap.values()).map((perf) => {
    const perfMonthId = new Date(perf.month).toISOString().slice(0, 7);
    const sessions = perf.sessionCount;

    const recurringTotal = getRecurringTotal(perf.location.id);
    const oneTimeTotal = getOneTimeExpenses(perfMonthId, perf.location.id);
    const totalExtraExpense = Number(perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

    const calc = calculateMonthlyCashFlow(sessions, totalExtraExpense, {
      sessionPrice,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: perf.location.fixedRent,
      duesAmount: perf.location.duesAmount,
      revenueShareRate: perf.location.revenueShareRate || 15,
      month: perfMonthId,
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
      totalCommission: calc.totalCommission,
      revenueShare: calc.revenueShare,
      extraExpense: totalExtraExpense,
      totalExpense: calc.totalExpense,
      netCash: calc.netCash,
    };
  });

  const filteredData = processed.filter((row) =>
    filterLocation === 'all' || row.locationId === filterLocation
  );

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Finansal Denetim</p>
          <h1 className="apple-headline mt-3">Nakit <span className="hero-serif text-gradient-emerald">akışı</span></h1>
          <p className="mt-4 apple-body max-w-2xl">
            Aylık nakit akışı, lokasyon bazlı dağılım ve operasyonel maliyet izleme.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[--bg-elevated] rounded-full overflow-x-auto">
          <Link
            href="/raporlar?location=all"
            className={cn(
              'px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap min-h-[36px] flex items-center',
              filterLocation === 'all' ? 'bg-[--surface] text-[--text]' : 'text-[--text-secondary] hover:text-[--text]'
            )}
            style={{ letterSpacing: '-0.005em' }}
          >
            Tümü
          </Link>
          {(locations || []).map((loc) => (
            <Link
              key={loc.id}
              href={`/raporlar?location=${loc.id}`}
              className={cn(
                'px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap min-h-[36px] flex items-center',
                filterLocation === loc.id ? 'bg-[--surface] text-[--text]' : 'text-[--text-secondary] hover:text-[--text]'
              )}
              style={{ letterSpacing: '-0.005em' }}
            >
              {loc.name.split(' ')[0]}
            </Link>
          ))}
        </div>
      </header>

      <CashFlowClientUI
        locations={locations || []}
        initialData={filteredData}
        filterLocation={filterLocation}
      />
    </div>
  );
}
