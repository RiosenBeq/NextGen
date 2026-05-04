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
        className="group relative h-[220px] sm:h-[200px] w-full text-left rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200"
        aria-label={`${locationName} gider kartı detayı`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Lokasyon Kartı</p>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-900">{locationName}</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            Özet
          </span>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Aylık Toplam</span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
              ₺{monthlyTotal.toLocaleString('tr-TR')}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Detayları görmek için karta tıklayın.
          </p>
        </div>
      </button>

      <PremiumModal isOpen={open} onClose={() => setOpen(false)} title={`${locationName} — Gider Detayı`} maxWidth="max-w-xl">
        <div className="rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500">Detay Döküm</h4>
            <Info size={14} className="text-slate-400" />
          </div>

          <div className="mt-4 space-y-2">
            <DetailRow label="Kira (+KDV)" value={fixedRentWithVat} icon={<Building2 size={14} />} />
            <DetailRow label="Aidat" value={duesAmount} icon={<Wallet size={14} />} />
            <DetailRow label="Tekrarlayan" value={recurringExpense} icon={<Repeat size={14} />} />
          </div>

          <div className="mt-5 rounded-xl bg-slate-50/70 px-4 py-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Toplam Gider</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
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
    <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        ₺{value.toLocaleString('tr-TR')}
      </span>
    </div>
  );
}
