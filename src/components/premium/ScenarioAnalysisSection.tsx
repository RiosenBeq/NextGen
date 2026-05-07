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
      <div>
        <p className="apple-eyebrow">Projeksiyon</p>
        <h2 className="apple-title-1 mt-2">Senaryo Analizi</h2>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="p-6 border-b border-[--border] bg-[--bg-subtle]">
          <p className="text-[15px] text-[--text-secondary] leading-relaxed">
            Tüm resmi vergiler hariç reel nakit tablosu. Başabaş noktası:{' '}
            <span className="font-semibold tabular-nums text-[--text]">{breakEvenTotal} oturum/ay</span>. AVM başına günlük{' '}
            <span className="font-semibold tabular-nums text-[--accent]">~{Math.ceil(Math.ceil(breakEvenTotal / locationCount) / 30)} seans</span> gereklidir.
          </p>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[--border]">
                <th className="text-left px-6 py-3 text-[13px] font-medium text-[--text-secondary]">Aylık Oturum</th>
                <th className="text-center px-6 py-3 text-[13px] font-medium text-[--text-secondary]">AVM Başına</th>
                <th className="text-right px-6 py-3 text-[13px] font-medium text-[--text-secondary]">Aylık Net Gelir</th>
                <th className="text-right px-6 py-3 text-[13px] font-medium text-[--text-secondary]">Aylık Kâr/Zarar</th>
                <th className="text-right px-6 py-3 text-[13px] font-medium text-[--text-secondary]">Kişi Başı / Ay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border-soft]">
              {scenarios.map((s) => {
                const isBreakEven = Math.abs(s.sessions - breakEvenTotal) < 30;
                return (
                  <tr
                    key={s.sessions}
                    className={cn('cursor-pointer hover:bg-[--bg-subtle] transition-colors', isBreakEven && 'bg-[--bg-elevated]')}
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-6 py-4 text-[15px] font-medium tabular-nums text-[--text]">{s.sessions}</td>
                    <td className="px-6 py-4 text-[15px] text-center tabular-nums text-[--text-secondary]">{Math.round(s.sessions / locationCount)}</td>
                    <td className="px-6 py-4 text-[15px] text-right tabular-nums text-[--text-secondary]">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                    <td className={cn('px-6 py-4 text-[15px] text-right font-medium tabular-nums', s.monthlyProfit >= 0 ? 'text-[--text]' : 'text-[--text-secondary]')}>
                      ₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={cn('px-6 py-4 text-[15px] text-right font-medium tabular-nums', s.monthlyPerPartner >= 0 ? 'text-[--accent]' : 'text-[--text-secondary]')}>
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
              className="rounded-[18px] border border-[--border] bg-[--surface] p-5 text-left transition-all duration-200 hover:border-[--border-strong]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[--text-secondary]">Aylık Oturum</p>
                <p className="text-[24px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>{s.sessions}</p>
              </div>
              <div className="mt-4 space-y-2 text-[14px]">
                <p className="flex items-center justify-between text-[--text-secondary]"><span>AVM Başına</span><span className="font-medium tabular-nums text-[--text]">{Math.round(s.sessions / locationCount)}</span></p>
                <p className="flex items-center justify-between text-[--text-secondary]"><span>Aylık Net Gelir</span><span className="font-medium tabular-nums text-[--text]">₺{s.monthlyNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className={cn('flex items-center justify-between font-medium tabular-nums', s.monthlyProfit >= 0 ? 'text-[--text]' : 'text-[--text-secondary]')}><span>Kâr / Zarar</span><span>₺{s.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
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
            <div className="rounded-[18px] bg-[--accent-soft] p-4">
              <p className="text-[13px] text-[--accent] font-medium">Senaryo Özeti</p>
              <p className="mt-2 text-[15px] text-[--text] leading-relaxed">
                <span className="font-semibold tabular-nums">{selected.sessions}</span> toplam oturumda, AVM başına ortalama <span className="font-semibold tabular-nums">{Math.round(selected.sessions / locationCount)}</span> oturum düşer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Metric label="Aylık Net Gelir" value={selected.monthlyNet} tone="default" />
              <Metric label="Aylık Kâr / Zarar" value={selected.monthlyProfit} tone={selected.monthlyProfit >= 0 ? 'positive' : 'muted'} />
              <Metric label="Kişi Başı / Ay" value={selected.monthlyPerPartner} tone={selected.monthlyPerPartner >= 0 ? 'accent' : 'muted'} />
              <Metric label="Yıllık Kâr / Zarar" value={selected.yearlyProfit} tone={selected.yearlyProfit >= 0 ? 'positive' : 'muted'} />
            </div>
            <div className="rounded-[18px] border border-[--border] bg-[--bg-subtle] p-4">
              <p className="text-[13px] text-[--text-secondary]">Gider Kırılımı (Senaryo)</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px]">
                <p className="flex items-center justify-between rounded-xl bg-[--surface] border border-[--border] px-3 py-2.5"><span className="text-[--text-secondary]">Kira (+KDV)</span><span className="font-medium tabular-nums text-[--text]">₺{selected.totalRentWithVat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-[--surface] border border-[--border] px-3 py-2.5"><span className="text-[--text-secondary]">Aidat</span><span className="font-medium tabular-nums text-[--text]">₺{selected.totalDues.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-[--surface] border border-[--border] px-3 py-2.5"><span className="text-[--text-secondary]">AVM Ciro Payı</span><span className="font-medium tabular-nums text-[--text]">₺{selected.totalRevenueShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-[--surface] border border-[--border] px-3 py-2.5"><span className="text-[--text-secondary]">Komisyon</span><span className="font-medium tabular-nums text-[--text]">₺{selected.totalCommissions.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
                <p className="flex items-center justify-between rounded-xl bg-[--surface] border border-[--border] px-3 py-2.5 sm:col-span-2"><span className="text-[--text-secondary]">Tekrarlayan Operasyonel</span><span className="font-medium tabular-nums text-[--text]">₺{selected.totalRecurringOps.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span></p>
              </div>
            </div>

            <p className="text-[14px] text-[--text-secondary] leading-relaxed">
              Bu senaryo, mevcut maliyet parametreleri ve komisyon oranlarıyla hesaplanmıştır. Oturum artışı en çok net kârlılığı ve yatırım geri dönüş hızını etkiler.
            </p>
          </div>
        )}
      </PremiumModal>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'default' | 'positive' | 'muted' | 'accent' }) {
  const valueColor =
    tone === 'accent' ? 'text-[--accent]'
    : tone === 'muted' ? 'text-[--text-secondary]'
    : 'text-[--text]';

  return (
    <div className="rounded-[18px] border border-[--border] bg-[--surface] p-4">
      <p className="text-[13px] text-[--text-secondary]">{label}</p>
      <p className={cn('mt-2 text-[20px] md:text-[22px] font-semibold tabular-nums', valueColor)} style={{ letterSpacing: '-0.018em' }}>
        ₺{value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}
