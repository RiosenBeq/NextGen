"use client";

import { use, useEffect, useState } from 'react';
import { calculateMonthlyCashFlow, CalculationResult } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import { TrendingUp, TrendingDown, Target, Calculator, BarChart3, Percent, ArrowUpRight, ArrowDownRight, Zap, Target as TargetIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/lib/utils';

export default function FinansalTablo() {
  const [data, setData] = useState<{
    locations: any[];
    avmSummaries: any;
    totals: any;
    scenarios: any[];
    params: any;
    breakEven: any;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const params = await getSystemParameters();
      const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;
      const kdvRate = params['VAT_RATE'] || 20;

      const { data: locations } = await supabase.from('Location').select('*').eq('isActive', true);
      const { data: performances } = await supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: true });

      const avmSummaries: Record<string, any> = {};
      if (performances && locations) {
        for (const perf of performances) {
          const loc = perf.location;
          if (!loc) continue;

          const calc = calculateMonthlyCashFlow(perf.sessionCount, perf.extraExpenseAmount || 0, {
            sessionPrice, iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
            fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
            revenueShareRate: loc.revenueShareRate || 15,
          });

          if (!avmSummaries[loc.id]) {
            avmSummaries[loc.id] = {
              name: loc.name, totalSessions: 0, totalGrossRevenue: 0,
              totalCommission: 0, totalRevenueShare: 0, totalAvmExpense: 0,
              totalNetCash: 0, fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
            };
          }

          avmSummaries[loc.id].totalSessions += perf.sessionCount;
          avmSummaries[loc.id].totalGrossRevenue += calc.grossRevenue;
          avmSummaries[loc.id].totalCommission += calc.totalCommission;
          avmSummaries[loc.id].totalRevenueShare += calc.revenueShare;
          avmSummaries[loc.id].totalAvmExpense += calc.totalAvmExpense;
          avmSummaries[loc.id].totalNetCash += calc.netCash;
        }
      }

      const totalGross = Object.values(avmSummaries).reduce((s: any, a: any) => s + a.totalGrossRevenue, 0);
      const totalNetCash = Object.values(avmSummaries).reduce((s: any, a: any) => s + a.totalNetCash, 0);
      const monthlyFixedTotal = (locations || []).reduce((s, loc) => s + loc.fixedRent + loc.duesAmount, 0);
      const netRevenuePerSession = sessionPrice / (1 + kdvRate / 100) * (1 - 4 / 100);
      const breakEvenTotal = netRevenuePerSession > 0 ? Math.ceil(monthlyFixedTotal / netRevenuePerSession) : 0;

      const scenarios = [200, 370, 500, 750, 1000, 1500].map(sessions => {
        const monthlyNetRevenue = sessions * netRevenuePerSession;
        const monthlyProfit = monthlyNetRevenue - monthlyFixedTotal;
        return {
          sessions,
          monthlyNet: monthlyNetRevenue,
          monthlyProfit,
          yearlyProfit: monthlyProfit * 12,
          monthlyPerPartner: (monthlyProfit) / 4,
        };
      });

      setData({
        locations: locations || [],
        avmSummaries,
        totals: {
          gross: totalGross,
          net: totalNetCash,
          commission: Object.values(avmSummaries).reduce((s: any, a: any) => s + a.totalCommission, 0),
          avmExpense: Object.values(avmSummaries).reduce((s: any, a: any) => s + a.totalAvmExpense, 0),
        },
        scenarios,
        params: { sessionPrice, netRevenuePerSession },
        breakEven: { total: breakEvenTotal, perAvm: Math.ceil(breakEvenTotal / (locations?.length || 1)) }
      });
    }
    fetchData();
  }, []);

  if (!data) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10">Projected Yield</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <TargetIcon className="w-8 h-8 text-zinc-500" />
             Finansal Analiz
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Karlılık senaryoları, başabaş noktası analizleri ve lokasyon bazlı sabit gider dökümü.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="premium-card px-6 py-4 bg-white/[0.02]">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Bilet Fiyatı</p>
            <p className="text-xl font-bold text-white italic">₺{data.params.sessionPrice}</p>
          </div>
          <div className="premium-card px-6 py-4 bg-emerald-500/[0.02]">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Net / Oturum</p>
            <p className="text-xl font-bold text-emerald-400 italic">₺{Math.round(data.params.netRevenuePerSession)}</p>
          </div>
        </div>
      </header>

      {/* KPI Overlays */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "TOPLAM CİRO", value: data.totals.gross, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "KOMİSYONLAR (%4)", value: data.totals.commission, icon: Percent, color: "text-rose-400", bg: "bg-rose-500/10" },
          { label: "AVM GİDERLERİ", value: data.totals.avmExpense, icon: TrendingDown, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "REEL KAZANÇ", value: data.totals.net, icon: BarChart3, color: data.totals.net >= 0 ? "text-indigo-400" : "text-rose-400", bg: data.totals.net >= 0 ? "bg-indigo-500/10" : "bg-rose-500/10" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="premium-card p-8 group relative overflow-hidden"
          >
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
               <kpi.icon size={80} />
            </div>
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-6`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h2 className="text-2xl font-bold tracking-tight text-white italic">₺{kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
          </motion.div>
        ))}
      </section>

      {/* Fixed Expenses per AVM */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Lokasyon Bazlı Sabit Giderler</h2>
          <div className="flex-1 h-[1px] bg-white/[0.04]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.locations.map((loc) => (
            <motion.div key={loc.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-8 bg-zinc-950/50">
              <h3 className="text-sm font-bold text-zinc-200 mb-8 uppercase tracking-widest flex items-center gap-2">
                 <Zap className="w-4 h-4 text-indigo-500" />
                 {loc.name}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Kira</span>
                  <span className="font-bold text-white">₺{loc.fixedRent.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Aidat</span>
                  <span className="font-bold text-white">₺{loc.duesAmount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Aylık Sabit Toplam</span>
                  <span className="text-xl font-bold text-white italic">₺{(loc.fixedRent + loc.duesAmount).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Scenario Table */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight italic">Senaryo Analizi & Projeksiyon</h2>
          <div className="flex-1 h-[1px] bg-white/[0.04]" />
        </div>

        <div className="premium-card overflow-hidden">
          <div className="p-6 border-b border-white/[0.04] bg-white/[0.01]">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">
              Tüm resmi vergiler hariç Reel Nakit Tablosu. Başabaş noktası: <span className="text-amber-500 font-bold">{data.breakEven.total} oturum/ay</span>.
              AVM başına günlük <span className="text-indigo-400 font-bold">~{Math.ceil(data.breakEven.perAvm / 30)} seans</span> gereklidir.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04]">Aylık Oturum</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-center">AVM Başına</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">Aylık Net Gelir</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.04] text-right">Aylık Kâr/Zarar</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/[0.04] text-right">Kişi Başı / Ay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {data.scenarios.map((s: any) => {
                  const isBreakEven = Math.abs(s.sessions - data.breakEven.total) < 30;
                  return (
                    <tr key={s.sessions} className={cn("group hover:bg-white/[0.01] transition-colors", isBreakEven && "bg-amber-500/[0.02] border-l border-amber-500")}>
                      <td className="px-6 py-5 font-bold text-zinc-200">{s.sessions}</td>
                      <td className="px-4 py-5 text-center text-zinc-500 text-xs font-bold">{Math.round(s.sessions/data.locations.length)}</td>
                      <td className="px-4 py-5 text-right font-medium text-zinc-400 text-sm">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                      <td className={cn("px-4 py-5 text-right font-bold text-sm", s.monthlyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                        ₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={cn("px-6 py-5 text-right font-bold text-sm italic", s.monthlyPerPartner >= 0 ? 'text-indigo-400' : 'text-rose-400')}>
                        ₺{s.monthlyPerPartner.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

