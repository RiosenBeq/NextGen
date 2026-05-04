'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  MapPin,
  Search,
  Eye,
  Plus,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import {
  deleteExpenseAttachment,
  updateAvmExpenseFinancials,
  updateAvmExpenseStatus,
  uploadExpenseAttachment,
  updateExpenseAttachment,
} from '@/features/ledger/actions';
import { toast } from '@/hooks/useToast';

interface Invoice {
  id: string;
  description: string;
  amountWithVat: number;
  attachmentUrl?: string | null;
  isOfficial: boolean;
  isSettled?: boolean;
  paidBy: string;
  createdAt: string;
  location?: { name: string };
  category?: { name: string };
}

interface FaturalarProps {
  invoices: Invoice[];
  avmExpenses: Invoice[];
  locations: Array<{ id: string; name: string }>;
}

const cardShadow =
  'shadow-[0_1px_3px_rgba(15,23,42,0.04),_0_1px_2px_rgba(15,23,42,0.06)]';

export default function FaturalarClientUI({
  invoices: initialInvoices,
  avmExpenses: initialAvmExpenses,
  locations,
}: FaturalarProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [avmExpenses, setAvmExpenses] = useState(initialAvmExpenses);
  const [uploadingAvmId, setUploadingAvmId] = useState<string | null>(null);
  const [savingAvmId, setSavingAvmId] = useState<string | null>(null);
  const [avmDrafts, setAvmDrafts] = useState<
    Record<string, { amountWithVat: number; paidBy: string }>
  >({});

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.location?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.paidBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAvm = async (
    id: string,
    field: 'isSettled' | 'isOfficial',
    current: boolean
  ) => {
    const res = await updateAvmExpenseStatus(id, { [field]: !current });
    if (!res.success) {
      toast.error(res.error || 'Durum güncellenemedi.');
      return;
    }
    setAvmExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: !current } : item))
    );
  };

  const handleUploadAvmInvoice = async (expenseId: string, file: File | null) => {
    if (!file) return;
    setUploadingAvmId(expenseId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const upload = await uploadExpenseAttachment(fd);
      if (!upload.success || !upload.publicUrl)
        throw new Error(upload.error || 'Dosya yüklenemedi.');

      const update = await updateExpenseAttachment(expenseId, upload.publicUrl);
      if (!update.success)
        throw new Error(update.error || 'Belge kaydı güncellenemedi.');

      await updateAvmExpenseStatus(expenseId, { isOfficial: true });
      setAvmExpenses((prev) =>
        prev.map((item) =>
          item.id === expenseId
            ? { ...item, attachmentUrl: upload.publicUrl, isOfficial: true }
            : item
        )
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Belge yükleme hatası.');
    } finally {
      setUploadingAvmId(null);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    setDeletingId(invoiceId);
    const res = await deleteExpenseAttachment(invoiceId);
    if (res.success) {
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      return;
    }
    toast.error(res.error || 'Belge silinirken bir hata oluştu.');
    setDeletingId(null);
  };

  const getAvmDraft = (item: Invoice) => {
    return (
      avmDrafts[item.id] || {
        amountWithVat: Number(item.amountWithVat || 0),
        paidBy: item.paidBy || 'Ortak Hesap',
      }
    );
  };

  const handleSaveAvmFinancials = async (item: Invoice) => {
    const draft = getAvmDraft(item);
    setSavingAvmId(item.id);
    const res = await updateAvmExpenseFinancials(item.id, {
      amountWithVat: Number(draft.amountWithVat || 0),
      paidBy: draft.paidBy,
    });
    if (!res.success) {
      toast.error(res.error || 'AVM gider bilgisi güncellenemedi.');
      setSavingAvmId(null);
      return;
    }
    setAvmExpenses((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? {
              ...row,
              amountWithVat: Number(draft.amountWithVat || 0),
              paidBy: draft.paidBy || 'Ortak Hesap',
            }
          : row
      )
    );
    setSavingAvmId(null);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Kurumsal Belge Arşivi
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            E-Faturalar ve Dekontlar
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Sisteme yüklenen tüm gider evrakları, PDF faturalar ve ödeme dekontları
            burada saklanır.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Belge veya şube ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
          >
            <Plus size={16} />
            Yeni Belge Ekle
          </button>
        </div>
      </header>

      {/* AVM Section */}
      <section
        className={cn(
          'rounded-2xl border border-slate-200/70 bg-white p-6 space-y-5',
          cardShadow
        )}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              AVM Fatura & Ödeme Takibi
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl">
              Kira / aidat / ciro payı kayıtlarını buradan fatura tutarına göre
              güncelleyin. Bu bölüm operasyonel hesaplardan ayrı takip içindir.
            </p>
          </div>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-slate-500">
            Otomatik kira kayıtları desteklenir
          </span>
        </div>

        {avmExpenses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            Bu ay için AVM gider kaydı bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {avmExpenses.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/70 bg-white p-4 space-y-3 hover:border-slate-300/70 transition-all duration-200"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {item.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {item.location?.name || 'Genel'} · ₺
                    {item.amountWithVat?.toLocaleString('tr-TR')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleAvm(item.id, 'isSettled', Boolean(item.isSettled))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {Boolean(item.isSettled) ? (
                      <CheckSquare size={14} className="text-emerald-600" />
                    ) : (
                      <Square size={14} />
                    )}
                    Ödeme Yapıldı
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleAvm(item.id, 'isOfficial', item.isOfficial)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {item.isOfficial ? (
                      <CheckSquare size={14} className="text-blue-600" />
                    ) : (
                      <Square size={14} />
                    )}
                    Fatura Geldi
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Upload size={14} />
                    {uploadingAvmId === item.id ? 'Yükleniyor...' : 'Fatura Yükle'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) =>
                        handleUploadAvmInvoice(item.id, e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={getAvmDraft(item).amountWithVat}
                    onChange={(e) =>
                      setAvmDrafts((prev) => ({
                        ...prev,
                        [item.id]: {
                          ...getAvmDraft(item),
                          amountWithVat: Number(e.target.value || 0),
                        },
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
                    placeholder="Fatura Tutarı (KDV Dahil)"
                  />
                  <input
                    type="text"
                    value={getAvmDraft(item).paidBy}
                    onChange={(e) =>
                      setAvmDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...getAvmDraft(item), paidBy: e.target.value },
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
                    placeholder="Ödeyen Hesap"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveAvmFinancials(item)}
                    disabled={savingAvmId === item.id}
                    className="rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
                  >
                    {savingAvmId === item.id
                      ? 'Kaydediliyor...'
                      : 'Tutar/Ödeyen Güncelle'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Document Grid */}
      <section>
        <AnimatePresence mode="popLayout">
          {filteredInvoices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center text-slate-300">
                <FileText size={32} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight text-slate-900">
                  Henüz Belge Bulunmuyor
                </h3>
                <p className="text-sm text-slate-500">
                  Aramaya uygun bir evrak bulunamadı veya henüz yükleme yapılmadı.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredInvoices.map((inv, idx) => {
                const attachmentUrl = inv.attachmentUrl ?? undefined;
                const isPdf = attachmentUrl?.toLowerCase().includes('.pdf') ?? false;

                return (
                  <motion.div
                    layout
                    key={inv.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03, ease: 'easeOut' }}
                    className={cn(
                      'group bg-white rounded-2xl border border-slate-200/70 overflow-hidden flex flex-col h-full hover:shadow-md hover:border-slate-300/70 transition-all duration-200',
                      cardShadow
                    )}
                  >
                    {/* Preview */}
                    <div className="h-44 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                      {isPdf ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center text-blue-600">
                            <FileText size={26} strokeWidth={1.5} />
                          </div>
                          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                            PDF Arşivi
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full relative">
                          {attachmentUrl ? (
                            <Image
                              src={attachmentUrl}
                              alt="Belge"
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 33vw, 25vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-slate-400">
                              Önizleme bulunamadı
                            </div>
                          )}
                        </div>
                      )}

                      {/* Floating Actions */}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Link
                          href={attachmentUrl || '#'}
                          target="_blank"
                          className={cn(
                            'w-9 h-9 bg-white rounded-lg text-slate-600 shadow-sm border border-slate-200/70 flex items-center justify-center transition-colors',
                            attachmentUrl
                              ? 'hover:bg-slate-50 hover:text-blue-600'
                              : 'pointer-events-none opacity-40'
                          )}
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={attachmentUrl || '#'}
                          download
                          target="_blank"
                          className={cn(
                            'w-9 h-9 bg-white rounded-lg text-slate-600 shadow-sm border border-slate-200/70 flex items-center justify-center transition-colors',
                            attachmentUrl
                              ? 'hover:bg-slate-50 hover:text-blue-600'
                              : 'pointer-events-none opacity-40'
                          )}
                        >
                          <Download size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          className="w-9 h-9 bg-white rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed shadow-sm border border-slate-200/70 flex items-center justify-center transition-colors"
                        >
                          {deletingId === inv.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider border',
                            inv.isOfficial
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          )}
                        >
                          {inv.isOfficial ? 'Resmi Fatura' : 'Dekont / Fiş'}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 flex flex-col flex-1 space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <h4 className="font-semibold text-slate-900 text-sm tracking-tight line-clamp-2 leading-snug">
                          {inv.description}
                        </h4>
                        <span className="font-semibold text-rose-600 text-sm tabular-nums shrink-0">
                          ₺{inv.amountWithVat?.toLocaleString('tr-TR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto">
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                            Lokasyon
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 truncate">
                            <MapPin size={12} className="text-slate-400" />
                            {inv.location?.name || 'Genel Merkez'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                            Tarih
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 tabular-nums">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(inv.createdAt).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                            Kayıt Kaynağı
                          </p>
                          <span className="text-xs font-medium text-slate-700">
                            {inv.paidBy}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {deletingId === inv.id ? 'Siliniyor...' : 'Belgeyi Sil'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Modal */}
      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Belge & Gider Kaydı"
        maxWidth="max-w-xl"
      >
        <ExpenseForm
          locations={locations}
          onClose={() => {
            setIsModalOpen(false);
            router.refresh();
          }}
        />
      </PremiumModal>
    </div>
  );
}
