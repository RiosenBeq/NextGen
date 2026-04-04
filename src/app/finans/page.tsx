"use client";

import { useEffect, useState } from 'react';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import { 
  TrendingUp, TrendingDown, BarChart3, Percent, 
  Zap, CreditCard, Calendar, Target, RefreshCw
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/lib/utils';

export default function FinansalTablo() {
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<{
    locations: any[];
    avmSummaries: any;
    totals: any;
    scenarios: any[];
    params: any;
    breakEven: any;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-kabin');
      const result = await res.json();
      if (result.success) window.location.reload();
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const params = await getSystemParameters();
      const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;

      const { data: locations } = await supabase.from('Location').select('*').eq('isActive', true);
      const { data: performances } = await supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: true });

      const avmSummaries: Record<string, any> = {};
      if (performances && locations) {
        for (const perf of performances) {
          const loc = perf.location;
          if (!loc) continue;

          const perfMonthStr = new Date(perf.month).toISOString().slice(0, 7);
          if (filterMonth && perfMonthStr !== filterMonth) continue;

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
              totalIyzico: 0, totalNayax: 0,
            };
          }

          avmSummaries[loc.id].totalSessions += perf.sessionCount;
          avmSummaries[loc.id].totalGrossRevenue += calc.grossRevenue;
          avmSummaries[loc.id].totalCommission += calc.totalCommission;
          avmSummaries[loc.id].totalIyzico += calc.iyzicoCommission;
          avmSummaries[loc.id].totalNayax += calc.nayaxCommission;
          avmSummaries[loc.id].totalRevenueShare += calc.revenueShare;
          avmSummaries[loc.id].totalAvmExpense += calc.totalAvmExpense;
          avmSummaries[loc.id].totalNetCash += calc.netCash;
        }
      }

      const totalGross = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalGrossRevenue, 0);
      const totalSessions = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalSessions, 0);
      const totalIyzico = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalIyzico, 0);
      const totalNayax = Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalNayax, 0);

      const monthlyFixedTotal = (locations || []).reduce((s, loc) => s + (loc.fixedRent * 1.20) + loc.duesAmount, 0);
      const netRevenuePerSession = sessionPrice * 0.96; 
      const breakEvenTotal = netRevenuePerSession > 0 ? Math.ceil(monthlyFixedTotal / netRevenuePerSession) : 0;

      const scenarios = [200, 370, 500, 750, 1000, 1500].map(sessions => {
        const mockCalc = calculateMonthlyCashFlow(sessions, 0, {
          sessionPrice, iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
          fixedRent: (locations?.[0]?.fixedRent || 40000), 
          duesAmount: (locations?.[0]?.duesAmount || 6000),
          revenueShareRate: 15
        });
        return {
          sessions,
          monthlyNet: sessions * netRevenuePerSession,
          monthlyProfit: mockCalc.netCash,
          yearlyProfit: mockCalc.netCash * 12,
          monthlyPerPartner: mockCalc.okanShare,
        };
      });

      setData({
        locations: locations || [],
        avmSummaries,
        totals: {
          gross: totalGross,
          sessions: totalSessions,
          net: Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalNetCash, 0),
          commission: Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalCommission, 0),
          iyzico: totalIyzico,
          nayax: totalNayax,
          avmExpense: Object.values(avmSummaries).reduce((s: number, a: any) => s + a.totalAvmExpense, 0),
        },
        scenarios,
        params: { sessionPrice, netRevenuePerSession },
        breakEven: { total: breakEvenTotal, perAvm: Math.ceil(breakEvenTotal / (locations?.length || 1)) },
      });
    }
    fetchData();
  }, [filterMonth]);

  if (!data) return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
        <span className="text-sm text-slate-500">Veriler yükleniyor...</span>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
              Tahmini Verimlilik
            </span>
            <span className="live-dot text-[9px]">Senkronize</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Target className="w-6 h-6 text-slate-400" />
            Finansal Analiz
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Karlılık senaryoları, başabaş noktası analizleri ve lokasyon bazlı sabit gider dökümü.
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Calendar className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-blue-500" />
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="elite-input pl-9 w-44 text-xs cursor-pointer"
            />
          </div>
          <div className="premium-card px-4 py-2.5 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bilet Fiyatı</span>
            <span className="text-sm font-bold text-slate-900">₺{data.params.sessionPrice}</span>
          </div>
          <button 
            onClick={triggerSync}
            disabled={isSyncing}
            className="elite-button-secondary flex items-center gap-2 text-xs"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            Senkronize Et
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Toplam Ciro", value: data.totals.gross, icon: TrendingUp, cardClass: "stat-card-green", iconColor: "text-emerald-600", iconBg: "bg-emerald-100 border-emerald-200" },
          { label: "iyzico (%2)", value: data.totals.iyzico, icon: Percent, cardClass: "stat-card-red", iconColor: "text-red-600", iconBg: "bg-red-100 border-red-200" },
          { label: "Nayax (%2)", value: data.totals.nayax, icon: CreditCard, cardClass: "stat-card-blue", iconColor: "text-blue-600", iconBg: "bg-blue-100 border-blue-200" },
          { label: "AVM Gideri", value: data.totals.avmExpense, icon: TrendingDown, cardClass: "stat-card-amber", iconColor: "text-amber-600", iconBg: "bg-amber-100 border-amber-200" },
          { label: "Reel Kazanç", value: data.totals.net, icon: BarChart3, cardClass: data.totals.net >= 0 ? "stat-card-green" : "stat-card-red", iconColor: data.totals.net >= 0 ? "text-emerald-600" : "text-red-600", iconBg: data.totals.net >= 0 ? "bg-emerald-100 border-emerald-200" : "bg-red-100 border-red-200" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn("premium-card p-5 border", kpi.cardClass)}
          >
            <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center mb-3", kpi.iconBg)}>
              <kpi.icon className={cn("w-4 h-4", kpi.iconColor)} />
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
            <h2 className="text-lg font-bold text-slate-900">₺{kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
          </motion.div>
        ))}
      </section>

      {/* Fixed Expenses per AVM */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Lokasyon Bazlı Sabit Giderler</h2>
          <div className="flex-1 section-divider" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data.locations.map((loc) => (
            <motion.div key={loc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-card p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-blue-500" />
                 {loc.name}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs font-medium text-slate-500">Kira (+%20 KDV)</span>
                  <span className="font-semibold text-slate-900">₺{(loc.fixedRent * 1.20).toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs font-medium text-slate-500">Aidat</span>
                  <span className="font-semibold text-slate-900">₺{loc.duesAmount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Aylık Toplam</span>
                  <span className="text-lg font-bold text-slate-900">₺{((loc.fixedRent * 1.20) + loc.duesAmount).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Scenario Table */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Senaryo Analizi & Projeksiyon</h2>
          <div className="flex-1 section-divider" />
        </div>

        <div className="premium-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 leading-relaxed">
              Tüm resmi vergiler hariç reel nakit tablosu. Başabaş noktası: <strong className="text-amber-600">{data.breakEven.total} oturum/ay</strong>.
              AVM başına günlük <strong className="text-blue-600">~{Math.ceil(data.breakEven.perAvm / 30)} seans</strong> gereklidir.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aylık Oturum</th>
                  <th className="text-center">AVM Başına</th>
                  <th className="text-right">Aylık Net Gelir</th>
                  <th className="text-right">Aylık Kâr/Zarar</th>
                  <th className="text-right">Kişi Başı / Ay</th>
                </tr>
              </thead>
              <tbody>
                {data.scenarios.map((s: any) => {
                  const isBreakEven = Math.abs(s.sessions - data.breakEven.total) < 30;
                  return (
                    <tr key={s.sessions} className={cn(isBreakEven && "bg-amber-50")}>
                      <td className="font-semibold text-slate-900">{s.sessions}</td>
                      <td className="text-center text-slate-500 font-medium">{Math.round(s.sessions / data.locations.length)}</td>
                      <td className="text-right font-medium text-slate-700">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                      <td className={cn("text-right font-bold", s.monthlyProfit >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                        ₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={cn("text-right font-bold", s.monthlyPerPartner >= 0 ? 'text-blue-700' : 'text-red-600')}>
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

      {/* FAQ Section */}
      <section className="space-y-4 pb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Parametre Bilgi Merkezi</h2>
          <div className="flex-1 section-divider" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
             { q: "Sistem cirosu nasıl hesaplanır?", a: "Seans başına brüt ücret (şu an ₺300) üzerinden KDV düşülmeden hesaplanır. KabinRapor senkronizasyonu her 5 dakikada bir güncellenir." },
             { q: "Kesintiler (iyzico/Nayax) nedir?", a: "Pos ve ödeme sistemleri komisyonlarıdır. iyzico %2 anlık olarak banka hesabından düşerken, Nayax %2 aylık olarak ayrıca fatura edilir." },
             { q: "AVM kira ve ciro payı modeli nedir?", a: "Sözleşmeli kira tutarı (Ham Kira + %20 KDV) ve aidata ek olarak, cironun belirli bir yüzdesini aşarsa 'Ciro Payı' devreye girer." },
             { q: "Bütün giderlere KDV dahil mi?", a: "Evet, bu tablodaki tüm giderler (Kira, Aidat, Komisyon ve Ek Masraflar) KDV dahil reel ödeme tutarlarını yansıtır." },
           ].map((item, idx) => (
             <div key={idx} className="premium-card p-5 hover:shadow-md transition-all group">
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">Q</span>
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.q}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
