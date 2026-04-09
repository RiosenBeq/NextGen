import { createClient } from '@/utils/supabase/server';
import { getActiveLocations } from '@/features/ledger/actions';
import ExpensesClientUI from '@/components/premium/ExpensesClientUI';

export const metadata = {
  title: 'Gider Yönetimi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const locations = await getActiveLocations();

  const [{ data: expensesData }, { data: documentsData }] = await Promise.all([
    supabase
      .from('Expense')
      .select('*, location:Location(*)')
      .order('createdAt', { ascending: false }),
    supabase
      .from('Document')
      .select('*')
      .eq('relatedType', 'expense'),
  ]);

  const expenses = expensesData || [];
  const total = expenses.reduce((sum: number, exp: any) => sum + (exp.amountWithVat || 0), 0);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = expenses
    .filter((e: any) => e.month && e.month.slice(0, 7) === currentMonthStr)
    .reduce((sum: number, e: any) => sum + (e.amountWithVat || 0), 0);

  return (
    <ExpensesClientUI
      expenses={expenses}
      locations={locations || []}
      documents={documentsData || []}
      total={total}
      thisMonthTotal={thisMonthTotal}
    />
  );
}
