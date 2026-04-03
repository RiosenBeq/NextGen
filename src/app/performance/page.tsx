import { MonthlyPerformanceForm } from '@/features/ledger/components/MonthlyPerformanceForm';
import { getActiveLocations } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import { Zap, Database, Activity } from 'lucide-react';

export const metadata = {
  title: 'Performans Girişi - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const locations = await getActiveLocations();

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10">Data Entry</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             <Database className="w-8 h-8 text-zinc-500" />
             Performans Girişi
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Kabinrapor verilerini sisteme aktararak anlık karlılık projeksiyonlarını güncelleyin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="premium-card px-6 py-4 bg-emerald-500/[0.02] flex items-center gap-4 border-emerald-500/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sistem Durumu</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                 <Activity className="w-3 h-3" />
                 AKTİF SENKRON
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </header>

      <div className="space-y-12">
        <MonthlyPerformanceForm locations={locations.map((l: any) => ({ 
          id: l.id, 
          name: l.name,
          fixedRent: l.fixedRent,
          duesAmount: l.duesAmount,
          rentVatRate: l.rentVatRate,
          revenueShareRate: l.revenueShareRate,
          revenueThreshold: l.revenueThreshold
        }))} />
      </div>
    </div>
  );
}

