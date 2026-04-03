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
    if (sortBy === 'conversion') return (b.conversion_rate || 0) - (a.conversion_rate || 0);
    return a.cabin_name.localeCompare(b.cabin_name);
  });

  // Last 7 days chart data
  const chartData = Array.isArray(last7Graph) ? last7Graph : (last7Graph?.data || last7Graph?.series || []);

  // Filter cabins by location helper for the split view
  const bursaCabins = syncedCabins.filter(c => c.cabin_name.toLowerCase().includes('bursa'));
  const izmirCabins = syncedCabins.filter(c => 
    c.cabin_name.toLowerCase().includes('izmir') || 
    c.cabin_name.toLowerCase().includes('mavibahçe') || 
    c.cabin_name.toLowerCase().includes('mavibahce')
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-10">
        <div className="space-y-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <span className="w-10 h-[2px] bg-slate-900 rounded-full" />
            <span className="text-[11px] font-black tracking-[0.4em] text-slate-500 uppercase">Oses Raporlama Sistemi</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-none">
            Anlık Kabin Performansı
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl">
            Tüm kabin verileri <span className="text-slate-900 font-bold">osessensin.com</span> üzerinden canlı olarak senkronize edilmektedir.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {errorMsg ? (
               <div className="px-5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                 <AlertCircle size={16} /> BAĞLANTI HATASI
               </div>
          ) : (
            <div className="flex items-center gap-3">
               <Link href="/kabin" className="p-3 rounded-xl bg-slate-100/50 hover:bg-slate-200 text-slate-600 transition-all">
                  <RefreshCw className="w-5 h-5" />
               </Link>
               <div className="px-6 py-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SİSTEM DURUMU</span>
                     <span className="text-xs font-black text-emerald-600">CANLI VERİ AKIŞI</span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
               </div>
            </div>
          )}
        </div>
      </header>

      {errorMsg ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-16 text-center max-w-2xl mx-auto py-24 border-red-100 bg-white"
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Hizmet Kesintisi</h2>
          <p className="text-slate-500 font-medium mb-8 uppercase text-[10px] tracking-[0.2em]">{errorMsg}</p>
          <Link href="/kabin" className="elite-button-primary inline-flex py-4 px-10">SİSTEMİ YENİLE</Link>
        </motion.div>
      ) : (
        <div className="space-y-16">
          {/* Controls & Filter Bar */}
          <section className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50">
               {(['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Tüm Zamanlar'] as DateRange[]).map((range) => (
                <Link key={range}
                  href={`/kabin?location=${selectedLocation}&range=${range}&search=${searchQuery}&sortBy=${sortBy}`}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase whitespace-nowrap",
                    selectedRange === range ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                  )}
                >{range}</Link>
              ))}
            </div>

            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
              <form action="/kabin" method="GET">
                <input type="hidden" name="location" value={selectedLocation} />
                <input type="hidden" name="range" value={selectedRange} />
                <input type="hidden" name="sortBy" value={sortBy} />
                <input
                  type="text" name="search" defaultValue={searchQuery}
                  placeholder="KABİN VEYA LOKASYON ARA..."
                  className="w-full elite-input pl-14 py-4 bg-white border border-slate-200 focus:bg-white focus:border-slate-300"
                />
              </form>
            </div>
          </section>

          {/* Location Columns (Bursa vs İzmir) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
             {/* BURSA COLUMN */}
             <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black italic">B</div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">Bursa Kabinleri</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zafer Plaza ve Genel Operasyon</p>
                   </div>
                   <div className="ml-auto text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM CİRO</p>
                      <p className="text-xl font-black text-slate-900">₺{bursaCabins.reduce((a,c) => a + (c.today_revenue || 0), 0).toLocaleString('tr-TR')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {bursaCabins.map((cabin, idx) => (
                      <CabinCard key={cabin.id} cabin={cabin} index={idx} />
                   ))}
                   {bursaCabins.length === 0 && <EmptyState text="Bursa için eşleşme bulunamadı" />}
                </div>
             </div>

             {/* IZMIR COLUMN */}
             <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black italic">İ</div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">İzmir Kabinleri</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mavibahçe ve Çevre Şubeler</p>
                   </div>
                   <div className="ml-auto text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM CİRO</p>
                      <p className="text-xl font-black text-indigo-600">₺{izmirCabins.reduce((a,c) => a + (c.today_revenue || 0), 0).toLocaleString('tr-TR')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {izmirCabins.map((cabin, idx) => (
                      <CabinCard key={cabin.id} cabin={cabin} index={idx} highlight="indigo" />
                   ))}
                   {izmirCabins.length === 0 && <EmptyState text="İzmir için eşleşme bulunamadı" />}
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
      className="premium-card p-6 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all group overflow-hidden bg-white"
    >
      <div className="flex justify-between items-start mb-6">
         <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{cabin.cabin_name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
               <MapPin size={12} className="opacity-50" /> {cabin.cabin_location}
            </p>
         </div>
         <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CİRO (GELİR)</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">₺{cabin.today_revenue?.toLocaleString('tr-TR')}</p>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-100">
         <div className="space-y-1">
            <div className="flex items-center gap-1.5">
               <Zap size={11} className="text-emerald-500" />
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OTURUM</p>
            </div>
            <p className="text-xl font-black text-slate-800">{cabin.paid_sessions}</p>
         </div>
         <div className="space-y-1 border-x border-slate-100 px-4">
            <div className="flex items-center gap-1.5">
               <Activity size={11} className="text-amber-500" />
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TEST / DİĞER</p>
            </div>
            <p className="text-xl font-black text-slate-700">{testSessions}</p>
         </div>
         <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-1.5">
               <Target size={11} className="text-indigo-500" />
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">DÖNÜŞÜM</p>
            </div>
            <p className="text-xl font-black text-slate-900">%{cabin.conversion_rate?.toFixed(0)}</p>
         </div>
      </div>

      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((cabin.paid_sessions / Math.max(1, cabin.incoming_customer_count)) * 100, 100)}%` }}
            className={`h-full bg-${highlight}-500 shadow-[0_0_8px_rgba(30,58,138,0.2)]`}
            style={{ backgroundColor: highlight === 'indigo' ? '#4f46e5' : '#10b981' }}
         />
      </div>

      {/* Detail overlay on hover */}
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Birim Seans: ₺{(cabin.avg_revenue_per_session || 0).toFixed(1)}</span>
         <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200">ID: {cabin.id}</span>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl text-center">
       <AlertCircle className="mx-auto text-slate-300 mb-3" size={24} />
       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{text}</p>
    </div>
  );
}
