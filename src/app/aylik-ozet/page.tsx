import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { Calendar, FileText } from 'lucide-react';
import MonthSelector from '@/features/ledger/components/MonthSelector';
import AylikOzetCards, { type LocationCalc } from '@/components/aylik-ozet/AylikOzetCards';

export const metadata = { title: 'Aylık Özet — NextGenBox' };
export const dynamic = 'force-dynamic';

export default async function MonthlySummaryPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const supabase = await createClient();
  const params = await getSystemParameters();
  const sp = await searchParams;

  const { data: performances } = await supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false });
  const { data: allExpenses } = await supabase.from('Expense').select('*');
  const { data: investments } = await supabase.from('Investment').select('*');

  const totalInv = (investments || []).reduce((acc: any, i: any) => acc + (i.totalAmount || 0), 0);
  const monthlyAmortization = totalInv > 0 ? totalInv / 36 : 0;

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  let availableMonths = Array.from(new Set([
    ...((performances || []).map((p: any) => new Date(p.month).toISOString().slice(0, 7))),
    ...((allExpenses || []).map((e: any) => e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7))),
    currentMonthStr,
    '2026-04',
    '2026-03'
  ])).sort().reverse();

  availableMonths = availableMonths.filter((m: string) => m >= '2026-03');

  const selectedMonthStr = sp?.m || availableMonths[0] || currentMonthStr;

  const monthDate = new Date(selectedMonthStr + '-01');
  const monthName = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  let monthRevenue = 0;
  let monthCommission = 0;
  let monthAvmFixed = 0;
  let monthOperationalExpense = 0;
  let rawNetCash = 0;

  const currentPerformances = (performances || []).filter((p: any) => p.month.startsWith(selectedMonthStr));
  const activeLocCount = currentPerformances.length || 1;
  const sessionPrice: number = params['SESSION_PRICE_INCL_VAT'] || 300;

  const locationDetails: LocationCalc[] = [];

  for (const perf of currentPerformances) {
    const loc = perf.location;

    const recurringTotal = (allExpenses || [])
      .filter((e: any) => {
        if (e.type !== 'RECURRING') return false;
        const d = e.description || '';
        if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
        return true;
      })
      .reduce((s: number, e: any) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocCount;
        if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
        return s;
      }, 0);

    const oneTimeTotal = (allExpenses || [])
      .filter((e: any) => {
        if (e.type === 'RECURRING') return false;
        const d = e.description || '';
        if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
        const expMonthStr = e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7);
        return expMonthStr === selectedMonthStr && (!e.locationId || e.locationId === loc.id);
      })
      .reduce((s: number, e: any) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocCount;
        return s + (e.amountWithVat || 0);
      }, 0);

    const extra = (perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

    const revenueShareRate: number = loc.revenueShareRate || 15;
    const calc = calculateMonthlyCashFlow(perf.sessionCount, extra, {
      sessionPrice,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: loc.fixedRent,
      duesAmount: loc.duesAmount,
      revenueShareRate,
      month: selectedMonthStr,
    });

    monthRevenue += calc.grossRevenue;
    monthCommission += calc.totalCommission;
    monthAvmFixed += calc.totalAvmExpense;
    monthOperationalExpense += extra;
    rawNetCash += calc.netCash;

    locationDetails.push({
      name: loc.name || loc.id,
      sessionCount: perf.sessionCount,
      sessionPrice,
      grossRevenue: calc.grossRevenue,
      iyzicoCommission: calc.iyzicoCommission,
      nayaxCommission: calc.nayaxCommission,
      totalCommission: calc.totalCommission,
      fixedRent: loc.fixedRent || 0,
      fixedRentWithVat: (loc.fixedRent || 0) * 1.2,
      duesAmount: loc.duesAmount || 0,
      revenueShare: calc.revenueShare,
      revenueShareRate,
      totalAvmExpense: calc.totalAvmExpense,
      extraExpense: extra,
      netCash: calc.netCash,
      breakEvenSessions: calc.breakEvenSessions,
    });
  }

  const ebitProfit = rawNetCash - monthlyAmortization;
  const isProfitable = ebitProfit >= 0;

  const monthSpecificExpenses = (allExpenses || []).filter((e: any) => {
    if (e.type === 'RECURRING') return true;
    const expM = e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7);
    return expM === selectedMonthStr;
  });

  return (
    <div className="page-wrapper min-h-screen bg-slate-50 space-y-8 p-6 md:p-10">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
              {monthName} <span className="text-slate-400">Raporu</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Operasyonel Finansal Analiz</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dönem:</span>
          <MonthSelector availableMonths={availableMonths} selectedMonthStr={selectedMonthStr} />
        </div>
      </header>

      {/* Interactive Cards (EBIT, Amortisman, Analysis) */}
      <AylikOzetCards
        monthRevenue={monthRevenue}
        monthCommission={monthCommission}
        monthAvmFixed={monthAvmFixed}
        monthOperationalExpense={monthOperationalExpense}
        rawNetCash={rawNetCash}
        ebitProfit={ebitProfit}
        monthlyAmortization={monthlyAmortization}
        totalInv={totalInv}
        isProfitable={isProfitable}
        locationDetails={locationDetails}
      />

      {/* Transaction Details */}
      <section className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400"><FileText size={18} /></div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">İşlem Bazlı Audit</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic border-b border-slate-100">
                <th className="px-8 py-5">Açıklama</th>
                <th className="text-center">Sorumlu</th>
                <th className="text-center">Tip</th>
                <th className="px-8 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthSpecificExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm font-medium">
                    Bu dönem için gider kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                monthSpecificExpenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{exp.description}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{exp.location?.name || 'Genel'}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 uppercase">{exp.paidBy || 'MERKEZ'}</span>
                    </td>
                    <td className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{exp.type === 'RECURRING' ? 'Sabit' : 'Ad-hoc'}</span>
                    </td>
                    <td className="px-8 text-right">
                      <span className="text-sm font-bold text-slate-900 tabular-nums italic">₺{exp.amountWithVat?.toLocaleString('tr-TR')}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
