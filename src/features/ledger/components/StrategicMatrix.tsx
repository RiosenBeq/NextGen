'use client'

import React from 'react';
import * as motion from "framer-motion/client";
import { Target, BarChart3, Clock, Zap } from 'lucide-react';
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {insights.map((loc, idx) => (
        <motion.div
          key={loc.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="relative group bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
        >
          {/* Subtle Background Accent */}
          <div className={cn(
             "absolute -right-20 -top-20 w-64 h-64 blur-[100px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-1000",
             loc.isProfitable ? "bg-emerald-500" : "bg-rose-500"
          )}></div>

          {/* Header */}
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-blue-600 transition-colors">
                {loc.name}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">STRATEJİK OPERASYONEL ANALİZ</p>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-sm border",
              loc.isProfitable 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-rose-50 text-rose-600 border-rose-100"
            )}>
              {loc.isProfitable ? "AKTÜEL KÂRLI" : "MİLYET EŞİĞİ ALTI"}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Başabaş Noktası</span>
              </div>
              <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
                {loc.breakEvenSessions}
                <span className="text-xs ml-1.5 font-bold text-slate-400 uppercase not-italic tracking-normal">Seans</span>
              </p>
            </div>
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kâr Marjı</span>
              </div>
              <p className="text-2xl font-black text-slate-900 italic tracking-tighter">%{loc.profitMargin.toFixed(1)}</p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-4 mb-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Amortisman Projeksiyonu</span>
              </div>
              <span className={cn(
                "text-sm font-black italic tracking-tighter",
                loc.paybackProgress >= 70 ? "text-emerald-600" : "text-blue-600"
              )}>
                %{loc.paybackProgress.toFixed(1)} TAMAMLANDI
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: `${loc.paybackProgress}%` }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 className={cn(
                   "h-full rounded-full shadow-[0_0_10px_rgba(37,99,235,0.2)]",
                   loc.paybackProgress >= 70 ? "bg-emerald-500" : "bg-blue-600"
                 )}
               />
            </div>
          </div>

          {/* ROI Info */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em]">Tahmini Geri Dönüş</span>
              <span className="text-base font-black text-slate-900 italic tracking-tighter uppercase">
                {loc.estimatedPaybackMonths === Infinity ? 'VERİ YETERSİZ' : `${loc.estimatedPaybackMonths} AY İÇİNDE`}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all shadow-sm">
               <Zap size={20} className={cn(loc.paybackProgress > 80 && "text-amber-400")} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
