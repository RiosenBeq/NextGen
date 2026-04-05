"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TrendingDown, CreditCard, Plus, Activity, Filter, Wallet } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import ExpenseList from '@/features/ledger/components/ExpenseList';
import { AnimatePresence } from 'framer-motion';

export default function ExpensesPage() {
  const [data, setData] = useState<{
    expenses: any[];
    locations: any[];
    documents: any[];
    total: number;
    thisMonthTotal: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100"></div>
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <span className="text-sm font-semibold tracking-widest text-slate-400 uppercase animate-pulse">Sistem Yükleniyor...</span>
    </div>
  );

  return (
    <div className="page-wrapper max-w-7xl mx-auto space-y-8 animate-fade-in p-4 md:p-8">
      
      {/* Header Section */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/50 backdrop-blur-md mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Finansal Gider Takibi
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
            Gider Yönetimi
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl">
            Tüm şube ve merkez operasyonel giderlerini, faturalarını ve ekiplerin ödemelerini tek bir noktadan, <span className="text-slate-800 font-semibold">tam şeffaflıkla</span> yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Stats Cards Row */}
          <div className="flex w-full sm:w-auto gap-4">
            <div className="premium-card p-4 flex-1 sm:w-48 bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-12 h-12" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bu Ayki Gider</p>
              <p className="text-2xl font-black text-slate-800">
                ₺{data.thisMonthTotal.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            
            <div className="premium-card p-4 flex-1 sm:w-48 bg-gradient-to-br from-red-500 to-red-700 border-none shadow-md shadow-red-500/20 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-20">
                <TrendingDown className="w-12 h-12" />
              </div>
              <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest mb-1">Tüm Zamanlar</p>
              <p className="text-2xl font-black text-white">
                ₺{data.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 active:scale-95 transition-all outline-none rounded-xl py-3.5 px-6 font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Yeni Gider İşle</span>
          </button>
        </div>
      </header>

      {/* Expense Form Modal - Upgraded to a sleek overlay */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[5vh] md:top-[10vh] mx-auto z-[101] max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl shadow-2xl"
            >
              <ExpenseForm 
                locations={data.locations} 
                onClose={() => setShowForm(false)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Data Section */}
      <section className="space-y-6">
        <ExpenseList 
          initialExpenses={data.expenses} 
          documents={data.documents} 
          locations={data.locations} 
        />
      </section>
    </div>
  );
}

