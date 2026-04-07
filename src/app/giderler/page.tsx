"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getActiveLocations } from '@/features/ledger/actions';
import ExpensesClientUI from '@/components/premium/ExpensesClientUI';

export default function ExpensesPage() {
  const [data, setData] = useState<{
    expenses: any[];
    locations: any[];
    documents: any[];
    total: number;
    thisMonthTotal: number;
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
      
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const thisMonthTotal = expenses
        .filter((e: any) => e.month && e.month.slice(0, 7) === currentMonthStr)
        .reduce((sum, e) => sum + (e.amountWithVat || 0), 0);

      setData({
        expenses,
        locations: locations || [],
        documents: documentsData || [],
        total,
        thisMonthTotal
      });
    }
    fetchData();
  }, []);

  if (!data) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-[24px] border-4 border-slate-100 shadow-inner"></div>
        <div className="w-16 h-16 rounded-[24px] border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0 shadow-lg shadow-blue-500/10"></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase animate-pulse">NextGen Box Ledger</span>
        <span className="text-xs font-bold text-slate-300 italic">Veriler güvenli katmanda doğrulanıyor...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="page-wrapper max-w-7xl mx-auto p-4 md:p-8">
         <ExpensesClientUI 
            expenses={data.expenses}
            locations={data.locations}
            documents={data.documents}
            total={data.total}
            thisMonthTotal={data.thisMonthTotal}
         />
      </div>
    </div>
  );
}
