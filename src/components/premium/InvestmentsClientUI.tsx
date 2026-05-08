'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Box,
  Globe,
  TrendingUp,
  History,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestmentForm } from '@/features/ledger/components/InvestmentForm';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import { deleteInvestment } from '@/features/ledger/actions';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/errors';

type InvestmentLocation = { id: string; name: string };

type InvestmentItem = {
  id: string;
  description: string;
  amount: number;
  currency?: string;
  notes?: string;
  createdAt: string;
  locationId?: string;
  location?: { name?: string } | null;
};

interface InvestmentsClientProps {
  investments: InvestmentItem[];
  locations: InvestmentLocation[];
  total: number;
  count: number;
}

export default function InvestmentsClientUI({ investments, locations, total, count }: InvestmentsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentItem | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentItem | null>(null);
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val: number, currency: string = 'TRY') =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(val);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu yatırım kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      const res = await deleteInvestment(id);
      if (!res.success) toast.error(res.error ?? '');
      else router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Silme sırasında hata oluştu.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (inv: InvestmentItem) => {
    setEditingInvestment(inv);
    setShowForm(true);
  };

  const filtered = investments.filter((inv) => {
    if (filterLocation !== 'all' && inv.locationId !== filterLocation) return false;
    if (searchQuery && !inv.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Capex</p>
          <h1 className="apple-headline mt-3">Yatırım &amp; <span className="hero-serif text-gradient-emerald">demirbaş</span></h1>
          <p className="mt-4 apple-body max-w-2xl">
            Sabit yatırım kalemlerini, yeni nesil kabin alımlarını ve geri dönüş sürelerini stratejik olarak yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="apple-card p-5 min-w-[200px]">
            <p className="text-[12px] text-[--text-tertiary] flex items-center gap-1.5">
              <History size={12} strokeWidth={1.75} /> Toplam Portföy
            </p>
            <p className="text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.022em' }}>
              {formatCurrency(total)}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingInvestment(null);
              setShowForm(true);
            }}
            className="elite-button-primary"
          >
            <Plus size={16} strokeWidth={2} />
            Yeni Yatırım
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <StatCard icon={<Box className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Kayıtlı Demirbaş" value={`${count} Ünite`} sub="Operasyonel envanter" />
        <StatCard icon={<Globe className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Aktif Lokasyon" value={`${locations.length} Şube`} sub="Yatırımın dağıldığı noktalar" />
        <StatCard icon={<TrendingUp className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Amortisman" value="Hızlandırılmış" sub="Vergi odaklı muhasebe" />
      </section>

      {/* Filters & Table */}
      <section className="space-y-5">
        <div className="apple-card p-3 flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
            <input
              type="text"
              placeholder="Demirbaş ara…"
              className="w-full pl-11 pr-4 py-3 bg-[--bg-elevated] border border-transparent rounded-full text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors min-h-[44px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-[--bg-elevated] rounded-full overflow-x-auto">
            <FilterButton active={filterLocation === 'all'} onClick={() => setFilterLocation('all')} label="Tümü" />
            {locations.map((loc) => (
              <FilterButton key={loc.id} active={filterLocation === loc.id} onClick={() => setFilterLocation(loc.id)} label={loc.name} />
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block apple-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[--border]">
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Yatırım Kalemi</th>
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Şube</th>
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Tutar</th>
                <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Tarih</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border-soft]">
              {filtered.map((inv, idx) => (
                <tr
                  key={inv.id || idx}
                  className="group hover:bg-[--bg-subtle] transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedInvestment(inv);
                    setIsDrawerOpen(true);
                  }}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--text-secondary]">
                        <Box size={18} strokeWidth={1.75} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{inv.description}</span>
                        <span className="text-[12px] text-[--text-tertiary]">{inv.notes || 'Ek not yok'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="chip">{inv.location?.name || 'Genel'}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-[15px] font-medium tabular-nums text-[--text]">
                      {formatCurrency(inv.amount || 0, inv.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-[13px] text-[--text-tertiary] tabular-nums">
                      {new Date(inv.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(inv);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors"
                        aria-label="Düzenle"
                      >
                        <Edit2 size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(inv.id);
                        }}
                        disabled={isLoading}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors disabled:opacity-50"
                        aria-label="Sil"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Briefcase className="empty-state-icon" />
              <p className="empty-state-title">Yatırım kaydı bulunamadı</p>
              <p className="empty-state-desc">Yeni yatırım eklemek için yukarıdaki butonu kullanın.</p>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((inv) => (
            <button
              key={inv.id}
              type="button"
              onClick={() => {
                setSelectedInvestment(inv);
                setIsDrawerOpen(true);
              }}
              className="w-full text-left apple-card p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--text-secondary] shrink-0">
                  <Box size={18} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{inv.description}</p>
                  <p className="text-[12px] text-[--text-tertiary] mt-0.5">
                    {inv.location?.name || 'Genel'} · {new Date(inv.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-[18px] font-semibold tabular-nums text-[--text] mt-2" style={{ letterSpacing: '-0.014em' }}>
                    {formatCurrency(inv.amount || 0, inv.currency)}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state apple-card">
              <Briefcase className="empty-state-icon" />
              <p className="empty-state-title">Yatırım kaydı yok</p>
              <p className="empty-state-desc">Yeni yatırım eklemek için yukarıdaki butonu kullanın.</p>
            </div>
          )}
        </div>
      </section>

      <PremiumModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingInvestment(null);
        }}
        title={editingInvestment ? 'Yatırım Kaydı Düzenle' : 'Yeni Yatırım'}
        maxWidth="max-w-2xl"
      >
        <InvestmentForm
          locations={locations}
          initialData={editingInvestment ?? undefined}
          onClose={() => {
            setShowForm(false);
            setEditingInvestment(null);
            router.refresh();
          }}
        />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Yatırım Detayı">
        {selectedInvestment && (
          <div className="space-y-8 py-4">
            <div className="rounded-[22px] bg-[--bg-elevated] p-6 space-y-5">
              <div>
                <p className="text-[12px] text-[--text-tertiary]">Yatırım Portföyü</p>
                <p className="text-[24px] md:text-[28px] font-semibold text-[--text] mt-1" style={{ letterSpacing: '-0.022em' }}>
                  {selectedInvestment.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-5 border-t border-[--border]">
                <div>
                  <p className="text-[12px] text-[--text-tertiary]">Tutar</p>
                  <p className="text-[20px] md:text-[22px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.018em' }}>
                    {formatCurrency(selectedInvestment.amount, selectedInvestment.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[--text-tertiary]">Lokasyon</p>
                  <p className="text-[15px] font-medium text-[--text] mt-1" style={{ letterSpacing: '-0.005em' }}>
                    {selectedInvestment.location?.name || 'Genel'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Kayıt Tarihi" value={new Date(selectedInvestment.createdAt).toLocaleString('tr-TR')} />
                <DetailRow label="Demirbaş ID" value={`#CAPEX-${selectedInvestment.id.slice(0, 8).toUpperCase()}`} />
              </div>

              {selectedInvestment.notes && (
                <div className="p-5 rounded-xl bg-[--bg-elevated]">
                  <p className="text-[12px] text-[--text-tertiary] mb-2">Notlar</p>
                  <p className="text-[14px] text-[--text] leading-relaxed">&ldquo;{selectedInvestment.notes}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[--border]">
              <button onClick={() => setIsDrawerOpen(false)} className="elite-button-secondary w-full">
                Kapat
              </button>
            </div>
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="apple-card p-6 md:p-7">
      <div className="w-10 h-10 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--text-secondary] mb-5">
        {icon}
      </div>
      <p className="text-[13px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>{label}</p>
      <p className="text-[24px] md:text-[28px] font-semibold text-[--text] mt-1" style={{ letterSpacing: '-0.022em' }}>{value}</p>
      <p className="text-[12px] text-[--text-tertiary] mt-2">{sub}</p>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap min-h-[36px]',
        active ? 'bg-[--surface] text-[--text]' : 'text-[--text-secondary] hover:text-[--text]'
      )}
      style={{ letterSpacing: '-0.005em' }}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] text-[--text-tertiary]">{label}</span>
      <p className="text-[14px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{value}</p>
    </div>
  );
}
