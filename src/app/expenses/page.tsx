import { createClient } from '@/utils/supabase/server';
import { TrendingDown, PiggyBank, ArrowDownRight, CreditCard } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import { ExpenseForm } from '@/features/ledger/components/ExpenseForm';
import ExpenseList from '@/features/ledger/components/ExpenseList';

export const metadata = {
  title: 'Giderler & Yatırımlar - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

// ... interfaces ...
interface Location {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  type: string;
  month?: string;
  isOfficial: boolean;
  amountWithoutVat: number;
  amountWithVat: number;
  location?: Location | null;
  paidBy?: string;
  createdAt: string;
}



export default async function ExpensesPage() {
  const supabase = await createClient();
  const locations = await getActiveLocations();

  const { data: expensesData } = await supabase
    .from('Expense')
    .select('*, location:Location(*)')
    .order('createdAt', { ascending: false });



  const { data: documentsData } = await supabase
    .from('Document')
    .select('*')
    .eq('relatedType', 'expense');

  const expenses = (expensesData || []) as Expense[];
  const documents = documentsData || [];

  const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amountWithVat || 0), 0);

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <span className="w-8 h-[2px] bg-rose-500 rounded-full"></span>
              <span className="text-[10px] font-black tracking-[0.3em] text-rose-500 uppercase">
                Financial Outflow
              </span>
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter heading-elite leading-tight">
              Gider Yönetimi
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <ExpenseForm locations={locations} />
          </div>
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="premium-card px-8 py-5 flex items-center gap-6 divide-x divide-white/5 shadow-2xl">
            <div className="pr-6">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">TOPLAM GİDER</p>
              <p className="text-2xl font-black text-white">₺{totalExpense.toLocaleString('tr-TR')}</p>
            </div>
            <div className="pl-6 flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
               </div>
            </div>
          </div>

        </div>
      </header>

      <div className="space-y-12">
        <ExpenseList initialExpenses={expenses} documents={documents} locations={locations} />
      </div>
    </div>
  );
}
