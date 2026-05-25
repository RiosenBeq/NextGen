import { createClient } from '@/utils/supabase/server';
import { getActiveLocations } from '@/features/ledger/actions';
import InvestmentsClientUI from '@/components/premium/InvestmentsClientUI';
import { resolveActiveProfile } from '@/lib/profile-context';

export const metadata = {
  title: 'Yatırım Portföyü — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const profileCtx = await resolveActiveProfile();
  const profileId = profileCtx.profile?.id ?? null;
  const locations = await getActiveLocations();

  const { data: investmentsData } = profileId
    ? await supabase
        .from('Investment')
        .select('*, location:Location(*)')
        .eq('profileId', profileId)
        .order('createdAt', { ascending: false })
    : { data: [] };

  type InvestmentRow = { totalAmount?: number | null };
  const investments = investmentsData || [];
  const total = investments.reduce((sum: number, inv: InvestmentRow) => sum + (inv.totalAmount || 0), 0);

  return (
    <InvestmentsClientUI
      investments={investments}
      locations={locations || []}
      total={total}
      count={investments.length}
    />
  );
}
