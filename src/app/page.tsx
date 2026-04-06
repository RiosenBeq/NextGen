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
  let totalManualCommission = 0;
  let totalManualAvmExpense = 0;
  let totalManualOperationalExpense = 0;

  if (performances) {
    for (const perf of performances) {
      const loc = perf.location;
      const perfMonthStr = new Date(perf.month).toISOString().slice(0, 7);
      
      // Recurring: global split + location-specific full
      const recurringTotal = (expensesData || [])
        .filter((e: any) => {
          if (e.type !== 'RECURRING') return false;
          const d = e.description || '';
          // Skip AVM fixed costs that are already calculated automatically
          if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
          return true;
        })
        .reduce((s: number, e: any) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
          if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
          return s;
        }, 0);

      // One-time: global split + location-specific full
      const oneTimeTotal = (expensesData || [])
        .filter((e: any) => {
          if (e.type === 'RECURRING') return false;
          const d = e.description || '';
          // Skip AVM fixed costs that are already calculated automatically
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
      totalManualCommission += calc.totalCommission;
      totalManualAvmExpense += calc.totalAvmExpense;
      totalManualOperationalExpense += (calc.totalCommission + calc.totalAvmExpense + totalExtraExpense);
    }
  }

  const displayAllTimeRevenue = totalManualRevenue;
  const trueGlobalNetCash = totalManualNetCash;
  const totalGlobalOperationalExpense = totalManualOperationalExpense;
  const displayTotalSessions = performances?.reduce((acc: number, p: any) => acc + p.sessionCount, 0) || 0;
  const totalInvestment = insights.reduce((acc, loc) => acc + loc.totalInvestment, 0);
  const allMonthCount = performances ? new Set(performances.map((p: any) => new Date(p.month).toISOString().slice(0, 7))).size : 1;

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
      allMonthCount={allMonthCount}
      allExpenses={expensesData || []}
    />
  );
}
