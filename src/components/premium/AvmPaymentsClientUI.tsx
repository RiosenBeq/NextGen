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
  Building2,
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
  Kira: 'Kira (Sabit)',
  Aidat: 'Aidat & Ortak Gider',
  CiroPay: 'Cirodan Pay',
  Diger: 'Diğer AVM Ödemesi',
};

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  Kira: 'bg-blue-50 text-blue-700 border-blue-200',
  Aidat: 'bg-amber-50 text-amber-700 border-amber-200',
  CiroPay: 'bg-purple-50 text-purple-700 border-purple-200',
  Diger: 'bg-slate-50 text-slate-600 border-slate-200',
};

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

function getLocationName(location?: { id: string; name: string } | Array<{ id: string; name: string }>) {
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
              <Building2 className="w-3.5 h-3.5" />
              Bağımsız Takip Modülü
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-slate-900 inline-flex items-center gap-3">
              <Receipt className="w-8 h-8 text-slate-400" />
              AVM Ödeme Takibi
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Kira, aidat ve ciro payı ödemelerinizi manuel olarak girin ve ödeme durumlarını takip edin.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="h-14 px-6 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-slate-800 inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            <Plus size={16} /> Yeni Ödeme Ekle
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Toplam Tutar" value={formatCurrency(stats.total)} icon={<CircleDollarSign className="w-4 h-4" />} />
        <StatCard label="Ödenen" value={formatCurrency(stats.paidTotal)} accent="emerald" icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Bekleyen" value={formatCurrency(stats.unpaidTotal)} accent="amber" icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Kayıt Sayısı" value={`${stats.paidCount} / ${filtered.length}`} icon={<Receipt className="w-4 h-4" />} />
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 pl-10 pr-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none cursor-pointer"
            >
              <option value="all">Tüm Aylar</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 pl-10 pr-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none cursor-pointer"
            >
              <option value="all">Tüm Lokasyonlar</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Payment List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">AVM ödeme kaydı bulunamadı.</p>
          <p className="text-xs text-slate-400 mt-1">Yeni ödeme eklemek için yukarıdaki butonu kullanın.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Durum</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Lokasyon</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Ay</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tip</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Açıklama</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tutar</th>
                  <th className="text-center px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">İşlem</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((payment) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'border-b border-slate-50 transition-colors hover:bg-slate-50/50',
                        payment.isPaid && 'bg-emerald-50/30'
                      )}
                    >
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePaid(payment)}
                          disabled={togglingId === payment.id}
                          className="inline-flex items-center gap-2 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {togglingId === payment.id ? (
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          ) : payment.isPaid ? (
                            <CheckSquare size={16} className="text-emerald-600" />
                          ) : (
                            <Square size={16} className="text-slate-300" />
                          )}
                          <span className={payment.isPaid ? 'text-emerald-700' : 'text-slate-500'}>
                            {payment.isPaid ? 'Ödendi' : 'Bekliyor'}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{getLocationName(payment.location)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatMonth(payment.month)}</td>
                      <td className="px-5 py-3">
                        <span className={cn('inline-block rounded-lg border px-2 py-0.5 text-[11px] font-bold', PAYMENT_TYPE_COLORS[payment.paymentType] || PAYMENT_TYPE_COLORS.Diger)}>
                          {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 truncate max-w-[200px]">{payment.description || '—'}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(payment.id)}
                          disabled={deletingId === payment.id}
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          {deletingId === payment.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
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
              <div
                key={payment.id}
                className={cn(
                  'rounded-2xl border bg-white p-4 space-y-3 shadow-sm',
                  payment.isPaid ? 'border-emerald-200' : 'border-slate-200'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{getLocationName(payment.location)}</p>
                    <p className="text-xs text-slate-500">{formatMonth(payment.month)}</p>
                  </div>
                  <span className={cn('inline-block rounded-lg border px-2 py-0.5 text-[11px] font-bold', PAYMENT_TYPE_COLORS[payment.paymentType] || PAYMENT_TYPE_COLORS.Diger)}>
                    {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                  </span>
                </div>

                {payment.description && (
                  <p className="text-xs text-slate-500">{payment.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(payment.amount)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(payment)}
                      disabled={togglingId === payment.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50',
                        payment.isPaid
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      )}
                    >
                      {togglingId === payment.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : payment.isPaid ? (
                        <CheckSquare size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                      {payment.isPaid ? 'Ödendi' : 'Bekliyor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(payment.id)}
                      disabled={deletingId === payment.id}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 disabled:opacity-50"
                    >
                      {deletingId === payment.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Payment Modal */}
      <PremiumModal isOpen={showForm} onClose={() => setShowForm(false)} title="Yeni AVM Ödemesi Ekle" maxWidth="max-w-lg">
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
  accent = 'slate',
  icon,
}: {
  label: string;
  value: string;
  accent?: 'slate' | 'emerald' | 'amber';
  icon: React.ReactNode;
}) {
  const colors = {
    slate: 'border-slate-200 bg-white text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  const iconColors = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
  };
  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', colors[accent])}>
      <div className={cn('mb-1', iconColors[accent])}>{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black tracking-tight">{value}</p>
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

      // Success callback to parent component
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
      {/* Location */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Lokasyon <span className="text-rose-500">*</span></label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            required
            value={form.locationId}
            onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            className="w-full h-11 rounded-xl border border-slate-200 pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none cursor-pointer"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Month + Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ay <span className="text-rose-500">*</span></label>
          <input
            type="month"
            required
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
            className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ödeme Tipi <span className="text-rose-500">*</span></label>
          <div className="relative">
            <select
              required
              value={form.paymentType}
              onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              className="w-full h-11 rounded-xl border border-slate-200 px-3 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none cursor-pointer"
            >
              <option value="Kira">Kira (Sabit)</option>
              <option value="Aidat">Aidat & Ortak Gider</option>
              <option value="CiroPay">Cirodan Pay</option>
              <option value="Diger">Diğer</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tutar (KDV Dahil) <span className="text-rose-500">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-blue-600 text-lg">₺</span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full h-14 rounded-2xl border border-slate-200 pl-10 pr-4 text-xl font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 bg-slate-50 shadow-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Açıklama (İsteğe Bağlı)</label>
        <input
          type="text"
          placeholder="Ör: Nisan ayı kira bedeli..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-5 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Kaydediliyor...
            </>
          ) : (
            'Ödemeyi Kaydet'
          )}
        </button>
      </div>
    </form>
  );
}
