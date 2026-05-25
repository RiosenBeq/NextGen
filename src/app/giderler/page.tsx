import { createClient } from '@/utils/supabase/server';
import { getActiveLocations } from '@/features/ledger/actions';
import ExpensesClientUI from '@/components/premium/ExpensesClientUI';
import { resolveActiveProfile } from '@/lib/profile-context';

export const metadata = {
  title: 'Gider Yönetimi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const profileCtx = await resolveActiveProfile();
  const profileId = profileCtx.profile?.id ?? null;
  const locations = await getActiveLocations();

  const [{ data: expensesData }, { data: documentsData }] = profileId
    ? await Promise.all([
        supabase
          .from('Expense')
          .select('*, location:Location(*)')
          .eq('profileId', profileId)
          .order('createdAt', { ascending: false }),
        supabase
          .from('Document')
          .select('*')
          .eq('profileId', profileId)
          .eq('relatedType', 'expense'),
      ])
    : [{ data: [] }, { data: [] }];

  type ExpenseRow = {
    amountWithVat?: number | null;
    month?: string | null;
  };
  const expenses = expensesData || [];
  const total = expenses.reduce((sum: number, exp: ExpenseRow) => sum + (exp.amountWithVat || 0), 0);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = expenses
    .filter((e: ExpenseRow) => !!e.month && e.month.slice(0, 7) === currentMonthStr)
    .reduce((sum: number, e: ExpenseRow) => sum + (e.amountWithVat || 0), 0);

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
