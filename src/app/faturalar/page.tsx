import { createClient } from '@/utils/supabase/server';
import FaturalarClientUI from '@/components/premium/FaturalarClientUI';
import { getActiveLocations } from '@/features/ledger/actions';

export const metadata = {
  title: 'Faturalar ve Belgeler — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from('Expense')
    .select('*, location:Location(name)')
    .not('attachmentUrl', 'is', null)
    .order('createdAt', { ascending: false });

  const { data: avmExpenses } = await supabase
    .from('Expense')
    .select('*, location:Location(name)')
    .or('description.ilike.%Sabit Kira%,description.ilike.%AVM Aidat%,description.ilike.%Ciro Payı%')
    .order('createdAt', { ascending: false })
    .limit(60);

  const locations = await getActiveLocations();

  return (
    <FaturalarClientUI
      invoices={expenses || []}
      avmExpenses={avmExpenses || []}
      locations={locations || []}
    />
  );
}
