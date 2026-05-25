import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getLocationInsights } from '@/features/ledger/actions';
import DashboardClientUI from '@/components/premium/DashboardClientUI';
import { getActiveLocations } from '@/features/ledger/actions';
import { resolveActiveProfile } from '@/lib/profile-context';

export const metadata = {
  title: 'Panel — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

type LocationLite = {
  id: string;
  name: string;
  fixedRent: number;
  duesAmount: number;
  revenueShareRate?: number | null;
};
type ExpenseRow = {
  id: string;
  type: string;
  description?: string | null;
  amountWithVat?: number | null;
  locationId?: string | null;
  month?: string | null;
};
type InvestmentRow = {
  id: string;
  totalAmount?: number | null;
  amountWithoutVat?: number | null;
  locationId?: string | null;
  location?: { name?: string | null } | { name?: string | null }[] | null;
};
type SystemParamRow = { key: string; value: unknown };
type ConsolidatedPerf = {
  id: string;
  month: string;
  locationId: string;
  location: LocationLite;
  sessionCount: number;
  extraExpenseAmount: number;
};

function monthIdOf(value: string) {
  return value.includes('T') ? value.split('T')[0].slice(0, 7) : value.slice(0, 7);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const profileCtx = await resolveActiveProfile();
  const profileId = profileCtx.profile?.id ?? null;

  // Cafe profili karaoke panelini görmesin — kendi paneline yönlendir
  if (profileCtx.profile?.businessType === 'cafe') {
    redirect('/cafe');
  }

  // Check for default page setting (profile-scoped)
  if (profileId) {
    const { data: defaultPageParam } = await supabase
      .from('SystemParameter')
      .select('value')
      .eq('profileId', profileId)
      .eq('key', 'SETTING_DEFAULT_PAGE')
      .single();

    if (defaultPageParam) {
      const val = parseInt(String(defaultPageParam.value));
      if (val === 1) redirect('/performans');
      if (val === 2) redirect('/gelir-gider');
    }
  }

  const insights = await getLocationInsights();

  const { data: performances } = profileId ? await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .eq('profileId', profileId)
    .order('month', { ascending: true }) : { data: [] };

  const { data: expensesData } = profileId ? await supabase
    .from('Expense')
    .select('*')
    .eq('profileId', profileId)
    .limit(100) : { data: [] };

  const { data: investmentData } = profileId ? await supabase
    .from('Investment')
    .select('id, totalAmount, amountWithoutVat, locationId, location:Location(name)')
    .eq('profileId', profileId) : { data: [] };

  const { data: paramsData } = profileId ? await supabase
    .from('SystemParameter')
    .select('*')
    .eq('profileId', profileId) : { data: [] };

  const paramMap = (paramsData || []).reduce((acc: Record<string, unknown>, p: SystemParamRow) => {
    acc[p.key] = p.value;
    return acc;
  }, {} as Record<string, unknown>);

  const monthlyTotals: Record<string, { revenue: number; profit: number; sessions: number }> = {};
  let totalManualRevenue = 0;
  let totalManualNetCash = 0;
  let totalManualOperationalExpense = 0;

  const consolidatedMap = new Map<string, ConsolidatedPerf>();
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

  // Global (locationId=null) giderleri kaç aktif lokasyona böleceğiz?
  // consolidatedMap içindeki distinct locationId sayısı, bu hesabın gerçek
  // tabanıdır (en az 1 — sıfıra bölmeyi her zaman engelle).
  const distinctLocationIds = new Set<string>();
  for (const perf of consolidatedMap.values()) {
    if (perf.location?.id) distinctLocationIds.add(perf.location.id);
  }
  const activeLocationCount = Math.max(1, distinctLocationIds.size);

  for (const perf of consolidatedMap.values()) {
    const loc = perf.location;
    const perfMonthStr = monthIdOf(String(perf.month));

    const recurringTotal = (expensesData || [])
      .filter((e: ExpenseRow) => {
        if (e.type !== 'RECURRING') return false;
        const d = e.description || '';
        if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
        return true;
      })
      .reduce((s: number, e: ExpenseRow) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
        if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
        return s;
      }, 0);

    const oneTimeTotal = (expensesData || [])
      .filter((e: ExpenseRow) => {
        if (e.type === 'RECURRING') return false;
        const d = e.description || '';
        if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;

        const expMonth = e.month ? monthIdOf(String(e.month)) : '';
        if (expMonth !== perfMonthStr) return false;
        if (e.locationId && e.locationId !== loc.id) return false;
        return true;
      })
      .reduce((s: number, e: ExpenseRow) => {
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
      month: perfMonthStr,
    });

    const monthKey = perfMonthStr; // YYYY-MM (önceki kısa "Oca" formatı yerine kanonik)
    if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { revenue: 0, profit: 0, sessions: 0 };
    monthlyTotals[monthKey].revenue += calc.grossRevenue;
    monthlyTotals[monthKey].profit += calc.netCash;
    monthlyTotals[monthKey].sessions += Number(perf.sessionCount || 0);

    totalManualRevenue += calc.grossRevenue;
    totalManualNetCash += calc.netCash;
    totalManualOperationalExpense += calc.totalCommission + calc.totalAvmExpense + totalExtraExpense;
  }

  const displayAllTimeRevenue = totalManualRevenue;
  const trueGlobalNetCash = totalManualNetCash;
  const totalGlobalOperationalExpense = totalManualOperationalExpense;
  const displayTotalSessions = Array.from(consolidatedMap.values()).reduce((acc: number, p: ConsolidatedPerf) => acc + Number(p.sessionCount || 0), 0);
  const totalInvestment = (investmentData || []).reduce((acc: number, inv: InvestmentRow) => {
    const tutar = Number(inv.totalAmount ?? inv.amountWithoutVat ?? 0);
    return acc + (Number.isFinite(tutar) ? tutar : 0);
  }, 0);

  const investmentBreakdown = (investmentData || []).reduce((acc: Record<string, number>, inv: InvestmentRow) => {
    const locField = inv.location;
    const locName = Array.isArray(locField) ? locField[0]?.name : locField?.name;
    const lokasyon = locName || 'Belirtilmemiş';
    const tutar = Number(inv.totalAmount ?? inv.amountWithoutVat ?? 0);
    acc[lokasyon] = (acc[lokasyon] || 0) + (Number.isFinite(tutar) ? tutar : 0);
    return acc;
  }, {});
  const allMonthCount = consolidatedMap.size > 0 ? new Set(Array.from(consolidatedMap.values()).map((p: ConsolidatedPerf) => monthIdOf(String(p.month)))).size : 1;

  // New Data Fetching for UI
  const activeLocations = await getActiveLocations() || [];

  // ── Bu ay ↔ geçen ay karşılaştırması ───────────────────────────────────────
  const now = new Date();
  const currentMonthId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previousMonthId = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;

  const emptyMonth = { revenue: 0, profit: 0, sessions: 0 };
  const currentMonth = monthlyTotals[currentMonthId] ?? emptyMonth;
  const previousMonth = monthlyTotals[previousMonthId] ?? emptyMonth;

  // Yüzde değişim. Önceki dönem 0 ise oran tanımsızdır → null döndür ki
  // UI "yetersiz veri" olarak gösterebilsin (1900%+ saçma sayılar yerine).
  const pctChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const growth = {
    revenue: pctChange(currentMonth.revenue, previousMonth.revenue),
    profit: pctChange(currentMonth.profit, previousMonth.profit),
    sessions: pctChange(currentMonth.sessions, previousMonth.sessions),
  };

  // Stats preparation for Premium UI
  const stats = {
    revenue: displayAllTimeRevenue,
    expense: totalGlobalOperationalExpense,
    profit: trueGlobalNetCash,
    roi: insights[0]?.roi || 0,
    sessions: displayTotalSessions,
    // Geriye dönük uyumluluk: monthlyGrowth artık gerçek MoM net kâr yüzdesi
    // (önceden mock %12.5 idi). Tanımsızsa 0 (UI null kontrolünü growth.profit
    // üzerinden yapmalı).
    monthlyGrowth: growth.profit ?? 0,
    currentMonth,
    previousMonth,
    currentMonthId,
    previousMonthId,
    growth,
  };

  const { data: latestExpenses } = profileId ? await supabase
    .from('Expense')
    .select('*, location:Location(name)')
    .eq('profileId', profileId)
    .order('createdAt', { ascending: false })
    .limit(10) : { data: [] };

  const { data: { user } } = await supabase.auth.getUser();
  const { data: latestNotes } = profileId ? await supabase
    .from('Note')
    .select('*')
    .eq('profileId', profileId)
    .eq('userId', user?.id)
    .order('createdAt', { ascending: false })
    .limit(10) : { data: [] };

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
