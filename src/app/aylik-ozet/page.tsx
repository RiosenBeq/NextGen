import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { Calendar, Wallet, TrendingUp, CreditCard, Receipt, Anchor, ArrowDownRight, ArrowUpRight, Target, Activity, MapPin } from 'lucide-react';
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
    <div className="page-wrapper min-h-screen bg-[#0f1117] space-y-8 animate-fade-in p-6 md:p-10 no-scrollbar">
      
      {/* 1. TOP HEADER & NAVIGATION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic">Stratejik Finans Raporu</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
                {monthName} <span className="text-slate-600">Özeti</span>
              </h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4 backdrop-blur-xl">
              <span className="text-[10px] font-black text-slate-500 uppercase italic">Dönem Seçimi:</span>
              <MonthSelector availableMonths={availableMonths} selectedMonthStr={selectedMonthStr} />
           </div>
        </div>
      </header>

      {/* 2. STRATEGIC EBIT PANEL (HERO) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Main Performance Grid */}
        <div className={cn(
           "lg:col-span-8 group relative rounded-[48px] p-12 overflow-hidden flex flex-col justify-between transition-all duration-700 border-2",
           isProfitable 
             ? "bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/10 shadow-[0_0_80px_rgba(16,185,129,0.05)]" 
             : "bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/10 shadow-[0_0_80px_rgba(244,63,94,0.05)]"
        )}>
           <div className="absolute top-0 right-0 p-12 opacity-5 blur-[2px] rotate-[-15deg]">
             <Target size={400} strokeWidth={0.5} />
           </div>

           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                 <div className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border italic backdrop-blur-md", 
                   isProfitable ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                    {isProfitable ? "NET OPERASYONEL KAR" : "NET OPERASYONEL ZARAR"}
                 </div>
                 <div className="px-4 py-1 rounded-full bg-white/5 text-[9px] font-black text-slate-500 border border-white/5 uppercase tracking-widest italic">
                    AMORTİSMAN SONRASI (EBIT)
                 </div>
              </div>
              
              <div className="flex items-baseline gap-4">
                 <h2 className={cn("text-8xl md:text-[140px] font-black tracking-tighter tabular-nums italic drop-shadow-2xl leading-none transition-all", 
                   isProfitable ? "text-white" : "text-rose-500")}>
                   {isProfitable ? "" : "-"}₺{Math.abs(ebitProfit).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                 </h2>
                 <span className={cn("text-xl font-black italic uppercase", isProfitable ? "text-emerald-500" : "text-rose-600")}>
                   {isProfitable ? "Elite Performans" : "Büyüme Riski"}
                 </span>
              </div>
           </div>

           <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 mt-16">
              {[
                { label: 'KİŞİ BAŞI HAKEDİŞ', val: `₺${(ebitProfit / 4).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, icon: Wallet },
                { label: 'YATIRIM GETİRİSİ', val: `%${((ebitProfit / totalInv) * 100).toFixed(1)}`, icon: TrendingUp },
                { label: 'KÂN MARJI', val: `%${((rawNetCash / monthRevenue) * 100).toFixed(1)}`, icon: Target },
                { label: 'BRÜT Hacim', val: `₺${monthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, icon: Activity }
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] group/item hover:bg-white/10 transition-all">
                   <div className="flex items-center gap-3 mb-3">
                      <stat.icon size={14} className="text-blue-500 opacity-60" />
                      <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-500 italic">{stat.label}</p>
                   </div>
                   <p className="text-2xl font-black text-white italic tracking-tighter">{stat.val}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Device Amortization Detail */}
        <div className="lg:col-span-4 premium-card bg-[#14161f] border border-white/5 p-12 rounded-[48px] flex flex-col justify-between group overflow-hidden relative">
           <div className="absolute -top-10 -right-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Anchor size={260} />
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                   <TrendingUp size={24} />
                 </div>
                 <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Cihaz Amortismanı</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="p-8 rounded-[36px] bg-white/[0.02] border border-white/5 flex flex-col items-center text-center group-hover:bg-amber-500/5 group-hover:border-amber-500/10 transition-all">
                    <p className="text-5xl font-black text-white italic tracking-tighter shadow-sm mb-2">₺{monthlyAmortization.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-relaxed">BU AYIN PAYINA DÜŞEN <br/> YATIRIM GİDERİ</p>
                 </div>
                 <p className="text-[11px] text-slate-500 font-bold leading-relaxed italic text-center px-4">
                    Toplam <span className="text-slate-300">₺{totalInv.toLocaleString('tr-TR')}</span> yatırımın 36 aylık (3 yıl) amortisman planına göre hesaplanmıştır.
                 </p>
              </div>
           </div>

           <div className="relative z-10 pt-10 mt-10 border-t border-white/5">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                    <Receipt size={14} className="text-amber-500" /> RESMİ MUHASEBE UYUMLU
                 </div>
                 <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              </div>
           </div>
        </div>
      </section>

      {/* 3. COST STRUCTURE (QUICK METRICS) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'BRÜT SATIŞ HACMİ', val: monthRevenue, color: 'blue', icon: Activity },
           { label: 'AVM KİRA & CİRO PAYI', val: monthAvmFixed, color: 'rose', icon: CreditCard },
           { label: 'OPERASYONEL GİDERLER', val: monthOperationalExpense + monthCommission, color: 'amber', icon: Receipt }
         ].map((card, i) => (
           <div key={i} className="premium-card p-10 bg-[#14161f] border border-white/5 hover:border-white/10 transition-all group/cost">
              <div className="flex justify-between items-start mb-8">
                 <div className="space-y-4">
                   <div className="flex items-center gap-2">
                     <card.icon size={12} className={cn("text-" + card.color + "-500")} />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{card.label}</span>
                   </div>
                   <p className="text-4xl font-black text-white italic tracking-tighter">₺{card.val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                 </div>
                 <div className={cn("p-4 rounded-2xl bg-" + card.color + "-500/10 text-" + card.color + "-500 group-hover/cost:scale-110 transition-transform shadow-xl")}><card.icon size={20} /></div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className={cn("h-full bg-" + card.color + "-500 transition-all duration-1000")} 
                      style={{ width: `${card.color === 'blue' ? 100 : (card.val / monthRevenue) * 100}%` }} />
              </div>
           </div>
         ))}
      </section>

      {/* 4. TRANSACTION AUDIT TABLE */}
      <section className="premium-card overflow-hidden bg-[#14161f] border border-white/5 rounded-[48px] shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
         <div className="px-12 py-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 italic shadow-inner">
                <Receipt size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Ekstra Gider Detayları</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Stratejik Audit Kayıtları</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />{monthName} Dönemi Filtrelendi
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-0">
              <thead>
                <tr className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em] italic border-b border-white/5">
                  <th className="px-12 py-8 bg-white/[0.01]">AÇIKLAMA / LOKASYON</th>
                  <th className="text-center bg-white/[0.01]">SORUMLU</th>
                  <th className="text-center bg-white/[0.01]">SİSTEM TİPİ</th>
                  <th className="text-right px-12 bg-white/[0.01]">KALEM TUTARI</th>
                </tr>
              </thead>
              <tbody>
                {monthSpecificExpenses.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-10">
                          <Activity size={60} strokeWidth={1} />
                          <p className="text-xs font-black italic tracking-[0.3em] uppercase text-slate-400">Veri Girişi Bulunmuyor</p>
                        </div>
                     </td>
                  </tr>
                ) : (
                  monthSpecificExpenses.map((exp: any, idx: number) => (
                    <tr key={exp.id} className={cn("group transition-all hover:bg-white/[0.03]", idx % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent")}>
                      <td className="px-12 py-7 border-t border-white/5">
                         <div className="flex flex-col gap-1">
                           <span className="text-sm font-black text-slate-200 group-hover:text-blue-400 transition-colors">{exp.description}</span>
                           <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">
                             <MapPin size={10} className="text-slate-700" />
                             {exp.location?.name || 'Genel Şube'}
                           </div>
                         </div>
                      </td>
                      <td className="text-center border-t border-white/5">
                         <span className="text-[10px] uppercase font-black tracking-widest text-blue-500 px-3 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10 italic leading-none">
                           {exp.paidBy || 'MERKEZ KASA'}
                         </span>
                      </td>
                      <td className="text-center border-t border-white/5">
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] italic">
                              {exp.type === 'RECURRING' ? 'DÜZENLİ ÖDEME' : 'AD-HOC İŞLEM'}
                            </span>
                            <div className={cn("w-6 h-0.5 rounded-full", exp.type === 'RECURRING' ? "bg-amber-500/30" : "bg-blue-500/30")} />
                         </div>
                      </td>
                      <td className="text-right px-12 border-t border-white/5">
                         <span className="text-xl font-black text-white tracking-tighter italic tabular-nums group-hover:text-rose-500 transition-colors">
                           ₺{exp.amountWithVat?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
         </div>
         
         <div className="p-10 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">TOPLAM {monthSpecificExpenses.length} KALEM ANALİZ EDİLDİ</p>
            <div className="w-12 h-1 rounded-full bg-slate-800" />
         </div>
      </section>

      {/* 5. FOOTER LOGO & SYSTEM STATUS */}
      <footer className="pt-20 pb-40 flex flex-col items-center gap-6 opacity-30 text-center">
         <div className="h-10 w-[2px] bg-gradient-to-b from-blue-500 to-transparent" />
         <div className="space-y-1">
           <p className="text-[11px] font-black italic tracking-[0.5em] text-white uppercase">NEXTGEN PERFORMANCE CLOUD</p>
           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">EST. 2026 • PROFESSIONAL DATA SYSTEM</p>
         </div>
      </footer>
    </div>
  );
}
