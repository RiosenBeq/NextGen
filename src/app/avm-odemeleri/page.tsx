import { createClient } from '@/utils/supabase/server';
import AvmOdemeleriClientUI from '@/components/premium/AvmOdemeleriClientUI';

export const metadata = {
  title: 'AVM Ödemeleri Takibi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function AvmOdemeleriPage() {
  const supabase = await createClient();

  const [{ data: invoices }, { data: locations }] = await Promise.all([
    supabase
      .from('AvmInvoice')
      .select('id, locationId, invoiceType, amount, invoiceDate, dueDate, isPaid, paidAt, attachmentUrl, notes, createdAt, location:Location(name)')
      .order('invoiceDate', { ascending: false }),
    supabase
      .from('Location')
      .select('id, name')
      .eq('isActive', true)
      .order('name', { ascending: true }),
  ]);

  return <AvmOdemeleriClientUI invoices={invoices || []} locations={locations || []} />;
}
