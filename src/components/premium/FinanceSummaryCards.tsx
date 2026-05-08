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

  const cards: Array<{
    label: string;
    value: number;
    icon: typeof TrendingUp;
    clickable?: boolean;
    negative?: boolean;
  }> = [
    { label: 'Toplam Ciro', value: totalGross, icon: TrendingUp },
    { label: 'Komisyonlar (%4)', value: totalCommission, icon: CreditCard },
    { label: 'AVM Gideri', value: totalAvmExpense, icon: Building2 },
    { label: 'Operasyonel Gider', value: totalOperational, icon: Zap, clickable: true },
    { label: 'Reel Kazanç', value: totalNetCash, icon: BarChart3, negative: totalNetCash < 0 },
  ];

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.clickable ? () => setOpen(true) : undefined}
              disabled={!kpi.clickable}
              className={cn(
                'apple-card p-4 sm:p-5 md:p-6 text-left transition-all duration-200 min-h-[44px]',
                kpi.clickable
                  ? 'hover:border-[--border-strong] cursor-pointer'
                  : 'cursor-default'
              )}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center bg-[--bg-elevated] text-[--text-secondary]">
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </div>
              <p className="text-[12px] sm:text-[13px] text-[--text-secondary] mt-3 sm:mt-5 line-clamp-1" style={{ letterSpacing: '-0.005em' }}>{kpi.label}</p>
              <h2 className={cn(
                'font-semibold tabular-nums mt-1 break-words',
                kpi.negative ? 'text-[--text-secondary]' : 'text-[--text]'
              )} style={{ letterSpacing: '-0.022em', fontSize: 'clamp(18px, 5vw, 28px)' }}>
                ₺{kpi.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </h2>
              {kpi.clickable && (
                <p className="mt-2 sm:mt-3 text-[12px] font-medium text-[--accent]">Detayı Gör →</p>
              )}
            </button>
          );
        })}
      </section>

      <PremiumModal isOpen={open} onClose={() => setOpen(false)} title="Operasyonel Gider Detayı" maxWidth="max-w-3xl">
        <div className="space-y-4">
          <p className="text-[15px] text-[--text-secondary] leading-relaxed">Bu listede operasyonel gider toplamına dahil edilen kalemler yer alır.</p>
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {sortedOperational.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[--border-strong] p-8 text-center text-[14px] text-[--text-tertiary]">
                Operasyonel gider kalemi bulunamadı.
              </div>
            ) : (
              sortedOperational.map((item) => (
                <div key={item.id} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{item.label}</p>
                      <p className="text-[12px] text-[--text-tertiary] mt-0.5">
                        {item.location || 'Genel'} {item.month ? `· ${item.month}` : ''} · {item.source === 'manual' ? 'Manuel' : 'Gider Kaydı'}
                      </p>
                    </div>
                    <p className="text-[14px] font-medium tabular-nums text-[--text] shrink-0">
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
