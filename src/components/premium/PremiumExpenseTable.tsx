'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Receipt, User, CheckCircle2, Trash2, Edit2, Eye } from 'lucide-react';
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
    setDeletingId(null);
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
      <section className="apple-card p-5 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary]" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gider açıklaması ara…"
              className="w-full h-11 rounded-full bg-[--bg-elevated] border border-transparent pl-11 pr-4 text-[15px] text-[--text] placeholder:text-[--text-tertiary] outline-none focus:border-[--accent] focus:bg-[--surface] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SelectFilter
              value={filterLocation}
              onChange={setFilterLocation}
              options={[{ value: 'all', label: 'Tüm Şubeler' }, ...locations.map((loc) => ({ value: loc.id, label: loc.name }))]}
            />
            <div className="sui-chip-group sui-chip-group--segmented">
              <TypeChip active={filterType === 'ALL'} onClick={() => setFilterType('ALL')} label="Tümü" />
              <TypeChip active={filterType === 'RECURRING'} onClick={() => setFilterType('RECURRING')} label="Aylık" />
              <TypeChip active={filterType === 'ONE_TIME'} onClick={() => setFilterType('ONE_TIME')} label="Tek Sefer" />
            </div>
          </div>
        </div>
      </section>

      <section className="apple-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-[--border]">
                <th className="text-left px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Gider</th>
                <th className="text-left px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Şube / Ödeyen</th>
                <th className="text-left px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Tarih</th>
                <th className="text-right px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Tutar</th>
                <th className="text-center px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Durum</th>
                <th className="text-right px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border-soft]">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-[--bg-subtle] transition-colors cursor-pointer" onClick={() => onView(exp)}>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--text-secondary]">
                        <Receipt size={16} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-[--text] truncate" style={{ letterSpacing: '-0.005em' }}>{exp.description}</p>
                        <p className="text-[12px] text-[--text-tertiary] mt-0.5">{exp.type === 'RECURRING' ? 'Aylık Gider' : 'Tek Seferlik Gider'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] text-[--text]">{exp.location?.name || 'Genel'}</p>
                    <p className="text-[12px] text-[--text-tertiary] inline-flex items-center gap-1 mt-0.5">
                      <User size={12} strokeWidth={1.75} /> {exp.paidBy || 'Ortak'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[--text-secondary] tabular-nums">
                    <p className="inline-flex items-center gap-1.5">
                      <Calendar size={14} strokeWidth={1.75} className="text-[--text-tertiary]" />{' '}
                      {new Date(exp.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <p className="text-[15px] font-medium text-[--text]">{formatCurrency(exp.amountWithVat || 0)}</p>
                    <p className="text-[12px] text-[--text-tertiary] mt-0.5">KDV dahil</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium',
                      exp.isOfficial ? 'bg-[--accent-soft] text-[--accent]' : 'bg-[--bg-elevated] text-[--text-secondary]'
                    )}>
                      {exp.isOfficial ? 'Resmi' : 'Belgesiz'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(exp); }}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors"
                        aria-label="Düzenle"
                      >
                        <Edit2 size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={(e) => handleToggleSettled(exp.id, exp.description, e)}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--accent] hover:bg-[--accent-soft] transition-colors"
                        aria-label="Durum"
                      >
                        <CheckCircle2 size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(exp.id, e)}
                        disabled={deletingId === exp.id}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] disabled:opacity-50 transition-colors"
                        aria-label="Sil"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onView(exp); }}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors"
                        aria-label="Görüntüle"
                      >
                        <Eye size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-[15px] font-medium text-[--text]">Filtreye uygun gider bulunamadı.</p>
                    <p className="text-[13px] text-[--text-tertiary] mt-1">Arama veya filtre kriterlerini değiştirin.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[--border-soft]">
          {filtered.map((exp) => (
            <button
              key={exp.id}
              type="button"
              onClick={() => onView(exp)}
              className="w-full text-left p-5 hover:bg-[--bg-subtle] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--text-secondary] shrink-0">
                  <Receipt size={16} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-medium text-[--text] truncate" style={{ letterSpacing: '-0.005em' }}>{exp.description}</p>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0',
                      exp.isOfficial ? 'bg-[--accent-soft] text-[--accent]' : 'bg-[--bg-elevated] text-[--text-secondary]'
                    )}>
                      {exp.isOfficial ? 'Resmi' : 'Belgesiz'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[--text-tertiary] mt-0.5">
                    {exp.location?.name || 'Genel'} · {exp.type === 'RECURRING' ? 'Aylık' : 'Tek Sefer'} · {new Date(exp.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-[18px] font-semibold tabular-nums text-[--text] mt-2" style={{ letterSpacing: '-0.014em' }}>
                    {formatCurrency(exp.amountWithVat || 0)}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <Receipt className="empty-state-icon" />
              <p className="empty-state-title">Filtreye uygun kayıt yok</p>
              <p className="empty-state-desc">Arama veya filtre kriterlerini değiştirin.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[--border] bg-[--bg-subtle] flex items-center justify-between text-[13px]">
          <span className="tabular-nums text-[--text-secondary]">{filtered.length} kayıt</span>
          <span className="tabular-nums text-[--text-secondary]">
            Filtreli Toplam:{' '}
            <span className="text-[--text] font-medium">{formatCurrency(filteredTotal)}</span>
          </span>
        </div>
      </section>
    </div>
  );
}

function TypeChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('sui-chip sui-chip--compact', active && 'sui-chip--active')}>
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
      className="h-11 rounded-full bg-[--bg-elevated] border border-transparent px-4 text-[14px] text-[--text] outline-none focus:border-[--accent] focus:bg-[--surface] transition-colors min-h-[44px]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
