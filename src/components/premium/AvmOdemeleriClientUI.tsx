'use client';

import { useMemo, useState, useTransition } from 'react';
import { AlertTriangle, Building2, CheckCircle2, CircleDollarSign, Clock3, Download, Loader2, PlusCircle } from 'lucide-react';
import { createAvmInvoice, toggleAvmInvoicePayment } from '@/features/avm-odemeleri/actions';
import { cn } from '@/lib/utils';

const INVOICE_TYPES = [
  { value: 'AIDAT_FATURASI', label: 'Aidat Faturası' },
  { value: 'CIRO_PAYI_FATURASI', label: 'Ciro Payı Faturası' },
  { value: 'KIRA_FATURASI', label: 'Kira Faturası' },
  { value: 'DIGER_FATURA', label: 'Diğer Fatura' },
] as const;

type InvoiceType = (typeof INVOICE_TYPES)[number]['value'];

interface AvmInvoice {
  id: string;
  locationId?: string | null;
  invoiceType: InvoiceType;
  amount: number;
  invoiceDate: string;
  dueDate?: string | null;
  isPaid: boolean;
  paidAt?: string | null;
  attachmentUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  location?: { name?: string | null } | null;
}

interface LocationItem {
  id: string;
  name: string;
}

interface Props {
  invoices: AvmInvoice[];
  locations: LocationItem[];
}

const money = (value: number) => `₺${Number(value || 0).toLocaleString('tr-TR')}`;
const todayIso = () => new Date().toISOString().slice(0, 10);

function getInvoiceTypeLabel(type: InvoiceType): string {
  return INVOICE_TYPES.find((item) => item.value === type)?.label || 'Diğer Fatura';
}

