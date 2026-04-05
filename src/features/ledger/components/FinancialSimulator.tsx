'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, ArrowRight, Info, X, HelpCircle, Target, Zap, Rocket } from 'lucide-react';
import { calculateMonthlyCashFlow } from '../calculations';
import { cn } from '@/lib/utils';

interface Props {
  defaultParams: any;
}

export default function FinancialSimulator({ defaultParams }: Props) {
  const [sessions, setSessions] = useState(500);
  const [activeModal, setActiveModal] = useState<string | null>(null);

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

  const explanations: Record<string, { title: string, icon: any, color: string, text: string, details: string }> = {
    'cashflow': {
       title: 'Net Nakit Akışı',
       icon: Zap,
       color: 'emerald',
       text: 'Cebimize giren paradan, harçlıklarımızı (kirayı, elektriği vs.) çıkardıktan sonra elimizde kalan "kumbaradaki para"dır.',
       details: 'Eğer bu yeşilse kumbaramız doluyor, kırmızıysa kumbaradan harcıyoruz demektir. Tüm masraflar çıktıktan sonra cebine kalan gerçek paradır.'
    },
    'margin': {
       title: 'Kâr Marjı',
       icon: Target,
       color: 'blue',
       text: 'Kazandığımız her 100 paranın ne kadarının bize "kâr" olarak kaldığını söyler.',
       details: 'Elmanın yarısını yemek gibi; ne kadar büyük bir dilim bize kalıyor? Verimliliğimizi ölçer.'
    },
    'breaven': {
       title: 'Başa Baş Noktası',
       icon: Rocket,
       color: 'orange',
       text: 'Kirayı ve borçlarımızı ödeyebilmek için en az kaç kişinin şarkı söylemeye gelmesi gerektiğini söyler.',
       details: 'Bu sayıya ulaştığımızda artık zarar etmiyoruz, dükkan kendi kendini döndürüyor demektir. Bu noktadan sonraki her müşteri safi kârdır.'
    },
    'roi': {
       title: 'Aylık ROI',
       icon: TrendingUp,
       color: 'indigo',
       text: 'Koyduğumuz büyük harçlığın (yatırımın) her ay ne kadarını geri topladığımızı gösterir.',
       details: 'Sanki bir tohum ektin, her ay ne kadar hızlı büyüdüğünü ölçmek gibi! Yatırımı ne kadar sürede geri alacağımızı fısıldar.'
    }
  };

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
           <motion.div 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setActiveModal('cashflow')}
             className={cn(
              "p-5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer relative group/card",
              simulation.netCash > 0 ? "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50" : "bg-red-50 border-red-100 hover:bg-red-100/50"
             )}
           >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Net Nakit Akışı</span>
                <HelpCircle size={14} className="text-slate-300 group-hover/card:text-slate-400 transition-colors" />
              </div>
              <div className="space-y-1">
                 <p className={cn("text-2xl font-black tracking-tight", simulation.netCash > 0 ? "text-emerald-700" : "text-red-700")}>
                    ₺{simulation.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                 </p>
                 <div className={cn("flex items-center gap-1.5", simulation.netCash > 0 ? "text-emerald-600" : "text-red-600")}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black tracking-widest uppercase">{simulation.netCash > 0 ? "KÂR" : "ZARAR"}</span>
                 </div>
              </div>
           </motion.div>

           {/* Margin */}
           <motion.div 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setActiveModal('margin')}
             className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between cursor-pointer hover:border-blue-300 hover:bg-blue-50/10 transition-all group/card"
           >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Kâr Marjı</span>
                <HelpCircle size={14} className="text-slate-300 group-hover/card:text-slate-400 transition-colors" />
              </div>
              <div>
                 <p className="text-2xl font-black text-slate-900 tracking-tight">
                    %{simulation.profitMargin.toFixed(1)}
                 </p>
              </div>
           </motion.div>

           {/* Break Even */}
           <motion.div 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setActiveModal('breaven')}
             className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between cursor-pointer hover:border-orange-300 hover:bg-orange-50/10 transition-all group/card"
           >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Başa Baş Noktası</span>
                <HelpCircle size={14} className="text-slate-300 group-hover/card:text-slate-400 transition-colors" />
              </div>
              <div>
                 <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {simulation.breakEvenSessions}
                 </p>
                 <span className="text-[10px] text-slate-400 mt-1 font-bold italic block">Seans / Ay</span>
              </div>
           </motion.div>

           {/* ROI */}
           <motion.div 
             whileHover={{ scale: 1.05, rotate: -1 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setActiveModal('roi')}
             className="p-5 rounded-2xl bg-indigo-600 flex flex-col justify-between text-white shadow-lg shadow-indigo-200 cursor-pointer relative overflow-hidden group/card"
           >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                <TrendingUp size={60} />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-3">Aylık ROI</span>
                <HelpCircle size={14} className="text-indigo-300" />
              </div>
               <div className="flex items-center justify-between relative z-10">
                 <p className="text-2xl font-black tracking-tight">
                    %{simulation.roiPercentage?.toFixed(1) || '0.0'}
                 </p>
                 <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                   <ArrowRight className="w-4 h-4 text-white" />
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-[90%] max-w-md h-fit bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className={cn(
                "p-8 text-center space-y-6 relative",
                activeModal === 'roi' ? "bg-indigo-600 text-white" : "bg-white text-slate-800"
              )}>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X size={20} className={activeModal === 'roi' ? 'text-indigo-200' : 'text-slate-400'} />
                </button>

                <div className={cn(
                  "w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-inner",
                  activeModal === 'roi' ? "bg-white/20" : "bg-slate-50"
                )}>
                  {(() => {
                    const Icon = explanations[activeModal].icon;
                    return <Icon size={40} className={activeModal === 'roi' ? 'text-white' : 'text-indigo-600'} />;
                  })()}
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                    {explanations[activeModal].title}
                  </h3>
                  <p className={cn(
                    "text-lg font-bold leading-relaxed",
                    activeModal === 'roi' ? "text-indigo-50" : "text-slate-600"
                  )}>
                    "{explanations[activeModal].text}"
                  </p>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium",
                    activeModal === 'roi' ? "bg-white/10 text-indigo-100" : "bg-slate-50 text-slate-500"
                  )}>
                    {explanations[activeModal].details}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveModal(null)}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all",
                    activeModal === 'roi' ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-slate-900 text-white hover:bg-indigo-600"
                  )}
                >
                  Anladım!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
