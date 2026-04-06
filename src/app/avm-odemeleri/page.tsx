import { createClient } from '@/utils/supabase/server';
import AvmOdemeleriClientUI from '@/components/premium/AvmOdemeleriClientUI';

export const metadata = {
  title: 'AVM Ödemeleri Takibi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

type InvoiceRow = {
  id: string;
  locationId?: string | null;
  invoiceType: 'AIDAT_FATURASI' | 'CIRO_PAYI_FATURASI' | 'KIRA_FATURASI' | 'DIGER_FATURA';
  amount: number;
  invoiceDate: string;
  dueDate?: string | null;
  isPaid: boolean;
  paidAt?: string | null;
  attachmentUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  location?: { name?: string | null }[] | { name?: string | null } | null;
};

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

  const normalizedInvoices = ((invoices || []) as InvoiceRow[]).map((item) => ({
    ...item,
    location: Array.isArray(item.location) ? item.location[0] || null : item.location || null,
  }));

  return <AvmOdemeleriClientUI invoices={normalizedInvoices} locations={locations || []} />;
}
