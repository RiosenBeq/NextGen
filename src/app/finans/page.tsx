import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow, calculateYearlyNetProfit, CalculationResult } from '@/features/ledger/calculations';
import { getLocationInsights, getSystemParameters } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import { TrendingUp, TrendingDown, Target, Calculator, BarChart3, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const metadata = {
  title: 'Finansal Tablo - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function FinansalTablo() {
  const supabase = await createClient();
  const params = await getSystemParameters();

  const { data: locations } = await supabase
    .from('Location')
    .select('*')
    .eq('isActive', true);

  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: true });

  const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;
  const kdvRate = params['VAT_RATE'] || 20;

  // AVM bazlı hesaplamalar
  const avmSummaries: Record<string, {
    name: string;
    totalSessions: number;
    totalGrossRevenue: number;
    totalCommission: number;
    totalRevenueShare: number;
    totalAvmExpense: number;
    totalNetCash: number;
    monthlyResults: CalculationResult[];
    fixedRent: number;
    duesAmount: number;
    rentKdv: number;
  }> = {};

  if (performances && locations) {
    for (const perf of performances) {
      const loc = perf.location;
      if (!loc) continue;

      const calc = calculateMonthlyCashFlow(
        perf.sessionCount,
        perf.extraExpenseAmount || 0,
        {
          sessionPrice,
          kdvRate,
          iyzicoCommissionRate: 2,
          nayaxCommissionRate: 2,
          fixedRent: loc.fixedRent,
          duesAmount: loc.duesAmount,
          rentKdvRate: loc.rentVatRate,
          revenueShareRate: loc.revenueShareRate || 15,
          revenueThreshold: loc.revenueThreshold || 0,
          applyRentVat: true,
        }
      );

      if (!avmSummaries[loc.id]) {
        avmSummaries[loc.id] = {
          name: loc.name,
          totalSessions: 0,
          totalGrossRevenue: 0,
          totalCommission: 0,
          totalRevenueShare: 0,
          totalAvmExpense: 0,
          totalNetCash: 0,
          monthlyResults: [],
          fixedRent: loc.fixedRent,
          duesAmount: loc.duesAmount,
          rentKdv: loc.fixedRent * (loc.rentVatRate / 100),
        };
      }

      avmSummaries[loc.id].totalSessions += perf.sessionCount;
      avmSummaries[loc.id].totalGrossRevenue += calc.grossRevenue;
      avmSummaries[loc.id].totalCommission += calc.totalCommission;
      avmSummaries[loc.id].totalRevenueShare += calc.revenueShare;
      avmSummaries[loc.id].totalAvmExpense += calc.totalAvmExpense;
      avmSummaries[loc.id].totalNetCash += calc.netCash;
      avmSummaries[loc.id].monthlyResults.push(calc);
    }
  }

  const allResults = Object.values(avmSummaries).flatMap(a => a.monthlyResults);
  const yearlyCalc = calculateYearlyNetProfit(allResults, params['CORP_TAX_RATE'] || 22);

  // Genel toplamlar
  const totalGross = Object.values(avmSummaries).reduce((s, a) => s + a.totalGrossRevenue, 0);
  const totalSessions = Object.values(avmSummaries).reduce((s, a) => s + a.totalSessions, 0);
  const totalCommission = Object.values(avmSummaries).reduce((s, a) => s + a.totalCommission, 0);
  const totalRevenueShare = Object.values(avmSummaries).reduce((s, a) => s + a.totalRevenueShare, 0);
  const totalAvmExpense = Object.values(avmSummaries).reduce((s, a) => s + a.totalAvmExpense, 0);
  const totalNetCash = Object.values(avmSummaries).reduce((s, a) => s + a.totalNetCash, 0);

  // Toplam aylık sabit gider
  const monthlyFixedTotal = (locations || []).reduce((s, loc) => {
    return s + loc.fixedRent + loc.duesAmount + (loc.fixedRent * (loc.rentVatRate / 100));
  }, 0);

  // Net gelir / oturum (Excel: 240 TL)
  const netRevenuePerSession = sessionPrice / (1 + kdvRate / 100) * (1 - 4 / 100);
  const breakEvenTotal = netRevenuePerSession > 0 ? Math.ceil(monthlyFixedTotal / netRevenuePerSession) : 0;
  const breakEvenPerAvm = (locations || []).length > 0 ? Math.ceil(breakEvenTotal / (locations || []).length) : 0;

  // Senaryo tablosu
  const scenarios = [200, 300, 370, 400, 500, 600, 700, 800, 1000, 1500].map(sessions => {
    const perAvm = sessions / ((locations || []).length || 1);
    const monthlyNetRevenue = sessions * netRevenuePerSession;
    const monthlyProfit = monthlyNetRevenue - monthlyFixedTotal;
    const yearlyProfit = monthlyProfit * 12;
    const yearlyTax = yearlyProfit > 0 ? yearlyProfit * 0.22 : 0;
    const yearlyNet = yearlyProfit - yearlyTax;
    return {
      sessions,
      perAvm: Math.round(perAvm),
      monthlyNet: monthlyNetRevenue,
      monthlyProfit,
      yearlyProfit,
      yearlyTax,
      yearlyNet,
      perPartner: yearlyNet / 4,
      monthlyPerPartner: (yearlyNet / 4) / 12,
    };
  });

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest">Financial Intelligence</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter heading-elite leading-[0.9]">
            Finansal<br/>Durum Raporu
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-md">
            Excel tablosu ile birebir eşleşen, iyzico %2 + Nayax %2 komisyon, AVM %15 ciro payı dahil tüm hesaplamalar.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="premium-card px-6 py-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Oturum Fiyatı</p>
            <p className="text-xl font-black text-white">₺{sessionPrice}</p>
            <p className="text-[9px] text-zinc-600">(KDV Dahil)</p>
          </div>
          <div className="premium-card px-6 py-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Net / Oturum</p>
            <p className="text-xl font-black text-emerald-400">₺{Math.round(netRevenuePerSession)}</p>
            <p className="text-[9px] text-zinc-600">(KDV+Kom. düşük)</p>
          </div>
          <div className="premium-card px-6 py-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Başabaş</p>
            <p className="text-xl font-black text-indigo-400">{breakEvenTotal} <span className="text-sm">oturum/ay</span></p>
            <p className="text-[9px] text-zinc-600">AVM başına: {breakEvenPerAvm}</p>
          </div>
        </div>
      </header>

      {/* KPI'lar */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "TOPLAM CİRO", value: `₺${totalGross.toLocaleString('tr-TR')}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "KOMİSYONLAR (%4)", value: `₺${totalCommission.toLocaleString('tr-TR')}`, icon: Percent, color: "text-rose-400", bg: "bg-rose-500/10", sub: `iyzico: ₺${(totalCommission/2).toLocaleString('tr-TR')} + Nayax: ₺${(totalCommission/2).toLocaleString('tr-TR')}` },
          { label: "AVM GİDERLERİ", value: `₺${totalAvmExpense.toLocaleString('tr-TR')}`, icon: TrendingDown, color: "text-amber-400", bg: "bg-amber-500/10", sub: `Ciro payı: ₺${totalRevenueShare.toLocaleString('tr-TR')}` },
          { label: "NET NAKİT", value: `₺${totalNetCash.toLocaleString('tr-TR')}`, icon: BarChart3, color: totalNetCash >= 0 ? "text-emerald-400" : "text-rose-400", bg: totalNetCash >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="premium-card p-8 relative overflow-hidden group"
          >
            <div className={`absolute -right-6 -top-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity`}>
              <kpi.icon size={120} />
            </div>
            <div className={`w-10 h-10 rounded-2xl ${kpi.bg} flex items-center justify-center mb-6`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
            <h2 className="text-3xl font-black tracking-tighter text-white">{kpi.value}</h2>
            {kpi.sub && <p className="text-[9px] font-bold text-zinc-600 mt-2">{kpi.sub}</p>}
          </motion.div>
        ))}
      </section>

      {/* AVM Bazlı Detaylar */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-indigo-500 px-6 py-2">AVM Bazlı Sabit Giderler</h2>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.values(avmSummaries).length > 0 ? Object.values(avmSummaries).map((avm) => (
            <motion.div
              key={avm.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-8"
            >
              <h3 className="text-lg font-black text-white mb-6 tracking-tight uppercase">{avm.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400">Kira</span>
                  <span className="font-black text-white">₺{avm.fixedRent.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400">Kira KDV (%20)</span>
                  <span className="font-black text-white">₺{avm.rentKdv.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400">Aidat</span>
                  <span className="font-black text-white">₺{avm.duesAmount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400">Ciro Payı (%15 eşik üstü)</span>
                  <span className="font-black text-amber-400">₺{avm.totalRevenueShare.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-4 mt-2 border-t-2 border-dashed border-white/10">
                  <span className="text-sm font-black text-white">AYLIK SABİT TOPLAM</span>
                  <span className="text-lg font-black text-indigo-400">₺{(avm.fixedRent + avm.duesAmount + avm.rentKdv).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </motion.div>
          )) : (locations || []).map((loc) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-8"
            >
              <h3 className="text-lg font-black text-white mb-6 tracking-tight uppercase">{loc.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400">Kira</span>
                  <span className="font-black text-white">₺{loc.fixedRent.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400">Kira KDV (%{loc.rentVatRate})</span>
                  <span className="font-black text-white">₺{(loc.fixedRent * loc.rentVatRate / 100).toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400">Aidat</span>
                  <span className="font-black text-white">₺{loc.duesAmount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-4 mt-2 border-t-2 border-dashed border-white/10">
                  <span className="text-sm font-black text-white">AYLIK SABİT</span>
                  <span className="text-lg font-black text-indigo-400">₺{(loc.fixedRent + loc.duesAmount + loc.fixedRent * loc.rentVatRate / 100).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="premium-card p-6 bg-zinc-950 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-black text-white uppercase tracking-wider">2 AVM TOPLAM AYLIK SABİT</span>
          <span className="text-2xl font-black text-white">₺{monthlyFixedTotal.toLocaleString('tr-TR')}</span>
        </div>
      </section>

      {/* Yıllık Vergi & Net Kâr */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-emerald-500 px-6 py-2">Yıllık Vergi & Net Kâr</h2>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="premium-card p-8">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Yıllık Brüt Kâr</p>
            <p className={`text-3xl font-black ${yearlyCalc.yearlyGrossProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
              ₺{yearlyCalc.yearlyGrossProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="premium-card p-8">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Kurumlar Vergisi (%22)</p>
            <p className="text-3xl font-black text-amber-400">
              ₺{yearlyCalc.corpTax.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[9px] text-zinc-600 mt-1">{yearlyCalc.corpTax === 0 ? 'Zarar: vergi yok' : 'Kâr × %22'}</p>
          </div>
          <div className="premium-card p-8">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">NET KÂR (Vergi Sonrası)</p>
            <p className={`text-3xl font-black ${yearlyCalc.yearlyNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₺{yearlyCalc.yearlyNetProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="premium-card p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/10">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Ortak Başına (Yıllık)</p>
            <p className={`text-3xl font-black ${yearlyCalc.perPartner >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              ₺{yearlyCalc.perPartner.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[9px] text-zinc-600 mt-1">4 ortak × %25</p>
          </div>
        </div>
      </section>

      {/* Senaryo Tablosu */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-amber-500 px-6 py-2">Senaryo Analizi</h2>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        <div className="premium-card overflow-hidden bg-zinc-950">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Aylık oturum sayısına göre: gelir, gider, yıllık kâr/zarar — Kurumlar Vergisi %22 dahil.
              Komisyonlar: iyzico %2 + Nayax %2 = %4 brüt cirodan. AVM %15 ciro payı eşik üstü.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Aylık Oturum</th>
                  <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-center">AVM Başına</th>
                  <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right">Aylık Net Gelir</th>
                  <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right">Aylık Kâr/Zarar</th>
                  <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right">Yıllık Kâr/Zarar</th>
                  <th className="px-4 py-5 text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-white/5 text-right">Kurumlar Vergisi</th>
                  <th className="px-4 py-5 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 text-right">Yıllık Net Kâr</th>
                  <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 text-right">Aylık/Kişi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {scenarios.map((s) => {
                  const isBreakEven = Math.abs(s.sessions - breakEvenTotal) < 20;
                  return (
                    <tr key={s.sessions} className={`group hover:bg-white/[0.03] transition-colors ${isBreakEven ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''}`}>
                      <td className="px-6 py-5 font-black text-white">{s.sessions}</td>
                      <td className="px-4 py-5 text-center text-zinc-400 text-sm">{s.perAvm}</td>
                      <td className="px-4 py-5 text-right font-mono text-sm text-zinc-300">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                      <td className={`px-4 py-5 text-right font-mono text-sm font-bold ${s.monthlyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-5 text-right font-mono text-sm font-bold ${s.yearlyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₺{s.yearlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-5 text-right font-mono text-sm text-amber-400">
                        ₺{s.yearlyTax.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-5 text-right font-mono text-sm font-black ${s.yearlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₺{s.yearlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-6 py-5 text-right font-mono text-sm font-black ${s.monthlyPerPartner >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        ₺{s.monthlyPerPartner.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex flex-wrap gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Başabaş: <strong className="text-amber-400">{breakEvenTotal} oturum/ay</strong></span>
            <span>AVM başına: <strong className="text-amber-400">{breakEvenPerAvm} oturum/ay</strong></span>
            <span>Günlük (AVM): <strong className="text-amber-400">~{Math.ceil(breakEvenPerAvm / 30)} oturum/gün</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
}
