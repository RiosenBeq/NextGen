'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface PerformanceComparisonProps {
  data: any[];
}

export default function PerformanceComparison({ data }: PerformanceComparisonProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ month: string, loc: string, val: number } | null>(null);

  if (!data || data.length === 0) return null;

  const locations = Object.keys(data[0]).filter(k => k !== 'month');
  const maxVal = Math.max(...data.flatMap(d => locations.map(l => d[l] || 0)), 1);

  const colors = ['#2563EB', '#F59E0B', '#10B981', '#6366F1'];

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col pt-8 relative">
      {/* Legend */}
      <div className="absolute top-0 right-0 flex gap-4">
        {locations.map((loc, i) => (
          <div key={loc} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{loc}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-end justify-between gap-4 md:gap-8 px-4 h-[240px]">
        {data.map((d, i) => (
          <div key={d.month} className="flex-1 flex flex-col items-center group h-full justify-end">
            <div className="w-full flex items-end justify-center gap-1 md:gap-2 grow">
              {locations.map((loc, locIdx) => {
                const val = d[loc] || 0;
                const h = (val / maxVal) * 100;
                return (
                  <div key={loc} className="relative w-full max-w-[24px]">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, delay: i * 0.05 + locIdx * 0.1, ease: "circOut" }}
                      className="w-full rounded-t-lg shadow-sm cursor-help hover:brightness-110 transition-all"
                      style={{ backgroundColor: colors[locIdx % colors.length] }}
                      onMouseEnter={(e) => setHoveredBar({ month: d.month, loc, val })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </div>
                );
              })}
            </div>
            <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
              {d.month}
            </span>
          </div>
        ))}
      </div>

      {/* Axis Line */}
      <div className="w-full h-px bg-slate-100 mt-0" />

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredBar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 pointer-events-none"
            style={{ 
              left: '50%',
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{hoveredBar.month} — {hoveredBar.loc}</p>
            <p className="text-sm font-black italic">{hoveredBar.val.toLocaleString('tr-TR')} Seans</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
