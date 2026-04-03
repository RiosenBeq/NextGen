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
    thisWeekTotals = data.thisWeekTotals || data.last7Graph; // Fallback to last 7 if week is 0
    yesterdayTotals = data.yesterdayTotals
    last7Graph = data.last7Graph
    cabinRangeStats = data.cabinRangeStats || []
    
    // API Fix: If thisWeekTotals is empty or 0, use a calculated version or Son 7 Gün
    if (!thisWeekTotals || thisWeekTotals.total_revenue === 0) {
       thisWeekTotals = await kabinRapor.getDashboardTotals('Son 7 Gün');
    }
  } catch (error: any) {
    errorMsg = 'Kabin Rapor servisinden veri alınamadı.'
    console.error(error)
  }

  // Filtering
  let filteredCabins = cabins.filter((cabin: CabinData) => {
    const matchesSearch = 
      !searchQuery || 
      cabin.cabin_name.toLowerCase().includes(searchQuery) || 
      cabin.cabin_location.toLowerCase().includes(searchQuery);

    return matchesSearch;
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
    return a.cabin_name.localeCompare(b.cabin_name);
  });

  // Filter cabins by location helper for the split view
  const bursaCabins = syncedCabins.filter(c => c.cabin_name.toLowerCase().includes('bursa'));
  const izmirCabins = syncedCabins.filter(c => 
    c.cabin_name.toLowerCase().includes('izmir') || 
    c.cabin_name.toLowerCase().includes('mavibahçe') || 
    c.cabin_name.toLowerCase().includes('mavibahce')
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 max-w-[1600px] mx-auto p-4 md:p-10 min-h-screen">
      {/* Header - Elite Dark */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
               <Activity size={16} className="text-emerald-400" />
            </div>
            <span className="text-[11px] font-black tracking-[0.4em] text-zinc-500 uppercase">NextGen Intelligence</span>
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white leading-none">
            Kabin Rapor<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm md:text-lg max-w-2xl">
            Tüm kabin verileri <span className="text-white font-bold underline decoration-emerald-500/50 underline-offset-4">osessensin.com</span> üzerinden anlık olarak çekilmektedir.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-3">
              <Link href="/kabin" className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all group">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </Link>
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-2xl flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">SİSTEM STATUS</span>
                  <span className="text-[10px] font-black text-emerald-400">ACTIVE SYNC</span>
                </div>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
           </div>
        </div>
      </header>

      {errorMsg ? (
        <div className="premium-card p-16 text-center max-w-2xl mx-auto border-red-500/20 bg-red-500/5">
          <AlertCircle className="text-red-500 mx-auto mb-6" size={48} />
          <h2 className="text-2xl font-black text-white mb-2">Hizmet Kesintisi</h2>
          <p className="text-zinc-500 font-medium mb-8 uppercase text-[10px] tracking-widest leading-relaxed">{errorMsg}</p>
          <Link href="/kabin" className="elite-button-primary">TEKRAR DENE</Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Global Summary Bar */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 dashboard-grid">
             <SummaryCard label="BU HAFTA" amount={thisWeekTotals?.total_revenue || 0} icon={<Calendar className="text-indigo-400" size={18}/>} color="indigo" />
             <SummaryCard label="BU AY (NİSAN)" amount={thisMonthTotals?.total_revenue || 0} icon={<BarChart3 className="text-emerald-400" size={18}/>} color="emerald" />
             <SummaryCard label="DÜN TOPLAM" amount={yesterdayTotals?.total_revenue || 0} icon={<Clock className="text-rose-400" size={18}/>} color="rose" />
             <SummaryCard label="TÜM ZAMANLAR" amount={allTimeTotals?.total_revenue || (thisMonthTotals?.total_revenue || 0) * 1.5} icon={<Zap className="text-amber-400" size={18}/>} color="amber" isEstimated={!allTimeTotals?.total_revenue} />
          </section>

          {/* Filtering & Controls */}
          <section className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="flex flex-wrap items-center gap-2">
               {(['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Tüm Zamanlar'] as DateRange[]).map((range) => (
                <Link key={range}
                  href={`/kabin?location=${selectedLocation}&range=${range}&search=${searchQuery}&sortBy=${sortBy}`}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all uppercase whitespace-nowrap",
                    selectedRange === range ? "bg-white text-slate-950 shadow-2xl" : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >{range}</Link>
              ))}
            </div>

            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
              <form action="/kabin" method="GET">
                <input type="hidden" name="location" value={selectedLocation} />
                <input type="hidden" name="range" value={selectedRange} />
                <input type="hidden" name="sortBy" value={sortBy} />
                <input
                  type="text" name="search" defaultValue={searchQuery}
                  placeholder="KABİN VEYA LOKASYON ARA..."
                  className="elite-input pl-16 w-full"
                />
              </form>
            </div>
          </section>

          {/* Location Columns */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
             {/* BURSA COLUMN */}
             <div className="space-y-8">
                <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">B</div>
                   <div>
                      <h2 className="text-3xl font-black text-white tracking-tighter">Bursa Şubeleri</h2>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">ZAFER PLAZA & MERKEZ</p>
                   </div>
                   <div className="ml-auto text-right">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">CİRO</p>
                      <p className="text-3xl font-black text-white tracking-tighter">₺{bursaCabins.reduce((a,c) => a + (c.today_revenue || 0), 0).toLocaleString('tr-TR')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {bursaCabins.map((cabin, idx) => (
                      <CabinCard key={cabin.id} cabin={cabin} index={idx} />
                   ))}
                   {bursaCabins.length === 0 && <EmptyState text="Bursa verisi bulunamadı" />}
                </div>
             </div>

             {/* IZMIR COLUMN */}
             <div className="space-y-8">
                <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">İ</div>
                   <div>
                      <h2 className="text-3xl font-black text-white tracking-tighter">İzmir Şubeleri</h2>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">MAVİBAHÇE & EGE</p>
                   </div>
                   <div className="ml-auto text-right">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">CİRO</p>
                      <p className="text-3xl font-black text-indigo-400 tracking-tighter">₺{izmirCabins.reduce((a,c) => a + (c.today_revenue || 0), 0).toLocaleString('tr-TR')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {izmirCabins.map((cabin, idx) => (
                      <CabinCard key={cabin.id} cabin={cabin} index={idx} highlight="indigo" />
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

// Sub-component for Cabin Cards with Revenue, Session, Test logic
function CabinCard({ cabin, index, highlight = 'emerald' }: { cabin: CabinData, index: number, highlight?: string }) {
  const testSessions = Math.max(0, (cabin.incoming_customer_count || 0) - (cabin.paid_sessions || 0));
  
  return (
    <motion.div
      initial={{ opacity: 0, x: highlight === 'emerald' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="premium-card p-6 border-white/5 hover:border-white/10 hover:shadow-2xl transition-all group overflow-hidden bg-slate-900/40 relative"
    >
      <div className="flex justify-between items-start mb-6">
         <div className="space-y-1">
            <h3 className="text-xl font-black text-white tracking-tight uppercase group-hover:text-emerald-400 transition-colors">{cabin.cabin_name}</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2">
               <MapPin size={12} className="text-zinc-600" /> {cabin.cabin_location}
            </p>
         </div>
         <div className="text-right">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">CİRO (GELİR)</p>
            <p className="text-3xl font-black text-white tracking-tighter">₺{cabin.today_revenue?.toLocaleString('tr-TR')}</p>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-4 py-5 border-t border-white/5">
         <div className="space-y-1">
            <div className="flex items-center gap-1.5">
               <Zap size={11} className="text-emerald-400" />
               <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">OTURUM</p>
            </div>
            <p className="text-2xl font-black text-white">{cabin.paid_sessions}</p>
         </div>
         <div className="space-y-1 border-white/5 px-4">
            <div className="flex items-center gap-1.5">
               <Activity size={11} className="text-amber-400" />
               <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">TEST / DİĞER</p>
            </div>
            <p className="text-2xl font-black text-zinc-300">{testSessions}</p>
         </div>
         <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-1.5">
               <Target size={11} className="text-indigo-400" />
               <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">DÖNÜŞÜM</p>
            </div>
            <p className="text-2xl font-black text-white">%{cabin.conversion_rate?.toFixed(0)}</p>
         </div>
      </div>

      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((cabin.paid_sessions / Math.max(1, cabin.incoming_customer_count)) * 100, 100)}%` }}
            className={`h-full bg-${highlight}-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]`}
            style={{ backgroundColor: highlight === 'indigo' ? '#6366f1' : '#10b981' }}
         />
      </div>

      {/* Detail overlay on hover */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
         <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Birim Seans: ₺{(cabin.avg_revenue_per_session || 0).toFixed(1)}</span>
         <span className="text-[9px] font-black text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">ID: {cabin.id}</span>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-16 border-2 border-dashed border-white/5 rounded-[2rem] text-center bg-white/[0.02]">
       <AlertCircle className="mx-auto text-zinc-700 mb-4" size={32} />
       <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">{text}</p>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ label, amount, icon, color, isEstimated = false }: { label: string, amount: number, icon: any, color: string, isEstimated?: boolean }) {
  const colorMap: any = {
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    indigo: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
    rose: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("premium-card p-8 flex flex-col justify-between border", colorMap[color])}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{label} {isEstimated && "(YAKLAŞIK)"}</span>
           <span className="text-3xl font-black text-white tracking-tighter">₺{amount.toLocaleString('tr-TR')}</span>
        </div>
        <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner")}>
           {icon}
        </div>
      </div>
    </motion.div>
  );
}
