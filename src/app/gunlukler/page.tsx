'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuditLogs } from '@/features/audit/actions';
import {
  Activity,
  Shield,
  Search,
  Calendar,
  FilterX,
  Clock3,
  Globe,
  ChevronDown,
  ChevronUp,
  Database,
  Pencil,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/SettingsProvider';

type AuditLog = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  entity: string;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

const actionMeta = {
  CREATE: {
    label: 'Oluşturma',
    icon: Database,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    side: 'before:bg-emerald-500',
  },
  UPDATE: {
    label: 'Güncelleme',
    icon: Pencil,
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    side: 'before:bg-blue-500',
  },
  DELETE: {
    label: 'Silme',
    icon: Trash2,
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    side: 'before:bg-rose-500',
  },
} as const;

function parseDetails(details: string | null) {
  if (!details) return { display: '-', technical: null as string | null };
  if (!details.includes('| Veri:')) return { display: details, technical: null as string | null };
  const [display, technical] = details.split('| Veri:');
  return { display: display.trim(), technical: technical.trim() };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    async function fetchLogs() {
      const data = await getAuditLogs();
      setLogs((data || []) as AuditLog[]);
    }
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterAction !== 'ALL' && log.action !== filterAction) return false;
      if (dateFilter && !log.createdAt.startsWith(dateFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inDetails = log.details?.toLowerCase().includes(q);
        const inEntity = log.entity?.toLowerCase().includes(q);
        const inIp = log.ipAddress?.toLowerCase().includes(q);
        if (!inDetails && !inEntity && !inIp) return false;
      }
      return true;
    });
  }, [logs, filterAction, dateFilter, searchQuery]);

  const summary = useMemo(() => {
    const total = filteredLogs.length;
    const createCount = filteredLogs.filter((l) => l.action === 'CREATE').length;
    const updateCount = filteredLogs.filter((l) => l.action === 'UPDATE').length;
    const deleteCount = filteredLogs.filter((l) => l.action === 'DELETE').length;
    return { total, createCount, updateCount, deleteCount };
  }, [filteredLogs]);

  const clearFilters = () => {
    setFilterAction('ALL');
    setSearchQuery('');
    setDateFilter('');
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 pb-20 md:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 shadow-sm">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
              <Shield className="h-3.5 w-3.5" />
              Güvenlik İzleme Merkezi
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Sistem Log Kayıtları</h1>
            <p className="max-w-2xl text-sm text-slate-500 md:text-base">
              Tüm kritik operasyonları, kullanıcı aksiyonlarını ve veri değişikliklerini tek bir profesyonel görünümde takip edin.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
            <SummaryCard label="Toplam" value={summary.total} tone="slate" />
            <SummaryCard label="Oluşturma" value={summary.createCount} tone="emerald" />
            <SummaryCard label="Güncelleme" value={summary.updateCount} tone="blue" />
            <SummaryCard label="Silme" value={summary.deleteCount} tone="rose" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Loglarda ara: varlık, detay, IP..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none [color-scheme:light]"
              />
            </div>

            {(['ALL', 'CREATE', 'UPDATE', 'DELETE'] as const).map((action) => (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all',
                  filterAction === action
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                {action === 'ALL' ? 'Tümü' : action}
              </button>
            ))}

            {(filterAction !== 'ALL' || searchQuery || dateFilter) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:text-blue-600"
              >
                <FilterX className="h-4 w-4" />
                Temizle
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {filteredLogs.map((log, idx) => {
          const { display, technical } = parseDetails(log.details);
          const isExpanded = expandedId === log.id;
          const meta = actionMeta[log.action as keyof typeof actionMeta] || actionMeta.UPDATE;
          const ActionIcon = meta.icon;

          return (
            <motion.article
              key={log.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.01 }}
              className={cn(
                'relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:rounded-l-2xl',
                meta.side,
                technical ? 'cursor-pointer' : 'cursor-default'
              )}
              onClick={() => technical && setExpandedId(isExpanded ? null : log.id)}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider', meta.chip)}>
                    <ActionIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">{log.entity}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{log.entityId.slice(0, 10)}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(log.createdAt).toLocaleDateString('tr-TR')} {new Date(log.createdAt).toLocaleTimeString('tr-TR')}
                  </span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-700 break-words">{display}</p>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 md:grid-cols-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <Globe className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-mono break-all">{log.ipAddress || '127.0.0.1'}</span>
                </span>
                <span className="truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-right" title={log.userAgent || ''}>
                  {log.userAgent || '-'}
                </span>
              </div>

              {technical && settings.SETTING_LOG_DETAIL_LEVEL === 1 && (
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-blue-600">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isExpanded ? 'Teknik veriyi gizle' : 'Teknik veriyi göster'}
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
                    <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
                      {JSON.stringify(JSON.parse(technical), null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <Activity className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-700">Seçili filtrelere uygun log kaydı bulunamadı.</p>
            <p className="mt-1 text-xs text-slate-500">Filtreleri temizleyerek tüm kayıtları tekrar görebilirsiniz.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'blue' | 'rose' }) {
  const classes = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className={cn('rounded-2xl border px-4 py-3', classes[tone])}>
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
    </div>
  );
}
