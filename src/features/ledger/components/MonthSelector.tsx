"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

export default function MonthSelector({ availableMonths, selectedMonthStr }: { availableMonths: string[], selectedMonthStr: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (newVal: string) => {
    startTransition(() => {
      // Use router.push to update URL which will re-run the server component
      router.push(`${pathname}?m=${newVal}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selectedMonthStr}
          disabled={isPending}
          onChange={(e) => handleSelect(e.target.value)}
          className="bg-white border border-slate-200 text-slate-900 font-medium px-4 py-2.5 pr-11 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 transition-all duration-150 cursor-pointer appearance-none tabular-nums"
        >
          {availableMonths.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {isPending ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <ChevronDown size={16} />}
        </div>
      </div>
    </div>
  );
}
