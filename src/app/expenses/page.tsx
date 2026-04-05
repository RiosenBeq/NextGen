"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TrendingDown, CreditCard, Plus, Activity, Filter, Wallet } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import ExpenseList from '@/features/ledger/components/ExpenseList';
import ModernModal from '@/components/ModernModal';
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
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-slate-800/20 blur-[150px]"></div>
      </div>

      <div className="page-wrapper max-w-7xl mx-auto space-y-10 relative z-10 p-4 md:p-8 pt-12">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md mb-2">
              <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                FİNANSAL YÖNETİM MERKEZİ
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-4 italic uppercase">
              <Wallet className="w-10 h-10 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              Gider <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Yönetimi</span>
            </h1>
            <p className="text-sm md:text-lg text-slate-400 font-medium max-w-2xl leading-relaxed">
              İşletme giderlerini, fatura takibini ve ekip mahsuplaşmalarını <span className="text-blue-400 font-bold">Gerçek Zamanlı</span> verilerle profesyonelce yönetin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full lg:w-auto">
            {/* Stats Cards Row */}
            <div className="flex gap-4">
              <div className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative min-w-[160px]">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">BU AYKİ GİDER</p>
                  <p className="text-2xl font-black text-white font-mono tracking-tighter">
                    ₺{data.thisMonthTotal.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              
              <div className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative min-w-[160px]">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">TOPLAM GİDER</p>
                  <p className="text-2xl font-black text-white font-mono tracking-tighter">
                    ₺{data.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-95 flex items-center justify-center gap-3"
            >
              <Plus size={20} strokeWidth={3} />
              <span>YENİ GİDER EKLE</span>
            </button>
          </div>
        </header>

        {/* Expense Form Modal Refactored */}
        <ModernModal 
          isOpen={showForm} 
          onClose={() => setShowForm(false)}
          maxWidth="max-w-2xl"
          showCloseButton={false}
        >
          <ExpenseForm 
            locations={data.locations} 
            onClose={() => setShowForm(false)} 
          />
        </ModernModal>


        {/* Data Section */}
        <section className="relative">
          <div className="absolute -inset-4 bg-white/[0.02] border border-white/5 rounded-[40px] blur-sm pointer-events-none"></div>
          <div className="relative">
            <ExpenseList 
              initialExpenses={data.expenses} 
              documents={data.documents} 
              locations={data.locations} 
            />
          </div>
        </section>
      </div>
    </div>
  );
}

