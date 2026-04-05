import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { Calendar, Wallet, TrendingUp, CreditCard, Users, Landmark, Receipt, Anchor } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Aylık Özet — NextGenBox' };
export const dynamic = 'force-dynamic';

export default async function MonthlySummaryPage({ searchParams }: { searchParams: { m?: string } }) {
  const supabase = await createClient();
  const params = await getSystemParameters();

  const { data: performances } = await supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false });
  const { data: allExpenses } = await supabase.from('Expense').select('*');
  const { data: investments } = await supabase.from('Investment').select('*');

  const totalInv = (investments || []).reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const monthlyAmortization = totalInv > 0 ? totalInv / 60 : 0; // 5 Yıllık (60 ay) Amortisman

  const availableMonths = Array.from(new Set((performances || []).map(p => new Date(p.month).toISOString().slice(0, 7)))).sort().reverse();
  const selectedMonthStr = searchParams?.m || availableMonths[0] || new Date().toISOString().slice(0, 7);

  // Split month label
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
    
    // Giderleri o ay ile eşleştirme
    const recurringTotal = (allExpenses || [])
        .filter(e => e.type === 'RECURRING')
        .reduce((s, e) => {
          if (!e.locationId) return s + (e.amountWithVat || 0) / activeLocCount;
          if (e.locationId === loc.id) return s + (e.amountWithVat || 0);
          return s;
        }, 0);

    const oneTimeTotal = (allExpenses || [])
        .filter(e => {
          if (e.type === 'RECURRING') return false;
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
        revenueShareRate: loc.revenueShareRate || 15
    });

    monthRevenue += calc.grossRevenue;
    monthCommission += calc.totalCommission;
    monthAvmFixed += calc.totalAvmExpense;
    monthOperationalExpense += extra;
    rawNetCash += calc.netCash;
  }

  const ebitProfit = rawNetCash - monthlyAmortization;
  const isProfitable = ebitProfit >= 0;

  // o aya ait tüm giderleri düz bir liste yapmak için filtre (Sadece liste gösterimi)
  const monthSpecificExpenses = (allExpenses || []).filter(e => {
    if (e.type === 'RECURRING') return true;
    const expM = e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7);
    return expM === selectedMonthStr;
  });

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Analizler
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" />
            Aylık Finansal Özet
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Seçili ayın tüm gelir, gider ve amortisman düşülmüş net kazanç oranları.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2">
            <select 
              name="m" 
              defaultValue={selectedMonthStr}
              className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm focus:ring-4 ring-indigo-50 outline-none"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
              Filtrele
            </button>
          </form>
        </div>
      </header>

      {/* Ana Net Kâr / Zarar Bloğu (Amortisman Sonrası) */}
      <section className={cn(
         "w-full rounded-3xl p-8 md:p-12 relative overflow-hidden text-center",
         isProfitable ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-200/50" : "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-200/50"
      )}>
         <div className="absolute top-0 right-0 p-8 opacity-10 blur-[2px]">
           <Anchor size={250} />
         </div>
         <div className="relative z-10 max-w-lg mx-auto space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] italic opacity-80 mix-blend-overlay">AMORTİSMAN SONRASI GERÇEK NET DURUM</h2>
            <div className="text-6xl md:text-8xl font-black tracking-tighter tabular-nums drop-shadow-sm">
              {isProfitable ? "+" : ""}₺{ebitProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </div>
            <div className="flex justify-center items-center gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-2xl">
                 <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Kişi Başı Net ({monthName})</p>
                 <p className="text-xl font-bold">~₺{(ebitProfit / 4).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
         </div>
      </section>

      {/* Ayın Tüm Detayları */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="premium-card p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14}/> Toplam Brüt Ciro</p>
            <p className="text-3xl font-black text-slate-800">₺{monthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
         </div>
         <div className="premium-card p-6 border-l-4 border-l-rose-400">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CreditCard size={14}/> AVM Kira & Gelir Payı</p>
            <p className="text-3xl font-black text-slate-800">₺{monthAvmFixed.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
         </div>
         <div className="premium-card p-6 border-l-4 border-l-orange-400">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Receipt size={14}/> Diğer Harcamalar & Vergiler</p>
            <p className="text-3xl font-black text-slate-800">₺{(monthOperationalExpense + monthCommission).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
         </div>
         <div className="premium-card p-6 border-l-4 border-l-slate-400 bg-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Landmark size={14}/> Cihaz Amortismanı</p>
            <p className="text-3xl font-black text-slate-800">₺{monthlyAmortization.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-2 italic shadow-sm bg-white/50 px-2 py-1 inline-block rounded">(840.500 TL Demirbaş / 60 Ay)</p>
         </div>
      </section>

      {/* Bu Ayın Ekstra Masraf Kalemleri (Listeleme) */}
      <section className="premium-card p-8 bg-white mt-8 border border-slate-100">
         <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
            <Receipt className="text-slate-400"/>
            Özel Harcama Kalemleri ({monthName})
         </h3>
         
         <div className="space-y-3">
           {monthSpecificExpenses.length === 0 && <p className="text-xs text-slate-400">Bu ay için kaydedilmiş özel bir operasyonel gider / bakım masrafı yok.</p>}
           {monthSpecificExpenses.map((exp: any) => (
             <div key={exp.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{exp.description}</span>
                  <div className="flex gap-2 mt-1 items-center">
                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{exp.paidBy || 'Ortak Hesap'}</span>
                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">{exp.type === 'RECURRING' ? 'DÜZENLİ (ABONE)' : 'TEK SEFERLİK'}</span>
                  </div>
                </div>
                <div className="text-sm font-black text-rose-600">
                  ₺{exp.amountWithVat?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                </div>
             </div>
           ))}
         </div>
      </section>

    </div>
  );
}
