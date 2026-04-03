"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PiggyBank, Briefcase, TrendingUp, Wallet, ArrowUpRight, BarChart3 } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import { InvestmentForm } from '@/features/ledger/components/InvestmentForm';
import InvestmentList from '@/features/ledger/components/InvestmentList';

export default function InvestmentsPage() {
  const [data, setData] = useState<{
    investments: any[];
    locations: any[];
    total: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const locations = await getActiveLocations();

      const { data: investmentsData } = await supabase
        .from('Investment')
        .select('*, location:Location(*)')
        .order('createdAt', { ascending: false });

      const investments = investmentsData || [];
      const total = investments.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

      setData({
        investments,
        locations: locations || [],
        total,
        count: investments.length
      });
    }
    fetchData();
  }, []);

  if (!data) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10">Capital Expenditure</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <Briefcase className="w-8 h-8 text-zinc-500" />
             Yatırım & Demirbaş
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Sabit yatırım kalemlerini, demirbaş alımlarını ve ROI (Geri Dönüş) sürelerini stratejik olarak yönetin.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="premium-card px-8 py-5 bg-emerald-500/[0.02] flex items-center gap-6 border-emerald-500/10">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">TOPLAM YATIRIM</p>
              <p className="text-2xl font-bold text-white italic">₺{data.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <InvestmentForm locations={data.locations} />
        </div>
      </header>

      {/* Main Content */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="premium-card p-6 border-white/5 bg-white/[0.01] flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                 <BarChart3 size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kayıt Sayısı</p>
                 <p className="text-lg font-bold text-white">{data.count} Demirbaş</p>
              </div>
           </div>
           {/* Summary stat 2 */}
           <div className="premium-card p-6 border-white/5 bg-white/[0.01] flex items-center gap-4 opacity-50">
              <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-500">
                 <ArrowUpRight size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Amortisman</p>
                 <p className="text-lg font-bold text-white">Yıllık %10</p>
              </div>
           </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-white tracking-tight">Yatırım Detayları</h2>
             <div className="flex-1 h-[1px] bg-white/[0.04]" />
          </div>
          <InvestmentList initialInvestments={data.investments} locations={data.locations} />
        </div>
      </section>
    </div>
  );
}

