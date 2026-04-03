import { createClient } from '@/utils/supabase/server';
import { PiggyBank, Briefcase } from 'lucide-react';
import * as motion from "framer-motion/client";
import { getActiveLocations } from '@/features/ledger/actions';
import { InvestmentForm } from '@/features/ledger/components/InvestmentForm';
import InvestmentList from '@/features/ledger/components/InvestmentList';

export const metadata = {
  title: 'Yatırımlar (CAPEX) - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

interface Location {
  id: string;
  name: string;
}

interface Investment {
  id: string;
  description: string;
  currency: string;
  amountWithoutVat: number;
  totalAmount: number;
  notes?: string;
  locationId?: string;
  location?: Location | null;
  createdAt: string;
}

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const locations = await getActiveLocations();

  const { data: investmentsData } = await supabase
    .from('Investment')
    .select('*, location:Location(*)')
    .order('createdAt', { ascending: false });

  const investments = (investmentsData || []) as Investment[];
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
              <span className="w-8 h-[2px] bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
                CAPEX Control Center
              </span>
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter heading-elite leading-tight">
              Yatırım & Demirbaş<br/>Yönetimi
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <InvestmentForm locations={locations} />
          </div>
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="premium-card px-8 py-5 flex items-center gap-6 divide-x divide-slate-200 shadow-sm bg-white border-slate-200">
            <div className="pr-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM HARCAMA (TL BAZLI)</p>
              <p className="text-2xl font-black text-emerald-600">₺{totalInvestment.toLocaleString('tr-TR')}</p>
            </div>
            <div className="pl-6 flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-emerald-600" />
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-12">
        <InvestmentList initialInvestments={investments} locations={locations} />
      </div>
    </div>
  );
}
