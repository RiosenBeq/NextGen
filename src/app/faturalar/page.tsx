import { createClient } from '@/utils/supabase/server';
import FaturalarClientUI from '@/components/premium/FaturalarClientUI';
import { getActiveLocations } from '@/features/ledger/actions';
import { resolveActiveProfile } from '@/lib/profile-context';

export const metadata = {
  title: 'Faturalar ve Belgeler — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const supabase = await createClient();
  const profileCtx = await resolveActiveProfile();
  const profileId = profileCtx.profile?.id ?? null;

  const { data: expenses } = profileId ? await supabase
    .from('Expense')
    .select('*, location:Location(name)')
    .eq('profileId', profileId)
    .not('attachmentUrl', 'is', null)
    .order('createdAt', { ascending: false }) : { data: [] };

  const { data: avmExpenses } = profileId ? await supabase
    .from('Expense')
    .select('*, location:Location(name)')
    .eq('profileId', profileId)
    .or('description.ilike.%Sabit Kira%,description.ilike.%AVM Aidat%,description.ilike.%Ciro Payı%')
    .order('createdAt', { ascending: false })
    .limit(60) : { data: [] };

  const locations = await getActiveLocations();

  return (
    <FaturalarClientUI
      invoices={expenses || []}
      avmExpenses={avmExpenses || []}
      locations={locations || []}
    />
  );
}
