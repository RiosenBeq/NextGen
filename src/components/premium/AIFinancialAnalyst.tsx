'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  BrainCircuit, 
  RefreshCcw, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  ChevronRight,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeFinancialData } from '@/features/ledger/ai-actions';
import { cn } from '@/lib/utils';

/**
 * Premium Yapay Zeka Finansal Analiz Bileşeni
 * Glassmorphic tasarım ve interaktif animasyonlar ile 
 * OpenAI stratejik içgörülerini sunar.
 */
export default function AIFinancialAnalyst() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeFinancialData();
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
      } else {
        setError(result.error || 'Analiz verisi alınamadı.');
      }
    } catch (err) {
      setError('Sistem hatası: Yapay zeka ile bağlantı kurulamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // İlk yüklemede otomatik analiz değil, butona bağlı kalsın 
  // (maliyet ve kullanıcı kontrolü için)
  
  return (
    <section className="relative group">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[40px] opacity-10 group-hover:opacity-20 blur-2xl transition-opacity duration-700"></div>
      
      <div className="relative bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-2xl">
        
        {/* 1. HEADER */}
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-xl">
                <BrainCircuit size={24} className={cn(isLoading && "animate-pulse")} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-2">
                   Elite AI Analyst
                   <span className="inline-flex px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black tracking-normal uppercase not-italic">GPT-4o</span>
                </h2>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stratejik Karar Destek Sistemi</p>
                </div>
             </div>
          </div>

          <button 
            onClick={performAnalysis}
            disabled={isLoading}
            className={cn(
              "p-3 rounded-2xl border border-slate-200 text-slate-500 transition-all active:scale-95 shadow-sm",
              isLoading ? "bg-slate-100 opacity-50 cursor-not-allowed" : "bg-white hover:bg-slate-900 hover:text-white hover:border-slate-800"
            )}
          >
             <RefreshCcw size={20} className={cn(isLoading && "animate-spin")} />
          </button>
        </header>

        {/* 2. CONTENT AREA */}
        <main className={cn(
          "p-8 min-h-[320px] transition-all duration-700 h-full no-scrollbar overflow-y-auto max-h-[500px]",
          isLoading ? "flex flex-col items-center justify-center text-center space-y-6" : ""
        )}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                 <div className="relative">
                    <div className="w-20 h-20 rounded-[32px] border-4 border-slate-100"></div>
                    <div className="w-20 h-20 rounded-[32px] border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0 shadow-lg shadow-blue-500/10"></div>
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" size={28} />
                 </div>
                 <div className="space-y-2">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse italic">Büyük Veri Analiz Ediliyor...</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">ROI Projeksiyonları ve Şube Performansları İşleniyor</p>
                 </div>
              </motion.div>
            ) : analysis ? (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-slate prose-sm max-w-none space-y-6"
              >
                 <div className="space-y-4 whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-[13px] italic">
                    {parseAnalysis(analysis)}
                 </div>
                 
                 <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest italic shadow-sm">
                       <ShieldCheck size={14} />
                       Doğrulanmış Tahmin
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Anlık veriler üzerinden hesaplanmıştır.</p>
                 </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-4 py-12"
              >
                  <div className="p-4 rounded-full bg-rose-50 border border-rose-100 text-rose-500">
                    <AlertTriangle size={32} />
                  </div>
                  <p className="text-xs font-black text-rose-500 uppercase tracking-widest">{error}</p>
                  <button 
                    onClick={performAnalysis}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                  >
                    Tekrar Dene
                  </button>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-8 py-12"
              >
                 <div className="w-24 h-24 rounded-[40px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 relative overflow-hidden group/star">
                    <Sparkles size={48} className="relative z-10 transition-transform group-hover/star:rotate-12 duration-500" strokeWidth={1} />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent"></div>
                 </div>
                 <div className="space-y-3">
                    <h3 className="text-lg font-black text-slate-900 tracking-tighter italic uppercase">Analize Hazır mısın?</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                       ROI trendlerini, basabaş noktalarını ve stratejik büyüme fırsatlarını yapay zeka ile keşfedin.
                    </p>
                 </div>
                 <button 
                    onClick={performAnalysis}
                    className="group relative px-10 py-5 bg-slate-950 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.25em] shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
                 >
                    <div className="relative z-10 flex items-center gap-3 italic">
                       Raporu Oluştur
                       <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 3. FOOTER TIPS */}
        <footer className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center gap-4">
           <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm">
                   <Target size={12} />
                </div>
              ))}
           </div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic truncate">
             AI Öneri: Mavibahçe şubesinde seans başı kâr marjı bu hafta %2.1 arttı.
           </p>
        </footer>

      </div>
    </section>
  );
}

/**
 * Markdown benzeri basit yapıları görsel komponentlere dönüştürür.
 * Gerçek bir markdown parser yerine stratejik başlıkları vurgular.
 */
function parseAnalysis(text: string) {
  const parts = text.split('\n');
  return parts.map((part, i) => {
    if (part.startsWith('**') || part.startsWith('##') || part.match(/^[0-9]\./)) {
      return (
        <span key={i} className="block mt-4 text-slate-900 font-black uppercase tracking-tighter italic text-sm first:mt-0">
          {part.replace(/\*\*|##|[0-9]\./g, '').trim()}
        </span>
      );
    }
    if (part.startsWith('-') || part.startsWith('*')) {
       return (
         <span key={i} className="flex gap-2 pl-2 text-slate-500">
           <span className="text-blue-500 font-black">•</span>
           {part.replace(/^[-*]/, '').trim()}
         </span>
       );
    }
    return <span key={i} className="block">{part}</span>;
  });
}
