import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { createClient } from '@/utils/supabase/server';
import GelirGiderClientUI from '@/components/premium/GelirGiderClientUI';

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
    const str = String(isoStringOrMonthId);
    let y, m;
    if (str.includes('T')) {
      [y, m] = str.split('T')[0].split('-');
    } else {
      [y, m] = str.split('-');
    }
    if (!y || !m) return 'Bilinmiyor';
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString('tr-TR', { year: '2-digit', month: 'short' }).toUpperCase();
  };

  let totalGrossSum = 0;
  let totalExpenseSumValue = 0;
  let totalNetCashSum = 0;
  let totalCommissionSum = 0;
  let trueSessionsSum = 0;
  let revenueShareSum = 0;
  
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
      
      const recurringTotal = (expenses || [])
        .filter(e => e.type === 'RECURRING')
        .reduce((s, e) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          else if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
          return s;
        }, 0);

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

      const calc = calculateMonthlyCashFlow(perf.sessionCount, totalExtraExpense, {
        sessionPrice,
        iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
        revenueShareRate: loc.revenueShareRate || 15,
      });

      const entry = {
        perfId: perf.id,
        monthId: perfMonthStr,
        month: formatMonthSafe(perfMonthStr),
        locationName: loc.name,
        locationId: loc.id,
        sessions: perf.sessionCount,
        extraExpense: perf.extraExpenseAmount || 0,
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
          trueSessionsSum += perf.sessionCount;
          revenueShareSum += calc.revenueShare;
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
    { id: 'rent', label: 'AVM Kirası (+KDV)', value: avmRentTotal, subLabel: 'Stopaj/Tevkifat Dahil', color: 'bg-rose-500' },
    { id: 'dues', label: 'AVM Aidat & Ortak', value: avmDuesTotal, subLabel: 'İşletme Giderleri', color: 'bg-orange-500' },
    { id: 'rev', label: 'Ciro Payı (Sözleşme)', value: revenueShareSum, subLabel: 'Kira Üstü Hakediş', color: 'bg-amber-500' },
    { id: 'comm', label: 'Komisyon Kayıpları', value: totalCommissionSum, subLabel: 'iyzico + Nayax (%4)', color: 'bg-pink-500' },
    { id: 'ops', label: 'Servis ve Diğer', value: operationalExpensesTotalValue, subLabel: 'Faturalar & Operasyon', color: 'bg-emerald-500' },
  ].filter(x => x.value > 0);

  const summary = {
    gross: totalGrossSum,
    expense: totalExpenseSumValue,
    net: totalNetCashSum,
    margin: totalGrossSum > 0 ? (totalNetCashSum / totalGrossSum) * 100 : 0
  };

  return (
    <GelirGiderClientUI 
      summary={summary}
      entries={filteredMonthlyEntries}
      locations={locations || []}
      categories={[]}
      filters={{ month: filterMonth, location: filterLocation, category: filterCategory }}
      breakdown={expenseBreakdownData}
    />
  );
}
