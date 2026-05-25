import { redirect } from 'next/navigation';
import { resolveActiveProfile } from '@/lib/profile-context';
import { getCafeMonthlySummary, listCafeDailySales, listAvailableMonths } from '@/features/cafe/actions';
import { getActiveLocations } from '@/features/ledger/actions';
import CafeDashboardClient from '@/components/premium/CafeDashboardClient';

export const metadata = {
  title: 'Cafe Paneli — NextGen',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function CafeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const ctx = await resolveActiveProfile();
  if (ctx.error || !ctx.profile) {
    redirect('/profile-select');
  }
  if (ctx.profile.businessType !== 'cafe') {
    redirect('/');
  }

  const sp = await searchParams;
  const monthId = sp.m;

  const [summary, recent, months, locations] = await Promise.all([
    getCafeMonthlySummary(monthId),
    listCafeDailySales({ month: monthId, limit: 14 }),
    listAvailableMonths(),
    getActiveLocations(),
  ]);

  return (
    <CafeDashboardClient
      profile={ctx.profile}
      summary={summary}
      recent={recent}
      months={months}
      locations={locations as { id: string; name: string }[]}
      selectedMonth={summary?.monthId ?? new Date().toISOString().slice(0, 7)}
    />
  );
}
