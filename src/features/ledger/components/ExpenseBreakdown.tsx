'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, ShoppingBag, Users, Building, Zap } from 'lucide-react';

interface Expense {
  type: string;
  amountWithVat: number;
}

interface Props {
  expenses: Expense[];
}

export default function ExpenseBreakdown({ expenses }: Props) {
  const breakdown = useMemo(() => {
    const categories: Record<string, number> = {
      'FATURA': 0,
      'MAAS': 0,
      'KİRA': 0,
      'DİĞER': 0
    };
    
    let total = 0;
    expenses.forEach(exp => {
      const cat = exp.type?.toUpperCase() || 'DİĞER';
      if (categories[cat] !== undefined) categories[cat] += exp.amountWithVat;
      else categories['DİĞER'] += exp.amountWithVat;
      total += exp.amountWithVat;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: getColor(name)
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  function getColor(cat: string) {
    switch (cat) {
      case 'FATURA': return 'bg-amber-500';
      case 'MAAS': return 'bg-indigo-500';
      case 'KİRA': return 'bg-emerald-500';
      default: return 'bg-zinc-500';
    }
  }

  function getIcon(cat: string) {
    switch (cat) {
      case 'FATURA': return Zap;
      case 'MAAS': return Users;
      case 'KİRA': return Building;
      default: return ShoppingBag;
    }
  }

  if (breakdown.length === 0) return null;

  return (
    <div className="premium-card p-10 bg-zinc-950 border-white/5 relative overflow-hidden h-full">
      <header className="mb-12">
        <h3 className="text-xl font-black text-white tracking-tighter mb-1 flex items-center gap-3">
           <PieChart className="text-zinc-500 w-5 h-5" />
           Gider Dağılımı
        </h3>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Operasyonel Harcama Analizi</p>
      </header>

      <div className="space-y-8">
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-white/5 border border-white/5">
          {breakdown.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ width: 0 }}
              animate={{ width: `${item.percentage}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className={item.color}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {breakdown.map((item, i) => {
            const Icon = getIcon(item.name);
            return (
              <motion.div 
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center justify-between group cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${item.color} bg-opacity-10 flex items-center justify-center border border-current border-opacity-10`}>
                     <Icon className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white tracking-tight uppercase italic">{item.name}</p>
                    <p className="text-[10px] font-bold text-zinc-500">%{item.percentage.toFixed(1)}</p>
                  </div>
                </div>
                <p className="font-mono text-sm font-black text-white">₺{item.value.toLocaleString('tr-TR')}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
