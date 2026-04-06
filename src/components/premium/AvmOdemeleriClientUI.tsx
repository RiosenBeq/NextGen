'use client';

import { useMemo, useState, useTransition } from 'react';
import { Building2, CheckCircle2, CircleDashed, Search, Wallet } from 'lucide-react';
import { toggleExpenseSettled } from '@/features/ledger/actions';
import { cn } from '@/lib/utils';

interface AvmExpense {
  id: string;
  description: string;
  amountWithVat: number;
  paidBy?: string;
  month?: string;
  createdAt: string;
  location?: {
    name?: string;
  } | null;
}

interface Props {
  expenses: AvmExpense[];
}

const money = (value: number) => `₺${Number(value || 0).toLocaleString('tr-TR')}`;

export default function AvmOdemeleriClientUI({ expenses: initialExpenses }: Props) {
  const [search, setSearch] = useState('');
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isPending, startTransition] = useTransition();

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;

    return expenses.filter((item) => {
      return (
        item.description.toLowerCase().includes(q)
        || (item.location?.name || '').toLowerCase().includes(q)
        || (item.paidBy || '').toLowerCase().includes(q)
        || (item.month || '').toLowerCase().includes(q)
      );
    });
  }, [expenses, search]);

  const summary = useMemo(() => {
    let total = 0;
    let settled = 0;

    for (const item of filteredExpenses) {
      const amount = Number(item.amountWithVat || 0);
      total += amount;
      if (item.description.includes('[MAHSUP]')) settled += amount;
    }

    return {
      total,
      settled,
      waiting: total - settled,
      count: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  const toggleSettled = (exp: AvmExpense) => {
    startTransition(async () => {
      const result = await toggleExpenseSettled(exp.id, exp.description);
      if (!result.success) {
        alert(result.error || 'Durum güncellenemedi.');
        return;
      }

      setExpenses((prev) => prev.map((item) => {
        if (item.id !== exp.id) return item;
        const isSettled = item.description.includes('[MAHSUP]');
        const nextDescription = isSettled
          ? item.description.replace('[MAHSUP] ', '')
          : `[MAHSUP] ${item.description}`;

        return { ...item, description: nextDescription };
      }));
    });
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white grid place-items-center shadow-lg shadow-blue-200">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Operasyon</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">AVM Ödemeleri Takibi</h1>
          </div>
        </div>

        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Açıklama, AVM, dönem veya ödeyen ara..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Toplam AVM Gideri</p>
          <p className="text-2xl font-black text-slate-900 mt-2">{money(summary.total)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs text-emerald-700 font-semibold">Ödenen / Mahsup</p>
          <p className="text-2xl font-black text-emerald-700 mt-2">{money(summary.settled)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs text-amber-700 font-semibold">Bekleyen Ödeme</p>
          <p className="text-2xl font-black text-amber-700 mt-2">{money(summary.waiting)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Kayıt Adedi</p>
          <p className="text-2xl font-black text-slate-900 mt-2">{summary.count}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="text-left p-4">Açıklama</th>
                <th className="text-left p-4">AVM / Lokasyon</th>
                <th className="text-left p-4">Dönem</th>
                <th className="text-left p-4">Ödeyen</th>
                <th className="text-right p-4">Tutar</th>
                <th className="text-center p-4">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500 text-sm">
                    Filtreye uygun AVM ödeme kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => {
                  const isSettled = item.description.includes('[MAHSUP]');
                  return (
                    <tr key={item.id} className="border-t border-slate-100 text-sm">
                      <td className="p-4 font-semibold text-slate-800">{item.description.replace('[MAHSUP] ', '')}</td>
                      <td className="p-4 text-slate-600">{item.location?.name || 'Genel'}</td>
                      <td className="p-4 text-slate-600">{item.month || new Date(item.createdAt).toISOString().slice(0, 7)}</td>
                      <td className="p-4 text-slate-600">{item.paidBy || 'Ortak Hesap'}</td>
                      <td className="p-4 text-right font-black text-slate-900">{money(item.amountWithVat)}</td>
                      <td className="p-4">
                        <button
                          disabled={isPending}
                          onClick={() => toggleSettled(item)}
                          className={cn(
                            'mx-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                            isSettled
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          )}
                        >
                          {isSettled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
                          {isSettled ? 'Ödendi' : 'Bekliyor'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-500 flex items-center gap-2">
        <Wallet className="w-3.5 h-3.5" />
        Bu tablo AVM/kira/aidat/ciro payı ile eşleşen gider kayıtlarını gösterir.
      </p>
    </div>
  );
}
