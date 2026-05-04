'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  ChevronRight,
  Building2,
  Activity,
  HandCoins,
  CreditCard,
  PlusCircle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumModal } from '@/components/premium/PremiumModal';

interface ExpenseItem {
  id: string;
  label: string;
  value: number;
  iconName: string;
  subLabel?: string;
  color: string;
}

interface Props {
  total: number;
  breakdown: ExpenseItem[];
  tag?: string;
}

export default function ExpenseDetailCard({ total, breakdown, tag = "KDV Dahil" }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={() => setIsOpen(true)}
        className="bg-white border border-slate-200/70 rounded-2xl p-6 hover:border-slate-300/70 transition-colors cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown size={18} />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{tag}</span>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Detayları gör <ChevronRight size={12} />
            </div>
          </div>
        </div>

        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1.5">Toplam Gider</p>
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">
          ₺{total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </h2>

        <div className="mt-4 flex items-center gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          {breakdown.map((item) => (
            <div
              key={item.id}
              style={{ width: `${(item.value / total) * 100}%` }}
              className={cn("h-full", item.color)}
            />
          ))}
        </div>
      </motion.div>

      {/* Modal Detail */}
      <PremiumModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Gider Detay Analizi"
        maxWidth="max-w-xl"
      >
        <div className="p-6 md:p-8 space-y-8 bg-white">
          {/* Header Summary */}
          <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-200/70 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Brüt Harcama</p>
              <h3 className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                ₺{total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown size={22} />
            </div>
          </div>

          {/* Breakdown List */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Kategori Dağılımı</span>
            </div>

            {breakdown.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200/70"
                    )}>
                      {item.iconName === 'Building2' && <Building2 size={18} className={item.color.replace('bg-', 'text-')} />}
                      {item.iconName === 'Activity' && <Activity size={18} className={item.color.replace('bg-', 'text-')} />}
                      {item.iconName === 'HandCoins' && <HandCoins size={18} className={item.color.replace('bg-', 'text-')} />}
                      {item.iconName === 'CreditCard' && <CreditCard size={18} className={item.color.replace('bg-', 'text-')} />}
                      {item.iconName === 'PlusCircle' && <PlusCircle size={18} className={item.color.replace('bg-', 'text-')} />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900 tracking-tight">{item.label}</p>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{item.subLabel || 'Operasyonel'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-slate-900 tracking-tight tabular-nums">₺{item.value.toLocaleString('tr-TR')}</p>
                    <p className={cn("text-xs font-medium tabular-nums", item.color.replace('bg-', 'text-'))}>%{((item.value / total) * 100).toFixed(1)}</p>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / total) * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={cn("h-full", item.color)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <footer className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <PieChartIcon size={14} />
              </div>
              <span className="text-xs font-medium text-slate-500">İstatistiksel Dağılım Hesabı</span>
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">NextGen Financial Algorithm V2.1</p>
          </footer>
        </div>
      </PremiumModal>
    </>
  );
}
