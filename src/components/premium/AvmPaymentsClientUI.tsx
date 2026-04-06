'use client';

import { useState } from 'react';
import { CheckSquare, Loader2, Square, Upload } from 'lucide-react';
import { updateAvmExpenseFinancials, updateAvmExpenseStatus, uploadExpenseAttachment, updateExpenseAttachment } from '@/features/ledger/actions';

type AvmExpense = {
  id: string;
  description: string;
  amountWithVat: number;
  isOfficial: boolean;
  isSettled?: boolean;
  paidBy: string;
  location?: { name: string } | Array<{ name: string }>;
};

export default function AvmPaymentsClientUI({ initialItems }: { initialItems: AvmExpense[] }) {
  const [items, setItems] = useState(initialItems);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { amountWithVat: number; paidBy: string }>>({});

  const getDraft = (item: AvmExpense) =>
    drafts[item.id] || { amountWithVat: Number(item.amountWithVat || 0), paidBy: item.paidBy || 'Ortak Hesap' };

  const onToggle = async (id: string, field: 'isSettled' | 'isOfficial', current: boolean) => {
    const res = await updateAvmExpenseStatus(id, { [field]: !current });
    if (!res.success) {
      alert(res.error || 'Durum güncellenemedi.');
      return;
    }
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: !current } : row)));
  };

  const onSave = async (item: AvmExpense) => {
    const draft = getDraft(item);
    setSavingId(item.id);
    const res = await updateAvmExpenseFinancials(item.id, {
      amountWithVat: Number(draft.amountWithVat || 0),
      paidBy: draft.paidBy,
    });
    if (!res.success) {
      alert(res.error || 'Kayıt güncellenemedi.');
      setSavingId(null);
      return;
    }
    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, amountWithVat: draft.amountWithVat, paidBy: draft.paidBy } : row)));
    setSavingId(null);
  };

  const onUpload = async (itemId: string, file: File | null) => {
    if (!file) return;
    setUploadingId(itemId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const upload = await uploadExpenseAttachment(fd);
      if (!upload.success || !upload.publicUrl) throw new Error(upload.error || 'Dosya yüklenemedi.');

      const update = await updateExpenseAttachment(itemId, upload.publicUrl);
      if (!update.success) throw new Error(update.error || 'Belge kaydı güncellenemedi.');

      await updateAvmExpenseStatus(itemId, { isOfficial: true });
      setItems((prev) => prev.map((row) => (row.id === itemId ? { ...row, isOfficial: true } : row)));
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Belge yükleme hatası.');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-bold text-slate-900">AVM Ödeme Takibi</h1>
        <p className="text-sm text-slate-500">Kira, aidat ve ciro payı faturalarını ayrı bir akışta takip edin.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            AVM ödeme kaydı bulunamadı.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{item.description}</p>
                <p className="text-xs text-slate-500">{getLocationName(item.location)} • ₺{item.amountWithVat.toLocaleString('tr-TR')}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onToggle(item.id, 'isSettled', Boolean(item.isSettled))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs">
                  {item.isSettled ? <CheckSquare size={14} className="text-emerald-600" /> : <Square size={14} />}
                  Ödeme Yapıldı
                </button>
                <button type="button" onClick={() => onToggle(item.id, 'isOfficial', Boolean(item.isOfficial))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs">
                  {item.isOfficial ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
                  Fatura Geldi
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs">
                  <Upload size={14} />
                  {uploadingId === item.id ? 'Yükleniyor...' : 'Fatura Yükle'}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => onUpload(item.id, e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="number"
                  min={0}
                  value={getDraft(item).amountWithVat}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: { ...getDraft(item), amountWithVat: Number(e.target.value || 0) } }))}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="Fatura Tutarı"
                />
                <input
                  type="text"
                  value={getDraft(item).paidBy}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: { ...getDraft(item), paidBy: e.target.value } }))}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="Ödeyen Hesap"
                />
                <button type="button" onClick={() => onSave(item)} disabled={savingId === item.id} className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-60">
                  {savingId === item.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Güncelle'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function getLocationName(location?: { name: string } | Array<{ name: string }>) {
  if (!location) return 'Genel';
  if (Array.isArray(location)) return location[0]?.name || 'Genel';
  return location.name || 'Genel';
}
