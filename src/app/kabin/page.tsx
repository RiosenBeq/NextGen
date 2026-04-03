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
  searchParams: Promise<{ location?: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const selectedLocation = searchParams.location || 'all'
  const searchQuery = (searchParams.search || '').toLowerCase()

  let todayTotal: DashboardTotals | null = null
  let cabins: CabinData[] = []
  let chartData: ChartData | null = null
  let errorMsg = null

  try {
    const [totals, fetchedCabins, fetchedChart] = await Promise.all([
      kabinRapor.getDashboardTotals('Bugün'),
      kabinRapor.getCabins(),
      kabinRapor.getLast7Graph()
    ])
    todayTotal = totals as DashboardTotals
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

  // Recalculate stats for filtered view
  const filteredRevenue = filteredCabins.reduce((acc: number, curr: CabinData) => acc + (curr.today_revenue || 0), 0);
  const filteredSessions = filteredCabins.reduce((acc: number, curr: CabinData) => acc + (curr.paid_sessions || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Kabin Rapor <span className="text-blue-600">Canlı İzleme</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium max-w-xl">
            OsesSensin sisteminden alınan anlık ciro ve durum bilgileri. Lokasyon bazlı filtreleme ile verimli analiz yapın.
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
        <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 flex flex-col gap-2">
          <div className="font-black text-lg">⚠️ Bağlantı Hatası</div>
          <div className="font-medium text-red-500 uppercase tracking-wider text-xs">{errorMsg}</div>
        </div>
      ) : (
        <>
          {/* Advanced Filtering UI */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/20">
            <div className="flex p-1 bg-gray-50 rounded-3xl w-full md:w-auto">
              {[
                { id: 'all', label: 'Tüm Lokasyonlar' },
                { id: 'bursa', label: 'Bursa (Zafer Plaza)' },
                { id: 'izmir', label: 'İzmir (Mavibahçe)' }
              ].map((loc) => (
                <Link
                  key={loc.id}
                  href={`/kabin?location=${loc.id}${searchQuery ? `&search=${searchQuery}` : ''}`}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ciro Kartı */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 shadow-2xl shadow-gray-900/10 text-white relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-slate-400 font-black mb-4 uppercase tracking-[0.2em] text-[10px]">Filtrelenmiş Hasılat</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black tracking-tighter">
                  ₺{filteredRevenue.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <div className="bg-white/5 backdrop-blur-xl px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-300 border border-white/5">
                  {filteredSessions} Ücretli Seans
                </div>
                {selectedLocation !== 'all' && (
                  <div className="text-[10px] uppercase font-black tracking-widest text-blue-400">
                    Sadece {selectedLocation === 'bursa' ? 'Bursa' : 'İzmir'}
                  </div>
                )}
              </div>
            </div>

            {/* Kabin Sayısı */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-blue-100 transition-all">
              <div>
                <h3 className="text-gray-400 font-black mb-4 uppercase tracking-[0.2em] text-[10px] group-hover:text-blue-400 transition-colors">Terminaller</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black text-gray-900 group-hover:scale-105 transition-transform">
                    {filteredCabins.length}
                  </span>
                  <span className="text-gray-400 font-bold text-lg">Aktif</span>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex -space-x-4">
                  {filteredCabins.slice(0, 5).map((c: CabinData, i: number) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center font-bold text-[10px] text-gray-500 shadow-sm">
                      {c.cabin_name.charAt(0)}
                    </div>
                  ))}
                  {filteredCabins.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-blue-600 border-4 border-white flex items-center justify-center font-bold text-[10px] text-white shadow-sm">
                      +{filteredCabins.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Son 7 Günlük Toplam */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              <div>
                <h3 className="text-gray-400 font-black mb-4 uppercase tracking-[0.2em] text-[10px]">Haftalık Trend</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black text-slate-800 tracking-tighter">
                    ₺{chartData?.series?.reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0).toLocaleString('tr-TR') || 0}
                  </span>
                </div>
              </div>
              <div className="mt-8 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-400 uppercase">Toplam Seans</div>
                  <div className="text-lg font-black text-slate-900">{chartData?.series?.reduce((acc: number, curr: any) => acc + (curr.sessions || 0), 0) || 0}</div>
                </div>
                <div className="w-24 h-12 flex items-end gap-1 pb-1">
                  {chartData?.series?.slice(-7).map((d: any, i: number) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-blue-100 rounded-t-sm group-hover:bg-blue-600 transition-all duration-500" 
                      style={{ height: `${(d.revenue / 20000) * 100}%`, minHeight: '4px' }}
                    ></div>
                  ))}
                </div>
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
                    <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{cabin.cabin_name}</h2>
                    <p className="text-gray-400 font-medium text-sm mt-1">{cabin.cabin_location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bugünkü Ciro</div>
                    <div className="text-3xl font-black text-emerald-600">₺{cabin.today_revenue?.toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-50">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Ücretli Seans</div>
                    <div className="text-lg font-black text-gray-900">{cabin.paid_sessions}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Gelen Müşteri</div>
                    <div className="text-lg font-black text-gray-900">{cabin.incoming_customer_count}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Kabin Ücreti</div>
                    <div className="text-lg font-black text-gray-900">₺{cabin.cabin_price}</div>
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

