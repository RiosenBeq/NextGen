import { createClient } from '@/utils/supabase/server';
import AvmPaymentsClientUI from '@/components/premium/AvmPaymentsClientUI';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AVM Ödeme Takibi — NextGenBox',
};

export default async function AvmPaymentsPage() {
  const supabase = await createClient();

  const [{ data: payments }, { data: locations }] = await Promise.all([
    supabase
      .from('AvmPayment')
      .select('*, location:Location(id, name)')
      .order('month', { ascending: false }),
    supabase
      .from('Location')
      .select('id, name')
      .eq('isActive', true)
      .order('name', { ascending: true }),
  ]);

  return (
    <div className="page-wrapper animate-fade-in">
      <AvmPaymentsClientUI
        initialPayments={
          (payments || []) as Array<{
            id: string;
            locationId: string;
            month: string;
            paymentType: string;
            description: string | null;
            amount: number;
            isPaid: boolean;
            paidAt: string | null;
            createdAt: string;
            location: { id: string; name: string } | Array<{ id: string; name: string }>;
          }>
        }
        locations={(locations || []) as Array<{ id: string; name: string }>}
      />
    </div>
  );
}
