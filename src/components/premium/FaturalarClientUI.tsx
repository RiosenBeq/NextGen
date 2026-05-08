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
    <div className="space-y-8 sm:space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Belge Arşivi</p>
          <h1 className="apple-headline mt-3">Faturalar &amp; <span className="hero-serif text-gradient-emerald">belgeler</span></h1>
          <p className="mt-4 apple-body max-w-2xl">
            E-faturalar, dekontlar ve gider evrakları tek panelde.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary]" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Belge veya şube ara…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors min-h-[44px]"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="elite-button-primary">
            <Plus size={16} strokeWidth={2} />
            Yeni Belge
          </button>
        </div>
      </header>

      {/* AVM Section */}
      <section className="apple-card p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="apple-eyebrow">AVM Takibi</p>
            <h2 className="apple-title-1 mt-2">Fatura & Ödeme</h2>
            <p className="mt-2 text-[15px] text-[--text-secondary] max-w-2xl" style={{ letterSpacing: '-0.005em' }}>
              Kira / aidat / ciro payı kayıtlarını fatura tutarına göre güncelleyin.
            </p>
          </div>
          <span className="chip">Otomatik kira destekli</span>
        </div>

        {avmExpenses.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[--border-strong] p-8 text-center text-[14px] text-[--text-tertiary]">
            Bu ay için AVM gider kaydı bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {avmExpenses.map((item) => (
              <div key={item.id} className="rounded-[18px] border border-[--border] bg-[--surface] p-5 space-y-4 transition-colors hover:border-[--border-strong]">
                <div>
                  <p className="text-[15px] font-medium text-[--text] line-clamp-2" style={{ letterSpacing: '-0.005em' }}>
                    {item.description}
                  </p>
                  <p className="text-[12px] text-[--text-tertiary] mt-1 tabular-nums">
                    {item.location?.name || 'Genel'} · ₺{item.amountWithVat?.toLocaleString('tr-TR')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAvm(item.id, 'isSettled', Boolean(item.isSettled))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[--bg-elevated] px-3 py-1.5 text-[12px] font-medium text-[--text-secondary] hover:text-[--text] transition-colors min-h-[32px]"
                  >
                    {Boolean(item.isSettled) ? <CheckSquare size={14} strokeWidth={1.75} className="text-[--accent]" /> : <Square size={14} strokeWidth={1.75} />}
                    Ödeme
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAvm(item.id, 'isOfficial', item.isOfficial)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[--bg-elevated] px-3 py-1.5 text-[12px] font-medium text-[--text-secondary] hover:text-[--text] transition-colors min-h-[32px]"
                  >
                    {item.isOfficial ? <CheckSquare size={14} strokeWidth={1.75} className="text-[--accent]" /> : <Square size={14} strokeWidth={1.75} />}
                    Fatura
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[--bg-elevated] px-3 py-1.5 text-[12px] font-medium text-[--text-secondary] hover:text-[--text] transition-colors min-h-[32px]">
                    <Upload size={14} strokeWidth={1.75} />
                    {uploadingAvmId === item.id ? 'Yükleniyor…' : 'Yükle'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleUploadAvmInvoice(item.id, e.target.files?.[0] || null)}
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
                        [item.id]: { ...getAvmDraft(item), amountWithVat: Number(e.target.value || 0) },
                      }))
                    }
                    className="rounded-xl bg-[--bg-elevated] border border-transparent px-3 py-2 text-[14px] text-[--text] tabular-nums focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors min-h-[40px]"
                    placeholder="Tutar (KDV dahil)"
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
                    className="rounded-xl bg-[--bg-elevated] border border-transparent px-3 py-2 text-[14px] text-[--text] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors min-h-[40px]"
                    placeholder="Ödeyen"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveAvmFinancials(item)}
                    disabled={savingAvmId === item.id}
                    className="rounded-full bg-[--text] hover:bg-black text-white px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-60 min-h-[40px]"
                  >
                    {savingAvmId === item.id ? 'Kaydediliyor…' : 'Güncelle'}
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
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="empty-state apple-card"
            >
              <FileText className="empty-state-icon" />
              <p className="empty-state-title">Henüz Belge Bulunmuyor</p>
              <p className="empty-state-desc">Aramaya uygun bir evrak bulunamadı veya henüz yükleme yapılmadı.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredInvoices.map((inv, idx) => {
                const attachmentUrl = inv.attachmentUrl ?? undefined;
                const isPdf = attachmentUrl?.toLowerCase().includes('.pdf') ?? false;

                return (
                  <motion.div
                    layout
                    key={inv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    className="group apple-card overflow-hidden flex flex-col h-full"
                  >
                    {/* Preview */}
                    <div className="h-44 bg-[--bg-elevated] border-b border-[--border] flex items-center justify-center relative overflow-hidden">
                      {isPdf ? (
                        <div className="flex flex-col items-center gap-2.5">
                          <div className="w-12 h-12 rounded-full bg-[--surface] flex items-center justify-center text-[--text-secondary]">
                            <FileText size={22} strokeWidth={1.5} />
                          </div>
                          <span className="text-[11px] font-medium text-[--text-tertiary]">PDF</span>
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
                            <div className="w-full h-full flex items-center justify-center text-[12px] text-[--text-tertiary]">
                              Önizleme yok
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
                            'w-9 h-9 bg-white rounded-full text-[--text-secondary] border border-[--border] flex items-center justify-center transition-colors',
                            attachmentUrl ? 'hover:text-[--text]' : 'pointer-events-none opacity-40'
                          )}
                          aria-label="Görüntüle"
                        >
                          <Eye size={16} strokeWidth={1.75} />
                        </Link>
                        <Link
                          href={attachmentUrl || '#'}
                          download
                          target="_blank"
                          className={cn(
                            'w-9 h-9 bg-white rounded-full text-[--text-secondary] border border-[--border] flex items-center justify-center transition-colors',
                            attachmentUrl ? 'hover:text-[--text]' : 'pointer-events-none opacity-40'
                          )}
                          aria-label="İndir"
                        >
                          <Download size={16} strokeWidth={1.75} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          className="w-9 h-9 bg-white rounded-full text-[--text-secondary] hover:text-[--danger] disabled:opacity-40 border border-[--border] flex items-center justify-center transition-colors"
                          aria-label="Sil"
                        >
                          {deletingId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} strokeWidth={1.75} />}
                        </button>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-medium',
                            inv.isOfficial ? 'bg-[--accent-soft] text-[--accent]' : 'bg-white/90 text-[--text-secondary] border border-[--border]'
                          )}
                        >
                          {inv.isOfficial ? 'Resmi' : 'Dekont'}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 flex flex-col flex-1 space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <h4 className="text-[15px] font-medium text-[--text] line-clamp-2 leading-snug" style={{ letterSpacing: '-0.005em' }}>
                          {inv.description}
                        </h4>
                        <span className="text-[15px] font-medium tabular-nums text-[--text] shrink-0">
                          ₺{inv.amountWithVat?.toLocaleString('tr-TR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto">
                        <div>
                          <p className="text-[12px] text-[--text-tertiary]">Lokasyon</p>
                          <div className="flex items-center gap-1.5 text-[13px] text-[--text] truncate mt-0.5">
                            <MapPin size={12} strokeWidth={1.75} className="text-[--text-tertiary]" />
                            {inv.location?.name || 'Genel Merkez'}
                          </div>
                        </div>
                        <div>
                          <p className="text-[12px] text-[--text-tertiary]">Tarih</p>
                          <div className="flex items-center gap-1.5 text-[13px] text-[--text] tabular-nums mt-0.5">
                            <Calendar size={12} strokeWidth={1.75} className="text-[--text-tertiary]" />
                            {new Date(inv.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[--border] flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[12px] text-[--text-tertiary]">Kaynak</p>
                          <span className="text-[13px] text-[--text]">{inv.paidBy}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          className="px-3 py-1.5 rounded-full bg-[--bg-elevated] text-[--text-secondary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors text-[12px] font-medium disabled:opacity-60"
                        >
                          {deletingId === inv.id ? 'Siliniyor…' : 'Sil'}
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
