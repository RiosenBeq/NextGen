"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PiggyBank, Briefcase, TrendingUp, Wallet, ArrowUpRight, Filter as FilterIcon, ArrowRight } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import InvestmentsClientUI from '@/components/premium/InvestmentsClientUI';

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

  if (!data) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-[24px] border-4 border-slate-100"></div>
        <div className="w-16 h-16 rounded-[24px] border-4 border-emerald-600 border-t-transparent animate-spin absolute top-0 left-0 shadow-lg shadow-emerald-500/10"></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase animate-pulse">NextGen Box Capital</span>
        <span className="text-xs font-bold text-slate-300 italic">Yatırım portföyü senkronize ediliyor...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="page-wrapper max-w-7xl mx-auto p-4 md:p-8">
         <InvestmentsClientUI 
            investments={data.investments}
            locations={data.locations}
            total={data.total}
            count={data.count}
         />
      </div>
    </div>
  );
}

