"use client";

import { use, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TrendingDown, CreditCard, Receipt, Wallet, Search, Filter } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import { ExpenseForm } from '@/features/ledger/components/ExpenseForm';
import ExpenseList from '@/features/ledger/components/ExpenseList';

export default function ExpensesPage() {
  const [data, setData] = useState<{
    expenses: any[];
    locations: any[];
    documents: any[];
    total: number;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const locations = await getActiveLocations();

      const { data: expensesData } = await supabase
        .from('Expense')
        .select('*, location:Location(*)')
        .order('createdAt', { ascending: false });

      const { data: documentsData } = await supabase
        .from('Document')
        .select('*')
        .eq('relatedType', 'expense');

      const expenses = expensesData || [];
      const total = expenses.reduce((sum: number, exp: any) => sum + (exp.amountWithVat || 0), 0);

      setData({
        expenses,
        locations: locations || [],
        documents: documentsData || [],
        total
      });
    }
    fetchData();
  }, []);

  if (!data) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/10">Financial Outflow</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <CreditCard className="w-8 h-8 text-zinc-500" />
             Gider Yönetimi
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Operasyonel giderleri, faturaları ve ekip ödemelerini detaylı olarak takip edin.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="premium-card px-8 py-5 bg-rose-500/[0.02] flex items-center gap-6 border-rose-500/10">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">TOPLAM GİDER</p>
              <p className="text-2xl font-bold text-white italic">₺{data.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <ExpenseForm locations={data.locations} />
        </div>
      </header>

      {/* Main Content */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-white tracking-tight">İşlem Geçmişi</h2>
             <div className="flex-1 h-[1px] bg-white/[0.04] w-24 hidden md:block" />
          </div>
        </div>

        <div className="space-y-8">
          <ExpenseList initialExpenses={data.expenses} documents={data.documents} locations={data.locations} />
        </div>
      </section>
    </div>
  );
}

