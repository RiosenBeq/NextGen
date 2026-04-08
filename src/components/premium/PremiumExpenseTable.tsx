'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Receipt, User, CheckCircle2, Trash2, Edit2, Eye, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteExpense, toggleExpenseSettled } from '@/features/ledger/actions';

interface PremiumExpenseTableProps {
  expenses: ExpenseItem[];
  locations: LocationItem[];
  documents: DocumentItem[];
  onView: (exp: ExpenseItem) => void;
  onEdit: (exp: ExpenseItem) => void;
}

interface ExpenseItem {
  id: string;
  description: string;
  amountWithVat: number;
  type: 'RECURRING' | 'ONE_TIME';
  isOfficial: boolean;
  createdAt: string;
  locationId?: string | null;
  paidBy?: string;
  location?: { name?: string | null } | null;
}

interface LocationItem {
  id: string;
  name: string;
}

interface DocumentItem {
  id: string;
}

export default function PremiumExpenseTable({ expenses, locations, onView, onEdit }: PremiumExpenseTableProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<'ALL' | 'RECURRING' | 'ONE_TIME'>('ALL');
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return expenses.filter((exp) => {
      if (filterType !== 'ALL' && exp.type !== filterType) return false;
      if (filterLocation !== 'all' && exp.locationId !== filterLocation) return false;
      if (searchQuery.trim() && !String(exp.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [expenses, filterType, filterLocation, searchQuery]);

  const filteredTotal = filtered.reduce((sum, exp) => sum + (exp.amountWithVat || 0), 0);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu gider kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setDeletingId(id);
    await deleteExpense(id);
    router.refresh();
  };

  const handleToggleSettled = async (id: string, currentDesc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleExpenseSettled(id, currentDesc);
    router.refresh();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gider açıklaması ara..."
              className="w-full h-10 rounded-lg border border-slate-200 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SelectFilter
              value={filterLocation}
              onChange={setFilterLocation}
              options={[{ value: 'all', label: 'Tüm Şubeler' }, ...locations.map((loc) => ({ value: loc.id, label: loc.name }))]}
            />
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
              <TypeChip active={filterType === 'ALL'} onClick={() => setFilterType('ALL')} label="Tümü" />
              <TypeChip active={filterType === 'RECURRING'} onClick={() => setFilterType('RECURRING')} label="Aylık" />
              <TypeChip active={filterType === 'ONE_TIME'} onClick={() => setFilterType('ONE_TIME')} label="Tek Sefer" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Gider</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Şube / Ödeyen</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tarih</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tutar</th>
                <th className="text-center px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Durum</th>
                <th className="text-right px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer" onClick={() => onView(exp)}>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <Receipt size={16} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{exp.description}</p>
                        <p className="text-[11px] text-slate-500">{exp.type === 'RECURRING' ? 'Aylık Gider' : 'Tek Seferlik Gider'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-800">{exp.location?.name || 'Genel'}</p>
                    <p className="text-[11px] text-slate-500 inline-flex items-center gap-1"><User size={12} /> {exp.paidBy || 'Ortak'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <p className="inline-flex items-center gap-1"><Calendar size={14} /> {new Date(exp.createdAt).toLocaleDateString('tr-TR')}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(exp.amountWithVat || 0)}</p>
                    <p className="text-[11px] text-slate-500">KDV dahil</p>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase',
                      exp.isOfficial ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'
                    )}>
                      {exp.isOfficial ? 'Resmi' : 'Belgesiz'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(exp); }} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => handleToggleSettled(exp.id, exp.description, e)} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-emerald-600">
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(exp.id, e)}
                        disabled={deletingId === exp.id}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onView(exp); }} className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700">Filtreye uygun gider bulunamadı.</p>
                    <p className="text-xs text-slate-500 mt-1">Arama veya filtre kriterlerini değiştirin.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>{filtered.length} kayıt listeleniyor</span>
          <span className="font-semibold">Filtreli Toplam: {formatCurrency(filteredTotal)}</span>
        </div>
      </section>
    </div>
  );
}

function TypeChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 px-3 rounded-md text-[11px] font-bold uppercase',
        active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
      )}
    >
      {label}
    </button>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 bg-white"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
