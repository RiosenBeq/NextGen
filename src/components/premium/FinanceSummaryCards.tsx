'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, CreditCard, Building2, Zap, BarChart3, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type OperationalItem = {
  id: string;
  label: string;
  amount: number;
  month?: string;
  location?: string;
  source: 'expense' | 'manual';
};

type ModalType = 'gross' | 'commission' | 'avm' | 'operational' | 'net' | null;

const fmt = (n: number) => `₺${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;

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
  const [modal, setModal] = useState<ModalType>(null);

  const sortedOperational = useMemo(
    () => [...operationalItems].sort((a, b) => b.amount - a.amount),
    [operationalItems],
  );

  const cards: {
    key: ModalType;
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    positive?: boolean;
  }[] = [
    { key: 'gross', label: 'Toplam Ciro', value: totalGross, icon: TrendingUp, iconBg: 'bg-emerald-100 border-emerald-200', iconColor: 'text-emerald-600', positive: true },
    { key: 'commission', label: 'Komisyonlar (%4)', value: totalCommission, icon: CreditCard, iconBg: 'bg-red-100 border-red-200', iconColor: 'text-red-600' },
    { key: 'avm', label: 'AVM Gideri', value: totalAvmExpense, icon: Building2, iconBg: 'bg-amber-100 border-amber-200', iconColor: 'text-amber-600' },
    { key: 'operational', label: 'Operasyonel Gider', value: totalOperational, icon: Zap, iconBg: 'bg-blue-100 border-blue-200', iconColor: 'text-blue-600' },
    { key: 'net', label: 'Reel Kazanç', value: totalNetCash, icon: BarChart3, iconBg: totalNetCash >= 0 ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200', iconColor: totalNetCash >= 0 ? 'text-emerald-600' : 'text-red-600', positive: totalNetCash >= 0 },
  ];

  const close = () => setModal(null);

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((kpi) => (
          <button
            key={kpi.key}
            type="button"
            onClick={() => setModal(kpi.key)}
            className="premium-card p-5 border text-left hover:shadow-lg cursor-pointer transition-all hover:-translate-y-0.5 group"
          >
            <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center mb-3', kpi.iconBg)}>
              <kpi.icon className={cn('w-4 h-4', kpi.iconColor)} />
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
            <h2 className="text-lg font-bold text-slate-900">{fmt(kpi.value)}</h2>
            <p className="mt-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Info size={10} /> Detay
            </p>
          </button>
        ))}
      </section>

      {/* Detail Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={close}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full md:max-w-xl max-h-[85vh] bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between z-10">
              <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">
                {modal === 'gross' && 'Toplam Ciro Detayı'}
                {modal === 'commission' && 'Komisyon Detayı'}
                {modal === 'avm' && 'AVM Gideri Detayı'}
                {modal === 'operational' && 'Operasyonel Gider Detayı'}
                {modal === 'net' && 'Reel Kazanç Hesaplama'}
              </h3>
              <button onClick={close} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              {modal === 'gross' && (
                <>
                  <CalcRow label="Brüt Satış Geliri" val={fmt(totalGross)} highlight />
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                      Seans sayısı × Seans ücreti (KDV dahil). Gelirden KDV düşülmez — brüt ciro olarak kaydedilir.
                    </p>
                  </div>
                </>
              )}
              {modal === 'commission' && (
                <>
                  <CalcRow label="iyzico Komisyonu (%2 brüt ciro)" val={fmt(totalCommission / 2)} />
                  <CalcRow label="Nayax Komisyonu (%2 brüt ciro)" val={fmt(totalCommission / 2)} />
                  <CalcRow label="Toplam Komisyon (%4)" val={fmt(totalCommission)} highlight />
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                      iyzico anlık olarak keser, Nayax aylık fatura eder. İkisi de brüt ciro üzerinden %2 hesaplanır.
                    </p>
                  </div>
                </>
              )}
              {modal === 'avm' && (
                <>
                  <CalcRow label="Toplam AVM Gideri" val={fmt(totalAvmExpense)} highlight />
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      Her lokasyon için: <b>Sabit Kira × 1.20 (KDV)</b> + <b>Aidat</b> + <b>Ciro Payı</b> (brüt ciro kiradan fazlaysa %15).
                      Mart 2025 için ciro payı uygulanmaz.
                    </p>
                  </div>
                </>
              )}
              {modal === 'operational' && (
                <>
                  <CalcRow label="Toplam Operasyonel" val={fmt(totalOperational)} highlight />
                  <div className="space-y-2 max-h-[50vh] overflow-auto">
                    {sortedOperational.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Operasyonel gider kalemi bulunamadı.</div>
                    ) : (
                      sortedOperational.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{item.location || 'Genel'} {item.month ? `• ${item.month}` : ''} • {item.source === 'manual' ? 'Manuel' : 'Gider Kaydı'}</p>
                            </div>
                            <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{fmt(item.amount)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
              {modal === 'net' && (
                <>
                  <CalcRow label="Brüt Satış Geliri" val={fmt(totalGross)} positive />
                  <CalcRow label="— Komisyonlar (%4)" val={`-${fmt(totalCommission)}`} indent />
                  <CalcRow label="— AVM Giderleri" val={`-${fmt(totalAvmExpense)}`} indent />
                  <CalcRow label="— Operasyonel Giderler" val={`-${fmt(totalOperational)}`} indent />
                  <CalcRow label="= Reel Kazanç (Net Nakit)" val={fmt(totalNetCash)} highlight />
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      Brüt ciro — tüm giderler (komisyon + AVM + operasyonel) = net nakit akış.
                      Hissedar başına pay: <b>{fmt(totalNetCash / 4)}</b> (4 × %25)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CalcRow({
  label,
  val,
  highlight = false,
  indent = false,
  positive,
}: {
  label: string;
  val: string;
  highlight?: boolean;
  indent?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 px-4 rounded-xl',
        highlight ? 'bg-slate-900' : 'bg-slate-50 border border-slate-100',
        indent && 'ml-4',
      )}
    >
      <span className={cn('text-xs font-bold uppercase tracking-wider', highlight ? 'text-slate-300' : 'text-slate-500')}>
        {label}
      </span>
      <span
        className={cn(
          'font-bold tabular-nums italic',
          highlight ? 'text-white text-lg' : 'text-slate-900',
          !highlight && positive === true && 'text-emerald-600',
          !highlight && positive === false && 'text-rose-600',
        )}
      >
        {val}
      </span>
    </div>
  );
}
