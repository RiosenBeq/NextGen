import { createClient } from '@/utils/supabase/server';
import AvmPaymentsClientUI from '@/components/premium/AvmPaymentsClientUI';
import { resolveActiveProfile } from '@/lib/profile-context';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AVM Ödeme Takibi — NextGenBox',
};

export default async function AvmPaymentsPage() {
  const supabase = await createClient();
  const profileCtx = await resolveActiveProfile();
  const profileId = profileCtx.profile?.id ?? null;

  const [{ data: payments }, { data: locations }] = profileId
    ? await Promise.all([
        supabase
          .from('AvmPayment')
          .select('*, location:Location(id, name)')
          .eq('profileId', profileId)
          .order('month', { ascending: false }),
        supabase
          .from('Location')
          .select('id, name')
          .eq('profileId', profileId)
          .eq('isActive', true)
          .order('name', { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

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
