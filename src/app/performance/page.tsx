import { MonthlyPerformanceForm } from '@/features/ledger/components/MonthlyPerformanceForm';
import { getActiveLocations } from '@/features/ledger/actions';
import * as motion from "framer-motion/client";

export const metadata = {
  title: 'Aylık Performans Girişi - NextGenBox',
};

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const locations = await getActiveLocations();

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-[2px] bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
              Operational Reporting
            </span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter heading-elite leading-tight">
            Performans Veri<br/>Giriş Paneli
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-6 py-3 rounded-2xl glass-panel flex items-center gap-4 shadow-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Veri Kaynağı</span>
              <span className="text-sm font-black text-emerald-400">KABİNRAPOR.COM</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
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
