'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import ModernModal from '@/components/ModernModal';

interface ExpenseItem {
  id: string;
  label: string;
  value: number;
  icon: any;
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
          {breakdown.map((item, idx) => (
            <div 
              key={item.id}
              style={{ width: `${(item.value / total) * 100}%` }}
              className={cn("h-full", item.color)}
            />
          ))}
        </div>
      </motion.div>

      {/* Modal Detail */}
      <ModernModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Gider Kalemleri Detay Analizi"
        maxWidth="max-w-xl"
      >
        <div className="p-8 space-y-8 bg-[#0f1117]">
          {/* Header Summary */}
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-red-400 uppercase tracking-widest italic">TOPLAM HARCAMA</p>
               <h3 className="text-2xl font-black text-white italic tracking-tighter mt-1">
                 ₺{total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
               </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
               <TrendingDown size={24} strokeWidth={2.5} />
            </div>
          </div>

          {/* Breakdown List */}
          <div className="space-y-4">
             {breakdown.map((item) => (
               <div 
                 key={item.id}
                 className="flex flex-col gap-3 group"
               >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", item.color.replace('bg-', 'text-').replace('text-', 'bg-') + '/10', item.color.replace('bg-', 'border-') + '/20')}>
                        <item.icon size={20} className={item.color.replace('bg-', 'text-')} />
                     </div>
                     <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">{item.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.subLabel || 'Operasyonel Gider'}</p>
                     </div>
                   </div>
                   <div className="text-right">
                      <p className="text-base font-black text-white tracking-tighter">₺{item.value.toLocaleString('tr-TR')}</p>
                      <p className={cn("text-[10px] font-bold", item.color.replace('bg-', 'text-'))}>% {((item.value / total) * 100).toFixed(1)}</p>
                   </div>
                 </div>
                 
                 {/* Item specific gauge */}
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / total) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn("h-full", item.color)} 
                    />
                 </div>
               </div>
             ))}
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-slate-500">
             <div className="flex items-center gap-2">
                <PieChartIcon size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Dengeli Dağılım Hesabı</span>
             </div>
             <p className="text-[10px] font-medium italic">KDV Dahil Toplam Net Maliyet</p>
          </div>
        </div>
      </ModernModal>
    </>
  );
}
