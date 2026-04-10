'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { deleteExpense } from '@/features/ledger/actions';

interface Expense {
  id: string;
  description: string;
  amountWithVat: number;
  type: string;
  paidBy?: string;
  isOfficial?: boolean;
  location?: { name: string } | null;
}

export default function AylikOzetExpenseTable({ initialExpenses }: { initialExpenses: Expense[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu gideri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    setDeletingId(id);
    const res = await deleteExpense(id);
    if (!res.success) {
      toast.error(res.error || 'Silme işlemi başarısız.');
      setDeletingId(null);
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
    toast.success('Gider başarıyla silindi.');
    router.refresh();
  };

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileText size={32} className="mx-auto text-slate-200 mb-3" />
        <p className="text-sm font-medium text-slate-400">Bu dönem için gider kaydı bulunamadı.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="px-6 py-4">Açıklama</th>
              <th className="px-4 py-4 text-center">Sorumlu</th>
              <th className="px-4 py-4 text-center">Tip</th>
              <th className="px-6 py-4 text-right">Tutar</th>
              <th className="px-4 py-4 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      {exp.description}
                      {!exp.isOfficial && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-tighter">
                          Harici
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {exp.location?.name || 'Genel'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 uppercase">
                    {exp.paidBy || 'MERKEZ'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {exp.type === 'RECURRING' ? 'Sabit' : 'Ad-hoc'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    ₺{exp.amountWithVat?.toLocaleString('tr-TR')}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(exp.id)}
                    disabled={deletingId === exp.id}
                    className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                  >
                    {deletingId === exp.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {expenses.map((exp) => (
          <div key={exp.id} className="px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                {exp.description}
                {!exp.isOfficial && (
                  <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-1 rounded uppercase">H</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  {exp.location?.name || 'Genel'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">
                  {exp.type === 'RECURRING' ? 'Sabit' : 'Ad-hoc'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">
                ₺{exp.amountWithVat?.toLocaleString('tr-TR')}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(exp.id)}
                disabled={deletingId === exp.id}
                className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                {deletingId === exp.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
