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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {insights.map((loc, idx) => (
        <motion.div
          key={loc.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.25, ease: 'easeOut' }}
          className="group bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8 hover:border-slate-300/70 transition-colors"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                {loc.name}
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Stratejik Operasyonel Analiz</p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border",
              loc.isProfitable
                ? "bg-emerald-50 text-emerald-600 border-emerald-200/70"
                : "bg-rose-50 text-rose-600 border-rose-200/70"
            )}>
              {loc.isProfitable ? "Aktüel Kârlı" : "Milyet Eşiği Altı"}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 rounded-xl bg-slate-50/50 border border-slate-200/70">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Başabaş Noktası</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">
                {loc.breakEvenSessions}
                <span className="text-xs ml-1.5 font-medium text-slate-400">seans</span>
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50/50 border border-slate-200/70">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Kâr Marjı</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">%{loc.profitMargin.toFixed(1)}</p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Amortisman Projeksiyonu</span>
              </div>
              <span className={cn(
                "text-sm font-semibold tracking-tight tabular-nums",
                loc.paybackProgress >= 70 ? "text-emerald-600" : "text-blue-600"
              )}>
                %{loc.paybackProgress.toFixed(1)} tamamlandı
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loc.paybackProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  "h-full rounded-full",
                  loc.paybackProgress >= 70 ? "bg-emerald-500" : "bg-blue-600"
                )}
              />
            </div>
          </div>

          {/* ROI Info */}
          <div className="pt-6 border-t border-slate-200/70 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Tahmini Geri Dönüş</span>
              <span className="text-base font-semibold text-slate-900 tracking-tight tabular-nums mt-0.5">
                {loc.estimatedPaybackMonths === Infinity ? 'Veri yetersiz' : `${loc.estimatedPaybackMonths} ay içinde`}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Zap size={18} className={cn(loc.paybackProgress > 80 && "text-amber-500 group-hover:text-amber-300")} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
