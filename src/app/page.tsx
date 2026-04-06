import { redirect } from 'next/navigation';
import DashboardClientUI from '@/components/premium/DashboardClientUI';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getActiveLocations, getLocationInsights } from '@/features/ledger/actions';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Panel — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

interface LocationRow {
  id: string;
  fixedRent: number;
  duesAmount: number;
  revenueShareRate?: number | null;
}

interface PerformanceRow {
  locationId: string;
  month: string;
  sessionCount: number;
  extraExpenseAmount?: number | null;
  location: LocationRow;
}

interface ExpenseRow {
  id: string;
  locationId?: string | null;
  description: string;
  type: string;
  amountWithVat: number;
  month?: string | null;
  createdAt: string;
  isOfficial?: boolean;
  attachmentUrl?: string | null;
  location?: { name?: string | null } | null;
}

interface SystemParam {
  key: string;
  value: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: defaultPageParam } = await supabase
    .from('SystemParameter')
    .select('value')
    .eq('key', 'SETTING_DEFAULT_PAGE')
    .single();

  if (defaultPageParam) {
    const value = parseInt(String(defaultPageParam.value), 10);
    if (value === 1) redirect('/performans');
    if (value === 2) redirect('/gelir-gider');
  }

  const [insights, { data: performances }, { data: expensesData }, { data: paramsData }] = await Promise.all([
    getLocationInsights(),
    supabase.from('MonthlyPerformance').select('locationId, month, sessionCount, extraExpenseAmount, location:Location(id, fixedRent, duesAmount, revenueShareRate)').order('month', { ascending: true }),
    supabase.from('Expense').select('id, locationId, description, type, amountWithVat, month, createdAt, isOfficial, attachmentUrl').limit(300),
    supabase.from('SystemParameter').select('key, value'),
  ]);

  const perfRows = (performances || []) as unknown as PerformanceRow[];
  const expenseRows = (expensesData || []) as ExpenseRow[];
  const params = (paramsData || []) as SystemParam[];

  const paramMap: Record<string, number> = params.reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = Number(item.value);
    return acc;
  }, {});

  const activeLocationCount = Math.max(1, new Set(perfRows.map((item) => item.locationId)).size);

  const monthlyTotals: Record<string, { revenue: number; profit: number }> = {};
  let totalRevenue = 0;
  let totalNetCash = 0;
  let totalOperationalExpense = 0;

  for (const perf of perfRows) {
    const monthKey = new Date(perf.month).toISOString().slice(0, 7);

    const recurringTotal = expenseRows
      .filter((expense) => {
        if (expense.type !== 'RECURRING') return false;
        if (['[Sabit Kira]', '[AVM Aidat]', '[Ciro Payı]'].some((token) => (expense.description || '').includes(token))) return false;
        return true;
      })
      .reduce((sum, expense) => {
        if (!expense.locationId) return sum + (expense.amountWithVat || 0) / activeLocationCount;
        if (expense.locationId === perf.location.id) return sum + (expense.amountWithVat || 0);
        return sum;
      }, 0);

    const oneTimeTotal = expenseRows
      .filter((expense) => {
        if (expense.type === 'RECURRING') return false;
        if (['[Sabit Kira]', '[AVM Aidat]', '[Ciro Payı]'].some((token) => (expense.description || '').includes(token))) return false;

        const expenseMonth = expense.month
          ? (expense.month.includes('T') ? expense.month.split('T')[0].slice(0, 7) : expense.month.slice(0, 7))
          : '';

        if (expenseMonth !== monthKey) return false;
        if (expense.locationId && expense.locationId !== perf.location.id) return false;
        return true;
      })
      .reduce((sum, expense) => {
        if (!expense.locationId) return sum + (expense.amountWithVat || 0) / activeLocationCount;
        return sum + (expense.amountWithVat || 0);
      }, 0);

    const extraExpense = Number(perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

    const calc = calculateMonthlyCashFlow(
      Number(perf.sessionCount || 0),
      extraExpense,
      {
        sessionPrice: paramMap.SESSION_PRICE_INCL_VAT || 300,
        iyzicoCommissionRate: 2,
        nayaxCommissionRate: 2,
        fixedRent: Number(perf.location.fixedRent || 0),
        duesAmount: Number(perf.location.duesAmount || 0),
        revenueShareRate: Number(perf.location.revenueShareRate || 15),
      },
    );

    const monthLabel = new Date(perf.month).toLocaleDateString('tr-TR', { month: 'short' });
    if (!monthlyTotals[monthLabel]) monthlyTotals[monthLabel] = { revenue: 0, profit: 0 };

    monthlyTotals[monthLabel].revenue += calc.grossRevenue;
    monthlyTotals[monthLabel].profit += calc.netCash;

    totalRevenue += calc.grossRevenue;
    totalNetCash += calc.netCash;
    totalOperationalExpense += calc.totalCommission + calc.totalAvmExpense + extraExpense;
  }

  const displayTotalSessions = perfRows.reduce((sum, item) => sum + Number(item.sessionCount || 0), 0);
  const totalInvestment = insights.reduce((sum, location) => sum + location.totalInvestment, 0);
  const allMonthCount = Math.max(1, new Set(perfRows.map((item) => new Date(item.month).toISOString().slice(0, 7))).size);

  const stats = {
    revenue: totalRevenue,
    expense: totalOperationalExpense,
    profit: totalNetCash,
    roi: insights[0]?.roi || 0,
    sessions: displayTotalSessions,
    monthlyGrowth: 12.5,
  };

  const [{ data: latestExpenses }, { data: authUser }, { data: latestNotes }, activeLocations] = await Promise.all([
    supabase
      .from('Expense')
      .select('id, description, amountWithVat, isOfficial, createdAt, type, attachmentUrl, location:Location(name)')
      .order('createdAt', { ascending: false })
      .limit(10),
    supabase.auth.getUser(),
    supabase.from('Note').select('*').limit(10),
    getActiveLocations(),
  ]);

  const notes = (latestNotes || []).filter((item) => item.userId === authUser.user?.id);

  const chartData = Object.entries(monthlyTotals)
    .map(([month, values]) => ({ month, revenue: values.revenue, profit: values.profit }))
    .slice(-6);

  return (
    <DashboardClientUI
      stats={stats}
      recentExpenses={(latestExpenses || []) as ExpenseRow[]}
      locations={activeLocations || []}
      chartData={chartData}
      notes={notes}
      totalInvestment={totalInvestment}
      allMonthCount={allMonthCount}
      allExpenses={expenseRows}
    />
  );
}
