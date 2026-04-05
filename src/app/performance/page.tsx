import { getActiveLocations } from '@/features/ledger/actions';
import { getDailyPerformanceHistory } from '@/features/ledger/performance-actions';
import DailyPerformanceForm from '@/features/ledger/components/DailyPerformanceForm';
import { 
  TrendingUp, BarChart3, 
  Calendar, CheckCircle2, 
  Settings, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as motion from "framer-motion/client";

export const metadata = {
  title: 'Performans Girişi — NextGenBox',
};

export default async function PerformancePage(props: {
  searchParams: Promise<{ location?: string }>
}) {
  const searchParams = await props.searchParams;
  const filterLocation = searchParams.location || 'all';

  const locations = await getActiveLocations();
  
  // Fetch history for selected location or first available
  const historyLocId = filterLocation === 'all' ? (locations[0]?.id || '') : filterLocation;
  const history = await getDailyPerformanceHistory(historyLocId);

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg inline-block mb-2">Operasyonel Kayıtlar</span>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-slate-400" />
            Performans Yönetimi
          </h1>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
             <CheckCircle2 size={14} className="shrink-0" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Manuel Mod Aktif</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-5">
           <DailyPerformanceForm locations={locations} />

           <div className="mt-6 premium-card p-5 border border-slate-200 bg-slate-50/50">
             <div className="flex items-center gap-3 mb-3">
               <Settings className="w-4 h-4 text-slate-400" />
               <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">Veri Kılavuzu</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
               Girdiğiniz günlük veriler otomatik olarak ilgili ayın finansal tablosuna (Nakit Akışı) yansıtılır. 
               Hatalı girişleri geçmiş listesinden düzeltebilirsiniz.
             </p>
           </div>
        </section>

        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Giriş Geçmişi
            </h2>
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
              {locations.map(loc => (
                <a 
                  key={loc.id} 
                  href={`?location=${loc.id}`}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                    historyLocId === loc.id ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {loc.name.split(' ')[0]}
                </a>
              ))}
            </div>
          </div>

          <div className="premium-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th className="text-center">Oturum</th>
                  <th className="text-center">Test</th>
                  <th className="text-right">Ekstra</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((row, idx) => (
                    <motion.tr 
                      key={row.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: idx * 0.03 }}
                    >
                      <td>
                        <span className="text-sm font-semibold text-slate-900">
                          {new Date(row.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge-blue text-xs font-mono">{row.sessionCount}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge-zinc text-xs font-mono">{row.testCount}</span>
                      </td>
                      <td className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 italic">
                          {row.extraMetrics && Object.keys(row.extraMetrics).length > 0 ? `${Object.keys(row.extraMetrics).length} metrik` : '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 transition-colors">
                           <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                       <div className="flex flex-col items-center gap-2 opacity-30 text-slate-400">
                         <BarChart3 size={40} />
                         <p className="text-sm font-semibold italic">Henüz veri girişi yapılmadı.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
