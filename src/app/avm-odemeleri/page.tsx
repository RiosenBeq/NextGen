import { createClient } from '@/utils/supabase/server';
import AvmPaymentsClientUI from '@/components/premium/AvmPaymentsClientUI';

export const metadata = {
  title: 'AVM Ödeme Takibi — NextGenBox',
};

export default async function AvmPaymentsPage() {
  const supabase = await createClient();

  const { data: avmExpenses } = await supabase
    .from('Expense')
    .select('id, description, amountWithVat, isOfficial, isSettled, paidBy, location:Location(name)')
    .or('description.ilike.%Sabit Kira%,description.ilike.%AVM Aidat%,description.ilike.%Ciro Payı%')
    .order('createdAt', { ascending: false })
    .limit(120);

  return (
    <div className="page-wrapper animate-fade-in">
      <AvmPaymentsClientUI initialItems={(avmExpenses || []) as unknown as Array<{ id: string; description: string; amountWithVat: number; isOfficial: boolean; isSettled?: boolean; paidBy: string; location?: { name: string } | Array<{ name: string }> }>} />
    </div>
  );
}
