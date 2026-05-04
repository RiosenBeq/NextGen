'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, ArrowRight, X, HelpCircle, Target, Zap, Rocket, Coins, BarChart3, Binary, type LucideIcon } from 'lucide-react';
import { calculateMonthlyCashFlow } from '../calculations';
import { cn } from '@/lib/utils';

interface SimulatorDefaultParams {
  sessionPrice?: number;
  fixedRent?: number;
  duesAmount?: number;
  revenueShareRate?: number;
  investmentAmount?: number;
}

interface Props {
  defaultParams: SimulatorDefaultParams;
}

export default function FinancialSimulator({ defaultParams }: Props) {
  const [sessions, setSessions] = useState(500);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const simulation = useMemo(() => {
    return calculateMonthlyCashFlow(sessions, 0, {
      sessionPrice: defaultParams.sessionPrice || 350,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: defaultParams.fixedRent || 40000,
      duesAmount: defaultParams.duesAmount || 6000,
      revenueShareRate: defaultParams.revenueShareRate || 15,
      investmentAmount: defaultParams.investmentAmount || 350000,
    });
  }, [sessions, defaultParams]);

  const explanations: Record<string, { title: string, icon: LucideIcon, math: string, text: string, details: string, formula: string, breakdown?: { label: string, value: string, color?: string }[] }> = {
    'cashflow': {
       title: 'NET NAKİT AKIŞI',
       icon: Zap,
       math: `₺${simulation.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
       text: `Bu ayki ${sessions} seans beklentisine göre elde edilen net tutar.`,
       details: 'Vergi ve platform kesintileri dahil tüm operasyonel dışa akışların ardından elde edilen gerçek geliri temsil eder.',
       formula: 'Brüt Gelir - (Kira + Aidat + KDV + Komisyon + Ciro Payı)',
       breakdown: [
         { label: 'Brüt Gelir (KDV Dahil)', value: `₺${simulation.grossRevenue.toLocaleString('tr-TR')}`, color: 'text-emerald-400' },
         { label: 'Nayax + iyzico (%4)', value: `-₺${simulation.totalCommission.toLocaleString('tr-TR')}`, color: 'text-rose-400' },
         { label: 'Ham Kira (KDV Hariç)', value: `₺${(defaultParams.fixedRent || 0).toLocaleString('tr-TR')}`, color: 'text-slate-400' },
         { label: 'Kira KDV (%20)', value: `₺${((defaultParams.fixedRent || 0) * 0.2).toLocaleString('tr-TR')}`, color: 'text-slate-400' },
         { label: 'AVM Aidat', value: `₺${(defaultParams.fixedRent ? (defaultParams.duesAmount || 0) : 0).toLocaleString('tr-TR')}`, color: 'text-slate-400' },
         { label: 'Ciro Payı (%15)', value: `-₺${simulation.revenueShare.toLocaleString('tr-TR')}`, color: 'text-rose-400' },
         { label: 'TOPLAM GİDERLER', value: `-₺${simulation.totalExpense.toLocaleString('tr-TR')}`, color: 'text-rose-400' },
       ]
    },
    'margin': {
       title: 'KÂR MARJI (PROFIT MARGIN)',
       icon: Target,
       math: `%${simulation.profitMargin.toFixed(1)}`,
       text: 'Net Nakit Akışının, Brüt Gelir içerisindeki yüzdelik payıdır.',
       details: 'İşletme verimliliğini ölçen ana göstergedir. Oranın yüksek olması, operasyonel giderlerin minimize edildiğini gösterir.',
       formula: '(Net Nakit Akışı / Brüt Gelir) × 100'
    },
    'breaven': {
       title: 'BAŞA BAŞ NOKTASI (BREAK-EVEN)',
       icon: Rocket,
       math: `${simulation.breakEvenSessions} Seans`,
       text: 'Bir takvim ayında zarar durumundan çıkıp kârlılığa geçilmesi için ulaşılması gereken asgari satış adedidir.',
       details: 'Sabit giderlerin toplamının, tek bir seansın net getiri ve katkı payına bölünmesiyle hesaplanır.',
       formula: 'Sabit Giderler ÷ (Birim Fiyat × (1 - Kesintiler))'
    },
    'roi': {
       title: 'AYLIK ROI (GERİ DÖNÜŞ)',
       icon: TrendingUp,
       math: `%${simulation.roiPercentage?.toFixed(1) || '0.0'}`,
       text: `Yapılan yatırımın (₺${(defaultParams.investmentAmount || 350000).toLocaleString('tr-TR')}) aylık net kâra oranıdır. Mevcut verilerle yatırımınızın %${(simulation.roiPercentage || 0).toFixed(1)} kısmını her ay geri topluyorsunuz.`,
       details: 'Aylık net kar ile yatırdığınız anaparanın kendini ne kadar sürede telafi edeceğini belirten yatırım getiri oranıdır.',
       formula: '(Aylık Net Nakit / Toplam Yatırım) × 100'
    }
  };

  return (
    <div className="relative group">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 relative z-10">
        
        {/* Controls */}
        <div className="space-y-8">
          <div className="premium-card bg-white/[0.02] border border-white/10 p-8 rounded-[32px] shadow-2xl backdrop-blur-xl">
            <div className="flex justify-between items-end mb-6">
               <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">HEDEF SEANS SAYISI</label>
                 <p className="text-[10px] text-slate-600 font-bold uppercase">Aylık Beklenen Müşteri</p>
               </div>
               <div className="flex items-baseline gap-1">
                 <span className="text-4xl font-black text-white italic tracking-tighter shadow-blue-500/20 drop-shadow-xl">{sessions}</span>
                 <span className="text-xs font-black text-blue-500 italic uppercase">ADET</span>
               </div>
            </div>
            
            <div className="relative h-12 flex items-center">
              <input 
                type="range" 
                min="0" 
                max="2000" 
                step="10"
                value={sessions}
                onChange={(e) => setSessions(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 border border-white/5"
              />
            </div>

            <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2 px-1">
               <span>0</span>
               <span>500</span>
               <span>1.000</span>
               <span>1.500</span>
               <span className="text-blue-500 opacity-60 italic">Kapasite 2.000</span>
            </div>
          </div>

          <div className="premium-card bg-white/[0.01] border border-white/5 p-8 rounded-[32px] overflow-hidden group/partners relative">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/partners:opacity-10 transition-opacity">
                <Coins size={120} />
             </div>
             <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6 relative z-10">
               <div>
                 <h4 className="text-[11px] font-black text-white uppercase tracking-[0.1em] italic">ORTAKLIK HAKEDİŞLERİ</h4>
                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Eşit Dağılım Modeli (%25)</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                 <BarChart3 className="w-5 h-5 text-blue-400" />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                {[
                  { name: 'OKAN', amount: simulation.okanShare },
                  { name: 'TALHA', amount: simulation.talhaShare },
                  { name: 'FURKAN', amount: simulation.furkanShare },
                  { name: 'ALP', amount: simulation.alpShare },
                ].map((partner) => (
                  <div key={partner.name} className="flex flex-col gap-2 group/val">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-blue-500/50"></div>
                       {partner.name}
                    </span>
                    <span className="text-xl font-black text-slate-200 tracking-tighter italic group-hover/val:text-white transition-colors">
                      ₺{partner.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           
           {/* Net Cash */}
           <motion.div 
             whileHover={{ y: -4, scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setActiveModal('cashflow')}
             className={cn(
              "p-6 rounded-[28px] border-2 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group/card",
              simulation.netCash > 0 
                ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]" 
                : "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.05)]"
             )}
           >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Net Nakit Akışı</span>
                <HelpCircle size={16} className="text-slate-600 group-hover/card:text-blue-400 transition-colors" />
              </div>
              <div className="space-y-1">
                 <p className={cn("text-3xl font-black tracking-tighter italic", simulation.netCash > 0 ? "text-emerald-400" : "text-rose-400")}>
                    ₺{simulation.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                 </p>
                 <div className={cn("flex items-center gap-2 mt-2", simulation.netCash > 0 ? "text-emerald-500/60" : "text-rose-500/60")}>
                    <TrendingUp className={cn("w-4 h-4", simulation.netCash < 0 && "rotate-180")} />
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase">{simulation.netCash > 0 ? "OPERASYONEL KAR" : "OPERASYONEL ZARAR"}</span>
                 </div>
              </div>
           </motion.div>

           {/* Margin */}
           <motion.div 
             whileHover={{ y: -4, scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setActiveModal('margin')}
             className="p-6 rounded-[28px] bg-white/[0.03] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer flex flex-col justify-between group/card"
           >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Kâr Marjı</span>
                <HelpCircle size={16} className="text-slate-600 group-hover/card:text-blue-400 transition-colors" />
              </div>
              <div>
                 <p className="text-3xl font-black text-white tracking-tighter italic shadow-sm">
                    %{simulation.profitMargin.toFixed(1)}
                 </p>
                 <p className="text-[9px] text-slate-600 font-bold uppercase mt-2 tracking-widest italic group-hover/card:text-blue-500/60">VERİMLİLİK SKORU</p>
              </div>
           </motion.div>

           {/* Break Even */}
           <motion.div 
             whileHover={{ y: -4, scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setActiveModal('breaven')}
             className="p-6 rounded-[28px] bg-white/[0.03] border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all cursor-pointer flex flex-col justify-between group/card"
           >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Başa Baş Noktası</span>
                <HelpCircle size={16} className="text-slate-600 group-hover/card:text-orange-400 transition-colors" />
              </div>
              <div>
                 <p className="text-3xl font-black text-white tracking-tighter italic">
                    {simulation.breakEvenSessions}
                 </p>
                 <span className="text-[9px] font-black text-slate-500 mt-2 uppercase tracking-[0.1em] block italic">KRİTİK HEDEF SEANS</span>
              </div>
           </motion.div>

           {/* ROI */}
           <motion.div 
             whileHover={{ y: -4, scale: 1.05, rotate: -1 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setActiveModal('roi')}
             className="p-6 rounded-[28px] bg-gradient-to-br from-indigo-600 to-blue-700 flex flex-col justify-between text-white shadow-2xl shadow-indigo-900/20 cursor-pointer relative overflow-hidden group/card border border-white/20"
           >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:scale-110 transition-transform duration-500">
                <Rocket size={80} strokeWidth={2.5} />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] italic mb-3">Aylık ROI</span>
                <HelpCircle size={14} className="text-white/40" />
              </div>
               <div className="flex items-center justify-between relative z-10 mt-4">
                 <p className="text-3xl font-black tracking-tighter italic drop-shadow-lg">
                    %{simulation.roiPercentage?.toFixed(1) || '0.0'}
                 </p>
                 <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover/card:translate-x-1 group-hover/card:-translate-y-1 transition-transform">
                   <ArrowRight className="w-5 h-5 text-white" strokeWidth={3} />
                 </div>
              </div>
           </motion.div>

        </div>
      </div>

      {/* Info Popups */}
      <AnimatePresence>
        {activeModal && explanations[activeModal] && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl h-fit bg-[#0f1117] border border-white/10 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[101] overflow-hidden"
            >
              <div className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      {(() => {
                        const Icon = explanations[activeModal].icon;
                        return <Icon size={24} strokeWidth={2.5} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">{explanations[activeModal].title}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">MATEMATİKSEL PROJEKSİYON</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 shadow-inner"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Current Value Display */}
                  <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-center">
                    <p className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em] mb-2">SİMÜLASYON DEĞERİ</p>
                    <p className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      {explanations[activeModal].math}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="mt-1"><HelpCircle size={16} className="text-rose-500" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 italic">BASİT ANLATIM</p>
                        <p className="text-sm font-bold text-slate-200 leading-relaxed italic">&quot;{explanations[activeModal].text}&quot;</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="mt-1"><Binary size={16} className="text-blue-500" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 italic">MATEMATİKSEL GERÇEKLİK</p>
                        <p className="text-sm font-bold text-slate-300 leading-relaxed">{explanations[activeModal].details}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 border-dashed relative">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calculator size={12} /> HESAPLAMA FORMÜLÜ
                      </p>
                      <code className="text-[11px] font-black text-blue-400/90 tracking-tight">{explanations[activeModal].formula}</code>
                    </div>

                    {/* Breakdown Implementation */}
                    {explanations[activeModal].breakdown && (
                      <div className="p-6 rounded-[28px] bg-white/[0.01] border border-white/5 space-y-4">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5 pb-3">STRATEJİK KALEM KIRILIMI</p>
                         <div className="space-y-3">
                            {explanations[activeModal].breakdown?.map((item, idx) => (
                               <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-300">
                                  <span className="text-slate-500 uppercase tracking-tighter italic">{item.label}</span>
                                  <span className={cn("italic tracking-tighter", item.color)}>{item.value}</span>
                               </div>
                            ))}
                         </div>
                         
                         {/* March Exception Notice */}
                         {activeModal === 'cashflow' && (
                           <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 italic text-center uppercase tracking-widest">
                             💡 MART 2026 İÇİN CİRO PAYI MUAFİYETİ UYGULANMIŞTIR.
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full py-5 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-xl shadow-blue-900/20 border border-blue-400/30 italic active:scale-95"
                >
                   ANALİZİ TAMAMLA
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
