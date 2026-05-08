import type { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/server';
import { Trophy, Flame, Zap, CheckCircle2, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocationInsights } from '@/features/ledger/actions';

export const metadata = { title: 'Hedefler — NextGenBox' };
export const dynamic = 'force-dynamic';

export default async function TargetsPage() {
  const insights = await getLocationInsights();

  const totalInvestment = insights.reduce((acc, loc) => acc + loc.totalInvestment, 0);
  const totalNetCash = insights.reduce((acc, loc) => acc + loc.cumulativeNetCash, 0);

  const paybackProgress = totalInvestment > 0 ? (totalNetCash / totalInvestment) * 100 : 0;
  const isPaybackComplete = paybackProgress >= 100;
  const paybackPercentage = Math.max(0, Math.min(100, paybackProgress));

  const supabase = await createClient();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const { data: currentPerformances } = await supabase.from('MonthlyPerformance').select('*').like('month', `${currentMonthStr}%`);

  type PerformanceRow = { sessionCount: number };
  const currentGross = (currentPerformances || []).reduce((acc: number, p: PerformanceRow) => acc + (p.sessionCount * 300), 0);
  const monthlyRevenueTarget = 150000;
  const monthlyProgress = Math.max(0, Math.min(100, (currentGross / monthlyRevenueTarget) * 100));

  const monthlyProjection = [
    { label: 'Temkinli', factor: 0.85 },
    { label: 'Baz', factor: 1 },
    { label: 'Agresif', factor: 1.2 },
  ].map((p) => {
    const projectedRevenue = currentGross * p.factor;
    return {
      ...p,
      projectedRevenue,
      projectedProgress: Math.min(100, (projectedRevenue / monthlyRevenueTarget) * 100),
      gap: Math.max(0, monthlyRevenueTarget - projectedRevenue),
    };
  });

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      <header>
        <p className="apple-eyebrow">Projeksiyon</p>
        <h1 className="apple-headline mt-3">Hedefler &amp; <span className="hero-serif text-gradient-sunset">projeksiyon</span></h1>
        <p className="mt-4 apple-body max-w-2xl">
          Yatırım geri dönüşü, aylık hedefler ve senaryo projeksiyonlarını tek panelden izleyin.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <InfoCard label="Toplam Yatırım" value={`₺${totalInvestment.toLocaleString('tr-TR')}`} icon={<Wallet className="w-[18px] h-[18px]" strokeWidth={1.75} />} />
        <InfoCard label="Toplam Net Nakit" value={`₺${totalNetCash.toLocaleString('tr-TR')}`} icon={<TrendingUp className="w-[18px] h-[18px]" strokeWidth={1.75} />} />
        <InfoCard label="Amorti Durumu" value={`%${paybackPercentage.toFixed(1)}`} icon={<Flame className="w-[18px] h-[18px]" strokeWidth={1.75} />} highlight />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="apple-card p-6 md:p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="apple-eyebrow flex items-center gap-2">
                <Trophy size={14} strokeWidth={1.75} /> Amorti
              </p>
              <h2 className="apple-title-1 mt-2">Ana Sermaye Geri Dönüşü</h2>
              <p className="text-[14px] text-[--text-secondary] mt-2">
                Toplam ₺{totalInvestment.toLocaleString('tr-TR')} yatırımın geri dönüş oranı.
              </p>
            </div>
            {isPaybackComplete ? (
              <div className="w-12 h-12 bg-[--accent] rounded-full flex items-center justify-center text-white">
                <CheckCircle2 size={24} strokeWidth={1.75} />
              </div>
            ) : (
              <span className="text-[28px] md:text-[32px] font-semibold text-[--accent] tabular-nums" style={{ letterSpacing: '-0.025em' }}>
                %{paybackPercentage.toFixed(1)}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="h-2 bg-[--bg-elevated] rounded-full overflow-hidden">
              <div
                className="h-full bg-[--accent] transition-all duration-700"
                style={{ width: `${paybackPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[12px] text-[--text-tertiary] tabular-nums">
              <span>₺0</span>
              <span>₺{totalInvestment.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[--border]">
            <p className="text-[13px] text-[--text-secondary]">Tahmini kalan</p>
            <p className="text-[18px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.014em' }}>
              ₺{Math.max(0, totalInvestment - totalNetCash).toLocaleString('tr-TR')}
              <span className="text-[14px] font-normal text-[--text-secondary] ml-2">net kâr</span>
            </p>
          </div>
        </div>

        <div className="apple-card p-6 md:p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="apple-eyebrow flex items-center gap-2">
                <Zap size={14} strokeWidth={1.75} /> Bu Ay
              </p>
              <h2 className="apple-title-1 mt-2">Ciro Hedefi</h2>
              <p className="text-[14px] text-[--text-secondary] mt-2">
                {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} dönemi brüt satış hedefi.
              </p>
            </div>
            <span className="text-[28px] md:text-[32px] font-semibold text-[--accent] tabular-nums" style={{ letterSpacing: '-0.025em' }}>
              %{monthlyProgress.toFixed(1)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-2 bg-[--bg-elevated] rounded-full overflow-hidden">
              <div className="h-full bg-[--accent] transition-all duration-700" style={{ width: `${Math.max(2, monthlyProgress)}%` }} />
            </div>
            <div className="flex justify-between text-[12px] text-[--text-tertiary] tabular-nums">
              <span>₺{currentGross.toLocaleString('tr-TR')}</span>
              <span>₺{monthlyRevenueTarget.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[--border] grid grid-cols-4 gap-2">
            {[
              { p: 25, label: 'Isınma' },
              { p: 50, label: 'Yarı yol' },
              { p: 75, label: 'Ritim' },
              { p: 100, label: 'Tamam' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-4 h-4 rounded-full transition-colors',
                    monthlyProgress >= step.p ? 'bg-[--accent]' : 'bg-[--bg-elevated]'
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    monthlyProgress >= step.p ? 'text-[--text]' : 'text-[--text-tertiary]'
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="apple-eyebrow">Simülasyon</p>
          <h2 className="apple-title-1 mt-2">3 Aylık Projeksiyon</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {monthlyProjection.map((p) => (
            <div key={p.label} className="apple-card p-5 md:p-6">
              <p className="text-[13px] text-[--text-secondary]">{p.label}</p>
              <p className="mt-2 text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>
                ₺{p.projectedRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[13px] text-[--text-tertiary] mt-2">Hedef: %{p.projectedProgress.toFixed(1)}</p>
              <p className="text-[13px] text-[--text-secondary] mt-1">
                Kalan: ₺{p.gap.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value, icon, highlight }: { label: string; value: string; icon: ReactNode; highlight?: boolean }) {
  return (
    <div className="apple-card p-5 md:p-6">
      <div className={cn(highlight ? 'text-[--accent]' : 'text-[--text-tertiary]')}>{icon}</div>
      <p className="text-[13px] text-[--text-secondary] mt-3" style={{ letterSpacing: '-0.005em' }}>{label}</p>
      <p className="mt-1 text-[20px] md:text-[24px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.018em' }}>
        {value}
      </p>
    </div>
  );
}
