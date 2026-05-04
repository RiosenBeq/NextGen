'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, 
  ChevronRight, 
  Building2, 
  Activity, 
  HandCoins, 
  CreditCard,
  PlusCircle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumModal } from '@/components/premium/PremiumModal';

interface ExpenseItem {
  id: string;
  label: string;
  value: number;
  iconName: string;
  subLabel?: string;
  color: string;
}

interface Props {
  total: number;
  breakdown: ExpenseItem[];
  tag?: string;
}

export default function ExpenseDetailCard({ total, breakdown, tag = "KDV Dahil" }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div 
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="premium-card p-5 border border-red-100 bg-white shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 rounded-xl border border-red-200 bg-red-100 flex items-center justify-center">
            <TrendingDown className="w-4.5 h-4.5 text-red-600" />
          </div>
          <div className="flex flex-col items-end gap-1">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{tag}</span>
             <div className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                DETAYLARI GÖR <ChevronRight size={10} />
             </div>
          </div>
        </div>
        
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Toplam Gider</p>
        <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">
          ₺{total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </h2>
        
        <div className="mt-4 flex items-center gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          {breakdown.map((item) => (
            <div
              key={item.id}
              style={{ width: `${(item.value / total) * 100}%` }}
              className={cn("h-full", item.color)}
            />
          ))}
        </div>
      </motion.div>

      {/* Modal Detail */}
      <PremiumModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Gider Detay Analizi"
        maxWidth="max-w-xl"
      >
        <div className="p-10 space-y-10 bg-slate-900 shadow-2xl relative overflow-hidden">
          {/* Animated Background Pulse */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 space-y-10">
            {/* Header Summary */}
            <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 flex items-center justify-between shadow-inner">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] italic">Brüt Harcama</p>
                 <h3 className="text-3xl font-black text-white italic tracking-tighter">
                   ₺{total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                 </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
                 <TrendingDown size={28} strokeWidth={2.5} />
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-2 px-2">
                  <BarChart3 size={14} className="text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Kategori Dağılımı</span>
               </div>
               
               {breakdown.map((item) => (
                 <div 
                   key={item.id}
                   className="flex flex-col gap-4 group/item"
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-5">
                       <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover/item:scale-110", 
                          item.color.replace('bg-', 'bg-') + '/10', 
                          item.color.replace('bg-', 'border-') + '/20'
                       )}>
                          {item.iconName === 'Building2' && <Building2 size={22} className={item.color.replace('bg-', 'text-')} />}
                          {item.iconName === 'Activity' && <Activity size={22} className={item.color.replace('bg-', 'text-')} />}
                          {item.iconName === 'HandCoins' && <HandCoins size={22} className={item.color.replace('bg-', 'text-')} />}
                          {item.iconName === 'CreditCard' && <CreditCard size={22} className={item.color.replace('bg-', 'text-')} />}
                          {item.iconName === 'PlusCircle' && <PlusCircle size={22} className={item.color.replace('bg-', 'text-')} />}
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[15px] font-black text-white uppercase italic tracking-tight">{item.label}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.subLabel || 'OPERASYONEL'}</p>
                       </div>
                     </div>
                     <div className="text-right">
                        <p className="text-lg font-black text-white tracking-tighter italic">₺{item.value.toLocaleString('tr-TR')}</p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest italic", item.color.replace('bg-', 'text-'))}>% {((item.value / total) * 100).toFixed(1)}</p>
                     </div>
                   </div>
                   
                   <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / total) * 100}%` }}
                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                        className={cn("h-full", item.color)} 
                      />
                   </div>
                 </div>
               ))}
            </div>

            {/* Footer Info */}
            <footer className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                     <PieChartIcon size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">İstatistiksel Dağılım Hesabı</span>
               </div>
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">NextGen Financial Algorithm V2.1</p>
            </footer>
          </div>
        </div>
      </PremiumModal>
    </>
  );
}
