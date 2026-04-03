'use client'

import React from 'react';
import * as motion from "framer-motion/client";
import { TrendingUp, Target, BarChart3, Clock, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  id: string;
  name: string;
  totalInvestment: number;
  cumulativeNetCash: number;
  roi: number;
  breakEvenSessions: number;
  profitMargin: number;
  currentMonthlyProfit: number;
  isProfitable: boolean;
  paybackProgress: number;
  estimatedPaybackMonths: number;
}

export default function StrategicMatrix({ insights }: { insights: Insight[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {insights.map((loc, idx) => (
        <motion.div
           key={loc.id}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: idx * 0.1 }}
           className="premium-card p-6 group"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors uppercase italic">
                {loc.name}
              </h3>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                Stratejik Performans Analizi
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
              loc.isProfitable ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            )}>
              {loc.isProfitable ? "Karlı" : "Eşik Altı"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between min-h-[80px]">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Target className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Başa Baş</span>
              </div>
              <div className="text-xl font-black text-white whitespace-nowrap">
                {loc.breakEvenSessions} <span className="text-[10px] text-zinc-500 font-medium">seans/ay</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between min-h-[80px]">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Kar Marjı</span>
              </div>
              <div className="text-xl font-black text-white">
                %{loc.profitMargin.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Yatırım Geri Dönüşü (ROI)</span>
                </div>
                <span className="text-sm font-black text-emerald-400">%{loc.paybackProgress.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loc.paybackProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tahmini Geri Ödeme</div>
              <div className="flex items-center gap-2">
                 <Zap className="w-3 h-3 text-emerald-400" />
                 <span className="text-sm font-black text-white">
                    {loc.estimatedPaybackMonths === Infinity ? "Hesaplanamıyor" : `${loc.estimatedPaybackMonths} Ay`}
                 </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