export default function AvmOdemeleriClientUI({ invoices: initialInvoices, locations }: Props) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'OVERDUE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | InvoiceType>('ALL');
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    locationId: '',
    invoiceType: 'AIDAT_FATURASI' as InvoiceType,
    amount: '',
    invoiceDate: todayIso(),
    dueDate: '',
    notes: '',
    file: null as File | null,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return invoices.filter((item) => {
      const due = item.dueDate ? new Date(item.dueDate) : null;
      const overdue = !!due && !item.isPaid && due < new Date(new Date().toDateString());

      if (statusFilter === 'PAID' && !item.isPaid) return false;
      if (statusFilter === 'UNPAID' && item.isPaid) return false;
      if (statusFilter === 'OVERDUE' && !overdue) return false;
      if (typeFilter !== 'ALL' && item.invoiceType !== typeFilter) return false;

      if (!query) return true;

      return (
        getInvoiceTypeLabel(item.invoiceType).toLowerCase().includes(query)
        || (item.location?.name || '').toLowerCase().includes(query)
        || (item.notes || '').toLowerCase().includes(query)
        || money(item.amount).toLowerCase().includes(query)
      );
    });
  }, [invoices, search, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    let total = 0;
    let paid = 0;
    let unpaid = 0;
    let overdue = 0;

    const now = new Date(new Date().toDateString());

    for (const item of filtered) {
      total += Number(item.amount || 0);
      if (item.isPaid) {
        paid += Number(item.amount || 0);
      } else {
        unpaid += Number(item.amount || 0);
        if (item.dueDate && new Date(item.dueDate) < now) overdue += Number(item.amount || 0);
      }
    }

    return { total, paid, unpaid, overdue };
  }, [filtered]);

  const handleAddInvoice = () => {
    setFormError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('locationId', form.locationId);
      formData.set('invoiceType', form.invoiceType);
      formData.set('amount', form.amount);
      formData.set('invoiceDate', form.invoiceDate);
      formData.set('dueDate', form.dueDate);
      formData.set('notes', form.notes);
      if (form.file) formData.set('file', form.file);

      const result = await createAvmInvoice(formData);
      if (!result.success) {
        setFormError(result.error || 'Kayıt sırasında hata oluştu.');
        return;
      }

      const location = locations.find((loc) => loc.id === form.locationId);

      const optimisticItem: AvmInvoice = {
        id: `tmp_${crypto.randomUUID()}`,
        locationId: form.locationId || null,
        invoiceType: form.invoiceType,
        amount: Number(form.amount),
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || null,
        isPaid: false,
        paidAt: null,
        attachmentUrl: null,
        notes: form.notes || null,
        createdAt: new Date().toISOString(),
        location: location ? { name: location.name } : null,
      };

      setInvoices((prev) => [optimisticItem, ...prev]);
      setForm({
        locationId: '',
        invoiceType: 'AIDAT_FATURASI',
        amount: '',
        invoiceDate: todayIso(),
        dueDate: '',
        notes: '',
        file: null,
      });
    });
  };

  const handleTogglePaid = (item: AvmInvoice) => {
    startTransition(async () => {
      const result = await toggleAvmInvoicePayment(item.id, item.isPaid);
      if (!result.success) {
        alert(result.error || 'Durum güncellenemedi.');
        return;
      }

      setInvoices((prev) => prev.map((inv) => (
        inv.id === item.id
          ? {
            ...inv,
            isPaid: !inv.isPaid,
            paidAt: inv.isPaid ? null : new Date().toISOString(),
          }
          : inv
      )));
    });
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white grid place-items-center shadow-lg shadow-blue-200">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Finans Operasyon</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">AVM Ödeme Takibi</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 max-w-3xl">
          AVM&apos;den gelen faturaları burada kategori bazlı ekleyebilir, dosya yükleyebilir, son ödeme tarihini takip edebilir ve ödenen/ödenmeyen durumunu tek tıkla yönetebilirsin.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600" /> Yeni AVM Faturası Ekle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={form.invoiceType}
            onChange={(event) => setForm((prev) => ({ ...prev, invoiceType: event.target.value as InvoiceType }))}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            {INVOICE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <select
            value={form.locationId}
            onChange={(event) => setForm((prev) => ({ ...prev, locationId: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Lokasyon Seç (Opsiyonel)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="Fatura tutarı (KDV dahil)"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />

          <label className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 flex flex-col gap-1">
            <span className="text-xs text-slate-400">Fatura Tarihi</span>
            <input
              type="date"
              value={form.invoiceDate}
              onChange={(event) => setForm((prev) => ({ ...prev, invoiceDate: event.target.value }))}
              className="outline-none"
            />
          </label>

          <label className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 flex flex-col gap-1">
            <span className="text-xs text-slate-400">Son Ödeme Tarihi</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              className="outline-none"
            />
          </label>

          <label className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 flex flex-col gap-1">
            <span className="text-xs text-slate-400">Dosya (PDF/JPG/PNG/WEBP)</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
              className="outline-none"
            />
          </label>
        </div>

        <textarea
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Notlar (opsiyonel)"
          className="w-full min-h-20 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />

        {formError && (
          <p className="text-sm text-rose-600 font-medium">{formError}</p>
        )}

        <button
          onClick={handleAddInvoice}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          Kaydet
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Toplam Fatura</p>
          <p className="text-2xl font-black text-slate-900 mt-2">{money(summary.total)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs text-emerald-700 font-semibold">Ödenen</p>
          <p className="text-2xl font-black text-emerald-700 mt-2">{money(summary.paid)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs text-amber-700 font-semibold">Bekleyen</p>
          <p className="text-2xl font-black text-amber-700 mt-2">{money(summary.unpaid)}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-xs text-rose-700 font-semibold">Geciken (Son Ödeme Geçti)</p>
          <p className="text-2xl font-black text-rose-700 mt-2">{money(summary.overdue)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tip, lokasyon, not veya tutar ara..."
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-full md:w-80"
        />

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'ALL', label: 'Tümü' },
            { key: 'PAID', label: 'Ödendi' },
            { key: 'UNPAID', label: 'Ödenmedi' },
            { key: 'OVERDUE', label: 'Geciken' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key as 'ALL' | 'PAID' | 'UNPAID' | 'OVERDUE')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border',
                statusFilter === item.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as 'ALL' | InvoiceType)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="ALL">Tüm Fatura Tipleri</option>
          {INVOICE_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1024px]">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="text-left p-4">Fatura Tipi</th>
                <th className="text-left p-4">Lokasyon</th>
                <th className="text-right p-4">Tutar</th>
                <th className="text-left p-4">Fatura Tarihi</th>
                <th className="text-left p-4">Son Ödeme</th>
                <th className="text-left p-4">Durum</th>
                <th className="text-left p-4">Dosya</th>
                <th className="text-left p-4">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500 text-sm">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const due = item.dueDate ? new Date(item.dueDate) : null;
                const overdue = !!due && !item.isPaid && due < new Date(new Date().toDateString());

                return (
                  <tr key={item.id} className="border-t border-slate-100 text-sm">
                    <td className="p-4 font-semibold text-slate-800">{getInvoiceTypeLabel(item.invoiceType)}</td>
                    <td className="p-4 text-slate-600">{item.location?.name || 'Genel'}</td>
                    <td className="p-4 text-right font-black text-slate-900">{money(item.amount)}</td>
                    <td className="p-4 text-slate-600">{new Date(item.invoiceDate).toLocaleDateString('tr-TR')}</td>
                    <td className="p-4 text-slate-600">{item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR') : '-'}</td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                        item.isPaid
                          ? 'bg-emerald-100 text-emerald-700'
                          : overdue
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                      )}>
                        {item.isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                        {item.isPaid ? 'Ödendi' : overdue ? 'Gecikmiş' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.attachmentUrl ? (
                        <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                          <Download className="w-3.5 h-3.5" /> Gör
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePaid(item)}
                        disabled={isPending}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                          item.isPaid
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        )}
                      >
                        <CircleDollarSign className="w-3.5 h-3.5" />
                        {item.isPaid ? 'Ödenmedi Yap' : 'Ödendi Yap'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
