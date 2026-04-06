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
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Senaryo Analizi & Projeksiyon</h2>
        <div className="flex-1 section-divider" />
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500 leading-relaxed">
            Tüm resmi vergiler hariç reel nakit tablosu. Başabaş noktası:{' '}
            <strong className="text-amber-600">{breakEvenTotal} oturum/ay</strong>. AVM başına günlük{' '}
            <strong className="text-blue-600">~{Math.ceil(Math.ceil(breakEvenTotal / locationCount) / 30)} seans</strong> gereklidir.
          </p>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Aylık Oturum</th>
                <th className="text-center">AVM Başına</th>
                <th className="text-right">Aylık Net Gelir</th>
                <th className="text-right">Aylık Kâr/Zarar</th>
                <th className="text-right">Kişi Başı / Ay</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => {
                const isBreakEven = Math.abs(s.sessions - breakEvenTotal) < 30;
                return (
                  <tr
                    key={s.sessions}
                    className={cn('cursor-pointer hover:bg-slate-50', isBreakEven && 'bg-amber-50')}
                    onClick={() => setSelected(s)}
                  >
                    <td className="font-semibold text-slate-900">{s.sessions}</td>
                    <td className="text-center text-slate-500 font-medium">{Math.round(s.sessions / locationCount)}</td>
                    <td className="text-right font-medium text-slate-700">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                    <td className={cn('text-right font-bold', s.monthlyProfit >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                      ₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={cn('text-right font-bold', s.monthlyPerPartner >= 0 ? 'text-blue-700' : 'text-red-600')}>
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
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Aylık Oturum</p>
                <p className="text-lg font-bold text-slate-900">{s.sessions}</p>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="flex items-center justify-between text-slate-600"><span>AVM Başına</span><span className="font-semibold">{Math.round(s.sessions / locationCount)}</span></p>
                <p className="flex items-center justify-between text-slate-600"><span>Aylık Net Gelir</span><span className="font-semibold">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className={cn('flex items-center justify-between font-semibold', s.monthlyProfit >= 0 ? 'text-emerald-700' : 'text-rose-600')}><span>Kâr / Zarar</span><span>₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
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
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Senaryo Özeti</p>
              <p className="mt-1 text-sm text-slate-700">
                {selected.sessions} toplam oturumda, AVM başına ortalama {Math.round(selected.sessions / locationCount)} oturum düşer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Metric label="Aylık Net Gelir" value={selected.monthlyNet} tone="default" />
              <Metric label="Aylık Kâr / Zarar" value={selected.monthlyProfit} tone={selected.monthlyProfit >= 0 ? 'positive' : 'negative'} />
              <Metric label="Kişi Başı / Ay" value={selected.monthlyPerPartner} tone={selected.monthlyPerPartner >= 0 ? 'positive' : 'negative'} />
              <Metric label="Yıllık Kâr / Zarar" value={selected.yearlyProfit} tone={selected.yearlyProfit >= 0 ? 'positive' : 'negative'} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gider Kırılımı (Senaryo)</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2"><span>Kira (+KDV)</span><span className="font-semibold">₺{selected.totalRentWithVat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2"><span>Aidat</span><span className="font-semibold">₺{selected.totalDues.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2"><span>AVM Ciro Payı</span><span className="font-semibold">₺{selected.totalRevenueShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2"><span>Komisyon</span><span className="font-semibold">₺{selected.totalCommissions.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2 sm:col-span-2"><span>Tekrarlayan Operasyonel</span><span className="font-semibold">₺{selected.totalRecurringOps.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
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
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn('mt-1 text-lg font-bold', tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-rose-600' : 'text-slate-900')}>
        ₺{value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}
