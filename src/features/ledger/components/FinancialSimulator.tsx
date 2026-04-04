'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react';
import { calculateMonthlyCashFlow } from '../calculations';
import { cn } from '@/lib/utils';

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
    <div className="relative group">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10">
        
        {/* Controls */}
        <div className="space-y-8">
          <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-end mb-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hedef Seans Sayısı</label>
               <span className="text-2xl font-bold text-blue-600">{sessions}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2000" 
              step="10"
              value={sessions}
              onChange={(e) => setSessions(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
               <span>0</span>
               <span>500</span>
               <span>1000</span>
               <span>1500</span>
               <span>2000</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
             <div className="flex items-center justify-between border-b border-slate-100 pb-3">
               <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Kâr Paylaşımı</h4>
               <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold">%25 Hisse</span>
             </div>
             
             <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {[
                  { name: 'OKAN', amount: simulation.okanShare },
                  { name: 'TALHA', amount: simulation.talhaShare },
                  { name: 'FURKAN', amount: simulation.furkanShare },
                  { name: 'ALP', amount: simulation.alpShare },
                ].map((partner) => (
                  <div key={partner.name} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 capitalize">{partner.name}</span>
                    <span className="text-lg font-bold text-slate-900">₺{partner.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           
           {/* Net Cash */}
           <div className={cn(
             "p-5 rounded-2xl border flex flex-col justify-between transition-all",
             simulation.netCash > 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
           )}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Net Nakit Akışı</span>
              <div className="space-y-1">
                 <p className={cn("text-2xl font-bold", simulation.netCash > 0 ? "text-emerald-700" : "text-red-600")}>
                    ₺{simulation.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                 </p>
                 <div className={cn("flex items-center gap-1.5", simulation.netCash > 0 ? "text-emerald-600" : "text-red-600")}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{simulation.netCash > 0 ? "KÂR" : "ZARAR"}</span>
                 </div>
              </div>
           </div>

           {/* Margin */}
           <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Kâr Marjı</span>
              <div>
                 <p className="text-2xl font-bold text-slate-900">
                    %{simulation.profitMargin.toFixed(1)}
                 </p>
              </div>
           </div>

           {/* Break Even */}
           <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Başa Baş Noktası</span>
              <div>
                 <p className="text-2xl font-bold text-slate-900">
                    {simulation.breakEvenSessions}
                 </p>
                 <span className="text-[10px] text-slate-400 mt-1 block">Seans / Ay</span>
              </div>
           </div>

           {/* ROI */}
           <div className="p-5 rounded-2xl bg-blue-600 flex flex-col justify-between text-white shadow-md shadow-blue-200">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-3">Aylık ROI</span>
               <div className="flex items-center justify-between">
                 <p className="text-2xl font-bold">
                    %{simulation.roiPercentage?.toFixed(1) || '0.0'}
                 </p>
                 <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                   <ArrowRight className="w-4 h-4 text-white" />
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
