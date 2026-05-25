import { redirect } from 'next/navigation';
import { resolveActiveProfile } from '@/lib/profile-context';
import { listCafeDailySales } from '@/features/cafe/actions';
import { getActiveLocations } from '@/features/ledger/actions';
import CafeDailySalesClient from '@/components/premium/CafeDailySalesClient';

export const metadata = {
  title: 'Günlük Ciro Girişi — Cafe',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function CafeDailySalesPage() {
  const ctx = await resolveActiveProfile();
  if (ctx.error || !ctx.profile) redirect('/profile-select');
  if (ctx.profile.businessType !== 'cafe') redirect('/');

  const [entries, locations] = await Promise.all([
    listCafeDailySales({ limit: 60 }),
    getActiveLocations(),
  ]);

  return (
    <CafeDailySalesClient
      profile={ctx.profile}
      initialEntries={entries}
      locations={locations as { id: string; name: string }[]}
    />
  );
}
