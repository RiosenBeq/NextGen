import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { Calendar, Wallet, TrendingUp, CreditCard, Receipt, Anchor, ArrowDownRight, ArrowUpRight, Target, Activity, MapPin, Building2, FileText } from 'lucide-react';
import MonthSelector from '@/features/ledger/components/MonthSelector';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Aylık Özet — NextGenBox' };
export const dynamic = 'force-dynamic';

const AVM_FIXED_KEYWORDS = [
  'sabit kira',
  'avm aidat',
  'ciro payı',
  'ciro payi',
  '[sabit kira]',
  '[avm aidat]',
  '[ciro payı]',
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isAvmFixedExpense(description: string | null | undefined) {
  const normalizedDescription = normalizeText(description || '');
  return AVM_FIXED_KEYWORDS.some((keyword) => normalizedDescription.includes(normalizeText(keyword)));
}

export default async function MonthlySummaryPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const supabase = await createClient();
  const params = await getSystemParameters();
  const sp = await searchParams;

  const { data: performances } = await supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false });
  const { data: allExpenses } = await supabase.from('Expense').select('*');
  const { data: investments } = await supabase.from('Investment').select('*');

  const totalInv = (investments || []).reduce((acc: any, i: any) => acc + (i.totalAmount || 0), 0);
  const monthlyAmortization = totalInv > 0 ? totalInv / 36 : 0; // 36 Aylık (3 Yıl) Amortisman

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

  const currentPerformances = (performances || []).filter(p => p.month.startsWith(selectedMonthStr));
  const activeLocCount = currentPerformances.length || 1;

  for (const perf of currentPerformances) {
    const loc = perf.location;
    
    const recurringTotal = (allExpenses || [])
        .filter(e => {
            if (e.type !== 'RECURRING') return false;
            if (isAvmFixedExpense(e.description)) return false;
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
          if (isAvmFixedExpense(e.description)) return false;
          
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
    <div className="page-wrapper min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white space-y-8 p-6 md:p-10">
      
      {/* Header */}
      <header className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border border-slate-200 rounded-[32px] bg-white p-6 md:p-8 shadow-sm">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-violet-100/60 blur-3xl pointer-events-none" />
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

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TopStat label="Aktif Şube" value={String(currentPerformances.length)} tone="slate" />
        <TopStat label="Brüt Gelir" value={`₺${monthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} tone="blue" />
        <TopStat label="Toplam Gider" value={`₺${(monthCommission + monthAvmFixed + monthOperationalExpense).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} tone="amber" />
        <TopStat label="Net Nakit" value={`₺${rawNetCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} tone={rawNetCash >= 0 ? 'emerald' : 'rose'} />
      </section>

      {/* Main Stats (EBIT Focused) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* EBITDA / Net Profit Card */}
        <div className={cn(
          "lg:col-span-2 p-10 rounded-[32px] border-2 flex flex-col justify-between min-h-[300px] shadow-sm",
          isProfitable ? "bg-white border-emerald-100" : "bg-white border-rose-100"
        )}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                isProfitable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                {isProfitable ? "Net Operasyonel Kar" : "Net Operasyonel Zarar"}
              </span>
              <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest">AMORTİSMAN SONRASI (EBIT)</span>
            </div>
            <div className="flex items-baseline gap-4">
              <h2 className={cn("text-6xl font-bold tracking-tighter tabular-nums italic", isProfitable ? "text-slate-900" : "text-rose-600")}>
                ₺{ebitProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-100">
            <SummaryStat label="Kişi Başı" val={`₺${(ebitProfit / 4).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} />
            <SummaryStat label="ROI" val={`%${((ebitProfit / totalInv) * 100).toFixed(1)}`} />
            <SummaryStat label="Kar Marjı" val={`%${((rawNetCash / monthRevenue) * 100).toFixed(1)}`} />
            <SummaryStat label="Hacim" val={`₺${monthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} />
          </div>
        </div>

        {/* Amortization Detail Card */}
        <div className="bg-white border border-slate-200 p-10 rounded-[32px] shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100"><TrendingUp size={20} /></div>
               <h3 className="text-lg font-bold text-slate-900 uppercase">Amortisman</h3>
            </div>
            <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-3xl font-bold text-slate-900 italic tracking-tighter">₺{monthlyAmortization.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Aylık Pay</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed text-center">
            Yatırımın <span className="text-slate-600 font-bold">36 aylık</span> planına göre hesaplanan sabit maliyet.
          </p>
        </div>
      </section>

      {/* Quick Analysis Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalysisCard label="Brüt Satış" val={monthRevenue} icon={Activity} color="blue" />
        <AnalysisCard label="Sabit Gider (AVM)" val={monthAvmFixed} icon={Building2} color="rose" />
        <AnalysisCard label="Operasyonel" val={monthOperationalExpense + monthCommission} icon={Receipt} color="amber" />
      </section>

      {/* Transaction Details */}
      <section className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400"><FileText size={18} /></div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">İşlem Bazlı Audit</h3>
           </div>
           <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1">
            Toplam {monthSpecificExpenses.length} kayıt
           </span>
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
                 {monthSpecificExpenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
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
                 ))}
              </tbody>
           </table>
        </div>
      </section>

    </div>
  );
}

function SummaryStat({ label, val }: { label: string, val: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-slate-900 italic tracking-tighter">{val}</p>
    </div>
  );
}

function AnalysisCard({ label, val, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-600",
    rose: "bg-rose-600",
    amber: "bg-amber-600"
  };
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
         <div className={cn("p-2.5 rounded-xl text-white shadow-lg shadow-inner", colors[color])}><Icon size={18} /></div>
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 tabular-nums tracking-tighter italic">₺{val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
    </div>
  );
}

function TopStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'amber' | 'emerald' | 'rose' | 'slate';
}) {
  const toneClasses: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100/40 text-blue-700 border-blue-100',
    amber: 'from-amber-50 to-amber-100/40 text-amber-700 border-amber-100',
    emerald: 'from-emerald-50 to-emerald-100/40 text-emerald-700 border-emerald-100',
    rose: 'from-rose-50 to-rose-100/40 text-rose-700 border-rose-100',
    slate: 'from-slate-50 to-slate-100/60 text-slate-700 border-slate-200',
  };

  return (
    <div className={cn('rounded-2xl border bg-gradient-to-br px-4 py-4 shadow-sm', toneClasses[tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-2 text-lg font-black tracking-tight tabular-nums">{value}</p>
    </div>
  );
}
