import { MonthlyPerformanceForm } from '@/features/ledger/components/MonthlyPerformanceForm';
import { getActiveLocations } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";
import { Database, Activity } from 'lucide-react';

export const metadata = {
  title: 'Performans Girişi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const locations = await getActiveLocations();

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg inline-block mb-2">
            Veri Girişi
          </span>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-slate-400" />
            Performans Girişi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            KabinRapor verilerini sisteme aktararak karlılık projeksiyonlarını güncelleyin.
          </p>
        </div>

        <div className="premium-card px-5 py-3 stat-card-green border flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Sistem Durumu</span>
            <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Aktif Senkron
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </header>

      <div className="space-y-8">
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
