'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  TrendingUp,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal } from './PremiumModal';
import MonthlyPerformanceForm from './MonthlyPerformanceForm';
import { deleteMonthlyPerformance } from '@/features/ledger/performans-actions';
import { toast } from '@/hooks/useToast';

type LocationOption = { id: string; name: string };

type CashFlowRow = {
  id: string;
  month?: string;
  locationName?: string;
  locationId?: string;
  sessionCount: number;
  grossRevenue: number;
  totalExpense: number;
  netCash: number;
};

interface CashFlowClientUIProps {
  locations: LocationOption[];
  initialData: CashFlowRow[];
  filterLocation: string;
}

export default function CashFlowClientUI({ locations, initialData }: CashFlowClientUIProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CashFlowRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu finansal kaydı silmek istediğinize emin misiniz?')) return;

    setIsLoading(true);
    try {
      const res = await deleteMonthlyPerformance(id);
      if (!res.success) toast.error(res.error ?? '');
    } catch {
      toast.error('Silme sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: CashFlowRow) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const currentTotals = {
    revenue: initialData.reduce((s, r) => s + (r.grossRevenue || 0), 0),
    profit: initialData.reduce((s, r) => s + (r.netCash || 0), 0),
    sessions: initialData.reduce((s, r) => s + (r.sessionCount || 0), 0),
  };

  const kpis = [
    { label: 'Toplam Ciro', value: formatCurrency(currentTotals.revenue), icon: TrendingUp },
    { label: 'Net Nakit Akışı', value: formatCurrency(currentTotals.profit), icon: ArrowUpRight, highlight: currentTotals.profit >= 0 },
    { label: 'Toplam Seans', value: currentTotals.sessions.toLocaleString('tr-TR'), icon: CalendarDays },
  ];

  return (
    <div className="space-y-8 sm:space-y-12 md:space-y-16 animate-fade-in">
      {/* KPI's */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="apple-card p-5 sm:p-6 md:p-7"
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              kpi.highlight ? 'bg-[--accent-soft] text-[--accent]' : 'bg-[--bg-elevated] text-[--text-secondary]'
            )}>
              <kpi.icon size={18} strokeWidth={1.75} />
            </div>
            <p className="text-[13px] text-[--text-secondary] mt-5" style={{ letterSpacing: '-0.005em' }}>{kpi.label}</p>
            <h2 className="text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.022em' }}>
              {kpi.value}
            </h2>
          </motion.div>
        ))}
      </section>

      {/* Table */}
      <section className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="apple-eyebrow">Denetim</p>
            <h2 className="apple-title-1 mt-2">Finansal Tablo</h2>
          </div>
          <button
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
            className="elite-button-primary"
          >
            <Plus size={16} strokeWidth={2} />
            Yeni Kayıt
          </button>
        </div>

        <div className="apple-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[--border]">
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Dönem & Şube</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Oturum</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Brüt Ciro</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Gider</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Net Nakit</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border-soft]">
                {initialData.map((row, idx) => (
                  <motion.tr
                    key={row.id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group hover:bg-[--bg-subtle] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{row.month}</span>
                        <span className="text-[12px] text-[--text-tertiary] mt-0.5">{row.locationName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-[14px] tabular-nums text-[--text-secondary]">{row.sessionCount}</td>
                    <td className="px-6 py-5 text-right text-[15px] font-medium tabular-nums text-[--text]">{formatCurrency(row.grossRevenue)}</td>
                    <td className="px-6 py-5 text-right text-[14px] tabular-nums text-[--text-secondary]">{formatCurrency(row.totalExpense)}</td>
                    <td className="px-6 py-5 text-right">
                      <span className={cn(
                        'text-[16px] font-semibold tabular-nums',
                        row.netCash >= 0 ? 'text-[--text]' : 'text-[--text-secondary]'
                      )} style={{ letterSpacing: '-0.014em' }}>
                        {formatCurrency(row.netCash)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(row)}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors"
                          aria-label="Düzenle"
                        >
                          <Edit2 size={14} strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          disabled={isLoading}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors disabled:opacity-50"
                          aria-label="Sil"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {initialData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="empty-state">
                        <FileText className="empty-state-icon" />
                        <p className="empty-state-title">Henüz bir kayıt bulunmuyor</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[--border-soft]">
            {initialData.map((row, idx) => (
              <div key={row.id || idx} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{row.month}</p>
                    <p className="text-[12px] text-[--text-tertiary] mt-0.5">{row.locationName}</p>
                  </div>
                  <span className="chip">{row.sessionCount} seans</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-[14px]">
                  <p className="text-[--text-secondary]">Brüt Ciro</p>
                  <p className="text-right font-medium tabular-nums text-[--text]">{formatCurrency(row.grossRevenue)}</p>
                  <p className="text-[--text-secondary]">Gider</p>
                  <p className="text-right tabular-nums text-[--text-secondary]">{formatCurrency(row.totalExpense)}</p>
                  <p className="text-[--text-secondary]">Net Nakit</p>
                  <p className={cn(
                    'text-right font-semibold tabular-nums',
                    row.netCash >= 0 ? 'text-[--text]' : 'text-[--text-secondary]'
                  )}>{formatCurrency(row.netCash)}</p>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 pt-3 border-t border-[--border]">
                  <button
                    onClick={() => handleEdit(row)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors"
                    aria-label="Düzenle"
                  >
                    <Edit2 size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={isLoading}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors disabled:opacity-50"
                    aria-label="Sil"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}

            {initialData.length === 0 && (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <p className="empty-state-title">Henüz bir kayıt yok</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Kayıt Düzenle' : 'Yeni Finansal Kayıt'}
        maxWidth="max-w-xl"
      >
        <MonthlyPerformanceForm
          locations={locations}
          initialData={editingRecord}
          onSuccess={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </PremiumModal>
    </div>
  );
}
