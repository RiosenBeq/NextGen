import { kabinRapor, CabinData, DateRange, DashboardTotal } from '@/lib/kabinRapor'
import Link from 'next/link'
import * as motion from "framer-motion/client";
import { 
  Activity, Search, MapPin, TrendingUp, TrendingDown, Users, 
  AlertCircle, Timer, ChevronRight, Monitor, BarChart3,
  Calendar, Clock, Zap, ArrowUpRight, ArrowDownRight,
  DollarSign, Target, Percent, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: 'Kabin Dashboard - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Always fresh data

export default async function KabinDashboard(props: {
  searchParams: Promise<{ location?: string; search?: string; range?: string; sortBy?: string }>
}) {
  const searchParams = await props.searchParams
  const selectedLocation = searchParams.location || 'all'
  const searchQuery = (searchParams.search || '').toLowerCase()
  const selectedRange = (searchParams.range || 'Bugün') as DateRange
  const sortBy = searchParams.sortBy || 'revenue'

  let cabins: CabinData[] = []
  let cabinRangeStats: any[] = []
  let selectedTotals: DashboardTotal | null = null
  let allTimeTotals: DashboardTotal | null = null
  let thisMonthTotals: DashboardTotal | null = null
  let thisWeekTotals: DashboardTotal | null = null
  let yesterdayTotals: DashboardTotal | null = null
  let last7Graph: any = null
  let errorMsg = null

  try {
    const data = await kabinRapor.getComprehensiveData(selectedRange)
    cabins = data.cabins || []
    selectedTotals = data.selectedRangeTotals
    allTimeTotals = data.allTimeTotals
    thisMonthTotals = data.thisMonthTotals
    thisWeekTotals = data.thisWeekTotals
    yesterdayTotals = data.yesterdayTotals
    last7Graph = data.last7Graph
    cabinRangeStats = data.cabinRangeStats || []
  } catch (error: any) {
    errorMsg = 'Kabin Rapor servisinden veri alınamadı.'
    console.error(error)
  }

  // Filtering
  let filteredCabins = cabins.filter((cabin: CabinData) => {
    const matchesLocation = 
      selectedLocation === 'all' || 
      (selectedLocation === 'bursa' && cabin.cabin_name.toLowerCase().includes('bursa')) ||
      (selectedLocation === 'izmir' && (cabin.cabin_name.toLowerCase().includes('izmir') || cabin.cabin_name.toLowerCase().includes('mavibahçe') || cabin.cabin_name.toLowerCase().includes('mavibahce')));
    
    const matchesSearch = 
      !searchQuery || 
      cabin.cabin_name.toLowerCase().includes(searchQuery) || 
      cabin.cabin_location.toLowerCase().includes(searchQuery);

    return matchesLocation && matchesSearch;
  });

  // Merge the range stats directly into cabins for perfect synchronization
  let syncedCabins = filteredCabins.map(cabin => {
    if (selectedRange === 'Bugün') return cabin;
    const rangeStat = cabinRangeStats.find(s => s.cabin_id === cabin.id || s.cabin_id === cabin.firm_id);
    if (!rangeStat) return cabin;
    return {
      ...cabin,
      today_revenue: rangeStat.revenue || 0,
      paid_sessions: rangeStat.sessions || 0,
      incoming_customer_count: rangeStat.customers || 0,
      avg_revenue_per_session: rangeStat.sessions > 0 ? (rangeStat.revenue || 0) / rangeStat.sessions : 0,
      conversion_rate: rangeStat.customers > 0 ? (rangeStat.sessions / rangeStat.customers) * 100 : 0
    }
  });

  // Sorting
  syncedCabins.sort((a, b) => {
    if (sortBy === 'revenue') return (b.today_revenue || 0) - (a.today_revenue || 0);
    if (sortBy === 'sessions') return (b.paid_sessions || 0) - (a.paid_sessions || 0);
    if (sortBy === 'conversion') return (b.conversion_rate || 0) - (a.conversion_rate || 0);
    return a.cabin_name.localeCompare(b.cabin_name);
  });

  // Stats from synced cabins
  const filteredRevenue = syncedCabins.reduce((acc, curr) => acc + (curr.today_revenue || 0), 0);
  const filteredSessions = syncedCabins.reduce((acc, curr) => acc + (curr.paid_sessions || 0), 0);
  const filteredCustomers = syncedCabins.reduce((acc, curr) => acc + (curr.incoming_customer_count || 0), 0);
  const avgRevenuePerSession = filteredSessions > 0 ? filteredRevenue / filteredSessions : 0;
  const overallConversion = filteredCustomers > 0 ? (filteredSessions / filteredCustomers) * 100 : 0;

  // Last 7 days chart data
  const chartData = Array.isArray(last7Graph) ? last7Graph : (last7Graph?.data || last7Graph?.series || []);

  // Range comparison for trend
  const yesterdayRevenue = yesterdayTotals?.total_revenue || 0;
  const todayRevenue = selectedTotals?.total_revenue || 0;
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <span className="w-8 h-[2px] bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">Live Monitoring System</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter heading-elite leading-tight">
            Kabin Rapor<br/>Canlı Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {errorMsg ? (
            <div className="px-6 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3">
              <AlertCircle size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Bağlantı Kesildi</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/kabin" className="p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-600 hover:text-emerald-400">
                <RefreshCw className="w-4 h-4" />
              </Link>
              <div className="px-6 py-3 rounded-2xl glass-panel flex items-center gap-4 shadow-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Status</span>
                  <span className="text-sm font-black text-emerald-400">DATA STREAMING</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          )}
        </div>
      </header>

      {errorMsg ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-16 text-center max-w-2xl mx-auto py-24 border-rose-500/10"
        >
          <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="text-rose-500" size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">API Bağlantı Hatası</h2>
          <p className="text-zinc-500 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-[0.2em]">{errorMsg}</p>
          <Link href="/kabin" className="elite-button-primary inline-flex py-4 px-12">SİSTEMİ YENİDEN YÜKLE</Link>
        </motion.div>
      ) : (
        <div className="space-y-12">
          {/* Controls & Filters */}
          <section className="flex flex-wrap gap-4 items-center">
            <div className="glass-panel p-1.5 flex gap-1 rounded-2xl">
              {[
                { id: 'all', label: 'TÜMÜ' },
                { id: 'bursa', label: 'BURSA' },
                { id: 'izmir', label: 'İZMİR' }
              ].map((loc) => (
                <Link key={loc.id}
                  href={`/kabin?location=${loc.id}&range=${selectedRange}&search=${searchQuery}&sortBy=${sortBy}`}
                  className={cn(
                    "px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all",
                    selectedLocation === loc.id ? "bg-white text-zinc-950 shadow-2xl" : "text-zinc-500 hover:text-white"
                  )}
                >{loc.label}</Link>
              ))}
            </div>

            <div className="glass-panel p-1.5 flex gap-1 rounded-2xl overflow-x-auto">
              {(['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün', 'Tüm Zamanlar'] as DateRange[]).map((range) => (
                <Link key={range}
                  href={`/kabin?location=${selectedLocation}&range=${range}&search=${searchQuery}&sortBy=${sortBy}`}
                  className={cn(
                    "px-4 md:px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap",
                    selectedRange === range ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-white"
                  )}
                >{range.toUpperCase()}</Link>
              ))}
            </div>
          </section>
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <form action="/kabin" method="GET">
              <input type="hidden" name="location" value={selectedLocation} />
              <input type="hidden" name="range" value={selectedRange} />
              <input type="hidden" name="sortBy" value={sortBy} />
              <input
                type="text" name="search" defaultValue={searchQuery}
                placeholder="KABİN ADI VEYA LOKASYON İLE ARA..."
                className="w-full elite-input pl-16 py-5 bg-zinc-900/50 border-white/5 focus:border-white/10"
              />
            </form>
          </div>

          {/* ALL TIME vs SELECTED RANGE — Multi-period KPIs */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-emerald-500 px-4 py-2">Genel Bakış — Tüm Dönemler</h2>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* All Time */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-6 md:p-8 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 opacity-[0.04]"><TrendingUp size={100} /></div>
                <p className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> TÜM ZAMANLAR CİRO
                </p>
                <p className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                  ₺{(allTimeTotals?.total_revenue || 0).toLocaleString('tr-TR')}
                </p>
                <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase">{(allTimeTotals?.total_paid_sessions || 0).toLocaleString('tr-TR')} toplam seans</p>
              </motion.div>

              {/* This Month */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="premium-card p-6 md:p-8 group">
                <p className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> BU AY
                </p>
                <p className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                  ₺{(thisMonthTotals?.total_revenue || 0).toLocaleString('tr-TR')}
                </p>
                <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase">{(thisMonthTotals?.total_paid_sessions || 0).toLocaleString('tr-TR')} seans</p>
              </motion.div>

              {/* This Week */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card p-6 md:p-8 group">
                <p className="text-[9px] md:text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> BU HAFTA
                </p>
                <p className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                  ₺{(thisWeekTotals?.total_revenue || 0).toLocaleString('tr-TR')}
                </p>
                <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase">{(thisWeekTotals?.total_paid_sessions || 0).toLocaleString('tr-TR')} seans</p>
              </motion.div>

              {/* Today with trend */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="premium-card p-6 md:p-8 group relative overflow-hidden">
                <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-500" /> BUGÜN (CANLI)
                </p>
                <p className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                  ₺{filteredRevenue.toLocaleString('tr-TR')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {revenueChange !== 0 && (
                    <span className={cn("text-[9px] font-black flex items-center gap-1 px-2 py-0.5 rounded-full",
                      revenueChange > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                    )}>
                      {revenueChange > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[9px] text-zinc-600 font-bold uppercase">düne göre</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20">
                  <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }} />
                </div>
              </motion.div>
            </div>
          </section>

          {/* Selected Range Aggregate KPIs */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="premium-card p-8 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><TrendingUp size={100} strokeWidth={1} /></div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {selectedRange.toUpperCase()} CİRO
              </p>
              <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                ₺{(selectedTotals?.total_revenue || filteredRevenue).toLocaleString('tr-TR')}
              </p>
              <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase tracking-widest">
                {(selectedTotals?.total_paid_sessions || filteredSessions).toLocaleString('tr-TR')} seans
              </p>
            </div>

            <div className="premium-card p-8">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Monitor size={14} /> AKTİF TERMİNALLER
              </p>
              <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{syncedCabins.length}</p>
              <div className="flex -space-x-2 mt-4">
                {syncedCabins.slice(0, 6).map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-zinc-900 border-2 border-zinc-950 flex items-center justify-center text-[9px] font-black text-white shadow-xl">
                    {c.cabin_name.charAt(0)}
                  </div>
                ))}
                {syncedCabins.length > 6 && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-[9px] font-black text-white border-2 border-zinc-950">
                    +{syncedCabins.length - 6}
                  </div>
                )}
              </div>
            </div>

            <div className="premium-card p-8">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Timer size={14} /> ORT. SEANS DEĞERİ
              </p>
              <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">₺{Math.round(avgRevenuePerSession).toLocaleString('tr-TR')}</p>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((avgRevenuePerSession / 500) * 100, 100)}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full"
                />
              </div>
            </div>

            <div className="premium-card p-8">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Target size={14} /> DÖNÜŞÜM ORANI
              </p>
              <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">%{overallConversion.toFixed(1)}</p>
              <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase">
                {filteredCustomers} müşteri → {filteredSessions} seans
              </p>
            </div>
          </section>

          {/* Son 7 Gün Trendi */}
          {chartData && chartData.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-indigo-500 px-4 py-2">Son 7 Gün Trendi</h2>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>
              <div className="premium-card p-8 bg-zinc-950">
                <div className="flex items-end justify-between gap-4 h-[200px]">
                  {chartData.slice(-7).map((day: any, i: number) => {
                    const maxRev = Math.max(...chartData.slice(-7).map((d: any) => d.revenue || d.total_revenue || 0), 1);
                    const rev = day.revenue || day.total_revenue || 0;
                    const h = (rev / maxRev) * 100;
                    const label = day.date || day.label || '';
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[8px] font-black text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          ₺{rev.toLocaleString('tr-TR')}
                        </span>
                        <div className="w-full flex items-end justify-center h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="w-full max-w-[48px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-xl group-hover:from-emerald-600 group-hover:to-emerald-400 transition-all shadow-lg border border-white/10"
                          />
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 group-hover:text-white transition-colors uppercase">{label.slice(-5) || `Gün ${i + 1}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Cabin Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-zinc-900 border-l-4 border-white/20 px-4 py-2">Kabin Bazlı Detay</h2>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{syncedCabins.length} terminaller</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {syncedCabins.map((cabin: CabinData, index: number) => {
                const isTopEarner = index === 0 && syncedCabins.length > 1;
                return (
                  <motion.div
                    key={cabin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "premium-card p-8 hover:border-emerald-500/20 group relative overflow-hidden",
                      isTopEarner && "border-emerald-500/10 bg-gradient-to-br from-emerald-500/[0.02] to-transparent"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-all pointer-events-none">
                      <Monitor size={160} />
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black tracking-widest uppercase">
                            {cabin.cabin_name.includes('Bursa') ? 'Bursa' : 'İzmir'}
                          </span>
                          {isTopEarner && (
                            <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] font-black tracking-widest uppercase flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> TOP
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-tight">{cabin.cabin_name}</h2>
                        <div className="flex items-center gap-2 text-zinc-500">
                          <MapPin size={11} className="text-zinc-700" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">{cabin.cabin_location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">CİRO</p>
                        <p className="text-2xl font-black text-white">₺{cabin.today_revenue?.toLocaleString('tr-TR')}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 pt-6 border-t border-white/5 relative z-10">
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">SEANS</p>
                        <p className="text-lg font-black text-white">{cabin.paid_sessions}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">MÜŞTERİ</p>
                        <p className="text-lg font-black text-white">{cabin.incoming_customer_count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">DÖNÜŞÜM</p>
                        <p className="text-lg font-black text-amber-400">%{(cabin.conversion_rate || 0).toFixed(0)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">ORT/SN</p>
                        <p className="text-lg font-black text-emerald-400">₺{Math.round(cabin.avg_revenue_per_session || 0)}</p>
                      </div>
                    </div>

                    {/* Revenue bar visualization */}
                    <div className="mt-4 relative z-10">
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${filteredRevenue > 0 ? Math.min((cabin.today_revenue / filteredRevenue) * 100 * syncedCabins.length, 100) : 0}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.02] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Fiyat: ₺{cabin.cabin_price}
                      </span>
                      <span className="text-[8px] font-black text-zinc-600 uppercase">
                        Başlangıç: {cabin.start_date ? new Date(cabin.start_date).toLocaleDateString('tr-TR') : '—'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {syncedCabins.length === 0 && (
                <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[4rem] text-center opacity-30">
                  <Search size={64} className="mx-auto mb-6 text-zinc-600" />
                  <p className="text-xl font-black uppercase tracking-widest">EŞLEŞEN KABİN BULUNAMADI</p>
                  <p className="text-xs font-bold mt-2">Arama kriterlerini veya filtreleri değiştirin.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
