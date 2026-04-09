import { createClient } from '@/utils/supabase/server';
import { getActiveLocations } from '@/features/ledger/actions';
import InvestmentsClientUI from '@/components/premium/InvestmentsClientUI';

export const metadata = {
  title: 'Yatırım Portföyü — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const locations = await getActiveLocations();

  const { data: investmentsData } = await supabase
    .from('Investment')
    .select('*, location:Location(*)')
    .order('createdAt', { ascending: false });

  const investments = investmentsData || [];
  const total = investments.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

  return (
    <InvestmentsClientUI
      investments={investments}
      locations={locations || []}
      total={total}
      count={investments.length}
    />
  );
}
