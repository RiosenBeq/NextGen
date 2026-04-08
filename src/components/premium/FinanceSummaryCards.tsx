'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, CreditCard, Building2, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumModal } from './PremiumModal';

type OperationalItem = {
  id: string;
  label: string;
  amount: number;
  month?: string;
  location?: string;
  source: 'expense' | 'manual';
};

export default function FinanceSummaryCards({
  totalGross,
  totalCommission,
  totalAvmExpense,
  totalOperational,
  totalNetCash,
  operationalItems,
}: {
  totalGross: number;
  totalCommission: number;
  totalAvmExpense: number;
  totalOperational: number;
  totalNetCash: number;
  operationalItems: OperationalItem[];
}) {
  const [open, setOpen] = useState(false);

  const sortedOperational = useMemo(
    () => [...operationalItems].sort((a, b) => b.amount - a.amount),
    [operationalItems]
  );

  const cards = [
    { label: 'Toplam Ciro', value: totalGross, icon: TrendingUp, cardClass: 'stat-card-green', iconBg: 'bg-emerald-100 border-emerald-200', iconColor: 'text-emerald-600' },
    { label: 'Komisyonlar (%4)', value: totalCommission, icon: CreditCard, cardClass: 'stat-card-red', iconBg: 'bg-red-100 border-red-200', iconColor: 'text-red-600' },
    { label: 'AVM Gideri', value: totalAvmExpense, icon: Building2, cardClass: 'stat-card-amber', iconBg: 'bg-amber-100 border-amber-200', iconColor: 'text-amber-600' },
    { label: 'Operasyonel Gider', value: totalOperational, icon: Zap, cardClass: 'stat-card-blue', iconBg: 'bg-blue-100 border-blue-200', iconColor: 'text-blue-600', clickable: true },
    { label: 'Reel Kazanç', value: totalNetCash, icon: BarChart3, cardClass: totalNetCash >= 0 ? 'stat-card-green' : 'stat-card-red', iconBg: totalNetCash >= 0 ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200', iconColor: totalNetCash >= 0 ? 'text-emerald-600' : 'text-red-600' },
  ];

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={kpi.clickable ? () => setOpen(true) : undefined}
            className={cn('premium-card p-5 border text-left', kpi.cardClass, kpi.clickable ? 'hover:shadow-xl cursor-pointer transition-all' : 'cursor-default')}
          >
            <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center mb-3', kpi.iconBg)}>
              <kpi.icon className={cn('w-4 h-4', kpi.iconColor)} />
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
            <h2 className="text-lg font-bold text-slate-900">₺{kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
            {kpi.clickable && <p className="mt-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider">Detayı Gör</p>}
          </button>
        ))}
      </section>

      <PremiumModal isOpen={open} onClose={() => setOpen(false)} title="Operasyonel Gider Detayı" maxWidth="max-w-3xl">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Bu listede operasyonel gider toplamına dahil edilen kalemler yer alır.</p>
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {sortedOperational.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Operasyonel gider kalemi bulunamadı.</div>
            ) : (
              sortedOperational.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.location || 'Genel'} {item.month ? `• ${item.month}` : ''} • {item.source === 'manual' ? 'Manuel' : 'Gider Kaydı'}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">₺{item.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PremiumModal>
    </>
  );
}
