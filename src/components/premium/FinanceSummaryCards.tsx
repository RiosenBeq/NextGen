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

type Tone = 'emerald' | 'rose' | 'amber' | 'blue';

const iconWrap = (tone: Tone) => {
  const map: Record<Tone, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return cn('w-10 h-10 rounded-xl flex items-center justify-center', map[tone]);
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

  const cards: Array<{
    label: string;
    value: number;
    icon: typeof TrendingUp;
    tone: Tone;
    clickable?: boolean;
  }> = [
    { label: 'Toplam Ciro', value: totalGross, icon: TrendingUp, tone: 'emerald' },
    { label: 'Komisyonlar (%4)', value: totalCommission, icon: CreditCard, tone: 'rose' },
    { label: 'AVM Gideri', value: totalAvmExpense, icon: Building2, tone: 'amber' },
    { label: 'Operasyonel Gider', value: totalOperational, icon: Zap, tone: 'blue', clickable: true },
    { label: 'Reel Kazanç', value: totalNetCash, icon: BarChart3, tone: totalNetCash >= 0 ? 'emerald' : 'rose' },
  ];

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.clickable ? () => setOpen(true) : undefined}
              className={cn(
                'rounded-2xl bg-white border border-slate-200/70 shadow-sm p-6 text-left transition-all duration-200',
                kpi.clickable
                  ? 'hover:shadow-md hover:border-slate-300/60 cursor-pointer'
                  : 'cursor-default'
              )}
            >
              <div className={iconWrap(kpi.tone)}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-4">{kpi.label}</p>
              <h2 className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 mt-1">
                ₺{kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </h2>
              {kpi.clickable && (
                <p className="mt-3 text-xs font-medium text-blue-600">Detayı Gör →</p>
              )}
            </button>
          );
        })}
      </section>

      <PremiumModal isOpen={open} onClose={() => setOpen(false)} title="Operasyonel Gider Detayı" maxWidth="max-w-3xl">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">Bu listede operasyonel gider toplamına dahil edilen kalemler yer alır.</p>
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {sortedOperational.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                Operasyonel gider kalemi bulunamadı.
              </div>
            ) : (
              sortedOperational.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200/70 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.location || 'Genel'} {item.month ? `· ${item.month}` : ''} · {item.source === 'manual' ? 'Manuel' : 'Gider Kaydı'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">
                      ₺{item.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </p>
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
