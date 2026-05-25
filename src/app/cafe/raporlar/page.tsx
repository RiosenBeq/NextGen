import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, TrendingUp, Users, Receipt, ArrowLeft } from 'lucide-react';
import { resolveActiveProfile } from '@/lib/profile-context';
import { getCafeMonthlySummary, listCafeDailySales, listAvailableMonths } from '@/features/cafe/actions';

export const metadata = {
  title: 'Cafe Raporları',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, { label: string; hue: string }> = {
  coffee: { label: 'Kahve', hue: '#6B4226' },
  coldDrink: { label: 'Soğuk', hue: '#3FA3D9' },
  dessert: { label: 'Tatlı', hue: '#D9A86C' },
  food: { label: 'Yemek', hue: '#A85542' },
  other: { label: 'Diğer', hue: '#94A3B8' },
};

function formatTRY(n: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

function formatMonthLabel(monthId: string) {
  const [y, m] = monthId.split('-').map((n) => parseInt(n, 10));
  if (!y || !m) return monthId;
  return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export default async function CafeReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const ctx = await resolveActiveProfile();
  if (ctx.error || !ctx.profile) redirect('/profile-select');
  if (ctx.profile.businessType !== 'cafe') redirect('/');

  const sp = await searchParams;
  const monthId = sp.m;

  const [summary, entries, months] = await Promise.all([
    getCafeMonthlySummary(monthId),
    listCafeDailySales({ month: monthId, limit: 100 }),
    listAvailableMonths(),
  ]);

  const selectedMonth = summary?.monthId ?? new Date().toISOString().slice(0, 7);

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <Link
            href="/cafe"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[--text-tertiary] hover:text-[--text] mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
            Cafe Paneli
          </Link>
          <p className="apple-eyebrow">Raporlar</p>
          <h1 className="apple-headline mt-3">
            <span
              style={{
                background: `linear-gradient(135deg, ${ctx.profile.primaryColor}, ${ctx.profile.accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatMonthLabel(selectedMonth)}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {months.slice(0, 6).map((m) => (
            <Link
              key={m}
              href={`/cafe/raporlar?m=${m}`}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                m === selectedMonth
                  ? 'text-white border-transparent shadow-md'
                  : 'text-[--text-secondary] bg-white border-[--border] hover:bg-[--bg-elevated]'
              }`}
              style={
                m === selectedMonth
                  ? {
                      background: `linear-gradient(135deg, ${ctx.profile.primaryColor}, ${ctx.profile.accentColor})`,
                    }
                  : undefined
              }
            >
              {formatMonthLabel(m)}
            </Link>
          ))}
        </div>
      </header>

      {(!summary || summary.totalRevenue === 0) && (
        <div className="apple-card p-10 text-center">
          <Calendar className="w-12 h-12 mx-auto text-[--text-tertiary]" strokeWidth={1.5} />
          <p className="text-[15px] text-[--text-secondary] mt-4">
            {formatMonthLabel(selectedMonth)} için ciro kaydı bulunamadı.
          </p>
          <Link
            href="/cafe/satislar"
            className="inline-block mt-5 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${ctx.profile.primaryColor}, ${ctx.profile.accentColor})` }}
          >
            Bu ay için ciro gir →
          </Link>
        </div>
      )}

      {summary && summary.totalRevenue > 0 && (
        <>
          {/* Summary cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" strokeWidth={1.75} />}
              label="Ciro"
              value={`₺${formatTRY(summary.totalRevenue)}`}
              tone={ctx.profile.primaryColor}
            />
            <SummaryCard
              icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
              label="Müşteri"
              value={formatTRY(summary.totalCustomers)}
            />
            <SummaryCard
              icon={<Receipt className="w-5 h-5" strokeWidth={1.75} />}
              label="Ortalama Hesap"
              value={`₺${formatTRY(summary.avgTicket)}`}
            />
            <SummaryCard
              icon={<Calendar className="w-5 h-5" strokeWidth={1.75} />}
              label="Çalışılan Gün"
              value={String(summary.daysWithSales)}
            />
          </section>

          {/* Daily timeline */}
          <section className="apple-card overflow-hidden">
            <div className="px-6 py-5 border-b border-[--border]">
              <p className="apple-eyebrow">Günlük Dağılım</p>
              <h3 className="apple-title-2 mt-1">{entries.length} kayıt</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[--border] bg-[--bg-subtle]">
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary]">Tarih</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary]">Lokasyon</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] text-center">Müşteri</th>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <th key={k} className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] text-right">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5"
                          style={{ background: v.hue }}
                        />
                        {v.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border-soft]">
                  {entries.map((r) => (
                    <tr key={r.id} className="hover:bg-[--bg-subtle]">
                      <td className="px-6 py-3 text-[13px] text-[--text] font-semibold tabular-nums">
                        {new Date(r.date + 'T00:00:00Z').toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-6 py-3 text-[12px] text-[--text-secondary]">{r.locationName}</td>
                      <td className="px-6 py-3 text-center text-[12px] tabular-nums text-[--text-secondary]">{r.customerCount}</td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums text-[--text-secondary]">{r.coffeeRevenue > 0 ? `₺${formatTRY(r.coffeeRevenue)}` : '—'}</td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums text-[--text-secondary]">{r.coldDrinkRevenue > 0 ? `₺${formatTRY(r.coldDrinkRevenue)}` : '—'}</td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums text-[--text-secondary]">{r.dessertRevenue > 0 ? `₺${formatTRY(r.dessertRevenue)}` : '—'}</td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums text-[--text-secondary]">{r.foodRevenue > 0 ? `₺${formatTRY(r.foodRevenue)}` : '—'}</td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums text-[--text-secondary]">{r.otherRevenue > 0 ? `₺${formatTRY(r.otherRevenue)}` : '—'}</td>
                      <td className="px-6 py-3 text-right text-[13px] font-semibold tabular-nums text-[--text]">₺{formatTRY(r.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[--border-strong] bg-[--bg-subtle]">
                    <td colSpan={3} className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-[--text-tertiary]">Toplam</td>
                    <td className="px-3 py-4 text-right text-[13px] font-semibold tabular-nums text-[--text]">₺{formatTRY(summary.categoryBreakdown.coffee)}</td>
                    <td className="px-3 py-4 text-right text-[13px] font-semibold tabular-nums text-[--text]">₺{formatTRY(summary.categoryBreakdown.coldDrink)}</td>
                    <td className="px-3 py-4 text-right text-[13px] font-semibold tabular-nums text-[--text]">₺{formatTRY(summary.categoryBreakdown.dessert)}</td>
                    <td className="px-3 py-4 text-right text-[13px] font-semibold tabular-nums text-[--text]">₺{formatTRY(summary.categoryBreakdown.food)}</td>
                    <td className="px-3 py-4 text-right text-[13px] font-semibold tabular-nums text-[--text]">₺{formatTRY(summary.categoryBreakdown.other)}</td>
                    <td className="px-6 py-4 text-right text-[15px] font-bold tabular-nums text-[--text]">₺{formatTRY(summary.totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="apple-card p-5 relative overflow-hidden">
      {tone && (
        <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: tone }} />
      )}
      <div
        className="inline-flex w-9 h-9 rounded-xl items-center justify-center text-white"
        style={{ background: tone ?? 'var(--text)' }}
      >
        {icon}
      </div>
      <p className="text-[12px] text-[--text-secondary] mt-3">{label}</p>
      <p className="text-[20px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.015em' }}>
        {value}
      </p>
    </div>
  );
}
