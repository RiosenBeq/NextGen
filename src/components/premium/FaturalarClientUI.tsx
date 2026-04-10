'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
  Receipt,
  FileText,
  Download,
  Calendar,
  MapPin,
  Search,
  Eye,
  Plus,
  ArrowRight,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import { deleteExpenseAttachment, updateAvmExpenseFinancials, updateAvmExpenseStatus, uploadExpenseAttachment, updateExpenseAttachment } from '@/features/ledger/actions';

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

export default function FaturalarClientUI({ invoices: initialInvoices, avmExpenses: initialAvmExpenses, locations }: FaturalarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [avmExpenses, setAvmExpenses] = useState(initialAvmExpenses);
  const [uploadingAvmId, setUploadingAvmId] = useState<string | null>(null);
  const [savingAvmId, setSavingAvmId] = useState<string | null>(null);
  const [avmDrafts, setAvmDrafts] = useState<Record<string, { amountWithVat: number; paidBy: string }>>({});

  const filteredInvoices = invoices.filter(inv =>
    inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.location?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.paidBy.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleToggleAvm = async (id: string, field: 'isSettled' | 'isOfficial', current: boolean) => {
    const res = await updateAvmExpenseStatus(id, { [field]: !current });
    if (!res.success) {
      toast.error(res.error || 'Durum güncellenemedi.');
      return;
    }

    setAvmExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: !current } : item)));
  };

  const handleUploadAvmInvoice = async (expenseId: string, file: File | null) => {
    if (!file) return;

    setUploadingAvmId(expenseId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const upload = await uploadExpenseAttachment(fd);
      if (!upload.success || !upload.publicUrl) throw new Error(upload.error || 'Dosya yüklenemedi.');

      const update = await updateExpenseAttachment(expenseId, upload.publicUrl);
      if (!update.success) throw new Error(update.error || 'Belge kaydı güncellenemedi.');

      await updateAvmExpenseStatus(expenseId, { isOfficial: true });
      setAvmExpenses((prev) => prev.map((item) => (item.id === expenseId ? { ...item, attachmentUrl: upload.publicUrl, isOfficial: true } : item)));
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
    return avmDrafts[item.id] || {
      amountWithVat: Number(item.amountWithVat || 0),
      paidBy: item.paidBy || 'Ortak Hesap',
    };
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
          ? { ...row, amountWithVat: Number(draft.amountWithVat || 0), paidBy: draft.paidBy || 'Ortak Hesap' }
          : row
      )
    );
    setSavingAvmId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Receipt size={20} />
           </div>
           <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Faturalar & Belgeler</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Kurumsal Belge Arşivi</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             <input
               type="text"
               placeholder="Ara..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full sm:w-56 pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-400"
             />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50 active:scale-[0.97]"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Yeni Belge</span>
          </button>
        </div>
      </header>


      {/* AVM FATURA / ÖDEME TAKİBİ (HESAPLAMADAN AYRI) */}
      <section className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">AVM Fatura & Ödeme Takibi</h2>
            <p className="text-xs text-slate-500">Kira / aidat / ciro payı kayıtlarını buradan fatura tutarına göre güncelleyin. Bu bölüm operasyonel hesaplardan ayrı takip içindir.</p>
          </div>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Otomatik kira kayıtları desteklenir</span>
        </div>

        {avmExpenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Bu ay için AVM gider kaydı bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {avmExpenses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2">{item.description}</p>
                    <p className="text-xs text-slate-500">{item.location?.name || 'Genel'} • ₺{item.amountWithVat?.toLocaleString('tr-TR')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => handleToggleAvm(item.id, 'isSettled', Boolean(item.isSettled))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                    {Boolean(item.isSettled) ? <CheckSquare size={14} className="text-emerald-600" /> : <Square size={14} />}
                    Ödeme Yapıldı
                  </button>
                  <button type="button" onClick={() => handleToggleAvm(item.id, 'isOfficial', item.isOfficial)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                    {item.isOfficial ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
                    Fatura Geldi
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                    <Upload size={14} />
                    {uploadingAvmId === item.id ? 'Yükleniyor...' : 'Fatura Yükle'}
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => handleUploadAvmInvoice(item.id, e.target.files?.[0] || null)} />
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
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
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
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    placeholder="Ödeyen Hesap"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveAvmFinancials(item)}
                    disabled={savingAvmId === item.id}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-60"
                  >
                    {savingAvmId === item.id ? 'Kaydediliyor...' : 'Tutar/Ödeyen Güncelle'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. DOCUMENT GRID */}
      <section>
         <AnimatePresence mode="popLayout">
           {filteredInvoices.length === 0 ? (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[48px] bg-slate-50/30 flex flex-col items-center gap-6"
             >
                <div className="w-20 h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200 shadow-sm">
                   <FileText size={40} strokeWidth={1} />
                </div>
                <div className="space-y-1">
                   <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Henüz Belge Bulunmuyor</h3>
                   <p className="text-sm text-slate-400 font-bold italic">Aramaya uygun bir evrak bulunamadı veya henüz yükleme yapılmadı.</p>
                </div>
             </motion.div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {filteredInvoices.map((inv, idx) => {
                  const attachmentUrl = inv.attachmentUrl ?? undefined;
                  const isPdf = attachmentUrl?.toLowerCase().includes('.pdf') ?? false;

                  return (
                  <motion.div
                    layout
                    key={inv.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-500 overflow-hidden flex flex-col h-full active:scale-[0.98]"
                  >
                     {/* Preview Area */}
                     <div className="h-56 bg-slate-50 border-b border-slate-50 flex items-center justify-center relative group-hover:bg-blue-50/30 transition-colors overflow-hidden">
                        {isPdf ? (
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-20 h-20 rounded-3xl bg-white border border-blue-100 flex items-center justify-center text-blue-500 shadow-sm group-hover:rotate-6 transition-transform duration-500">
                                <FileText size={40} strokeWidth={1.5} />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">PDF ARŞİVİ</span>
                          </div>
                        ) : (
                          <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-700">
                             {attachmentUrl ? (
                               <Image
                                 src={attachmentUrl}
                                 alt="Belge"
                                 fill
                                 sizes="(max-width: 768px) 100vw, (max-width: 1536px) 33vw, 25vw"
                                 className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"
                               />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-slate-400">
                                 Önizleme bulunamadı
                               </div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                       )}

                       {/* Floating Actions */}
                       <div className="absolute top-4 right-4 flex gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                          <Link href={attachmentUrl || '#'} target="_blank" className={cn("w-10 h-10 bg-white/90 backdrop-blur rounded-xl text-slate-600 shadow-lg flex items-center justify-center transition-all", attachmentUrl ? "hover:text-blue-600 hover:scale-110" : "pointer-events-none opacity-40")}>
                             <Eye size={18} />
                          </Link>
                          <Link href={attachmentUrl || '#'} download target="_blank" className={cn("w-10 h-10 bg-white/90 backdrop-blur rounded-xl text-slate-600 shadow-lg flex items-center justify-center transition-all", attachmentUrl ? "hover:text-blue-600 hover:scale-110" : "pointer-events-none opacity-40")}>
                             <Download size={18} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            disabled={deletingId === inv.id}
                            className="w-10 h-10 bg-white/90 backdrop-blur rounded-xl text-slate-600 hover:text-rose-600 disabled:text-slate-300 disabled:cursor-not-allowed shadow-lg flex items-center justify-center transition-all hover:scale-110"
                          >
                            {deletingId === inv.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={18} />}
                          </button>
                       </div>

                       <div className="absolute top-4 left-4">
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl backdrop-blur-md shadow-sm text-[9px] font-black uppercase tracking-widest border transition-colors",
                            inv.isOfficial
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          )}>
                             {inv.isOfficial ? "RESMİ FATURA" : "DEKONT / FİŞ"}
                          </span>
                       </div>
                     </div>

                     {/* Info Area */}
                     <div className="p-8 flex flex-col flex-1 space-y-6">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-black text-slate-900 text-lg tracking-tighter uppercase italic line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{inv.description}</h4>
                          <span className="font-black text-rose-600 text-lg italic tracking-tighter shrink-0">₺{inv.amountWithVat?.toLocaleString('tr-TR')}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-auto">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LOKASYON</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-700 font-bold italic truncate">
                                 <MapPin size={12} className="text-blue-500" />
                                 {inv.location?.name || 'GENEL MERKEZ'}
                              </div>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TARİH</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-700 font-bold italic">
                                 <Calendar size={12} className="text-blue-500" />
                                 {new Date(inv.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                           </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">KAYIT KAYNAĞI</span>
                              <span className="text-[10px] uppercase font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{inv.paidBy}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDelete(inv.id)}
                                disabled={deletingId === inv.id}
                                className="px-3 py-2 rounded-xl border border-rose-100 bg-rose-50/60 text-rose-600 hover:bg-rose-100 transition-colors text-[10px] font-black uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {deletingId === inv.id ? 'SİLİNİYOR...' : 'BELGEYİ SİL'}
                              </button>
                              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                <ArrowRight size={16} />
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )})}
             </div>
           )}
         </AnimatePresence>
      </section>

      {/* 3. MODALS */}
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
