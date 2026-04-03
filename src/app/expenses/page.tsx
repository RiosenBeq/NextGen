import { createClient } from '@/utils/supabase/server';
import { TrendingDown, PiggyBank, ArrowDownRight, CreditCard } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import { ExpenseForm } from '@/features/ledger/components/ExpenseForm';
import { InvestmentForm } from '@/features/ledger/components/InvestmentForm';
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

interface Investment {
  id: string;
  description: string;
  currency: string;
  amountWithoutVat: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
  location?: Location | null;
  createdAt: string;
}

export default async function ExpensesPage() {
  const supabase = await createClient();
  const locations = await getActiveLocations();

  const { data: expensesData } = await supabase
    .from('Expense')
    .select('*, location:Location(*)')
    .order('createdAt', { ascending: false });

  const { data: investmentsData } = await supabase
    .from('Investment')
    .select('*, location:Location(*)')
    .order('createdAt', { ascending: false });

  const { data: documentsData } = await supabase
    .from('Document')
    .select('*')
    .eq('relatedType', 'expense');

  const expenses = (expensesData || []) as Expense[];
  const investments = (investmentsData || []) as Investment[];
  const documents = documentsData || [];

  const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amountWithVat || 0), 0);
  const totalInvestment = investments.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

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
              Gider ve Yatırım<br/>Yönetimi
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <ExpenseForm locations={locations} />
            <InvestmentForm locations={locations} />
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

          <div className="premium-card px-8 py-5 flex items-center gap-6 divide-x divide-white/5 shadow-2xl bg-gradient-to-br from-zinc-900 to-black">
            <div className="pr-6">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">TOPLAM YATIRIM (CAPEX)</p>
              <p className="text-2xl font-black text-emerald-400">₺{totalInvestment.toLocaleString('tr-TR')}</p>
            </div>
            <div className="pl-6 flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-emerald-500" />
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-12">
        <ExpenseList initialExpenses={expenses} documents={documents} />

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card overflow-hidden"
        >
          <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-black text-white tracking-tight leading-none mb-1">Yatırım Harcamaları (CAPEX)</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">İlk Kurulum ve Demirbaş Alımları</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Kalem</th>
                  <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Lokasyon</th>
                  <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Brüt Tutar</th>
                  <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right text-emerald-500">Toplam TL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {investments.map((inv, idx) => (
                  <tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{inv.description}</span>
                        {inv.notes && <span className="text-[10px] text-zinc-500 font-medium">{inv.notes}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-zinc-400 uppercase">
                        {inv.location?.name}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-mono text-xs text-zinc-400">
                      {inv.amountWithoutVat?.toLocaleString('tr-TR')} {inv.currency}
                    </td>
                    <td className="px-8 py-6 text-right font-mono text-sm font-black text-emerald-400">
                      ₺{inv.totalAmount?.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
