'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs } from '@/features/audit/actions';
import { Activity, Shield, Clock, HardDrive, Smartphone, Monitor, Globe, Filter } from 'lucide-react';
import * as motion from "framer-motion/client";
import { cn } from '@/lib/utils';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  useEffect(() => {
    async function fetchLogs() {
      const data = await getAuditLogs();
      setLogs(data || []);
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10">Security Operations</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <Shield className="w-8 h-8 text-zinc-500" />
             Sistem Log Kayıtları
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Veri tabanı değişikliklerini, kullanıcı aksiyonlarını ve sistem olaylarını anlık olarak takip edin.
          </p>
        </div>

        <div className="flex gap-2 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
           {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map((act) => (
             <button 
               key={act}
               onClick={() => setFilterAction(act)}
               className={cn(
                 "px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase whitespace-nowrap",
                 filterAction === act ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white"
               )}
             >
               {act === 'ALL' ? 'TÜMÜ' : act === 'CREATE' ? 'Ekleme' : act === 'UPDATE' ? 'Güncelleme' : 'Silme'}
             </button>
           ))}
        </div>
      </header>

      {/* Logs Table */}
      <section className="premium-card overflow-hidden border-white/5 bg-zinc-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5">İşlem</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5">Varlık (Entity)</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5">Detaylar</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5">IP Adresi</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 text-right">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredLogs.map((log, idx) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border",
                      log.action === 'CREATE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      log.action === 'UPDATE' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                      "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-zinc-300 text-xs italic">{log.entity}</td>
                  <td className="px-6 py-5 max-w-sm truncate text-zinc-500 text-[11px] font-medium leading-relaxed">
                    {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : '-'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Globe size={12} className="text-zinc-700" />
                      <span className="text-[10px] font-black font-mono tracking-tight">{log.ipAddress || 'unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 text-zinc-400">
                      <Clock size={12} className="text-zinc-600" />
                      <span className="text-[10px] font-bold italic">
                        {new Date(log.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-zinc-600 italic">
                       <Activity size={32} className="opacity-20" />
                       <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Henüz Kayıtlı Log Bulunmuyor</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
