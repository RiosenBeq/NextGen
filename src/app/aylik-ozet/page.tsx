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

  // Consolidate duplicate MonthlyPerformance records for the same location+month
  function monthIdOf(val: string) {
    return val.includes('T') ? val.split('T')[0].slice(0, 7) : val.slice(0, 7);
  }

  const consolidatedMap = new Map<string, any>();
  for (const row of (performances || [])) {
    if (!row.location || !row.month) continue;
    const mId = monthIdOf(String(row.month));
    const key = `${row.locationId}_${mId}`;
    const existing = consolidatedMap.get(key);
    if (!existing) {
      consolidatedMap.set(key, {
        ...row,
        month: `${mId}-01T00:00:00.000Z`,
        sessionCount: Number(row.sessionCount || 0),
        extraExpenseAmount: Number(row.extraExpenseAmount || 0),
        extraExpenseNotes: row.extraExpenseNotes || '',
        _ids: [row.id],
      });
    } else {
      existing.sessionCount += Number(row.sessionCount || 0);
      existing.extraExpenseAmount = Number(existing.extraExpenseAmount || 0) + Number(row.extraExpenseAmount || 0);
      if (row.extraExpenseNotes) {
        existing.extraExpenseNotes = [existing.extraExpenseNotes, row.extraExpenseNotes].filter(Boolean).join(' | ');
      }
      existing._ids.push(row.id);
      const deterministicId = `perf_${mId}_${row.locationId}`;
      if (row.id === deterministicId || existing.id !== deterministicId) {
        existing.id = row.id;
      }
    }
  }
  const allConsolidated = Array.from(consolidatedMap.values());

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  let availableMonths = Array.from(new Set([
    ...allConsolidated.map((p: any) => monthIdOf(String(p.month))),
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

  const currentPerformances = allConsolidated.filter((p: any) => monthIdOf(String(p.month)) === selectedMonthStr);
  const activeLocCount = currentPerformances.length || 1;
  const sessionPrice: number = params['SESSION_PRICE_INCL_VAT'] || 300;

  const locationDetails: LocationCalc[] = [];

  for (const perf of currentPerformances) {
    const loc = perf.location;

    const locationExtraDetails: { id: string; description: string; amount: number; type: string; isGlobal: boolean }[] = [];

    if ((perf.extraExpenseAmount || 0) > 0) {
      locationExtraDetails.push({
        id: `perf-extra-${perf.id}`,
        description: perf.extraExpenseNotes || 'Ekstra Gider (Performans Tablosu)',
        amount: Number(perf.extraExpenseAmount),
        type: 'Performans Ekstrası',
        isGlobal: false
      });
    }

    const recurringTotal = (allExpenses || [])
      .filter((e: any) => {
        if (e.type !== 'RECURRING') return false;
        const d = e.description || '';
        if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
        return true;
      })
      .reduce((s: number, e: any) => {
        if (!e.locationId) {
          const val = (e.amountWithVat || 0) / activeLocCount;
          locationExtraDetails.push({ id: `rec-glob-${e.id}`, description: e.description, amount: val, type: 'Sabit', isGlobal: true });
          return s + val;
        }
        if (e.locationId === loc.id) {
          const val = (e.amountWithVat || 0);
          locationExtraDetails.push({ id: `rec-loc-${e.id}`, description: e.description, amount: val, type: 'Sabit', isGlobal: false });
          return s + val;
        }
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
        if (!e.locationId) {
          const val = (e.amountWithVat || 0) / activeLocCount;
          locationExtraDetails.push({ id: `one-glob-${e.id}`, description: e.description, amount: val, type: 'Ad-hoc', isGlobal: true });
          return s + val;
        }
        const val = (e.amountWithVat || 0);
        locationExtraDetails.push({ id: `one-loc-${e.id}`, description: e.description, amount: val, type: 'Ad-hoc', isGlobal: false });
        return s + val;
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
      extraExpenseDetails: locationExtraDetails,
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
    <div className="page-wrapper space-y-8">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {monthName} <span className="text-slate-400 font-medium">Raporu</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Operasyonel Finansal Analiz</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Dönem:</span>
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

      {/* Transaction Details — Desktop Table */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400"><FileText size={16} /></div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">İşlem Bazlı Giderler</h3>
          <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{monthSpecificExpenses.length} kayıt</span>
        </div>

        {monthSpecificExpenses.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-400">Bu dönem için gider kaydı bulunamadı.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Açıklama</th>
                    <th className="px-4 py-4 text-center">Sorumlu</th>
                    <th className="px-4 py-4 text-center">Tip</th>
                    <th className="px-6 py-4 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {monthSpecificExpenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">{exp.description}</span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{exp.location?.name || 'Genel'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 uppercase">{exp.paidBy || 'MERKEZ'}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{exp.type === 'RECURRING' ? 'Sabit' : 'Ad-hoc'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">₺{exp.amountWithVat?.toLocaleString('tr-TR')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {monthSpecificExpenses.map((exp: any) => (
                <div key={exp.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{exp.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium text-slate-400 uppercase">{exp.location?.name || 'Genel'}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">{exp.type === 'RECURRING' ? 'Sabit' : 'Ad-hoc'}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">₺{exp.amountWithVat?.toLocaleString('tr-TR')}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

    </div>
  );
}
