'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PremiumModal } from './PremiumModal';

type Scenario = {
  sessions: number;
  monthlyNet: number;
  monthlyProfit: number;
  yearlyProfit: number;
  monthlyPerPartner: number;
  totalRevenueShare: number;
  totalCommissions: number;
  totalRentWithVat: number;
  totalDues: number;
  totalRecurringOps: number;
};

export default function ScenarioAnalysisSection({
  scenarios,
  breakEvenTotal,
  locationCount,
}: {
  scenarios: Scenario[];
  breakEvenTotal: number;
  locationCount: number;
}) {
  const [selected, setSelected] = useState<Scenario | null>(null);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">Senaryo Analizi & Projeksiyon</h2>
        <div className="flex-1 section-divider" />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/70">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tüm resmi vergiler hariç reel nakit tablosu. Başabaş noktası:{' '}
            <span className="font-semibold tabular-nums text-amber-600">{breakEvenTotal} oturum/ay</span>. AVM başına günlük{' '}
            <span className="font-semibold tabular-nums text-blue-600">~{Math.ceil(Math.ceil(breakEvenTotal / locationCount) / 30)} seans</span> gereklidir.
          </p>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Aylık Oturum</th>
                <th className="text-center px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">AVM Başına</th>
                <th className="text-right px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Aylık Net Gelir</th>
                <th className="text-right px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Aylık Kâr/Zarar</th>
                <th className="text-right px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Kişi Başı / Ay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((s) => {
                const isBreakEven = Math.abs(s.sessions - breakEvenTotal) < 30;
                return (
                  <tr
                    key={s.sessions}
                    className={cn('cursor-pointer hover:bg-slate-50/50 transition-colors', isBreakEven && 'bg-amber-50/50')}
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-6 py-4 text-sm font-medium tabular-nums text-slate-900">{s.sessions}</td>
                    <td className="px-6 py-4 text-sm text-center tabular-nums text-slate-500">{Math.round(s.sessions / locationCount)}</td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                    <td className={cn('px-6 py-4 text-sm text-right font-semibold tabular-nums', s.monthlyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      ₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={cn('px-6 py-4 text-sm text-right font-semibold tabular-nums', s.monthlyPerPartner >= 0 ? 'text-blue-600' : 'text-rose-600')}>
                      ₺{s.monthlyPerPartner.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
          {scenarios.map((s) => (
            <button
              key={s.sessions}
              type="button"
              onClick={() => setSelected(s)}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 text-left shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Aylık Oturum</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{s.sessions}</p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center justify-between text-slate-600"><span>AVM Başına</span><span className="font-medium tabular-nums text-slate-900">{Math.round(s.sessions / locationCount)}</span></p>
                <p className="flex items-center justify-between text-slate-600"><span>Aylık Net Gelir</span><span className="font-medium tabular-nums text-slate-900">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className={cn('flex items-center justify-between font-semibold tabular-nums', s.monthlyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}><span>Kâr / Zarar</span><span>₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <PremiumModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.sessions} Oturum Senaryosu` : 'Senaryo'}
        maxWidth="max-w-xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-blue-700">Senaryo Özeti</p>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold tabular-nums text-slate-900">{selected.sessions}</span> toplam oturumda, AVM başına ortalama <span className="font-semibold tabular-nums text-slate-900">{Math.round(selected.sessions / locationCount)}</span> oturum düşer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Metric label="Aylık Net Gelir" value={selected.monthlyNet} tone="default" />
              <Metric label="Aylık Kâr / Zarar" value={selected.monthlyProfit} tone={selected.monthlyProfit >= 0 ? 'positive' : 'negative'} />
              <Metric label="Kişi Başı / Ay" value={selected.monthlyPerPartner} tone={selected.monthlyPerPartner >= 0 ? 'positive' : 'negative'} />
              <Metric label="Yıllık Kâr / Zarar" value={selected.yearlyProfit} tone={selected.yearlyProfit >= 0 ? 'positive' : 'negative'} />
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Gider Kırılımı (Senaryo)</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p className="flex items-center justify-between rounded-xl bg-white border border-slate-200/70 px-3 py-2.5"><span className="text-slate-600">Kira (+KDV)</span><span className="font-medium tabular-nums text-slate-900">₺{selected.totalRentWithVat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-white border border-slate-200/70 px-3 py-2.5"><span className="text-slate-600">Aidat</span><span className="font-medium tabular-nums text-slate-900">₺{selected.totalDues.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-white border border-slate-200/70 px-3 py-2.5"><span className="text-slate-600">AVM Ciro Payı</span><span className="font-medium tabular-nums text-slate-900">₺{selected.totalRevenueShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-white border border-slate-200/70 px-3 py-2.5"><span className="text-slate-600">Komisyon</span><span className="font-medium tabular-nums text-slate-900">₺{selected.totalCommissions.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-white border border-slate-200/70 px-3 py-2.5 sm:col-span-2"><span className="text-slate-600">Tekrarlayan Operasyonel</span><span className="font-medium tabular-nums text-slate-900">₺{selected.totalRecurringOps.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Bu senaryo, mevcut maliyet parametreleri ve komisyon oranlarıyla hesaplanmıştır. Oturum artışı en çok net kârlılığı ve yatırım geri dönüş hızını etkiler.
            </p>
          </div>
        )}
      </PremiumModal>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'default' | 'positive' | 'negative' }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('mt-2 text-xl font-semibold tabular-nums tracking-tight', tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-rose-600' : 'text-slate-900')}>
        ₺{value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}
