import { createClient } from '@/utils/supabase/server';
import AvmOdemeleriClientUI from '@/components/premium/AvmOdemeleriClientUI';

export const metadata = {
  title: 'AVM Ödemeleri Takibi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

const AVM_KEYWORDS = ['avm', 'kira', 'aidat', 'ciro payı'];

export default async function AvmOdemeleriPage() {
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from('Expense')
    .select('id, description, amountWithVat, paidBy, month, createdAt, location:Location(name)')
    .order('createdAt', { ascending: false });

  const avmExpenses = (expenses || []).filter((item) => {
    const normalized = (item.description || '').toLowerCase();
    return AVM_KEYWORDS.some((keyword) => normalized.includes(keyword));
  });

  return <AvmOdemeleriClientUI expenses={avmExpenses} />;
}
