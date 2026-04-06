'use client';

import { useState, type ReactNode } from 'react';
import { Repeat, Building2, Wallet, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [flipped, setFlipped] = useState(false);
  const monthlyTotal = fixedRentWithVat + duesAmount + recurringExpense;

  return (
    <button
      type="button"
      onClick={() => setFlipped((prev) => !prev)}
      className="group relative h-[280px] sm:h-[244px] w-full [perspective:1200px] text-left"
      aria-label={`${locationName} gider kartı detayı`}
    >
      <div
        className={cn(
          'relative h-full w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-500 [transform-style:preserve-3d] overflow-hidden',
          flipped ? '[transform:rotateY(180deg)]' : ''
        )}
      >
        <div className="absolute inset-0 rounded-3xl p-5 [backface-visibility:hidden]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Lokasyon Kartı</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{locationName}</h3>
            </div>
            <span className="rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Özet
            </span>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500">Aylık Toplam</span>
              <span className="text-lg font-bold text-slate-900">₺{monthlyTotal.toLocaleString('tr-TR')}</span>
            </div>
            <p className="text-xs text-slate-500">
              Detayları görmek için karta dokunun veya tıklayın.
            </p>
          </div>
        </div>

        <div className="absolute inset-0 rounded-3xl bg-slate-900 p-5 text-white [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Detay Döküm</h4>
            <Info size={16} className="text-slate-300" />
          </div>

          <div className="mt-4 space-y-3 text-sm flex-1 overflow-y-auto pr-1">
            <DetailRow label="Kira (+KDV)" value={fixedRentWithVat} icon={<Building2 size={14} />} />
            <DetailRow label="Aidat" value={duesAmount} icon={<Wallet size={14} />} />
            <DetailRow label="Tekrarlayan" value={recurringExpense} icon={<Repeat size={14} />} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-300">Toplam Gider</p>
            <p className="text-xl font-bold">₺{monthlyTotal.toLocaleString('tr-TR')}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="flex items-center gap-2 text-slate-200">
        {icon}
        {label}
      </span>
      <span className="font-semibold">₺{value.toLocaleString('tr-TR')}</span>
    </div>
  );
}
