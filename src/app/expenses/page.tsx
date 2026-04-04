"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TrendingDown, CreditCard, Plus } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import ExpenseList from '@/features/ledger/components/ExpenseList';

export default function ExpensesPage() {
  const [data, setData] = useState<{
    expenses: any[];
    locations: any[];
    documents: any[];
    total: number;
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

      setData({
        expenses,
        locations: locations || [],
        documents: documentsData || [],
        total
      });
    }
    fetchData();
  }, []);

  if (!data) return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
        <span className="text-sm text-slate-500">Yükleniyor...</span>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg inline-block mb-2">
            Finansal Gider Takibi
          </span>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-slate-400" />
            Gider Yönetimi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operasyonel giderleri, faturaları ve ekip ödemelerini takip edin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Total Expense Card */}
          <div className="premium-card px-5 py-4 stat-card-red border flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Toplam Gider</p>
              <p className="text-xl font-bold text-slate-900">
                ₺{data.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Add Expense Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="elite-button-primary flex items-center gap-2 py-3 px-5"
          >
            <Plus size={16} />
            Gider Ekle
          </button>
        </div>
      </header>

      {/* Expense Form - Collapsible */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <ExpenseForm 
            locations={data.locations} 
            onClose={() => setShowForm(false)} 
          />
        </motion.div>
      )}

      {/* Expense List */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">İşlem Geçmişi</h2>
          <div className="flex-1 section-divider" />
          <span className="text-xs text-slate-400 font-medium">{data.expenses.length} kayıt</span>
        </div>

        <ExpenseList 
          initialExpenses={data.expenses} 
          documents={data.documents} 
          locations={data.locations} 
        />
      </section>
    </div>
  );
}
