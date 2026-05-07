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
          className="bg-[--bg-elevated] border border-transparent text-[--text] font-medium px-4 py-2 pr-11 rounded-full text-[14px] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors cursor-pointer appearance-none tabular-nums min-h-[36px]"
          style={{ letterSpacing: '-0.005em' }}
        >
          {availableMonths.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[--text-tertiary]">
          {isPending ? <Loader2 size={14} className="animate-spin text-[--accent]" /> : <ChevronDown size={14} strokeWidth={1.75} />}
        </div>
      </div>
    </div>
  );
}
