import { createClient } from '@/utils/supabase/server';
import { getActiveLocations } from '@/features/ledger/actions';
import ExpensesClientUI from '@/components/premium/ExpensesClientUI';

export const metadata = {
  title: 'Gider Yönetimi — NextGenBox',
};

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const locations = await getActiveLocations();

  const { data: expenses } = await supabase
    .from('Expense')
    .select('*, location:Location(*)')
    .order('createdAt', { ascending: false });

  const { data: documents } = await supabase
    .from('Document')
    .select('*')
    .eq('relatedType', 'expense');

  const expenseList = expenses || [];
  const total = expenseList.reduce((sum: number, exp: any) => sum + (exp.amountWithVat || 0), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = expenseList
    .filter((e: any) => e.month?.slice(0, 7) === currentMonth)
    .reduce((sum: number, e: any) => sum + (e.amountWithVat || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="page-wrapper max-w-7xl mx-auto p-4 md:p-8">
        <ExpensesClientUI
          expenses={expenseList}
          locations={locations || []}
          documents={documents || []}
          total={total}
          thisMonthTotal={thisMonthTotal}
        />
      </div>
    </div>
  );
}
