'use client';

import React from 'react';
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  ChevronRight, 
  Zap, 
  Sparkles,
  BarChart3,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AIFinancialAnalyst from './AIFinancialAnalyst';

interface AIAnalysisProps {
  stats: {
    revenue: number;
    expense: number;
    profit: number;
    roi: number;
    sessions: number;
    monthlyGrowth: number;
  };
  chartData: { month: string, revenue: number, profit: number }[];
}

export default function AIAnalysisClientUI({ stats, chartData }: AIAnalysisProps) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. HEADER: STRATEGIC OVERVIEW */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border flex items-center gap-2"
              style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}
            >
              <Bot className="w-3 h-3" />
              SİSTEM STRATEJİ MERKEZİ
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tighter" style={{ color: '#1E2A44' }}>
             AI Finansal <span style={{ color: '#2F6BFF' }}>Analiz</span>
          </h1>
          <p className="text-base text-slate-500 font-medium max-w-xl leading-relaxed">
            Yapay zeka modellerimiz tarafından desteklenen <span className="font-bold underline underline-offset-4" style={{ color: '#2F6BFF', textDecorationColor: 'rgba(47,107,255,0.3)' }}>derinlemesine finansal öngörüleri</span> ve stratejik operasyonel analizleri keşfedin.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
           <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Activity size={24} className="animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem Sağlığı</p>
              <p className="text-sm font-black text-slate-900 italic tracking-tight uppercase">OPTIMUM PERFORMANS</p>
           </div>
        </div>
      </header>

      {/* 2. TREND CHART SECTION */}
      <section className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
               <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest italic">
                  <TrendingUp size={12} className="animate-pulse" />
                  Performans Dinamiği
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Gelir & Kâr Projeksiyonu</h2>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Brüt Ciro</span>
               </div>
               <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Net Kâr (P&L)</span>
               </div>
            </div>
         </div>

         <div className="h-[400px] w-full relative">
            <PremiumTrendChart data={chartData} />
         </div>
      </section>

      {/* 3. AI ANALYST WRAPPER */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <AIFinancialAnalyst />
         </div>
         
         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-20 -top-20 w-64 h-64 blur-[120px] rounded-full bg-blue-600 opacity-20 group-hover:opacity-40 transition-opacity"></div>
               
               <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 border border-white/5">
                  <Zap size={28} className="fill-blue-400" />
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Anlık Özet</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">System AI, son 30 günlük verilerinizde <span className="text-emerald-400 font-bold">%12.4'lük bir verimlilik artışı</span> saptadı.</p>
               </div>
               
               <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Maliyet</p>
                     <p className="text-lg font-black text-rose-400 italic">-%2.1</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Büyüme</p>
                     <p className="text-lg font-black text-emerald-400 italic">+%8.1</p>
                  </div>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[40px] p-8 space-y-6 shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                     <Target size={20} />
                  </div>
                  <h4 className="text-sm font-black italic uppercase tracking-widest">Stratejik Hedef</h4>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROI HEDEF %85</span>
                     <span className="text-[10px] font-black text-blue-600 tracking-widest">%68</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic">Geçen aya göre %5 daha yakınsınız. Operasyonel giderlerin minimize edilmesi kritik.</p>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}

/* REUSED CHART COMPONENT */
function PremiumTrendChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
         <BarChart3 size={40} strokeWidth={1} />
         <p className="text-[10px] font-black uppercase tracking-widest italic">YETERLİ VERİ TOPLANAMADI</p>
      </div>
    )
  }

  const padding = 40;
  const height = 400;
  const width = 1000; 
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.profit)), 1) * 1.2;

  const points = data.map((d, i) => ({
    x: padding + (i * (width - 2 * padding) / (data.length - 1 || 1)),
    revY: height - padding - (d.revenue / maxVal * (height - 2 * padding)),
    proY: height - padding - (d.profit / maxVal * (height - 2 * padding)),
  }));

  const revPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.revY}`).join(' ');
  const proPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.proY}`).join(' ');
  
  const revArea = revPath + ` L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const proArea = proPath + ` L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <motion.path initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} transition={{ duration: 1 }} d={revArea} fill="url(#revGradient)" />
      <motion.path initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ duration: 1, delay: 0.2 }} d={proArea} fill="url(#proGradient)" />
      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }} d={revPath} fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }} d={proPath} fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 + i * 0.1 }} cx={p.x} cy={p.revY} r="6" fill="#2563EB" stroke="white" strokeWidth="3" className="drop-shadow-lg" />
          <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8 + i * 0.1 }} cx={p.x} cy={p.proY} r="6" fill="#10B981" stroke="white" strokeWidth="3" className="drop-shadow-lg" />
          <text x={p.x} y={height - 5} textAnchor="middle" fill="#94A3B8" className="text-[12px] font-black uppercase tracking-tighter italic">{data[i].month}</text>
        </React.Fragment>
      ))}
      <defs>
        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" /><stop offset="100%" stopColor="#2563EB" stopOpacity="0" /></linearGradient>
        <linearGradient id="proGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#10B981" stopOpacity="0" /></linearGradient>
      </defs>
    </svg>
  );
}
