import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { createClient } from '@/utils/supabase/server';
import GelirGiderClientUI from '@/components/premium/GelirGiderClientUI';

type PerfRow = {
  id: string;
  month: string;
  sessionCount: number;
  extraExpenseAmount?: number | null;
  extraExpenseNotes?: string | null;
  locationId: string;
  location?: {
    id: string;
    name: string;
    fixedRent: number;
    duesAmount: number;
    revenueShareRate?: number | null;
  } | null;
};

function monthIdOf(value: string) {
  return value.includes('T') ? value.split('T')[0].slice(0, 7) : value.slice(0, 7);
}

export default async function GelirGiderPage(props: {
  searchParams: Promise<{ month?: string; location?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const filterMonth = searchParams.month || '';
  const filterLocation = searchParams.location || 'all';
  const filterCategory = searchParams.category || 'all';

  const supabase = await createClient();
  const sysParams = await getSystemParameters();
  const sessionPrice = sysParams['SESSION_PRICE_INCL_VAT'] || 300;

  const [{ data: locations }, { data: performances }, { data: expenses }] = await Promise.all([
    supabase.from('Location').select('*').eq('isActive', true),
    supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false }),
    supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false }),
  ]);

  const activeLocationCount = (locations || []).length || 1;

  const formatMonthSafe = (monthId: string) => {
    const [y, m] = monthId.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString('tr-TR', { year: '2-digit', month: 'short' }).toUpperCase();
  };

  // Consolidate possible duplicate month/location performance rows into one logical record.
  const consolidatedMap = new Map<string, PerfRow & { _ids: string[] }>();
  for (const row of ((performances || []) as PerfRow[])) {
    if (!row.location || !row.month) continue;

    const monthId = monthIdOf(String(row.month));
    const key = `${row.locationId}_${monthId}`;
    const existing = consolidatedMap.get(key);

    if (!existing) {
      consolidatedMap.set(key, {
        ...row,
        month: `${monthId}-01T00:00:00.000Z`,
        sessionCount: Number(row.sessionCount || 0),
        extraExpenseAmount: Number(row.extraExpenseAmount || 0),
        extraExpenseNotes: row.extraExpenseNotes || '',
        _ids: [row.id],
      });
      continue;
    }

    existing.sessionCount += Number(row.sessionCount || 0);
    existing.extraExpenseAmount = Number(existing.extraExpenseAmount || 0) + Number(row.extraExpenseAmount || 0);
    if (row.extraExpenseNotes) {
      existing.extraExpenseNotes = [existing.extraExpenseNotes, row.extraExpenseNotes].filter(Boolean).join(' | ');
    }
    existing._ids.push(row.id);

    const deterministicId = `perf_${monthId}_${row.locationId}`;
    if (row.id === deterministicId || existing.id !== deterministicId) {
      existing.id = row.id;
    }
  }

  const consolidatedPerformances = Array.from(consolidatedMap.values()).sort((a, b) => {
    return String(b.month).localeCompare(String(a.month));
  });

  const monthlyEntries: any[] = [];
  let totalGrossSum = 0;
  let totalExpenseSumValue = 0;
  let totalNetCashSum = 0;
  let totalCommissionSum = 0;
  let revenueShareSum = 0;
  let avmRentTotal = 0;
  let avmDuesTotal = 0;
  let operationalExpensesTotalValue = 0;

  for (const perf of consolidatedPerformances) {
    const loc = perf.location;
    if (!loc || !perf.month) continue;

    const perfMonthStr = monthIdOf(String(perf.month));

    const recurringTotal = (expenses || [])
      .filter((e) => e.type === 'RECURRING')
      .reduce((s, e) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
        if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
        return s;
      }, 0);

    const oneTimeTotal = (expenses || [])
      .filter((e) => {
        if (e.type === 'RECURRING') return false;
        const expMonth = e.month ? monthIdOf(String(e.month)) : '';
        if (expMonth !== perfMonthStr) return false;
        if (e.locationId && e.locationId !== loc.id) return false;
        return true;
      })
      .reduce((s, e) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
        return s + (e.amountWithVat || 0);
      }, 0);

    const totalExtraExpense = Number(perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

    const calc = calculateMonthlyCashFlow(perf.sessionCount, totalExtraExpense, {
      sessionPrice,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: loc.fixedRent,
      duesAmount: loc.duesAmount,
      revenueShareRate: loc.revenueShareRate || 15,
    });

    const entry = {
      perfId: perf.id,
      monthId: perfMonthStr,
      month: formatMonthSafe(perfMonthStr),
      locationName: loc.name,
      locationId: loc.id,
      sessions: perf.sessionCount,
      extraExpense: Number(perf.extraExpenseAmount || 0),
      extraNotes: perf.extraExpenseNotes || '',
      grossRevenue: calc.grossRevenue,
      totalExpense: calc.totalExpense,
      netCash: calc.netCash,
      totalCommission: calc.totalCommission,
      revenueShare: calc.revenueShare,
      avmExpense: calc.totalAvmExpense,
    };

    monthlyEntries.push(entry);

    if (!filterMonth || entry.monthId === filterMonth) {
      if (filterLocation === 'all' || entry.locationId === filterLocation) {
        totalGrossSum += calc.grossRevenue;
        totalExpenseSumValue += calc.totalExpense;
        totalNetCashSum += calc.netCash;
        totalCommissionSum += calc.totalCommission;
        revenueShareSum += calc.revenueShare;
        avmRentTotal += loc.fixedRent * 1.2;
        avmDuesTotal += loc.duesAmount;
        operationalExpensesTotalValue += totalExtraExpense;
      }
    }
  }

  const filteredMonthlyEntries = monthlyEntries.filter((entry) => {
    if (filterMonth && entry.monthId !== filterMonth) return false;
    if (filterLocation !== 'all' && entry.locationId !== filterLocation) return false;
    return true;
  });

  const expenseBreakdownData = [
    { id: 'rent', label: 'AVM Kirası (+KDV)', value: avmRentTotal, subLabel: 'Stopaj/Tevkifat Dahil', color: 'bg-rose-500' },
    { id: 'dues', label: 'AVM Aidat & Ortak', value: avmDuesTotal, subLabel: 'İşletme Giderleri', color: 'bg-orange-500' },
    { id: 'rev', label: 'Ciro Payı (Sözleşme)', value: revenueShareSum, subLabel: 'Kira Üstü Hakediş', color: 'bg-amber-500' },
    { id: 'comm', label: 'Komisyon Kayıpları', value: totalCommissionSum, subLabel: 'iyzico + Nayax (%4)', color: 'bg-pink-500' },
    { id: 'ops', label: 'Servis ve Diğer', value: operationalExpensesTotalValue, subLabel: 'Faturalar & Operasyon', color: 'bg-emerald-500' },
  ].filter((x) => x.value > 0);

  const summary = {
    gross: totalGrossSum,
    expense: totalExpenseSumValue,
    net: totalNetCashSum,
    margin: totalGrossSum > 0 ? (totalNetCashSum / totalGrossSum) * 100 : 0,
  };

  const availableMonths = Array.from(new Set(monthlyEntries.map((e) => e.monthId))).sort().reverse();

  return (
    <GelirGiderClientUI
      summary={summary}
      entries={filteredMonthlyEntries}
      locations={locations || []}
      categories={[]}
      filters={{ month: filterMonth, location: filterLocation, category: filterCategory }}
      breakdown={expenseBreakdownData}
      availableMonths={availableMonths}
    />
  );
}
