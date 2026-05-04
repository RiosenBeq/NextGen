'use client';

import { motion } from 'framer-motion';
import { PieChart, ShoppingBag, Users, Building, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Expense {
  type: string;
  amountWithVat: number;
}

interface Props {
  expenses: Expense[];
}

function getColor(cat: string) {
  switch (cat) {
    case 'Faturalar': return { bg: 'bg-amber-100', text: 'text-amber-600', fill: 'bg-amber-500' };
    case 'Personel': return { bg: 'bg-indigo-100', text: 'text-indigo-600', fill: 'bg-indigo-500' };
    case 'Kira': return { bg: 'bg-emerald-100', text: 'text-emerald-600', fill: 'bg-emerald-500' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-600', fill: 'bg-slate-500' };
  }
}

function getIcon(cat: string) {
  switch (cat) {
    case 'Faturalar': return Zap;
    case 'Personel': return Users;
    case 'Kira': return Building;
    default: return ShoppingBag;
  }
}

function computeBreakdown(expenses: Expense[]) {
  const categories: Record<string, number> = {
    'Faturalar': 0,
    'Personel': 0,
    'Kira': 0,
    'Diğer': 0
  };

  let total = 0;
  expenses.forEach(exp => {
    const cat = exp.type || 'Diğer';
    if (categories[cat] !== undefined) categories[cat] += exp.amountWithVat;
    else categories['Diğer'] += exp.amountWithVat;
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
}

export default function ExpenseBreakdown({ expenses }: Props) {
  const breakdown = computeBreakdown(expenses);

  if (breakdown.length === 0) return (
    <div className="py-8 text-center text-slate-400">
      <PieChart className="mx-auto mb-3 opacity-50" size={32} />
      <p className="text-sm">Gider verisi bulunamadı.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6">
        {/* Progress Bar composite */}
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
          {breakdown.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ width: 0 }}
              animate={{ width: `${item.percentage}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className={item.color.fill}
            />
          ))}
        </div>

        {/* Legend / Items */}
        <div className="grid grid-cols-1 gap-4">
          {breakdown.map((item, i) => {
            const Icon = getIcon(item.name);
            return (
              <motion.div 
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.color.bg, item.color.text)}>
                     <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none mb-1">{item.name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">%{item.percentage.toFixed(1)}</p>
                  </div>
                </div>
                <p className="font-semibold text-sm text-slate-800">₺{item.value.toLocaleString('tr-TR')}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
