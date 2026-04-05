import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { Calendar, Wallet, TrendingUp, CreditCard, Receipt, Anchor, ArrowDownRight, ArrowUpRight, Target, Activity } from 'lucide-react';
import MonthSelector from '@/features/ledger/components/MonthSelector';
import { cn } from '@/lib/utils';

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
  const monthlyAmortization = totalInv > 0 ? totalInv / 36 : 0; // 36 Aylık (3 Yıl) Amortisman

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  let availableMonths = Array.from(new Set([
    ...((performances || []).map((p: any) => new Date(p.month).toISOString().slice(0, 7))),
    ...((allExpenses || []).map((e: any) => e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7))),
    currentMonthStr,
    '2026-04',
    '2026-03'
  ])).sort().reverse();

  // Sabit başlangıç 2026 Mart sonrasını al
  availableMonths = availableMonths.filter((m: string) => m >= '2026-03');

  const selectedMonthStr = sp?.m || availableMonths[0] || currentMonthStr;

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

  // o aya ait tüm giderleri düz bir liste yapmak için filtre (Sadece liste gösterimi)
  const monthSpecificExpenses = (allExpenses || []).filter(e => {
    if (e.type === 'RECURRING') return true;
    const expM = e.month ? e.month.slice(0, 7) : e.createdAt.slice(0, 7);
    return expM === selectedMonthStr;
  });

  return (
    <div className="page-wrapper min-h-screen bg-[#0f1117] space-y-8 animate-fade-in p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] italic">PERFORMANS ANALİZİ</span>
              <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase mt-0.5">
                Aylık Finansal Özet
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-bold max-w-xl leading-relaxed italic">
            "{monthName}" dönemine ait tüm gelir kalemleri, AVM operasyon giderleri ve cihaz amortismanı düşülmüş net hakediş tablosu.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="premium-card bg-white/[0.03] border border-white/10 p-1.5 rounded-[22px] flex items-center gap-2">
            <MonthSelector availableMonths={availableMonths} selectedMonthStr={selectedMonthStr} />
          </div>
        </div>
      </header>

      {/* Hero Stats Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main EBIT Card */}
        <div className={cn(
           "lg:col-span-8 group relative rounded-[48px] p-10 md:p-16 overflow-hidden flex flex-col justify-between transition-all duration-700",
           isProfitable 
             ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.1)]" 
             : "bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 shadow-[0_0_100px_rgba(244,63,94,0.1)]"
        )}>
           <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity blur-[1px] rotate-12 group-hover:rotate-0 duration-1000">
             <Anchor size={400} strokeWidth={1} />
           </div>
           
           <div className="relative z-10 space-y-2">
             <div className="flex items-center gap-2">
               <Target className={isProfitable ? "text-emerald-500" : "text-rose-500"} size={16} />
               <h2 className="text-[11px] font-black uppercase tracking-[0.4em] italic text-slate-400">AMORTİSMAN SONRASI NET KAZANÇ (EBIT)</h2>
             </div>
             <div className={cn(
               "text-7xl md:text-9xl font-black tracking-tighter tabular-nums italic drop-shadow-2xl transition-all duration-500",
               isProfitable ? "text-emerald-400" : "text-rose-400"
             )}>
               {isProfitable ? "+" : ""}₺{ebitProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
             </div>
           </div>

           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[32px] group/item hover:bg-white/10 transition-all">
                 <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-2 italic">KİŞİ BAŞI HAKEDİŞ</p>
                 <div className="flex items-center justify-between">
                   <p className="text-2xl font-black text-white italic tracking-tighter">₺{(ebitProfit / 4).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                   <ArrowUpRight size={20} className="text-blue-500 opacity-0 group-hover/item:opacity-100 transition-all" />
                 </div>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[32px] group/item hover:bg-white/10 transition-all">
                 <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-2 italic">YATIRIM GERİ DÖNÜŞÜ</p>
                 <p className="text-2xl font-black text-white italic tracking-tighter">%{((ebitProfit / totalInv) * 100).toFixed(1)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[32px] group/item hover:bg-white/10 transition-all">
                 <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-2 italic">OPERASYONEL MARJ</p>
                 <p className="text-2xl font-black text-white italic tracking-tighter">%{((rawNetCash / monthRevenue) * 100).toFixed(1)}</p>
              </div>
           </div>
        </div>

        {/* Amortization Detail Card */}
        <div className="lg:col-span-4 premium-card bg-white/[0.02] border border-white/10 p-10 rounded-[48px] flex flex-col justify-between group overflow-hidden">
           <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={200} />
           </div>
           <div className="relative z-10">
              <div className="w-14 h-14 rounded-3xl bg-slate-800/50 border border-white/10 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 group-hover:text-amber-500 transition-all duration-500">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-4">Cihaz Amortismanı</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8 italic">
                Toplam yatırım maliyeti olan <span className="text-slate-300">₺{totalInv.toLocaleString('tr-TR')}</span> tutarın, 36 ay (3 yıl) üzerinden her aya düşen payıdır.
              </p>
              <div className="space-y-4">
                 <div className="p-6 rounded-[32px] bg-amber-500/5 border border-amber-500/10 text-center group-hover:border-amber-500/30 transition-all">
                    <p className="text-4xl font-black text-amber-500 italic tracking-tighter">₺{monthlyAmortization.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">DÜŞÜLEN TUTAR / AY</p>
                 </div>
              </div>
           </div>
           <div className="relative z-10 pt-8 mt-8 border-t border-white/5">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 italic">
                <Receipt size={12} /> VERGİ & MUHASEBE UYUMLU
              </p>
           </div>
        </div>
      </section>

      {/* Financial Breakdown Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="premium-card p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">TOPLAM BRÜT CİRO</span>
                 <p className="text-3xl font-black text-white italic tracking-tighter">₺{monthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
               </div>
               <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400"><TrendingUp size={18} /></div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[100%]" />
            </div>
         </div>

         <div className="premium-card p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">AVM KİRA & GELİR PAYI</span>
                 <p className="text-3xl font-black text-white italic tracking-tighter">₺{monthAvmFixed.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
               </div>
               <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400"><CreditCard size={18} /></div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${(monthAvmFixed / monthRevenue) * 100}%` }} />
            </div>
         </div>

         <div className="premium-card p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">KOMİSYON & MASRAFLAR</span>
                 <p className="text-3xl font-black text-white italic tracking-tighter">₺{(monthOperationalExpense + monthCommission).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
               </div>
               <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><Receipt size={18} /></div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${((monthOperationalExpense + monthCommission) / monthRevenue) * 100}%` }} />
            </div>
         </div>
      </section>

      {/* Transaction Feed */}
      <section className="premium-card overflow-hidden bg-white/[0.02] border border-white/10 rounded-[40px] shadow-2xl">
         <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 italic">
                <Receipt size={24} />
              </div>
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Ekstra Harcama Detayları</h3>
            </div>
            <div className="hidden md:flex gap-4">
               <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Sadece {monthName} Dönemi</div>
            </div>
         </div>
         
         <div className="overflow-x-auto p-2">
           <table className="w-full text-left border-separate border-spacing-y-2">
             <thead>
               <tr className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] italic">
                 <th className="px-10 py-5">Açıklama / Kategori</th>
                 <th className="text-center">Ödemeyi Yapan</th>
                 <th className="text-center">Tip</th>
                 <th className="text-right px-10">Tutar</th>
               </tr>
             </thead>
             <tbody>
               {monthSpecificExpenses.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="py-20 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-20">
                         <Activity size={48} />
                         <p className="text-sm font-black italic tracking-widest uppercase text-slate-400">Bu ay için özel masraf kaydı bulunamadı.</p>
                       </div>
                    </td>
                 </tr>
               ) : (
                 monthSpecificExpenses.map((exp: any) => (
                   <tr key={exp.id} className="group hover:bg-white/[0.02] transition-all bg-white/[0.01] rounded-[24px]">
                     <td className="px-10 py-6 rounded-l-[32px] border-y border-l border-white/5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-slate-200 group-hover:text-white transition-colors">{exp.description}</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            {exp.location?.name || 'GENEL'}
                          </span>
                        </div>
                     </td>
                     <td className="text-center border-y border-white/5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-400/5 px-3 py-1.5 rounded-xl border border-blue-400/10">
                          {exp.paidBy || 'ORTAK HESAP'}
                        </span>
                     </td>
                     <td className="text-center border-y border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                          {exp.type === 'RECURRING' ? 'DÜZENLİ' : 'TEK SEFER'}
                        </span>
                     </td>
                     <td className="text-right px-10 rounded-r-[32px] border-y border-r border-white/5">
                        <span className="text-lg font-black text-rose-500 tracking-tighter italic">
                          ₺{exp.amountWithVat?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </span>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
      </section>

      {/* Mobile Footer Spacing */}
      <div className="h-20" />
    </div>
  );
}
