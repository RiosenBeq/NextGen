import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getLocationInsights } from '@/features/ledger/actions';
import { getActiveLocations } from '@/features/ledger/actions';
import AIAnalysisClientUI from '@/components/premium/AIAnalysisClientUI';

export const metadata = {
  title: 'AI Analiz — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function AIAnalysisPage() {
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

  const activeLocationCount = (performances
    ? [...new Set(performances.map((p: any) => p.locationId))].length
    : 1) || 1;

  const monthlyTotals: Record<string, any> = {};
  let totalManualRevenue = 0;
  let totalManualNetCash = 0;
  let totalManualOperationalExpense = 0;

  if (performances) {
    for (const perf of performances) {
      const loc = perf.location;
      const perfMonthStr = new Date(perf.month).toISOString().slice(0, 7);
      
      const recurringTotal = (expensesData || [])
        .filter((e: any) => {
          if (e.type !== 'RECURRING') return false;
          const d = e.description || '';
          if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
          return true;
        })
        .reduce((s: number, e: any) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
          return s;
        }, 0);

      const oneTimeTotal = (expensesData || [])
        .filter((e: any) => {
          if (e.type === 'RECURRING') return false;
          const d = e.description || '';
          if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
          const expMonth = e.month ? (e.month.includes('T') ? e.month.split('T')[0].slice(0, 7) : e.month.slice(0, 7)) : '';
          if (expMonth !== perfMonthStr) return false;
          if (e.locationId && e.locationId !== loc.id) return false;
          return true;
        })
        .reduce((s: number, e: any) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          return s + (e.amountWithVat || 0);
        }, 0);

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
      totalManualOperationalExpense += (calc.totalCommission + calc.totalAvmExpense + totalExtraExpense);
    }
  }

  const displayAllTimeRevenue = totalManualRevenue;
  const trueGlobalNetCash = totalManualNetCash;
  const totalGlobalOperationalExpense = totalManualOperationalExpense;
  const displayTotalSessions = performances?.reduce((acc: number, p: any) => acc + p.sessionCount, 0) || 0;

  const stats = {
    revenue: displayAllTimeRevenue,
    expense: totalGlobalOperationalExpense,
    profit: trueGlobalNetCash,
    roi: insights[0]?.roi || 0,
    sessions: displayTotalSessions,
    monthlyGrowth: 12.5 
  };

  const chartData = Object.entries(monthlyTotals).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    profit: data.profit
  })).slice(-6);

  return (
    <AIAnalysisClientUI 
      stats={stats} 
      chartData={chartData}
    />
  );
}
