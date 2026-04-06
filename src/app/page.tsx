import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getLocationInsights } from '@/features/ledger/actions';
import StrategicMatrix from '@/features/ledger/components/StrategicMatrix';
import FinancialSimulator from '@/features/ledger/components/FinancialSimulator';
import ExpenseBreakdown from '@/features/ledger/components/ExpenseBreakdown';
import PerformanceComparison from '@/features/ledger/components/PerformanceComparison';
import InteractiveKPICards from '@/features/ledger/components/InteractiveKPICards';
import { 
  TrendingUp, CreditCard, Wallet, Activity, 
  ArrowUpRight, Radio, LayoutDashboard, BarChart3, 
  Globe, ShieldCheck 
} from 'lucide-react';
import * as motion from "framer-motion/client";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import DashboardClientUI from '@/components/premium/DashboardClientUI';
import { getActiveLocations } from '@/features/ledger/actions';

export const metadata = {
  title: 'Panel — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

function monthIdOf(value: string) {
  return value.includes('T') ? value.split('T')[0].slice(0, 7) : value.slice(0, 7);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Check for default page setting
  const { data: defaultPageParam } = await supabase
    .from('SystemParameter')
    .select('value')
    .eq('key', 'SETTING_DEFAULT_PAGE')
    .single();

  if (defaultPageParam) {
    const val = parseInt(String(defaultPageParam.value));
    if (val === 1) redirect('/performans');
    if (val === 2) redirect('/gelir-gider');
  }

  const insights = await getLocationInsights();

  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: true });

  const { data: expensesData } = await supabase
    .from('Expense')
    .select('*')
    .limit(100);

  const { data: investmentData } = await supabase
    .from('Investment')
    .select('id, totalAmount, amountWithoutVat, locationId, location:Location(name)');

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

  const consolidatedMap = new Map<string, any>();
  for (const perf of performances || []) {
    const loc = perf.location;
    if (!loc || !perf.month) continue;

    const monthId = monthIdOf(String(perf.month));
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

  for (const perf of consolidatedMap.values()) {
    const loc = perf.location;
    const perfMonthStr = monthIdOf(String(perf.month));

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

        const expMonth = e.month ? monthIdOf(String(e.month)) : '';
        if (expMonth !== perfMonthStr) return false;
        if (e.locationId && e.locationId !== loc.id) return false;
        return true;
      })
      .reduce((s: number, e: any) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
        return s + (e.amountWithVat || 0);
      }, 0);

    const totalExtraExpense = Number(perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

    const calc = calculateMonthlyCashFlow(perf.sessionCount, totalExtraExpense, {
      sessionPrice: paramMap['SESSION_PRICE_INCL_VAT'] || 300,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: loc.fixedRent,
      duesAmount: loc.duesAmount,
      revenueShareRate: loc.revenueShareRate || 15,
    });

    const monthKey = new Date(perf.month).toLocaleDateString('tr-TR', { month: 'short' });
    if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { revenue: 0, profit: 0 };
    monthlyTotals[monthKey].revenue += calc.grossRevenue;
    monthlyTotals[monthKey].profit += calc.netCash;

    totalManualRevenue += calc.grossRevenue;
    totalManualNetCash += calc.netCash;
    totalManualOperationalExpense += calc.totalCommission + calc.totalAvmExpense + totalExtraExpense;
  }

  const displayAllTimeRevenue = totalManualRevenue;
  const trueGlobalNetCash = totalManualNetCash;
  const totalGlobalOperationalExpense = totalManualOperationalExpense;
  const displayTotalSessions = Array.from(consolidatedMap.values()).reduce((acc: number, p: any) => acc + Number(p.sessionCount || 0), 0);
  const totalInvestment = (investmentData || []).reduce((acc: number, inv: any) => {
    const tutar = Number(inv.totalAmount ?? inv.amountWithoutVat ?? 0);
    return acc + (Number.isFinite(tutar) ? tutar : 0);
  }, 0);

  const investmentBreakdown = (investmentData || []).reduce((acc: Record<string, number>, inv: any) => {
    const lokasyon = inv.location?.name || 'Belirtilmemiş';
    const tutar = Number(inv.totalAmount ?? inv.amountWithoutVat ?? 0);
    acc[lokasyon] = (acc[lokasyon] || 0) + (Number.isFinite(tutar) ? tutar : 0);
    return acc;
  }, {});
  const allMonthCount = consolidatedMap.size > 0 ? new Set(Array.from(consolidatedMap.values()).map((p: any) => monthIdOf(String(p.month)))).size : 1;

  // New Data Fetching for UI
  const activeLocations = await getActiveLocations() || [];
  
  // Stats preparation for Premium UI
  const stats = {
    revenue: displayAllTimeRevenue,
    expense: totalGlobalOperationalExpense,
    profit: trueGlobalNetCash,
    roi: insights[0]?.roi || 0,
    sessions: displayTotalSessions,
    monthlyGrowth: 12.5 // Mock for now or calculate if data allows
  };

  const { data: latestExpenses } = await supabase
    .from('Expense')
    .select('*, location:Location(name)')
    .order('createdAt', { ascending: false })
    .limit(10);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: latestNotes } = await supabase
    .from('Note')
    .select('*')
    .eq('userId', user?.id)
    .order('createdAt', { ascending: false })
    .limit(10);

  return (
    <DashboardClientUI 
      stats={stats} 
      recentExpenses={latestExpenses || []} 
      locations={activeLocations} 
      notes={latestNotes || []}
      totalInvestment={totalInvestment}
      investmentBreakdown={investmentBreakdown}
      allMonthCount={allMonthCount}
      allExpenses={expensesData || []}
    />
  );
}
