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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="page-wrapper max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10 p-4 md:p-8 pt-12">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full mb-3 border" style={{ background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>
            <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: '#2F6BFF' }} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#2F6BFF' }}>
              FİNANSAL YÖNETİM MERKEZİ
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8" style={{ color: '#2F6BFF' }} />
            Gider Yönetimi
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium max-w-2xl">
            İşletme giderlerini, fatura takibini ve ekip mahsuplaşmalarını <span className="font-bold text-slate-700">Gerçek Zamanlı</span> verilerle profesyonelce yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full lg:w-auto">
          {/* Stats Cards Row */}
          <div className="flex gap-4">
            <div className="premium-card p-5 bg-white border border-slate-100 min-w-[160px]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Bu Ayki Gider</p>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                ₺{data.thisMonthTotal.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            
            <div className="premium-card p-5 border min-w-[160px]" style={{ background: '#1E2A44', borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Toplam Gider</p>
              <p className="text-2xl font-black text-white font-mono tracking-tighter">
                ₺{data.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="group relative px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 text-white cursor-pointer"
            style={{ background: '#2F6BFF' }}
          >
            <Plus size={18} strokeWidth={3} />
            <span>Yeni Gider Ekle</span>
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

