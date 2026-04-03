import { kabinRapor, CabinData } from '@/lib/kabinRapor'
import Link from 'next/link'
import * as motion from "framer-motion/client";
import { 
  Activity, 
  Search, 
  MapPin, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  AlertCircle,
  Timer,
  ChevronRight,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic'

interface DashboardTotals {
  total_revenue: number;
  total_paid_sessions: number;
}

interface ChartData {
  series: {
    date: string;
    revenue: number;
    sessions: number;
  }[];
}

export default async function KabinDashboard(props: {
  searchParams: Promise<{ location?: string; search?: string; range?: string; sortBy?: string }>
}) {
  const searchParams = await props.searchParams
  const selectedLocation = searchParams.location || 'all'
  const searchQuery = (searchParams.search || '').toLowerCase()
  const selectedRange = searchParams.range || 'Bugün'
  const sortBy = searchParams.sortBy || 'name'

  let totalStats: DashboardTotals | null = null
  let cabins: CabinData[] = []
  let errorMsg = null

  try {
    const [totals, fetchedCabins] = await Promise.all([
      kabinRapor.getDashboardTotals(selectedRange),
      kabinRapor.getCabins()
    ])
    totalStats = totals as DashboardTotals
    cabins = fetchedCabins as CabinData[]
  } catch (error: any) {
    errorMsg = 'Kabin Rapor servisinden veri alınamadı.'
    console.error(error)
  }

  // Filtering Logic
  let filteredCabins = cabins ? cabins.filter((cabin: CabinData) => {
    const matchesLocation = 
      selectedLocation === 'all' || 
      (selectedLocation === 'bursa' && cabin.cabin_name.toLowerCase().includes('bursa')) ||
      (selectedLocation === 'izmir' && (cabin.cabin_name.toLowerCase().includes('izmir') || cabin.cabin_name.toLowerCase().includes('mavibahçe') || cabin.cabin_name.toLowerCase().includes('mavibahce')));
    
    const matchesSearch = 
      !searchQuery || 
      cabin.cabin_name.toLowerCase().includes(searchQuery) || 
      cabin.cabin_location.toLowerCase().includes(searchQuery);

    return matchesLocation && matchesSearch;
  }) : [];

  // Sorting Logic
  filteredCabins.sort((a, b) => {
    if (sortBy === 'revenue') return (b.today_revenue || 0) - (a.today_revenue || 0);
    if (sortBy === 'sessions') return (b.paid_sessions || 0) - (a.paid_sessions || 0);
    return a.cabin_name.localeCompare(b.cabin_name);
  });

  const filteredRevenue = filteredCabins.reduce((acc: number, curr: CabinData) => acc + (curr.today_revenue || 0), 0);
  const filteredSessions = filteredCabins.reduce((acc: number, curr: CabinData) => acc + (curr.paid_sessions || 0), 0);
  const avgRevenuePerSession = filteredSessions > 0 ? filteredRevenue / filteredSessions : 0;

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-[2px] bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
              Live Monitoring System
            </span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter heading-elite leading-tight">
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
             <div className="px-6 py-3 rounded-2xl glass-panel flex items-center gap-4 shadow-xl">
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase">Status</span>
                 <span className="text-sm font-black text-emerald-400">DATA STREAMING</span>
               </div>
               <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
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
          <p className="text-zinc-500 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-[0.2em]">
            {errorMsg}
          </p>
          <Link 
            href="/kabin"
            className="elite-button-primary inline-flex py-4 px-12"
          >
            SİSTEMİ YENİDEN YÜKLE
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-12">
          {/* Controls & Filters */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
             <div className="xl:col-span-8 space-y-8">
                <div className="flex flex-wrap items-center gap-6">
                   <div className="glass-panel p-1.5 flex gap-1 rounded-2xl">
                      {[
                        { id: 'all', label: 'TÜMÜ' },
                        { id: 'bursa', label: 'BURSA' },
                        { id: 'izmir', label: 'İZMİR' }
                      ].map((loc) => {
                        const isActive = selectedLocation === loc.id;
                        return (
                          <Link
                            key={loc.id}
                            href={`/kabin?location=${loc.id}&range=${selectedRange}&search=${searchQuery}&sortBy=${sortBy}`}
                            className={cn(
                              "px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all",
                              isActive 
                                ? "bg-white text-zinc-950 shadow-2xl scale-105" 
                                : "text-zinc-500 hover:text-white"
                            )}
                          >
                            {loc.label}
                          </Link>
                        );
                      })}
                   </div>

                   <div className="glass-panel p-1.5 flex gap-1 rounded-2xl">
                    {['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay'].map((range) => {
                      const isActive = selectedRange === range;
                      return (
                        <Link
                          key={range}
                          href={`/kabin?location=${selectedLocation}&range=${range}&search=${searchQuery}&sortBy=${sortBy}`}
                          className={cn(
                            "px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all",
                            isActive 
                              ? "bg-zinc-800 text-emerald-400" 
                              : "text-zinc-500 hover:text-white"
                          )}
                        >
                          {range.toUpperCase()}
                        </Link>
                      );
                    })}
                   </div>
                </div>

                <div className="relative group">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                   <form action="/kabin" method="GET">
                      <input type="hidden" name="location" value={selectedLocation} />
                      <input type="hidden" name="range" value={selectedRange} />
                      <input type="hidden" name="sortBy" value={sortBy} />
                      <input 
                        type="text" 
                        name="search"
                        defaultValue={searchQuery}
                        placeholder="KABİN ADI VEYA LOKASYON İLE ARA..."
                        className="w-full elite-input pl-16 py-6 bg-zinc-900/50 border-white/5 focus:border-white/10"
                      />
                   </form>
                </div>
             </div>

             <div className="xl:col-span-4 glass-panel p-6 rounded-[2rem] space-y-6">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">İstatistikleri Sırala</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'name', label: 'İSİM' },
                    { id: 'revenue', label: 'CİRO' },
                    { id: 'sessions', label: 'SEANS' }
                  ].map((it) => (
                    <Link
                      key={it.id}
                      href={`/kabin?location=${selectedLocation}&range=${selectedRange}&search=${searchQuery}&sortBy=${it.id}`}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black tracking-widest text-center border transition-all",
                        sortBy === it.id 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-white/5 border-transparent text-zinc-500 hover:text-white"
                      )}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
             </div>
          </section>

          {/* Aggregate Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="premium-card p-10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                   <TrendingUp size={120} strokeWidth={1} />
                </div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   {selectedRange.toUpperCase()} BRÜT CİRO
                </p>
                <div className="flex items-end gap-3 mb-6">
                   <span className="text-5xl font-black text-white tracking-tighter">₺{filteredRevenue.toLocaleString('tr-TR')}</span>
                   <span className="text-zinc-500 font-bold mb-2 uppercase text-[10px]">Toplam</span>
                </div>
                <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 w-fit text-[10px] font-black tracking-widest text-zinc-400">
                   {filteredSessions} ÜCRETLİ SEANS
                </div>
             </div>

             <div className="premium-card p-10 bg-zinc-950 border-white/5 relative overflow-hidden group">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Monitor size={14} />
                   AKTİF TERMİNALLER
                </p>
                <div className="flex items-end gap-3 mb-8">
                   <span className="text-5xl font-black text-white tracking-tighter">{filteredCabins.length}</span>
                   <span className="text-zinc-500 font-bold mb-2 uppercase text-[10px]">Birim</span>
                </div>
                <div className="flex -space-x-3">
                   {filteredCabins.slice(0, 5).map((c, i) => (
                      <div key={i} className="w-10 h-10 rounded-xl bg-zinc-900 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                        {c.cabin_name.charAt(0)}
                      </div>
                   ))}
                   {filteredCabins.length > 5 && (
                      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white border-2 border-zinc-950 shadow-xl">
                        +{filteredCabins.length - 5}
                      </div>
                   )}
                </div>
             </div>

             <div className="premium-card p-10 bg-zinc-950 border-white/5 relative overflow-hidden group">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Timer size={14} />
                   ORTALAMA SEANS DEĞERİ
                </p>
                <div className="flex items-end gap-3 mb-6">
                   <span className="text-5xl font-black text-white tracking-tighter">₺{Math.round(avgRevenuePerSession).toLocaleString('tr-TR')}</span>
                   <span className="text-zinc-500 font-bold mb-2 uppercase text-[10px]">/ 15 DK</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min((avgRevenuePerSession / 500) * 100, 100)}%` }}
                     className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                   />
                </div>
             </div>
          </section>

          {/* Cabin Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 pb-20">
             {filteredCabins.map((cabin: CabinData, index: number) => (
               <motion.div 
                 key={cabin.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
                 className="premium-card p-10 hover:border-emerald-500/20 group relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-all pointer-events-none">
                    <Monitor size={180} />
                 </div>

                 <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="space-y-3">
                       <span className="px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-widest uppercase">
                          {cabin.cabin_name.includes('Bursa') ? 'Bursa' : 'İzmir'}
                       </span>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">{cabin.cabin_name}</h2>
                       <div className="flex items-center gap-2 text-zinc-500">
                          <MapPin size={12} className="text-zinc-700" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{cabin.cabin_location}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">CIRO</p>
                       <p className="text-3xl font-black text-white">₺{cabin.today_revenue?.toLocaleString('tr-TR')}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5 relative z-10">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">SEANS</p>
                       <p className="text-xl font-black text-white">{cabin.paid_sessions}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">MÜŞTERİ</p>
                       <p className="text-xl font-black text-white">{cabin.incoming_customer_count}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">VERİMLİLİK</p>
                       <p className="text-xl font-black text-emerald-400">%{Math.round(((cabin.paid_sessions || 0) / 40) * 100)}</p>
                    </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-white/[0.02] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500" />
                       REALTIME UPDATE
                    </span>
                    <ChevronRight size={16} className="text-zinc-700" />
                 </div>
               </motion.div>
             ))}

             {filteredCabins.length === 0 && (
               <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[4rem] text-center opacity-30">
                  <Search size={64} className="mx-auto mb-6 text-zinc-600" />
                  <p className="text-xl font-black uppercase tracking-widest">EŞLEŞEN KABİN BULUNAMADI</p>
                  <p className="text-xs font-bold mt-2">Arama kriterlerini veya filtreleri değiştirin.</p>
               </div>
             )}
          </section>
        </div>
      )}
    </div>
  )
}

