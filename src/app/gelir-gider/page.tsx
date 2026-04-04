"use client";

import { use, useEffect, useState } from 'react';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { getSystemParameters } from '@/features/ledger/actions';
import { kabinRapor } from '@/lib/kabinRapor';
import * as motion from "framer-motion/client";
import { 
  TrendingUp, TrendingDown, Wallet, BarChart3, 
  Calendar, MapPin, CreditCard, Percent,
  ListFilter, ArrowRight, PiggyBank, Filter
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

const EXPENSE_CATEGORIES: Record<string, { label: string; color: string; dot: string }> = {
  rent:        { label: 'Kira',         color: 'metric-pill-red',   dot: 'bg-red-500' },
  utilities:   { label: 'Faturalar',    color: 'metric-pill-blue',  dot: 'bg-blue-500' },
  maintenance: { label: 'Bakım/Onarım', color: 'metric-pill-green', dot: 'bg-amber-500' },
  marketing:   { label: 'Pazarlama',    color: 'metric-pill-blue',  dot: 'bg-purple-500' },
  equipment:   { label: 'Ekipman',      color: 'metric-pill-blue',  dot: 'bg-pink-500' },
  operational: { label: 'Operasyonel',  color: 'metric-pill-green', dot: 'bg-emerald-500' },
  other:       { label: 'Diğer',        color: 'metric-pill-blue',  dot: 'bg-slate-400' },
};

export default function GelirGiderPage(props: {
  searchParams: Promise<{ month?: string; location?: string; category?: string }>
}) {
  const searchParams = use(props.searchParams);
  const filterMonth    = searchParams.month    || '';
  const filterLocation = searchParams.location || 'all';
  const filterCategory = searchParams.category || 'all';

  const [data, setData] = useState<{
    locations: any[];
    monthlyEntries: any[];
    filteredExpenses: any[];
    totals: any;
    categoryTotals: Record<string, number>;
    uniqueMonths: string[];
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const params = await getSystemParameters();
      const sessionPrice = params['SESSION_PRICE_INCL_VAT'] || 300;

      const { data: locations }    = await supabase.from('Location').select('*').eq('isActive', true);
      const { data: performances } = await supabase.from('MonthlyPerformance').select('*, location:Location(*)').order('month', { ascending: false });
      const { data: expenses }     = await supabase.from('Expense').select('*, location:Location(*)').order('createdAt', { ascending: false });
      
      let liveData: any = null;
      let allTimeData: any = null;
      try {
        liveData = await kabinRapor.getComprehensiveData((filterMonth || 'Bu Ay') as any);
        if (!filterMonth) {
          allTimeData = await kabinRapor.getComprehensiveData('Tüm Zamanlar');
        }
      } catch (e) {
        console.error("Live Sync Error:", e);
      }

      const monthlyEntries: any[] = [];
      const currentMonthId = new Date().toISOString().slice(0, 7);
      const targetMonthId = filterMonth || currentMonthId;
      
      // Parse dates explicitly to avoid timezone offset pushing March 1st back to Feb 28th
      const formatMonthSafe = (isoStringOrMonthId: string) => {
        let y, m;
        if (isoStringOrMonthId.includes('T')) {
          [y, m] = isoStringOrMonthId.split('T')[0].split('-');
        } else {
          [y, m] = isoStringOrMonthId.split('-');
        }
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        return d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
      };

      if (performances) {
        for (const perf of performances) {
          const loc = perf.location;
          if (!loc) continue;

          const [y, m] = perf.month.split('T')[0].split('-');
          const perfMonthStr = `${y}-${m}`;
          
          const calc = calculateMonthlyCashFlow(perf.sessionCount, perf.extraExpenseAmount || 0, {
            sessionPrice,
            iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
            fixedRent: loc.fixedRent, duesAmount: loc.duesAmount,
            revenueShareRate: loc.revenueShareRate || 15,
          });

          monthlyEntries.push({
            monthId: perfMonthStr,
            month: formatMonthSafe(perfMonthStr),
            locationName: loc.name,
            locationId: loc.id,
            sessions: perf.sessionCount,
            grossRevenue: calc.grossRevenue,
            totalExpense: calc.totalExpense,
            netCash: calc.netCash,
            totalCommission: calc.totalCommission,
            revenueShare: calc.revenueShare,
            avmExpense: calc.totalAvmExpense,
            isLive: false
          });
        }
      }

      // Live Data overrides or prepends current month
      if (liveData?.citySplit?.cities) {
        const cities = liveData.citySplit.cities;
        
        for (const [cityName, cityData] of Object.entries(cities) as any) {
           const matchingLoc = (locations || []).find(l => l.name.toLowerCase().includes(cityName.toLowerCase()));
           if (!matchingLoc) continue;

           const liveSessions = cityData.sessions;
           const calc = calculateMonthlyCashFlow(liveSessions, 0, {
             sessionPrice,
             iyzicoCommissionRate: 2, nayaxCommissionRate: 2,
             fixedRent: matchingLoc.fixedRent, duesAmount: matchingLoc.duesAmount,
             revenueShareRate: matchingLoc.revenueShareRate || 15,
           });

           const liveEntry = {
             monthId: targetMonthId,
             month: filterMonth ? formatMonthSafe(filterMonth) : formatMonthSafe(currentMonthId),
             locationName: matchingLoc.name,
             locationId: matchingLoc.id,
             sessions: liveSessions,
             grossRevenue: calc.grossRevenue,
             totalExpense: calc.totalExpense,
             netCash: calc.netCash,
             totalCommission: calc.totalCommission,
             revenueShare: calc.revenueShare,
             avmExpense: calc.totalAvmExpense,
             isLive: true
           };

           const existingIndex = monthlyEntries.findIndex(e => e.monthId === targetMonthId && e.locationId === matchingLoc.id);
           if (existingIndex > -1) {
             monthlyEntries[existingIndex] = liveEntry;
           } else {
             monthlyEntries.unshift(liveEntry);
           }
        }
      }

      const filteredMonthlyEntries = monthlyEntries.filter(entry => {
        if (filterMonth && entry.monthId !== filterMonth) return false;
        if (filterLocation !== 'all' && entry.locationId !== filterLocation) return false;
        return true;
      });

      const filteredExpenses = (expenses || []).filter(exp => {
        if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
        if (filterMonth && exp.month && exp.month !== filterMonth) return false;
        if (filterLocation !== 'all' && exp.locationId !== filterLocation) return false;
        return true;
      });

      const categoryTotals: Record<string, number> = {};
      for (const exp of filteredExpenses) {
        const cat = exp.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (exp.amountWithVat || 0);
      }

      const manualGross = filteredMonthlyEntries.reduce((s, e) => s + e.grossRevenue, 0);
      const manualSessions = filteredMonthlyEntries.reduce((s, e) => s + e.sessions, 0);
      
      const trueGross = (!filterMonth && allTimeData?.dashboardTotals) 
        ? allTimeData.dashboardTotals.total_revenue 
        : manualGross;

      const trueSessions = (!filterMonth && allTimeData?.dashboardTotals) 
        ? allTimeData.dashboardTotals.total_paid_sessions 
        : manualSessions;

      // Base commission is always ~4%. If we use true API revenue, re-estimate the commission.
      const trueCommission = (!filterMonth && allTimeData?.dashboardTotals)
        ? trueGross * 0.04
        : filteredMonthlyEntries.reduce((s, e) => s + e.totalCommission, 0);

      // Rent and AVM fees are manually typed, they cannot be fetched from Kabin Rapor
      const avmExpenseAndRevShare = filteredMonthlyEntries.reduce((s, e) => s + e.avmExpense + e.revenueShare, 0);
      
      const userExpenses = filteredExpenses.reduce((s, e) => s + (e.amountWithVat || 0), 0);
      const calculatedTotalExpense = trueCommission + avmExpenseAndRevShare + userExpenses;

      setData({
        locations: locations || [],
        monthlyEntries: filteredMonthlyEntries,
        filteredExpenses,
        totals: {
          gross:      trueGross,
          expense:    calculatedTotalExpense,
          net:        trueGross - calculatedTotalExpense,
          sessions:   trueSessions,
          commission: trueCommission,
          revShare:   filteredMonthlyEntries.reduce((s, e) => s + e.revenueShare, 0),
        },
        categoryTotals,
        uniqueMonths: Array.from(new Set(monthlyEntries.map(e => e.monthId))).sort().reverse()
      });
    }
    fetchData();
  }, [filterMonth, filterLocation, filterCategory]);

  if (!data) return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
        <span className="text-sm text-slate-500">Veriler yükleniyor...</span>
      </div>
    </div>
  );

  const maxCatTotal = Math.max(...Object.values(data.categoryTotals), 0.1);

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      
      {/* Header */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg inline-block mb-2">
              Financial Ledger
            </span>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Wallet className="w-6 h-6 text-slate-400" />
              Gelir & Gider Paneli
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Operasyonel nakit akışı, komisyon kesintileri ve lokasyon bazlı performans dökümü.
            </p>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
            <Link
              href={`/gelir-gider?location=all&month=${filterMonth}&category=${filterCategory}`}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filterLocation === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              )}
            >Tümü</Link>
            {data.locations.map(loc => (
              <Link key={loc.id}
                href={`/gelir-gider?location=${loc.id}&month=${filterMonth}&category=${filterCategory}`}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  filterLocation === loc.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                )}
              >{loc.name.split(' ')[0]}</Link>
            ))}
          </div>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-4 py-4 border-y border-slate-200">
          <Link
            href={`/gelir-gider?location=${filterLocation}&month=&category=${filterCategory}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
              !filterMonth 
                ? 'bg-[#2563EB] text-white border-blue-500 shadow-sm' 
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Tüm Dönemler
          </Link>

          <div className="w-px h-6 bg-slate-200" />

          <div className="relative">
            <Calendar className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-blue-500" />
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => {
                const m = e.target.value;
                window.location.href = `/gelir-gider?location=${filterLocation}&month=${m}&category=${filterCategory}`;
              }}
              className="elite-input pl-9 w-44 text-xs cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Brüt Gelir', value: data.totals.gross, icon: TrendingUp, cardClass: 'stat-card-green', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100 border-emerald-200', tag: 'Ciro' },
          { label: 'Toplam Gider', value: data.totals.expense, icon: TrendingDown, cardClass: 'stat-card-red', iconColor: 'text-red-600', iconBg: 'bg-red-100 border-red-200', tag: 'KDV Dahil' },
          { label: 'Net Durum', value: data.totals.net, icon: Wallet, cardClass: data.totals.net >= 0 ? 'stat-card-blue' : 'stat-card-red', iconColor: data.totals.net >= 0 ? 'text-blue-600' : 'text-red-600', iconBg: data.totals.net >= 0 ? 'bg-blue-100 border-blue-200' : 'bg-red-100 border-red-200', tag: 'Nakit Akışı' },
          { label: 'Toplam Seans', value: data.totals.sessions, icon: BarChart3, cardClass: 'bg-white', iconColor: 'text-slate-600', iconBg: 'bg-slate-100 border-slate-200', tag: 'Hacim', isCurrency: false },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={cn("premium-card p-5 border", kpi.cardClass)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center", kpi.iconBg)}>
                <kpi.icon className={cn("w-4.5 h-4.5", kpi.iconColor)} />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{kpi.tag}</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
            <h2 className="text-xl font-bold text-slate-900">
              {kpi.isCurrency === false 
                ? kpi.value.toLocaleString('tr-TR') 
                : `₺${kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
            </h2>
          </motion.div>
        ))}
      </section>

      {/* Insight Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            label: 'iyzico %2 + Nayax %2', 
            sub: 'Toplam Operasyonel Kesinti', 
            value: data.totals.commission, 
            icon: CreditCard, 
            iconColor: 'text-red-500',
            cardClass: 'stat-card-red'
          },
          { 
            label: 'AVM Ciro Payı %15', 
            sub: 'Kira ve Hakediş Gideri', 
            value: data.totals.revShare, 
            icon: Percent, 
            iconColor: 'text-amber-600',
            cardClass: 'stat-card-amber'
          },
          { 
            label: 'Operasyonel Marj', 
            sub: 'Net Verimlilik Oranı', 
            value: data.totals.gross > 0 ? ((data.totals.net / data.totals.gross) * 100) : 0, 
            icon: PiggyBank, 
            iconColor: 'text-blue-600',
            cardClass: 'stat-card-blue',
            isPercent: true
          },
        ].map((item) => (
          <div key={item.label} className={cn("premium-card p-5 flex items-center gap-4 border", item.cardClass)}>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <item.icon className={cn("w-5 h-5", item.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">{item.label}</p>
              <p className="text-lg font-bold text-slate-900">
                {item.isPercent ? `%${item.value.toFixed(1)}` : `₺${item.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
              </p>
              <p className="text-[10px] text-slate-400">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Monthly Ledger Table */}
        <section className="xl:col-span-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dönemsel Gelir Dökümü</h2>
            <div className="flex-1 section-divider" />
          </div>
          
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[680px]">
                <thead>
                  <tr>
                    <th>Ay / Lokasyon</th>
                    <th className="text-center">Oturum</th>
                    <th className="text-right">Brüt Ciro</th>
                    <th className="text-right">Gider (AVM+Pay)</th>
                    <th className="text-right">Net Nakit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyEntries.map((entry, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{entry.month}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{entry.locationName}</p>
                          </div>
                          {entry.isLive && (
                            <span className="live-dot text-[9px]">Canlı</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center font-mono font-semibold text-slate-700">{entry.sessions}</td>
                      <td className="text-right font-semibold text-slate-900">₺{entry.grossRevenue.toLocaleString('tr-TR')}</td>
                      <td className="text-right text-red-500 font-medium text-sm">₺{entry.avmExpense.toLocaleString('tr-TR')}</td>
                      <td className={cn(
                        "text-right font-bold",
                        entry.netCash >= 0 ? "text-emerald-700" : "text-red-600"
                      )}>
                        ₺{entry.netCash.toLocaleString('tr-TR')}
                      </td>
                    </motion.tr>
                  ))}
                  {data.monthlyEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        Bu dönem için veri bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Expense Category Breakdown */}
        <section className="xl:col-span-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Gider Analizi</h2>
            <div className="flex-1 section-divider" />
          </div>

          <div className="premium-card p-5 space-y-5">
            {Object.entries(data.categoryTotals).length > 0 ? (
              <>
                {Object.entries(data.categoryTotals).map(([cat, amount]) => (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", EXPENSE_CATEGORIES[cat]?.dot || 'bg-slate-400')} />
                        <span className="text-xs font-semibold text-slate-700">
                          {EXPENSE_CATEGORIES[cat]?.label || cat}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">₺{amount.toLocaleString('tr-TR')}</p>
                        <p className="text-[10px] text-slate-400">
                          %{data.totals.expense > 0 ? ((amount / data.totals.expense) * 100).toFixed(1) : 0}
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(amount / maxCatTotal) * 100}%` }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full bg-[#2563EB]"
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <PiggyBank className="mx-auto mb-3 text-slate-300" size={28} />
                <p className="text-xs">Bu filtrelere göre gider bulunamadı.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <p className="text-xs font-semibold text-blue-700 mb-1">Kayıtlı Harcamalar</p>
                <p className="text-2xl font-bold text-blue-800">{data.filteredExpenses.length}</p>
                <p className="text-[10px] text-blue-500 mt-0.5">işlem kalemi</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
