import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow, CalculationResult } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3, 
  Filter, Calendar, MapPin, DollarSign, CreditCard, Percent,
  ChevronDown, FileText, PiggyBank, Wallet
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Gelir & Gider Takip - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

const EXPENSE_CATEGORIES: Record<string, { label: string; color: string }> = {
  rent: { label: 'Kira', color: 'text-blue-400' },
  utilities: { label: 'Faturalar', color: 'text-cyan-400' },
  maintenance: { label: 'Bakım/Onarım', color: 'text-amber-400' },
  marketing: { label: 'Pazarlama', color: 'text-purple-400' },
  equipment: { label: 'Ekipman', color: 'text-pink-400' },
  operational: { label: 'Operasyonel', color: 'text-emerald-400' },
  other: { label: 'Diğer', color: 'text-zinc-400' },
};

export default async function GelirGiderPage(props: {
  searchParams: Promise<{ month?: string; location?: string; category?: string }>
}) {
  const searchParams = await props.searchParams;
  const filterMonth = searchParams.month || '';
  const filterLocation = searchParams.location || 'all';
  const filterCategory = searchParams.category || 'all';

  const supabase = await createClient();
  const params = await getSystemParameters();

  const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;
  const kdvRate = params['VAT_RATE'] || 20;

  // Lokasyonlar
  const { data: locations } = await supabase.from('Location').select('*').eq('isActive', true);

  // Performanslar (gelir kaynağı)
  let perfQuery = supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false });
  const { data: performances } = await perfQuery;

  // Giderler
  let expQuery = supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false });
  const { data: expenses } = await expQuery;

  // Yatırımlar
  const { data: investments } = await supabase.from('Investment').select('*, location:Location(*)').order('createdAt', { ascending: false });

  // Hesaplamalar — aylık bazda
  interface MonthlyEntry {
    month: string;
    locationName: string;
    locationId: string;
    sessions: number;
    grossRevenue: number;
    totalCommission: number;
    iyzicoComm: number;
    nayaxComm: number;
    revenueShare: number;
    avmExpense: number;
    extraExpense: number;
    totalExpense: number;
    netCash: number;
    okanShare: number;
    talhaShare: number;
    furkanShare: number;
    alpShare: number;
  }

  const monthlyEntries: MonthlyEntry[] = [];
  const allCalcResults: CalculationResult[] = [];

  if (performances) {
    for (const perf of performances) {
      const loc = perf.location;
      if (!loc) continue;

      // Ay filtresi
      const perfMonth = new Date(perf.month).toISOString().slice(0, 7);
      if (filterMonth && perfMonth !== filterMonth) continue;
      if (filterLocation !== 'all' && loc.id !== filterLocation) continue;

      const calc = calculateMonthlyCashFlow(perf.sessionCount, perf.extraExpenseAmount || 0, {
        sessionPrice,
        iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
        revenueShareRate: loc.revenueShareRate || 15,
      });

      allCalcResults.push(calc);

      monthlyEntries.push({
        month: new Date(perf.month).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
        locationName: loc.name,
        locationId: loc.id,
        sessions: perf.sessionCount,
        grossRevenue: calc.grossRevenue,
        totalCommission: calc.totalCommission,
        iyzicoComm: calc.iyzicoCommission,
        nayaxComm: calc.nayaxCommission,
        revenueShare: calc.revenueShare,
        avmExpense: calc.totalAvmExpense,
        extraExpense: perf.extraExpenseAmount || 0,
        totalExpense: calc.totalExpense,
        netCash: calc.netCash,
        okanShare: calc.okanShare,
        talhaShare: calc.talhaShare,
        furkanShare: calc.furkanShare,
        alpShare: calc.alpShare,
      });
    }
  }

  // Gider filtresi
  const filteredExpenses = (expenses || []).filter(exp => {
    if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
    if (filterMonth && exp.month && exp.month !== filterMonth) return false;
    return true;
  });

  // Toplam hesaplamalar
  const totalGross = monthlyEntries.reduce((s, e) => s + e.grossRevenue, 0);
  const totalExpense = monthlyEntries.reduce((s, e) => s + e.totalExpense, 0);
  const totalNetCash = monthlyEntries.reduce((s, e) => s + e.netCash, 0);
  const totalSessions = monthlyEntries.reduce((s, e) => s + e.sessions, 0);
  const totalCommission = monthlyEntries.reduce((s, e) => s + e.totalCommission, 0);
  const totalRevenueShare = monthlyEntries.reduce((s, e) => s + e.revenueShare, 0);
  const otherExpenseTotal = filteredExpenses.reduce((s, e) => s + (e.amountWithVat || 0), 0);

  // All taxes are removed  // Kategori bazlı gider dağılımı
  const categoryTotals: Record<string, number> = {};
  for (const exp of filteredExpenses) {
    const cat = exp.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (exp.amountWithVat || 0);
  }
  const maxCatTotal = Math.max(...Object.values(categoryTotals), 1);

  // Benzersiz aylar (filtre için)
  const uniqueMonths = Array.from(new Set((performances || []).map(p => new Date(p.month).toISOString().slice(0, 7)))).sort().reverse();

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">Financial Control Center</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter heading-elite leading-[0.9]">
            Gelir & Gider<br/>Takip Paneli
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Tüm finansal hareketlerin kategorize takibi — iyzico %2, Nayax %2, AVM %15 ciro payı dahil
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="glass-panel rounded-xl px-1.5 py-1.5 flex gap-1">
            <Link
              href={`/gelir-gider?location=all&month=${filterMonth}&category=${filterCategory}`}
              className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${filterLocation === 'all' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >TÜMÜ</Link>
            {(locations || []).map(loc => (
              <Link key={loc.id}
                href={`/gelir-gider?location=${loc.id}&month=${filterMonth}&category=${filterCategory}`}
                className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${filterLocation === loc.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
              >{loc.name.split(' ')[0].toUpperCase()}</Link>
            ))}
          </div>

          {uniqueMonths.length > 0 && (
            <div className="glass-panel rounded-xl px-1.5 py-1.5 flex gap-1 overflow-x-auto">
              <Link
                href={`/gelir-gider?location=${filterLocation}&month=&category=${filterCategory}`}
                className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest whitespace-nowrap transition-all ${!filterMonth ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
              >TÜM AYLAR</Link>
              {uniqueMonths.slice(0, 6).map(m => (
                <Link key={m}
                  href={`/gelir-gider?location=${filterLocation}&month=${m}&category=${filterCategory}`}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest whitespace-nowrap transition-all ${filterMonth === m ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                >{m}</Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Financial KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'TOPLAM GELİR', value: totalGross, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', positive: true },
          { label: 'TOPLAM GİDER', value: totalExpense + otherExpenseTotal, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10', positive: false },
          { label: 'NET NAKİT', value: totalNetCash, icon: Wallet, color: totalNetCash >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: totalNetCash >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10', positive: totalNetCash >= 0 },
          { label: 'TOPLAM OTURUM', value: totalSessions, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10', positive: true, isCurrency: false },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="premium-card p-6 md:p-8 group"
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
              <kpi.icon className={`w-4 h-4 md:w-5 md:h-5 ${kpi.color}`} />
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
            <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white">
              {kpi.isCurrency === false ? kpi.value.toLocaleString('tr-TR') : `₺${kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
            </h2>
          </motion.div>
        ))}
      </section>

      {/* Komisyon Detayları */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">iyzico (%2)</p>
            <p className="text-xl font-black text-white">₺{(totalCommission / 2).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="premium-card p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nayax (%2)</p>
            <p className="text-xl font-black text-white">₺{(totalCommission / 2).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="premium-card p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Percent className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AVM Ciro Payı (%15)</p>
            <p className="text-xl font-black text-white">₺{totalRevenueShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </section>

      {/* Gider Kategori Dağılımı */}
      {Object.keys(categoryTotals).length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-amber-500 px-4 py-2">Gider Kategorileri</h2>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>
          <div className="premium-card p-8 space-y-4">
            {Object.entries(categoryTotals).sort(([,a],[,b]) => b - a).map(([cat, total]) => {
              const info = EXPENSE_CATEGORIES[cat] || { label: cat, color: 'text-zinc-400' };
              const pct = (total / maxCatTotal) * 100;
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className={`text-xs font-black uppercase tracking-widest ${info.color}`}>{info.label}</span>
                    <span className="text-sm font-black text-white">₺{total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Aylık Detay Tablosu */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-emerald-500 px-4 py-2">Aylık Gelir-Gider Detayı</h2>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        <div className="premium-card overflow-hidden bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Dönem</th>
                  <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Lokasyon</th>
                  <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-center">Seans</th>
                  <th className="px-4 py-5 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 text-right">Brüt Gelir</th>
                  <th className="px-4 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest border-b border-white/5 text-right">Komisyon (%4)</th>
                  <th className="px-4 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest border-b border-white/5 text-right">AVM Gider</th>
                  <th className="px-4 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 text-right">Net Nakit</th>
                  <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right">Ortak Payı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {monthlyEntries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <p className="text-sm font-black text-zinc-600 uppercase tracking-widest">Filtreye uygun veri bulunamadı</p>
                    </td>
                  </tr>
                )}
                {monthlyEntries.map((entry, idx) => (
                  <motion.tr
                    key={`${entry.month}-${entry.locationId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5 text-sm font-black text-white uppercase tracking-wider italic">{entry.month}</td>
                    <td className="px-4 py-5">
                      <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 uppercase">{entry.locationName}</span>
                    </td>
                    <td className="px-4 py-5 text-center text-sm font-bold text-zinc-300">{entry.sessions}</td>
                    <td className="px-4 py-5 text-right font-mono text-sm font-bold text-emerald-400">
                      ₺{entry.grossRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-5 text-right font-mono text-sm text-rose-400/70">
                      <div className="flex flex-col items-end">
                        <span>₺{entry.totalCommission.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        <span className="text-[8px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          IY: ₺{entry.iyzicoComm.toLocaleString('tr-TR', {maximumFractionDigits:0})} / NX: ₺{entry.nayaxComm.toLocaleString('tr-TR', {maximumFractionDigits:0})}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right font-mono text-sm text-rose-400/70">
                      ₺{entry.avmExpense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={`px-4 py-5 text-right font-mono text-sm font-black ${entry.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₺{entry.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8px] font-black italic opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-between gap-1"><span>OK:</span><span className="text-white">₺{entry.okanShare.toLocaleString('tr-TR', {maximumFractionDigits:0})}</span></div>
                        <div className="flex justify-between gap-1"><span>TL:</span><span className="text-white">₺{entry.talhaShare.toLocaleString('tr-TR', {maximumFractionDigits:0})}</span></div>
                        <div className="flex justify-between gap-1"><span>FK:</span><span className="text-white">₺{entry.furkanShare.toLocaleString('tr-TR', {maximumFractionDigits:0})}</span></div>
                        <div className="flex justify-between gap-1"><span>AL:</span><span className="text-emerald-500">₺{entry.alpShare.toLocaleString('tr-TR', {maximumFractionDigits:0})}</span></div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Toplamlar */}
          <div className="p-6 border-t border-white/10 bg-white/[0.02] flex flex-wrap gap-8 justify-end">
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Toplam Ciro</span>
              <span className="text-xl font-black text-white">₺{totalGross.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Toplam Net</span>
              <span className={`text-xl font-black ${totalNetCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₺{totalNetCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Diğer Giderler Listesi */}
      {filteredExpenses.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-rose-500 px-4 py-2">Operasyonel Giderler</h2>
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] font-black text-zinc-500 uppercase">{filteredExpenses.length} kayıt</span>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Gider</th>
                    <th className="px-4 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Kategori</th>
                    <th className="px-4 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Tip</th>
                    <th className="px-4 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-center">Resmi</th>
                    <th className="px-4 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredExpenses.map(exp => {
                    const catInfo = EXPENSE_CATEGORIES[exp.category || 'other'] || EXPENSE_CATEGORIES.other;
                    return (
                      <tr key={exp.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-white">{exp.description}</td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-black uppercase ${catInfo.color}`}>{catInfo.label}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-400 uppercase">{exp.type}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-black ${exp.isOfficial ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            {exp.isOfficial ? 'EVET' : 'HAYIR'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm font-black text-white">
                          ₺{(exp.amountWithVat || 0).toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
