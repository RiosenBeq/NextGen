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
    <div className="page-wrapper space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100">Security Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
             <Shield className="w-6 h-6 text-slate-400" />
             Sistem Log Kayıtları
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-lg">
            Veri tabanı değişikliklerini, kullanıcı aksiyonlarını ve sistem olaylarını anlık olarak takip edin.
          </p>
        </div>

        <div className="flex gap-1.5 bg-slate-100 border border-slate-200 p-1.5 rounded-xl">
           {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map((act) => (
             <button 
               key={act}
               onClick={() => setFilterAction(act)}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                 filterAction === act ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
               )}
             >
               {act === 'ALL' ? 'TÜMÜ' : act === 'CREATE' ? 'Ekleme' : act === 'UPDATE' ? 'Güncelleme' : 'Silme'}
             </button>
           ))}
        </div>
      </header>

      {/* Logs Table */}
      <section className="premium-card overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">İşlem</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Varlık (Entity)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Detaylar</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">IP Adresi</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, idx) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                      log.action === 'CREATE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      log.action === 'UPDATE' ? "bg-blue-50 text-blue-600 border-blue-200" :
                      "bg-rose-50 text-rose-600 border-rose-200"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-xs">{log.entity}</td>
                  <td className="px-6 py-4 max-w-sm truncate text-slate-500 text-xs font-medium">
                    {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Globe size={14} className="text-slate-400" />
                      <span className="text-[10px] font-semibold font-mono tracking-tight">{log.ipAddress || 'unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-slate-500">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs font-semibold">
                        {new Date(log.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                       <Activity size={32} className="opacity-40" />
                       <p className="text-xs font-bold uppercase tracking-widest">Henüz Kayıtlı Log Bulunmuyor</p>
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
