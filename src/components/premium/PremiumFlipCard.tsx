'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RotateCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  backContent?: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  className?: string;
}

export function PremiumFlipCard({ 
  title, 
  value, 
  subValue, 
  icon, 
  trend, 
  backContent, 
  color = 'blue',
  className 
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const colorMap = {
    blue: 'from-blue-600/10 to-blue-500/5 border-blue-100 text-blue-600 group-hover:border-blue-300',
    emerald: 'from-emerald-600/10 to-emerald-500/5 border-emerald-100 text-emerald-600 group-hover:border-emerald-300',
    amber: 'from-amber-600/10 to-amber-500/5 border-amber-100 text-amber-600 group-hover:border-amber-300',
    rose: 'from-rose-600/10 to-rose-500/5 border-rose-100 text-rose-600 group-hover:border-rose-300',
    indigo: 'from-indigo-600/10 to-indigo-500/5 border-indigo-100 text-indigo-600 group-hover:border-indigo-300',
    slate: 'from-slate-600/10 to-slate-500/5 border-slate-100 text-slate-600 group-hover:border-slate-300',
  };

  const bgIconMap = {
    blue: 'bg-blue-100/50',
    emerald: 'bg-emerald-100/50',
    amber: 'bg-amber-100/50',
    rose: 'bg-rose-100/50',
    indigo: 'bg-indigo-100/50',
    slate: 'bg-slate-100/50',
  };

  return (
    <div 
      className={cn("relative h-48 w-full perspective-1000 group cursor-pointer", className)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* FRONT SIDE */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className={cn(
            "absolute inset-0 p-6 rounded-[32px] border bg-gradient-to-br shadow-sm transition-all duration-300",
            colorMap[color],
            "group-hover:shadow-xl group-hover:shadow-current/5"
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", bgIconMap[color])}>
              {React.cloneElement(icon as React.ReactElement<{ size: number, strokeWidth: number }>, { size: 24, strokeWidth: 2.5 })}
            </div>
            <button className="p-2 rounded-xl hover:bg-white/50 transition-colors text-slate-400">
               <RotateCcw size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">{title}</p>
             <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter truncate">{value}</h3>
             {subValue && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</p>}
          </div>

          {trend && (
            <div className="mt-4 flex items-center gap-2">
               <div className={cn(
                 "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1",
                 trend.isPositive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
               )}>
                  {trend.value}
               </div>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">vs geçen ay</span>
            </div>
          )}
        </div>

        {/* BACK SIDE */}
        <div 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className={cn(
            "absolute inset-0 p-6 rounded-[32px] border bg-slate-900 border-slate-800 text-white shadow-2xl flex flex-col justify-between"
          )}
        >
          <div className="flex items-start justify-between">
             <div className="flex items-center gap-2 text-blue-400">
                <Info size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest italic">Detay Analizi</span>
             </div>
             <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500">
                <ChevronRight size={14} />
             </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
             {backContent ? backContent : (
               <div className="space-y-4">
                  <div className="space-y-1 text-center">
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Tahmini Projeksiyon</p>
                     <p className="text-xl font-black italic tracking-tighter text-white uppercase">Analiz Hazırlanıyor</p>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        className="h-full bg-blue-500"
                     />
                  </div>
               </div>
             )}
          </div>

          <div className="pt-4 border-t border-white/5">
             <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] italic text-center">NextGen AI Analytics Platform</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
