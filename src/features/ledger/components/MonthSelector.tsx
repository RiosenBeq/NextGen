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
      <div className="relative group">
        <select 
          value={selectedMonthStr}
          disabled={isPending}
          onChange={(e) => handleSelect(e.target.value)}
          className="bg-white border border-slate-200 text-slate-900 font-bold px-6 py-2.5 rounded-2xl text-sm focus:ring-4 ring-indigo-50 outline-none cursor-pointer hover:border-indigo-400 transition-all appearance-none pr-12 shadow-sm"
        >
          {availableMonths.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center gap-1">
          {isPending ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <ChevronDown size={16} />}
        </div>
      </div>
    </div>
  );
}
