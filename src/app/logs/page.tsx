'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs } from '@/features/audit/actions';
import { Activity, Shield, Clock, Globe, Filter, Search, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/SettingsProvider';

export function AuditLogSearch({ onSearch }: { onSearch: (val: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl focus-within:border-blue-400 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all group w-full md:w-80">
      <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
      <input 
        type="text" 
        placeholder="Loglarda ara (id, ip, detay...)"
        onChange={(e) => onSearch(e.target.value)}
        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium"
      />
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const { settings } = useSettings();

  useEffect(() => {
    async function fetchLogs() {
      const data = await getAuditLogs();
      setLogs(data || []);
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (dateFilter && !log.createdAt.startsWith(dateFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details ? log.details.toLowerCase().includes(q) : false;
      const matchEntity = log.entity?.toLowerCase().includes(q);
      const matchIp = log.ipAddress?.toLowerCase().includes(q);
      if (!matchDetails && !matchEntity && !matchIp) return false;
    }
    return true;
  });

  const formatDetails = (details: string | null) => {
    if (!details) return { display: '-', technical: null };
    if (details.includes('| Veri:')) {
      const [display, technical] = details.split('| Veri:');
      return { display: display.trim(), technical: technical.trim() };
    }
    return { display: details, technical: null };
  };

  return (
    <div className="page-wrapper space-y-10 animate-fade-in py-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              SİSTEM GÜVENLİK MERKEZİ
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tighter">
             <Shield className="w-10 h-10 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
             Sistem Log <span className="text-blue-600">Kayıtları</span>
          </h1>
          <p className="text-base text-slate-500 font-medium max-w-xl leading-relaxed">
            Sistem üzerindeki her türlü veri değişikliği, kullanıcı aksiyonu ve kritik olayları <span className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">şeffaf ve takip edilebilir</span> şekilde izleyin.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto">
           <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl group w-full md:w-auto">
             <Calendar className="w-4 h-4 text-slate-400" />
             <input 
               type="date" 
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
               className="bg-transparent border-none outline-none text-sm text-slate-700 font-medium cursor-pointer [color-scheme:light]"
             />
           </div>
           <AuditLogSearch onSearch={setSearchQuery} />
           <div className="flex gap-1.5 bg-slate-100/50 border border-slate-200 p-1.5 rounded-2xl backdrop-blur-sm overflow-x-auto no-scrollbar">
              {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map((act) => (
                <button 
                  key={act}
                  onClick={() => setFilterAction(act)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-[0.1em] italic",
                    filterAction === act 
                      ? "bg-white text-blue-600 shadow-md border border-blue-100 translate-y-[-1px]" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  {act === 'ALL' ? 'TÜMÜ' : act === 'CREATE' ? 'EKLEME' : act === 'UPDATE' ? 'GÜNCELLEME' : 'SİLME'}
                </button>
              ))}
           </div>
        </div>
      </header>

      {/* Logs Card */}
      <section className="bg-white rounded-[32px] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">İşlem Tipi</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Varlık</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">İşlem Detayları</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Erişim Bilgisi</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-right">Zaman Damgası</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log, idx) => {
                const { display, technical } = formatDetails(log.details);
                const isExpanded = expandedId === log.id;

                return (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className={cn(
                      "group transition-all cursor-pointer",
                      isExpanded ? "bg-blue-50/30" : "hover:bg-slate-50/50"
                    )}
                    onClick={() => technical && setExpandedId(isExpanded ? null : log.id)}
                  >
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic",
                        log.action === 'CREATE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        log.action === 'UPDATE' ? "bg-blue-50 text-blue-600 border-blue-200" :
                        "bg-rose-50 text-rose-600 border-rose-200"
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-xs italic uppercase tracking-tight">{log.entity}</span>
                        <span className="text-[10px] text-slate-400 font-medium">ID: {log.entityId.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-lg">
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold text-slate-700 leading-relaxed tracking-tight underline decoration-slate-100 underline-offset-4">
                          {display}
                        </p>
                        {technical && settings.SETTING_LOG_DETAIL_LEVEL === 1 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              {isExpanded ? 'TEKNİK VERİYİ GİZLE' : 'TEKNİK VERİYİ GÖSTER'}
                            </span>
                          </div>
                        )}
                        <AnimatePresence>
                          {isExpanded && technical && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden no-scrollbar"
                            >
                              <div className="mt-3 p-4 rounded-2xl bg-white border border-blue-100 shadow-inner">
                                <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap break-all leading-relaxed">
                                  {JSON.stringify(JSON.parse(technical), null, 2)}
                                </pre>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Globe size={14} className="text-blue-400" />
                          <span className="text-xs font-bold font-mono tracking-tight">{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 max-w-[140px] truncate" title={log.userAgent}>
                          {log.userAgent}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <Clock size={14} />
                          <span className="text-xs font-black text-slate-700 italic tracking-tighter">
                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                       <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <Search size={32} className="text-slate-200" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Log Kaydı Bulunamadı</p>
                          <p className="text-xs font-medium text-slate-400">Seçili kriterlere uygun herhangi bir kayıt mevcut değil.</p>
                       </div>
                       {(filterAction !== 'ALL' || searchQuery || dateFilter) && (
                         <button 
                           onClick={() => { setFilterAction('ALL'); setSearchQuery(''); setDateFilter(''); }}
                           className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                         >
                           FİLTRELERİ TEMİZLE
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sistem İzleme Aktif</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Toplam {filteredLogs.length} Kayıt Listeleniyor</span>
          </div>
          <p className="text-[10px] font-medium text-slate-300 italic">NextGenBox Akıllı Güvenlik Paketi v2.0</p>
        </div>
      </section>
    </div>
  );
}
