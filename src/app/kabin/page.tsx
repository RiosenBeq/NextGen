import { kabinRapor, CabinData, DateRange, DashboardTotal } from '@/lib/kabinRapor'
import Link from 'next/link'
import * as motion from "framer-motion/client";
import { 
  Activity, Search, MapPin, TrendingUp,
  AlertCircle, Monitor, BarChart3,
  Calendar, Clock, Zap, ArrowUpRight,
  Target, RefreshCw, Database, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: 'Kabin Verisi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  let errorMsg = null

  try {
    const data = await kabinRapor.getComprehensiveData(selectedRange)
    cabins = data.cabins || []
    selectedTotals = data.selectedRangeTotals
    allTimeTotals = data.allTimeTotals
    thisMonthTotals = data.thisMonthTotals
    thisWeekTotals = data.thisWeekTotals
    yesterdayTotals = data.yesterdayTotals
    cabinRangeStats = data.cabinRangeStats || []
    
    if (!thisWeekTotals || thisWeekTotals.total_revenue === 0) {
       thisWeekTotals = await kabinRapor.getDashboardTotals('Son 7 Gün');
    }
  } catch (error: any) {
    errorMsg = 'Kabin Rapor servisinden veri alınamadı.'
    console.error(error)
  }

  let filteredCabins = cabins.filter((cabin: CabinData) => {
    return !searchQuery || 
      cabin.cabin_name.toLowerCase().includes(searchQuery) || 
      cabin.cabin_location.toLowerCase().includes(searchQuery);
  });

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

  syncedCabins.sort((a, b) => {
    if (sortBy === 'revenue') return (b.today_revenue || 0) - (a.today_revenue || 0);
    if (sortBy === 'sessions') return (b.paid_sessions || 0) - (a.paid_sessions || 0);
    return a.cabin_name.localeCompare(b.cabin_name);
  });

  const bursaCabins = syncedCabins.filter(c => c.cabin_name.toLowerCase().includes('bursa'));
  const izmirCabins = syncedCabins.filter(c => 
    c.cabin_name.toLowerCase().includes('izmir') || 
    c.cabin_name.toLowerCase().includes('mavibahçe') || 
    c.cabin_name.toLowerCase().includes('mavibahce')
  );

  const summaryCards = [
    { label: 'Bu Hafta', amount: thisWeekTotals?.total_revenue || 0, sessions: thisWeekTotals?.total_paid_sessions || 0, color: 'blue' as const },
    { label: 'Bu Ay', amount: thisMonthTotals?.total_revenue || 0, sessions: thisMonthTotals?.total_paid_sessions || 0, color: 'green' as const },
    { label: 'Dün', amount: yesterdayTotals?.total_revenue || 0, sessions: yesterdayTotals?.total_paid_sessions || 0, color: 'amber' as const },
    { label: 'Tüm Zamanlar', amount: allTimeTotals?.total_revenue || 0, sessions: allTimeTotals?.total_paid_sessions || 0, color: 'purple' as const },
  ];

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="live-dot">osessensin.com canlı</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-slate-400" />
            Kabin Verisi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tüm kabin verileri <strong>osessensin.com</strong> üzerinden anlık çekilmektedir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/kabin" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl premium-card hover:shadow-md transition-all text-sm font-medium text-slate-600">
            <RefreshCw className="w-4 h-4" />
            Yenile
          </Link>
          <div className="flex items-center gap-2.5 px-4 py-2.5 premium-card stat-card-green rounded-xl border">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-700">Aktif Senkron</span>
          </div>
        </div>
      </header>

      {errorMsg ? (
        <div className="premium-card p-12 text-center max-w-xl mx-auto border-red-200 bg-red-50">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={40} />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Bağlantı Hatası</h2>
          <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
          <Link href="/kabin" className="elite-button-primary text-sm">Tekrar Dene</Link>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Summary Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}
          </section>

          {/* Filters */}
          <section className="premium-card p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Tüm Zamanlar'] as DateRange[]).map((range) => (
                <Link key={range}
                  href={`/kabin?location=${selectedLocation}&range=${range}&search=${searchQuery}&sortBy=${sortBy}`}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                    selectedRange === range 
                      ? "bg-[#2563EB] text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  )}
                >{range}</Link>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <form action="/kabin" method="GET">
                <input type="hidden" name="location" value={selectedLocation} />
                <input type="hidden" name="range" value={selectedRange} />
                <input type="hidden" name="sortBy" value={sortBy} />
                <input
                  type="text" name="search" defaultValue={searchQuery}
                  placeholder="Kabin veya lokasyon ara..."
                  className="elite-input pl-10 text-sm"
                />
              </form>
            </div>
          </section>

          {/* Location Columns */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* BURSA */}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-sm">B</div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Bursa Şubeleri</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Zafer Plaza</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Toplam Ciro</p>
                  <p className="text-lg font-bold text-slate-900">
                    ₺{bursaCabins.reduce((a, c) => a + (c.today_revenue || 0), 0).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {bursaCabins.map((cabin, idx) => (
                  <CabinCard key={cabin.id} cabin={cabin} index={idx} color="emerald" />
                ))}
                {bursaCabins.length === 0 && <EmptyState text="Bursa verisi bulunamadı" />}
              </div>
            </div>

            {/* IZMIR */}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-base shadow-sm">İ</div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">İzmir Şubeleri</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Mavibahçe & Ege</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Toplam Ciro</p>
                  <p className="text-lg font-bold text-blue-700">
                    ₺{izmirCabins.reduce((a, c) => a + (c.today_revenue || 0), 0).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {izmirCabins.map((cabin, idx) => (
                  <CabinCard key={cabin.id} cabin={cabin} index={idx} color="blue" />
                ))}
                {izmirCabins.length === 0 && <EmptyState text="İzmir verisi bulunamadı" />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CabinCard({ cabin, index, color }: { cabin: CabinData; index: number; color: 'emerald' | 'blue' }) {
  const testSessions = Math.max(0, (cabin.incoming_customer_count || 0) - (cabin.paid_sessions || 0));
  const isEmerald = color === 'emerald';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="premium-card p-5 hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={cn(
            "text-sm font-bold tracking-tight group-hover:transition-colors",
            isEmerald ? "text-slate-900 group-hover:text-emerald-700" : "text-slate-900 group-hover:text-blue-700"
          )}>
            {cabin.cabin_name}
          </h3>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin size={10} />
            {cabin.cabin_location}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Ciro</p>
          <p className="text-lg font-bold text-slate-900">₺{(cabin.today_revenue || 0).toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Zap size={10} className={isEmerald ? "text-emerald-500" : "text-blue-500"} />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Oturum</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{cabin.paid_sessions}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Monitor size={10} className="text-amber-500" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Test</p>
          </div>
          <p className="text-xl font-bold text-slate-600">{testSessions}</p>
        </div>
        <div className="space-y-1 text-right">
          <div className="flex items-center justify-end gap-1">
            <Target size={10} className="text-purple-500" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Dönüşüm</p>
          </div>
          <p className="text-xl font-bold text-slate-900">%{(cabin.conversion_rate || 0).toFixed(0)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((cabin.paid_sessions / Math.max(1, cabin.incoming_customer_count)) * 100, 100)}%` }}
          transition={{ duration: 0.8, delay: index * 0.06 }}
          className={cn("h-full rounded-full", isEmerald ? "bg-emerald-500" : "bg-blue-500")}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Ort. Seans: ₺{(cabin.avg_revenue_per_session || 0).toFixed(0)}</span>
        <span className="text-[10px] text-slate-300 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">ID: {cabin.id}</span>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
      <AlertCircle className="mx-auto text-slate-300 mb-3" size={28} />
      <p className="text-xs font-semibold text-slate-400">{text}</p>
    </div>
  );
}

const colorMap = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: 'text-blue-500' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', icon: 'text-purple-500' },
};

function SummaryCard({ label, amount, sessions, color }: { 
  label: string; amount: number; sessions: number; color: keyof typeof colorMap;
}) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("premium-card p-5 border", c.bg, c.border)}
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <p className={cn("text-2xl font-bold mb-1", c.text)}>
        ₺{amount.toLocaleString('tr-TR')}
      </p>
      <p className="text-xs text-slate-400">{sessions.toLocaleString('tr-TR')} seans</p>
    </motion.div>
  );
}
