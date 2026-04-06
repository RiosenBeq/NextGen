import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { FileText } from 'lucide-react';
import { getSystemParameters } from '@/features/ledger/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import CashFlowClientUI from '@/components/premium/CashFlowClientUI';

export const metadata = {
  title: 'Nakit Akışı — NextGenBox',
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const params = await searchParams;
  const filterLocation = params.location || 'all';

  const supabase = await createClient();
  const sysParams = await getSystemParameters();
  const sessionPrice = sysParams['SESSION_PRICE_INCL_VAT'] || 300;

  const { data: locations } = await supabase.from('Location').select('*').eq('isActive', true);
  const activeLocationCount = (locations || []).length || 1;
  
  const [
    { data: performances },
    { data: expenses }
  ] = await Promise.all([
    supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false }),
    supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false }),
  ]);

  const recurringExpenses = (expenses || []).filter((e) => e.type === 'RECURRING');
  const getRecurringTotal = (locationId?: string) => {
    return recurringExpenses.reduce((s, e) => {
      if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
      if (e.locationId === locationId) return s + (e.amountWithVat || 0);
      return s;
    }, 0);
  };

  const getOneTimeExpenses = (monthId: string, locationId?: string) => {
    return (expenses || [])
      .filter((e) => {
        if (e.type === 'RECURRING') return false;
        const expMonth = e.month ? (String(e.month).includes('T') ? String(e.month).split('T')[0].slice(0, 7) : String(e.month).slice(0, 7)) : '';
        if (expMonth !== monthId) return false;
        if (e.locationId && e.locationId !== locationId) return false;
        return true;
      })
      .reduce((s, e) => {
        if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocationCount;
        return s + (e.amountWithVat || 0);
      }, 0);
  };

  const consolidatedMap = new Map<string, any>();
  for (const perf of performances || []) {
    if (!perf.location || !perf.month) continue;
    const monthId = new Date(perf.month).toISOString().slice(0, 7);
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

  const processed = Array.from(consolidatedMap.values()).map((perf: any) => {
    const perfMonthId = new Date(perf.month).toISOString().slice(0, 7);
    const sessions = perf.sessionCount;

    const recurringTotal = getRecurringTotal(perf.location.id);
    const oneTimeTotal = getOneTimeExpenses(perfMonthId, perf.location.id);
    const totalExtraExpense = Number(perf.extraExpenseAmount || 0) + recurringTotal + oneTimeTotal;

    const calc = calculateMonthlyCashFlow(sessions, totalExtraExpense, {
      sessionPrice,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: perf.location.fixedRent,
      duesAmount: perf.location.duesAmount,
      revenueShareRate: perf.location.revenueShareRate || 15,
    });

    return {
      id: perf.id,
      monthId: perfMonthId,
      month: new Date(perf.month).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
      locationName: perf.location.name,
      locationId: perf.location.id,
      sessionCount: sessions,
      grossRevenue: calc.grossRevenue,
      totalAvmExpense: calc.totalAvmExpense,
      totalCommission: calc.totalCommission,
      revenueShare: calc.revenueShare,
      extraExpense: totalExtraExpense,
      totalExpense: calc.totalExpense,
      netCash: calc.netCash,
    };
  });

  const filteredData = processed.filter((row: any) =>
    filterLocation === 'all' || row.locationId === filterLocation
  );

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-xl">
              <FileText size={28} />
           </div>
           <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg inline-block mb-1 border border-blue-200 text-blue-600 bg-blue-50/50 italic">
                Sürekli Finansal Denetim
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
                Nakit Akışı Raporu
              </h1>
           </div>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl shadow-inner group">
          <Link 
            href="/raporlar?location=all" 
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", 
              filterLocation === 'all' ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Tümü
          </Link>
          {(locations || []).map(loc => (
            <Link 
              key={loc.id} 
              href={`/raporlar?location=${loc.id}`} 
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap", 
                filterLocation === loc.id ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {loc.name.split(' ')[0]}
            </Link>
          ))}
        </div>
      </header>

      <CashFlowClientUI 
        locations={locations || []}
        initialData={filteredData}
        filterLocation={filterLocation}
      />
    </div>
  );
}

