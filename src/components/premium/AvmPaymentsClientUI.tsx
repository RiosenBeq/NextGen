'use client';
import { useRouter } from 'next/navigation';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Loader2,
  Receipt,
  MapPin,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumModal } from './PremiumModal';
import { toast } from '@/hooks/useToast';
import {
  addAvmPayment,
  toggleAvmPaymentPaid,
  deleteAvmPayment,
} from '@/features/avm-payments/actions';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  Kira: 'Kira',
  Aidat: 'Aidat',
  CiroPay: 'Ciro Payı',
  Diger: 'Diğer',
};

const inputBase =
  'w-full h-11 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200';

type AvmPayment = {
  id: string;
  locationId: string;
  month: string;
  paymentType: string;
  description: string | null;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  location: { id: string; name: string } | Array<{ id: string; name: string }>;
};

type LocationOption = { id: string; name: string };

function getLocationName(
  location?: { id: string; name: string } | Array<{ id: string; name: string }>
) {
  if (!location) return 'Bilinmiyor';
  if (Array.isArray(location)) return location[0]?.name || 'Bilinmiyor';
  return location.name || 'Bilinmiyor';
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(month: string) {
  const [year, m] = month.split('-');
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${months[parseInt(m, 10) - 1]} ${year}`;
}

export default function AvmPaymentsClientUI({
  initialPayments,
  locations,
}: {
  initialPayments: AvmPayment[];
  locations: LocationOption[];
}) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const set = new Set(payments.map((p) => p.month));
    return Array.from(set).sort().reverse();
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterMonth !== 'all' && p.month !== filterMonth) return false;
      if (filterLocation !== 'all' && p.locationId !== filterLocation) return false;
      return true;
    });
  }, [payments, filterMonth, filterLocation]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, p) => s + p.amount, 0);
    const paidCount = filtered.filter((p) => p.isPaid).length;
    const unpaidCount = filtered.length - paidCount;
    const paidTotal = filtered.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);
    const unpaidTotal = total - paidTotal;
    return { total, paidCount, unpaidCount, paidTotal, unpaidTotal };
  }, [filtered]);

  const handleTogglePaid = async (payment: AvmPayment) => {
    setTogglingId(payment.id);
    const res = await toggleAvmPaymentPaid(payment.id, payment.isPaid);
    if (!res.success) {
      toast.error(res.error || 'Durum güncellenemedi.');
      setTogglingId(null);
      return;
    }
    setPayments((prev) =>
      prev.map((p) =>
        p.id === payment.id
          ? { ...p, isPaid: !p.isPaid, paidAt: !p.isPaid ? new Date().toISOString() : null }
          : p
      )
    );
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?')) return;
    setDeletingId(id);
    const res = await deleteAvmPayment(id);
    if (!res.success) {
      toast.error(res.error || 'Silme işlemi başarısız.');
      setDeletingId(null);
      return;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="apple-eyebrow">AVM Takibi</p>
          <h1 className="apple-headline mt-3">Ödeme <span className="hero-serif text-gradient-aurora">kayıtları</span></h1>
          <p className="mt-4 apple-body max-w-2xl">
            Kira, aidat ve ciro payı ödemelerini manuel olarak takip edin.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="elite-button-primary">
          <Plus size={16} strokeWidth={2} /> Yeni Ödeme
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Toplam Tutar" value={formatCurrency(stats.total)} icon={<CircleDollarSign className="w-[18px] h-[18px]" strokeWidth={1.75} />} />
        <StatCard label="Ödenen" value={formatCurrency(stats.paidTotal)} highlight icon={<CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={1.75} />} />
        <StatCard label="Bekleyen" value={formatCurrency(stats.unpaidTotal)} icon={<Clock className="w-[18px] h-[18px]" strokeWidth={1.75} />} />
        <StatCard label="Kayıt" value={`${stats.paidCount} / ${filtered.length}`} icon={<Receipt className="w-[18px] h-[18px]" strokeWidth={1.75} />} />
      </div>

      {/* Filters */}
      <section className="apple-card p-4 md:p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full h-11 rounded-full bg-[--bg-elevated] border border-transparent pl-11 pr-10 text-[14px] text-[--text] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tüm Aylar</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full h-11 rounded-full bg-[--bg-elevated] border border-transparent pl-11 pr-10 text-[14px] text-[--text] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tüm Lokasyonlar</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
          </div>
        </div>
      </section>

      {/* Payment List */}
      {filtered.length === 0 ? (
        <div className="empty-state apple-card">
          <Receipt className="empty-state-icon" />
          <p className="empty-state-title">AVM ödeme kaydı bulunamadı</p>
          <p className="empty-state-desc">Yeni ödeme eklemek için yukarıdaki butonu kullanın.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block apple-card overflow-hidden">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[--border]">
                  <th className="text-left px-5 py-4 text-[13px] font-medium text-[--text-secondary]">Durum</th>
                  <th className="text-left px-5 py-4 text-[13px] font-medium text-[--text-secondary]">Lokasyon</th>
                  <th className="text-left px-5 py-4 text-[13px] font-medium text-[--text-secondary]">Ay</th>
                  <th className="text-left px-5 py-4 text-[13px] font-medium text-[--text-secondary]">Tip</th>
                  <th className="text-left px-5 py-4 text-[13px] font-medium text-[--text-secondary]">Açıklama</th>
                  <th className="text-right px-5 py-4 text-[13px] font-medium text-[--text-secondary]">Tutar</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border-soft]">
                <AnimatePresence>
                  {filtered.map((payment) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="hover:bg-[--bg-subtle] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePaid(payment)}
                          disabled={togglingId === payment.id}
                          className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors disabled:opacity-50"
                        >
                          {togglingId === payment.id ? (
                            <Loader2 size={16} className="animate-spin text-[--text-tertiary]" />
                          ) : payment.isPaid ? (
                            <CheckSquare size={16} strokeWidth={1.75} className="text-[--accent]" />
                          ) : (
                            <Square size={16} strokeWidth={1.75} className="text-[--text-tertiary]" />
                          )}
                          <span className={payment.isPaid ? 'text-[--text]' : 'text-[--text-secondary]'}>
                            {payment.isPaid ? 'Ödendi' : 'Bekliyor'}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-[14px] text-[--text]">
                        {getLocationName(payment.location)}
                      </td>
                      <td className="px-5 py-4 text-[14px] text-[--text-secondary] tabular-nums">
                        {formatMonth(payment.month)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="chip">
                          {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[14px] text-[--text-tertiary] truncate max-w-[200px]">
                        {payment.description || '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-[15px] font-medium tabular-nums text-[--text]">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(payment.id)}
                          disabled={deletingId === payment.id}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors disabled:opacity-50"
                          aria-label="Sil"
                        >
                          {deletingId === payment.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={1.75} />}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((payment) => (
              <div key={payment.id} className="apple-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>
                      {getLocationName(payment.location)}
                    </p>
                    <p className="text-[12px] text-[--text-tertiary] tabular-nums mt-0.5">
                      {formatMonth(payment.month)}
                    </p>
                  </div>
                  <span className="chip">
                    {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                  </span>
                </div>

                {payment.description && (
                  <p className="text-[13px] text-[--text-secondary]">{payment.description}</p>
                )}

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[--border]">
                  <p className="text-[20px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.018em' }}>
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(payment)}
                      disabled={togglingId === payment.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50 min-h-[36px]',
                        payment.isPaid
                          ? 'bg-[--accent-soft] text-[--accent]'
                          : 'bg-[--bg-elevated] text-[--text-secondary]'
                      )}
                    >
                      {togglingId === payment.id ? <Loader2 size={14} className="animate-spin" /> : payment.isPaid ? <CheckSquare size={14} strokeWidth={1.75} /> : <Square size={14} strokeWidth={1.75} />}
                      {payment.isPaid ? 'Ödendi' : 'Bekliyor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(payment.id)}
                      disabled={deletingId === payment.id}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors disabled:opacity-50"
                      aria-label="Sil"
                    >
                      {deletingId === payment.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Payment Modal */}
      <PremiumModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Yeni AVM Ödemesi"
        maxWidth="max-w-lg"
      >
        <AddAvmPaymentForm
          locations={locations}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      </PremiumModal>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="apple-card p-5 md:p-6">
      <div className={highlight ? 'text-[--accent]' : 'text-[--text-tertiary]'}>{icon}</div>
      <p className="text-[12px] text-[--text-tertiary] mt-3">{label}</p>
      <p className="mt-1 text-[20px] md:text-[22px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.018em' }}>
        {value}
      </p>
    </div>
  );
}

function AddAvmPaymentForm({
  locations,
  onClose,
  onSuccess,
}: {
  locations: LocationOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    locationId: locations[0]?.id || '',
    month: getCurrentMonth(),
    paymentType: 'Kira' as string,
    description: '',
    amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.locationId) {
      toast.error('Lokasyon ve tutar alanları zorunludur.');
      return;
    }

    setLoading(true);
    try {
      const res = await addAvmPayment({
        locationId: form.locationId,
        month: form.month,
        paymentType: form.paymentType,
        description: form.description || null,
        amount: form.amount,
      });

      if (!res.success) throw new Error(res.error);

      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
      toast.error('Hata: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-1">
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[--text]">
          Lokasyon <span className="text-[--danger]">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
          <select
            required
            value={form.locationId}
            onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            className={`${inputBase} pl-10 pr-10 appearance-none cursor-pointer`}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Ay <span className="text-[--danger]">*</span></label>
          <input
            type="month"
            required
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
            className={`${inputBase} px-3 cursor-pointer tabular-nums`}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Tip <span className="text-[--danger]">*</span></label>
          <div className="relative">
            <select
              required
              value={form.paymentType}
              onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              className={`${inputBase} px-3 pr-10 appearance-none cursor-pointer`}
            >
              <option value="Kira">Kira</option>
              <option value="Aidat">Aidat</option>
              <option value="CiroPay">Ciro Payı</option>
              <option value="Diger">Diğer</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[--text]">Tutar (KDV Dahil) <span className="text-[--danger]">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-secondary]">₺</span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full h-12 rounded-xl bg-[--bg-elevated] border border-transparent pl-9 pr-4 text-[17px] font-medium text-[--text] tabular-nums placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[--text]">Açıklama (İsteğe Bağlı)</label>
        <input
          type="text"
          placeholder="Ör: Nisan ayı kira bedeli…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputBase} px-3`}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[--border]">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="elite-button-tertiary"
        >
          Vazgeç
        </button>
        <button type="submit" disabled={loading} className="elite-button-primary">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Kaydediliyor…
            </>
          ) : (
            'Kaydet'
          )}
        </button>
      </div>
    </form>
  );
}
