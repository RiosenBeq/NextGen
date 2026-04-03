'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { calculateMonthlyCashFlow } from '../calculations';

interface Props {
  defaultParams: any;
}

export default function FinancialSimulator({ defaultParams }: Props) {
  const [sessions, setSessions] = useState(500);

  const simulation = useMemo(() => {
    return calculateMonthlyCashFlow(sessions, 0, {
      sessionPrice: defaultParams.sessionPrice || 300,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: defaultParams.fixedRent || 40000,
      duesAmount: defaultParams.duesAmount || 6000,
      revenueShareRate: defaultParams.revenueShareRate || 15,
      investmentAmount: defaultParams.investmentAmount || 250000,
    });
  }, [sessions, defaultParams]);

  return (
    <div className="premium-card p-10 bg-zinc-950/50 border-emerald-500/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
        <Calculator size={140} />
      </div>

      <header className="flex justify-between items-start mb-12 relative z-10">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tighter mb-1 flex items-center gap-3 italic">
             <Calculator className="text-emerald-500 w-6 h-6" />
             Stratejik Projeksiyon
          </h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Hacim ve Ortaklık Simülatörü</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
           Canlı Simülasyon
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
               <label className="text-sm font-black text-white uppercase tracking-tighter italic">Aylık Beklenen Seans Sayısı</label>
               <span className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">{sessions}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2000" 
              step="10"
              value={sessions}
              onChange={(e) => setSessions(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
               <span>0 seans</span>
               <span>1000 seans</span>
               <span>2000 seans</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
             <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Ortaklık Paylaşım Projeksiyonu (%25)</h4>
             <p className="text-[8px] text-zinc-600 italic -mt-4">AVM Payı ve tüm giderler düşülmüş net tutardır.</p>
             <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'OKAN', amount: simulation.okanShare },
                  { name: 'TALHA', amount: simulation.talhaShare },
                  { name: 'FURKAN', amount: simulation.furkanShare },
                  { name: 'ALP', amount: simulation.alpShare },
                ].map((partner) => (
                  <div key={partner.name} className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-zinc-600">{partner.name}</span>
                    <span className="text-lg font-black text-white font-mono">₺{partner.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 flex flex-col justify-between group/card hover:border-emerald-500/30 transition-all">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Potansiyel Net Nakit</span>
              <div className="space-y-1">
                 <p className={cn("text-3xl font-black tracking-tighter", simulation.netCash > 0 ? "text-white" : "text-rose-500")}>
                    ₺{simulation.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                 </p>
                 <div className="flex items-center gap-2 text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[10px] font-black">{simulation.netCash > 0 ? "KARLI" : "ZARAR"}</span>
                 </div>
              </div>
           </div>

           <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 flex flex-col justify-between hover:border-indigo-500/30 transition-all">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Operasyonel Marj</span>
              <div>
                 <p className="text-3xl font-black text-white tracking-tighter">
                    %{simulation.profitMargin.toFixed(1)}
                 </p>
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1 block">Karlılık Endeksi</span>
              </div>
           </div>

           <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 flex flex-col justify-between hover:border-white/20 transition-all">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Başa Baş Seans Sayısı</span>
              <div>
                 <p className="text-3xl font-black text-white tracking-tighter">
                    {simulation.breakEvenSessions}
                 </p>
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1 block">Hedeflenen Seans</span>
              </div>
           </div>

           <div className="p-8 rounded-3xl bg-emerald-500 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.15)] group/cta cursor-pointer">
              <span className="text-[10px] font-black text-black uppercase tracking-widest mb-4">Yatırım Geri Dönüşü (ROI)</span>
               <div className="flex items-end justify-between">
                 <p className="text-3xl font-black text-black tracking-tighter italic">
                    %{simulation.roiPercentage?.toFixed(1) || '0.0'}
                 </p>
                 <ArrowRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
