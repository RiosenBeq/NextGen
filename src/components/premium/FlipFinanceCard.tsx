'use client';

import { useState, type ReactNode } from 'react';
import { Repeat, Building2, Wallet, Info } from 'lucide-react';
import { PremiumModal } from './PremiumModal';

interface FlipFinanceCardProps {
  locationName: string;
  fixedRentWithVat: number;
  duesAmount: number;
  recurringExpense: number;
}

export default function FlipFinanceCard({
  locationName,
  fixedRentWithVat,
  duesAmount,
  recurringExpense,
}: FlipFinanceCardProps) {
  const [open, setOpen] = useState(false);
  const monthlyTotal = fixedRentWithVat + duesAmount + recurringExpense;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full text-left apple-card p-5 sm:p-6 hover:border-[--border-strong] transition-all duration-200"
        aria-label={`${locationName} gider kartı detayı`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="apple-eyebrow">Lokasyon</p>
            <h3 className="apple-title-2 mt-1">{locationName}</h3>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between border-b border-[--border] pb-3">
            <span className="text-[13px] text-[--text-secondary]">Aylık Toplam</span>
            <span className="text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>
              ₺{monthlyTotal.toLocaleString('tr-TR')}
            </span>
          </div>
          <p className="text-[12px] text-[--text-tertiary]">
            Detayları görmek için karta tıklayın.
          </p>
        </div>
      </button>

      <PremiumModal isOpen={open} onClose={() => setOpen(false)} title={`${locationName} — Gider Detayı`} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[--border] pb-3">
            <h4 className="text-[13px] text-[--text-secondary]">Detay Döküm</h4>
            <Info size={14} strokeWidth={1.75} className="text-[--text-tertiary]" />
          </div>

          <div className="space-y-2">
            <DetailRow label="Kira (+KDV)" value={fixedRentWithVat} icon={<Building2 size={14} strokeWidth={1.75} />} />
            <DetailRow label="Aidat" value={duesAmount} icon={<Wallet size={14} strokeWidth={1.75} />} />
            <DetailRow label="Tekrarlayan" value={recurringExpense} icon={<Repeat size={14} strokeWidth={1.75} />} />
          </div>

          <div className="rounded-[18px] bg-[--bg-elevated] px-5 py-4 flex items-center justify-between">
            <p className="text-[13px] text-[--text-secondary]">Toplam Gider</p>
            <p className="text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>
              ₺{monthlyTotal.toLocaleString('tr-TR')}
            </p>
          </div>
        </div>
      </PremiumModal>
    </>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[--border] bg-[--surface] px-4 py-3">
      <span className="flex items-center gap-2 text-[14px] text-[--text]" style={{ letterSpacing: '-0.005em' }}>
        <span className="text-[--text-tertiary]">{icon}</span>
        {label}
      </span>
      <span className="text-[14px] font-medium tabular-nums text-[--text]">
        ₺{value.toLocaleString('tr-TR')}
      </span>
    </div>
  );
}
