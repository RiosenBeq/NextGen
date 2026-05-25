import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { Activity, Building2, Receipt, FileText, type LucideIcon } from 'lucide-react';
import MonthSelector from '@/features/ledger/components/MonthSelector';
import { cn } from '@/lib/utils';
import { resolveActiveProfile } from '@/lib/profile-context';

export const metadata = { title: 'Aylık Özet — NextGenBox' };
export const dynamic = 'force-dynamic';

export default async function MonthlySummaryPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const supabase = await createClient();
  const profileCtx = await resolveActiveProfile();
  const profileId = profileCtx.profile?.id ?? null;
  const params = await getSystemParameters();
  const sp = await searchParams;

  const { data: performances } = profileId
    ? await supabase.from('MonthlyPerformance').select('*, location:Location(*)').eq('profileId', profileId).order('month', { ascending: false })
    : { data: [] };
  const { data: allExpenses } = profileId
    ? await supabase.from('Expense').select('*').eq('profileId', profileId)
    : { data: [] };
  const { data: investments } = profileId
    ? await supabase.from('Investment').select('*').eq('profileId', profileId)
    : { data: [] };

  type InvestmentRow = { totalAmount?: number | null };
  const totalInv = (investments || []).reduce((acc: number, i: InvestmentRow) => acc + (i.totalAmount || 0), 0);
  const monthlyAmortization = totalInv > 0 ? totalInv / 36 : 0;

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  type PerfMonthRow = { month: string };
  type ExpenseMonthRow = { month?: string | null; createdAt: string };
  let availableMonths = Array.from(new Set([
    ...((performances || []).map((p: PerfMonthRow) => new Date(p.month).toISOString().slice(0, 7))),
    ...((allExpenses || []).map((e: ExpenseMonthRow) => e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7))),
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

  const currentPerformances = (performances || []).filter(p => p.month.startsWith(selectedMonthStr));
  const activeLocCount = currentPerformances.length || 1;

  for (const perf of currentPerformances) {
    const loc = perf.location;

    const recurringTotal = (allExpenses || [])
        .filter(e => {
            if (e.type !== 'RECURRING') return false;
            const d = e.description || '';
            if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;
            return true;
        })
        .reduce((s, e) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocCount;
          if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
          return s;
        }, 0);

    const oneTimeTotal = (allExpenses || [])
        .filter(e => {
          if (e.type === 'RECURRING') return false;
          const d = e.description || '';
          if (d.includes('[Sabit Kira]') || d.includes('[AVM Aidat]') || d.includes('[Ciro Payı]')) return false;

          const expMonthStr = e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7);
          return expMonthStr === selectedMonthStr && (!e.locationId || e.locationId === loc.id);
        })
        .reduce((s, e) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocCount;
          return s + (e.amountWithVat || 0);
        }, 0);

    const extra = (perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

    const calc = calculateMonthlyCashFlow(perf.sessionCount, extra, {
        sessionPrice: params['SESSION_PRICE_INCL_VAT'] || 300,
        iyzicoCommissionRate: 2,
        nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent,
        duesAmount: loc.duesAmount,
        revenueShareRate: loc.revenueShareRate || 15,
        month: selectedMonthStr
    });

    monthRevenue += calc.grossRevenue;
    monthCommission += calc.totalCommission;
    monthAvmFixed += calc.totalAvmExpense;
    monthOperationalExpense += extra;
    rawNetCash += calc.netCash;
  }

  const ebitProfit = rawNetCash - monthlyAmortization;
  const isProfitable = ebitProfit >= 0;

  const monthSpecificExpenses = (allExpenses || []).filter(e => {
    if (e.type === 'RECURRING') return true;
    const expM = e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7);
    return expM === selectedMonthStr;
  });

  return (
    <div className="space-y-8 sm:space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Aylık Özet</p>
          <h1 className="apple-headline mt-3"><span className="text-gradient-aurora">{monthName}</span></h1>
          <p className="mt-4 apple-body max-w-2xl">
            Operasyonel finansal analiz ve dönem performans özeti.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-[--bg-elevated] rounded-full">
          <span className="text-[12px] text-[--text-tertiary]">Dönem:</span>
          <MonthSelector availableMonths={availableMonths} selectedMonthStr={selectedMonthStr} />
        </div>
      </header>

      {/* Main Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 apple-card p-8 md:p-10 flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={cn('chip', isProfitable ? 'chip-accent' : 'chip-red')}>
                {isProfitable ? 'Net Operasyonel Kâr' : 'Net Operasyonel Zarar'}
              </span>
              <span className="chip">EBIT</span>
            </div>
            <div className="flex items-baseline gap-4">
              <h2 className={cn(
                'text-[44px] md:text-[64px] font-semibold tabular-nums',
                isProfitable ? 'text-[--text]' : 'text-[--danger]'
              )} style={{ letterSpacing: '-0.025em' }}>
                ₺{ebitProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-[--border]">
            <SummaryStat label="Kişi Başı" val={`₺${(ebitProfit / 4).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} />
            <SummaryStat label="ROI" val={`%${totalInv > 0 ? ((ebitProfit / totalInv) * 100).toFixed(1) : '—'}`} />
            <SummaryStat label="Kâr Marjı" val={`%${monthRevenue > 0 ? ((rawNetCash / monthRevenue) * 100).toFixed(1) : '—'}`} />
            <SummaryStat label="Hacim" val={`₺${monthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} />
          </div>
        </div>

        <div className="apple-card p-8 md:p-10 flex flex-col justify-between">
          <div className="space-y-4">
            <p className="apple-eyebrow">Amortisman</p>
            <h3 className="apple-title-1">Aylık Pay</h3>
            <div className="rounded-[18px] bg-[--bg-elevated] p-5 text-center mt-3">
              <p className="text-[28px] md:text-[32px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.025em' }}>
                ₺{monthlyAmortization.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <p className="text-[12px] text-[--text-tertiary] mt-6 leading-relaxed">
            Yatırımın <span className="text-[--text-secondary] font-medium">36 aylık</span> planına göre hesaplanan sabit maliyet.
          </p>
        </div>
      </section>

      {/* Quick Analysis Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <AnalysisCard label="Brüt Satış" val={monthRevenue} icon={Activity} />
        <AnalysisCard label="Sabit Gider (AVM)" val={monthAvmFixed} icon={Building2} />
        <AnalysisCard label="Operasyonel" val={monthOperationalExpense + monthCommission} icon={Receipt} />
      </section>

      {/* Transaction Details */}
      <section className="apple-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[--border]">
          <p className="apple-eyebrow">Audit</p>
          <h3 className="apple-title-2 mt-1 flex items-center gap-2">
            <FileText size={18} strokeWidth={1.75} className="text-[--text-tertiary]" />
            İşlem Detayı
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[--border]">
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Açıklama</th>
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Sorumlu</th>
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Tip</th>
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border-soft]">
              {monthSpecificExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[--bg-subtle] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{exp.description}</span>
                      <span className="text-[12px] text-[--text-tertiary] mt-0.5">{exp.location?.name || 'Genel'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[13px] text-[--text-secondary]">{exp.paidBy || 'Merkez'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[13px] text-[--text-secondary]">{exp.type === 'RECURRING' ? 'Sabit' : 'Ad-hoc'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[15px] font-medium tabular-nums text-[--text]">₺{exp.amountWithVat?.toLocaleString('tr-TR')}</span>
                  </td>
                </tr>
              ))}
              {monthSpecificExpenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[14px] text-[--text-tertiary]">
                    Bu dönem için kayıt bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryStat({ label, val }: { label: string; val: string }) {
  return (
    <div>
      <p className="text-[12px] text-[--text-tertiary]">{label}</p>
      <p className="text-[18px] md:text-[20px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.014em' }}>{val}</p>
    </div>
  );
}

function AnalysisCard({ label, val, icon: Icon }: { label: string; val: number; icon: LucideIcon }) {
  return (
    <div className="apple-card p-5 sm:p-6 md:p-7">
      <div className="w-10 h-10 rounded-full bg-[--bg-elevated] text-[--text-secondary] flex items-center justify-center">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <p className="text-[13px] text-[--text-secondary] mt-5" style={{ letterSpacing: '-0.005em' }}>{label}</p>
      <p className="text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.022em' }}>
        ₺{val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}
