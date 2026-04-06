'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs } from '@/features/audit/actions';
import { Activity, Shield, Clock, Globe, Search, ChevronDown, ChevronUp, Calendar, FilterX } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/SettingsProvider';

export function AuditLogSearch({ onSearch }: { onSearch: (val: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm transition-all group w-full md:w-80"
      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(47,107,255,0.4)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(47,107,255,0.1)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = ''; }}
    >
      <Search className="w-4 h-4 text-slate-400 transition-colors" />
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
    <div className="page-wrapper max-w-7xl mx-auto p-4 md:p-8 pt-12 space-y-8 animate-fade-in relative z-10 text-slate-900 bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border flex items-center gap-2"
              style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}
            >
              <Activity className="w-3 h-3" />
              SİSTEM GÜVENLİK MERKEZİ
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tighter" style={{ color: '#1E2A44' }}>
             <Shield className="w-10 h-10 drop-shadow-[0_0_15px_rgba(47,107,255,0.2)]" style={{ color: '#2F6BFF' }} />
             Sistem Log <span style={{ color: '#2F6BFF' }}>Kayıtları</span>
          </h1>
          <p className="text-base text-slate-500 font-medium max-w-xl leading-relaxed">
            Sistem üzerindeki her türlü veri değişikliği, kullanıcı aksiyonu ve kritik olayları <span className="font-bold underline underline-offset-4" style={{ color: '#2F6BFF', textDecorationColor: 'rgba(47,107,255,0.3)' }}>şeffaf ve takip edilebilir</span> şekilde izleyin.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full lg:w-auto">
           <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl group w-full xl:w-auto shadow-sm transition-all focus-within:border-blue-400">
             <Calendar className="w-4 h-4 text-slate-400" />
             <input 
               type="date" 
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
               className="bg-transparent border-none outline-none text-sm text-slate-700 font-medium cursor-pointer [color-scheme:light] w-full"
             />
           </div>
           <AuditLogSearch onSearch={setSearchQuery} />
           <div className="flex flex-wrap gap-1.5 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl shadow-sm">
              {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map((act) => (
                <button 
                  key={act}
                  onClick={() => setFilterAction(act)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-[0.1em] italic flex-1 sm:flex-none",
                    filterAction === act 
                      ? "bg-white shadow-sm border border-slate-200 translate-y-[-1px]" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  )}
                  style={filterAction === act ? { color: '#2F6BFF' } : {}}
                >
                  {act === 'ALL' ? 'TÜMÜ' : act === 'CREATE' ? 'EKLEME' : act === 'UPDATE' ? 'GÜNCELLEME' : 'SİLME'}
                </button>
              ))}
           </div>
           {(filterAction !== 'ALL' || searchQuery || dateFilter) && (
             <button
               onClick={() => { setFilterAction('ALL'); setSearchQuery(''); setDateFilter(''); }}
               className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 text-[11px] font-black uppercase tracking-wider"
             >
               <FilterX size={14} />
               Temizle
             </button>
           )}
        </div>
      </header>

      {/* Logs Card */}
      <section className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 space-y-4">
          {filteredLogs.map((log, idx) => {
            const { display, technical } = formatDetails(log.details);
            const isExpanded = expandedId === log.id;

            return (
              <motion.article
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.01 }}
                onClick={() => technical && setExpandedId(isExpanded ? null : log.id)}
                className={cn(
                  "rounded-2xl border p-4 md:p-5 transition-all",
                  technical ? "cursor-pointer" : "cursor-default",
                  isExpanded ? "bg-slate-50 border-blue-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic",
                      log.action === 'CREATE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      log.action === 'UPDATE' ? "bg-blue-50 text-blue-600 border-blue-200" :
                      "bg-rose-50 text-rose-600 border-rose-200"
                    )}>
                      {log.action}
                    </span>
                    <span className="font-black text-slate-900 text-xs italic uppercase tracking-tight">{log.entity}</span>
                    <span className="text-[10px] text-slate-400 font-medium">ID: {log.entityId.slice(0, 8)}...</span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-xs font-black text-slate-900 italic tracking-tighter">
                        {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-700 leading-relaxed tracking-tight break-words">{display}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 text-slate-500 min-w-0">
                    <Globe size={14} style={{ color: '#2F6BFF' }} />
                    <span className="text-xs font-bold font-mono tracking-tight break-all">{log.ipAddress || '127.0.0.1'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate md:text-right" title={log.userAgent}>
                    {log.userAgent}
                  </span>
                </div>

                {technical && settings.SETTING_LOG_DETAIL_LEVEL === 1 && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1" style={{ color: '#2F6BFF' }}>
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
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-inner overflow-x-auto">
                        <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(JSON.parse(technical), null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-24 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
                  <Search size={32} className="text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Log Kaydı Bulunamadı</p>
                  <p className="text-xs font-medium text-slate-400">Seçili kriterlere uygun herhangi bir kayıt mevcut değil.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="px-4 md:px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 md:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sistem İzleme Aktif</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Toplam {filteredLogs.length} Kayıt Listeleniyor</span>
          </div>
          <p className="text-[10px] font-medium text-slate-400 italic">NextGenBox Akıllı Güvenlik Paketi v2.0</p>
        </div>
      </section>
    </div>
  );
}
