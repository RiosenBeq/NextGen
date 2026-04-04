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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {insights.map((loc, idx) => (
        <motion.div
          key={loc.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="premium-card p-5 group"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                {loc.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Stratejik Performans Analizi</p>
            </div>
            <span className={cn(
              "metric-pill text-[10px]",
              loc.isProfitable ? "metric-pill-green" : "metric-pill-red"
            )}>
              {loc.isProfitable ? "Kârlı" : "Eşik Altı"}
            </span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Başa Baş</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loc.breakEvenSessions}{' '}
                <span className="text-xs text-slate-400 font-medium">seans/ay</span>
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Kâr Marjı</span>
              </div>
              <p className="text-xl font-bold text-slate-900">%{loc.profitMargin.toFixed(1)}</p>
            </div>
          </div>

          {/* ROI Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  Yatırım Geri Dönüşü
                </span>
              </div>
              <span className={cn(
                "text-sm font-bold",
                loc.paybackProgress >= 50 ? "text-emerald-600" : "text-blue-600"
              )}>
                %{loc.paybackProgress.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loc.paybackProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
              />
            </div>
          </div>

          {/* Payback */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Tahmini Geri Ödeme</span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-800">
                {loc.estimatedPaybackMonths === Infinity ? '—' : `${loc.estimatedPaybackMonths} Ay`}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
