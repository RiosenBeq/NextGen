import { kabinRapor, CabinData } from '@/lib/kabinRapor'
import Link from 'next/link'

// Revalidate 0 forces dynamic server rendering for 'anlık' (live) data fetching
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
  let chartData: ChartData | null = null
  let errorMsg = null

  try {
    // Ensure we fetch DIRECTLY from the service for real-time data
    const [totals, fetchedCabins, fetchedChart] = await Promise.all([
      kabinRapor.getDashboardTotals(selectedRange),
      kabinRapor.getCabins(),
      kabinRapor.getLast7Graph()
    ])
    totalStats = totals as DashboardTotals
    cabins = fetchedCabins as CabinData[]
    chartData = fetchedChart as ChartData
  } catch (error: any) {
    errorMsg = 'Kabin Rapor servisinden veri alınamadı. Lütfen giriş bilgilerini kontrol edin.'
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

  // Calculate stats for filtered view
  const filteredRevenue = filteredCabins.reduce((acc: number, curr: CabinData) => acc + (curr.today_revenue || 0), 0);
  const filteredSessions = filteredCabins.reduce((acc: number, curr: CabinData) => acc + (curr.paid_sessions || 0), 0);
  const filteredCustomers = filteredCabins.reduce((acc: number, curr: CabinData) => acc + (curr.incoming_customer_count || 0), 0);
  
  const avgRevenuePerSession = filteredSessions > 0 ? filteredRevenue / filteredSessions : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Kabin Rapor <span className="text-blue-600">Canlı İzleme</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium max-w-xl">
            OsesSensin sisteminden alınan anlık ciro ve durum bilgileri. Detaylı filtreleme ve istatistiklerle verimli analiz yapın.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-emerald-600 font-bold bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 md:self-end shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          Veri Bağlantısı Aktif
        </div>
      </div>

      {errorMsg ? (
        <div className="bg-white border-2 border-red-100 rounded-[3rem] p-16 text-center shadow-2xl shadow-red-500/5 max-w-2xl mx-auto my-12">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Veri Bağlantı Kesintisi</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            {errorMsg}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20"
          >
            Sistemi Yenile
          </button>
        </div>
      ) : (
        <>
          {/* Advanced Filtering UI */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/20">
              <div className="flex p-1 bg-gray-50 rounded-3xl w-full md:w-auto overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Tüm Lokasyonlar' },
                  { id: 'bursa', label: 'Bursa' },
                  { id: 'izmir', label: 'İzmir' }
                ].map((loc) => (
                  <Link
                    key={loc.id}
                    href={`/kabin?location=${loc.id}&range=${selectedRange}&search=${searchQuery}&sortBy=${sortBy}`}
                    scroll={false}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                      selectedLocation === loc.id 
                      ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                      : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {loc.label}
                  </Link>
                ))}
              </div>

              <div className="relative w-full md:w-96 px-4 md:px-0 pr-4">
                <form action="/kabin" method="GET" className="relative">
                  <input type="hidden" name="location" value={selectedLocation} />
                  <input type="hidden" name="range" value={selectedRange} />
                  <input type="hidden" name="sortBy" value={sortBy} />
                  <input 
                    type="text" 
                    name="search"
                    defaultValue={searchQuery}
                    placeholder="Kabin veya lokasyon ara..."
                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </form>
              </div>
            </div>

            {/* Range and Sort Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex p-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                {['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay'].map((range) => (
                  <Link
                    key={range}
                    href={`/kabin?location=${selectedLocation}&range=${range}&search=${searchQuery}&sortBy=${sortBy}`}
                    scroll={false}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      selectedRange === range 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {range}
                  </Link>
                ))}
              </div>

              <div className="flex p-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <span className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest self-center border-r border-gray-100 mr-1">Sırala:</span>
                {[
                  { id: 'name', label: 'İsim' },
                  { id: 'revenue', label: 'Ciro' },
                  { id: 'sessions', label: 'Seans' }
                ].map((sort) => (
                  <Link
                    key={sort.id}
                    href={`/kabin?location=${selectedLocation}&range=${selectedRange}&search=${searchQuery}&sortBy=${sort.id}`}
                    scroll={false}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      sortBy === sort.id 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {sort.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ciro Kartı */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-gray-900/10 text-white relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-slate-400 font-black mb-4 uppercase tracking-[0.2em] text-[10px]">{selectedRange} Toplam Ciro</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black tracking-tighter">
                  ₺{filteredRevenue.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="mt-6">
                <div className="inline-flex bg-white/5 backdrop-blur-xl px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/5">
                  {filteredSessions} Ücretli Seans
                </div>
              </div>
            </div>

            {/* Ortalama Gelir */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-emerald-100 transition-all">
              <div>
                <h3 className="text-gray-400 font-black mb-4 uppercase tracking-[0.2em] text-[10px] group-hover:text-emerald-500 transition-colors">Ort. Seans Geliri</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-gray-900">
                    ₺{Math.round(avgRevenuePerSession).toLocaleString('tr-TR')}
                  </span>
                  <span className="text-gray-400 font-bold text-sm">/seans</span>
                </div>
              </div>
              <div className="mt-6">
                <div className={`h-1.5 w-full bg-gray-50 rounded-full overflow-hidden`}>
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min((avgRevenuePerSession / 500) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Kabin Sayısı */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-slate-800 transition-all">
              <div>
                <h3 className="text-gray-400 font-black mb-4 uppercase tracking-[0.2em] text-[10px]">Aktif Terminaller</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-gray-900">
                    {filteredCabins.length}
                  </span>
                  <span className="text-gray-400 font-bold text-sm">Kabin</span>
                </div>
              </div>
              <div className="mt-6 flex -space-x-3">
                {filteredCabins.slice(0, 4).map((c: CabinData, i: number) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center font-bold text-[8px] text-gray-500 shadow-sm group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    {c.cabin_name.charAt(0)}
                  </div>
                ))}
                {filteredCabins.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center font-bold text-[8px] text-white shadow-sm">
                    +{filteredCabins.length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Individual Cabins List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCabins.map((cabin: CabinData) => (
              <div key={cabin.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg className="w-24 h-24 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                  </svg>
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.1em] mb-3">
                      {cabin.cabin_name.includes('Bursa') ? 'Bursa' : 'İzmir'} Lokasyonu
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{cabin.cabin_name}</h2>
                    <p className="text-gray-400 font-medium text-sm mt-1">{cabin.cabin_location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{selectedRange} Ciro</div>
                    <div className="text-3xl font-black text-emerald-600">₺{cabin.today_revenue?.toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-gray-50">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Seans</div>
                    <div className="text-lg font-black text-gray-900">{cabin.paid_sessions}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Müşteri</div>
                    <div className="text-lg font-black text-gray-900">{cabin.incoming_customer_count}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Ort. Gelir</div>
                    <div className="text-lg font-black text-gray-900">₺{Math.round(cabin.avg_revenue_per_session || 0)}</div>
                  </div>
                </div>
              </div>
            ))}
            {(!filteredCabins || filteredCabins.length === 0) && (
              <div className="lg:col-span-2 bg-gray-50 rounded-[2rem] p-16 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <div className="text-gray-400 font-black text-xl uppercase tracking-widest">Sonuç Bulunamadı</div>
                <p className="text-gray-400 mt-2 font-medium">Arama kriterlerinizi veya filtrelerinizi değiştirmeyi deneyin.</p>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  )
}

