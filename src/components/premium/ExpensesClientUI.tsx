'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Plus, Wallet, Activity, FileText, AlertCircle, CheckCircle2, UploadCloud, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import PremiumExpenseTable from '@/components/premium/PremiumExpenseTable';
import { uploadExpenseAttachment, updateExpenseAttachment } from '@/features/ledger/actions';

interface ExpensesClientProps {
  expenses: ExpenseItem[];
  locations: LocationItem[];
  documents: DocumentItem[];
  total: number;
  thisMonthTotal: number;
}

interface ExpenseItem {
  id: string;
  description: string;
  amountWithVat: number;
  type: 'RECURRING' | 'ONE_TIME';
  isOfficial: boolean;
  createdAt: string;
  paidBy?: string;
  attachmentUrl?: string | null;
  location?: { name?: string | null } | null;
}

interface LocationItem {
  id: string;
  name: string;
}

interface DocumentItem {
  id: string;
}

export default function ExpensesClientUI({ expenses, locations, documents, total, thisMonthTotal }: ExpensesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const handleLateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExpense) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const upload = await uploadExpenseAttachment(formData);
      if (!upload.success || !upload.publicUrl) throw new Error(upload.error || 'Yükleme başarısız');

      const update = await updateExpenseAttachment(selectedExpense.id, upload.publicUrl);
      if (!update.success) throw new Error(update.error);

      toast.success('Belge başarıyla eklendi.');
      setIsDrawerOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
      toast.error(`Hata: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/50 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-blue-700 shadow-sm">
              <Activity className="w-3.5 h-3.5" />
              Gider Yönetim Merkezi
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <Wallet className="w-8 h-8 text-slate-400 shrink-0" />
              Gider Yönetimi
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2.5 max-w-2xl">Gider kayıtları, belge durumu ve ödeme detaylarını tek panelden yönetin.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Bu Ay" value={formatCurrency(thisMonthTotal)} subtle />
              <MetricCard label="Toplam" value={formatCurrency(total)} />
            </div>
            <button
              onClick={() => { setEditingExpense(null); setShowForm(true); }}
              className="min-h-[44px] w-full px-5 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-slate-800 inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={16} /> Yeni Gider
            </button>
          </div>
        </div>
      </section>

      <PremiumExpenseTable
        expenses={expenses}
        locations={locations}
        documents={documents}
        onView={(exp: ExpenseItem) => { setSelectedExpense(exp); setIsDrawerOpen(true); }}
        onEdit={(exp: ExpenseItem) => { setEditingExpense(exp); setShowForm(true); }}
      />

      <PremiumModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingExpense(null); }}
        title={editingExpense ? 'Gider Kaydı Güncelle' : 'Gider Kaydı Ekle'}
        maxWidth="max-w-2xl"
      >
        <ExpenseForm
          locations={locations}
          initialData={editingExpense}
          onClose={() => { setShowForm(false); setEditingExpense(null); router.refresh(); }}
        />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Gider Detayı">
        {selectedExpense && (
          <div className="space-y-5 py-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Tutar</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(selectedExpense.amountWithVat)}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-100 overflow-hidden">
              <DetailRow label="Açıklama" value={selectedExpense.description} />
              <DetailRow label="Tip" value={selectedExpense.type === 'RECURRING' ? 'Aylık' : 'Tek Sefer'} />
              <DetailRow label="Durum" value={selectedExpense.isOfficial ? 'Resmi Evrak' : 'Belgesiz'} />
              <DetailRow label="Şube" value={selectedExpense.location?.name || 'Genel'} />
              <DetailRow label="Tarih" value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')} />
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 inline-flex items-center gap-2">
                <FileText size={14} /> Belge Durumu
              </p>

              {selectedExpense.attachmentUrl ? (
                <a href={selectedExpense.attachmentUrl} target="_blank" rel="noopener" className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 min-h-[44px]">
                  <div className="inline-flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                    <CheckCircle2 size={16} /> Belge mevcut
                  </div>
                  <ChevronRight size={16} className="text-emerald-500" />
                </a>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 w-full">
                    <AlertCircle size={16} className="shrink-0" /> Belge bulunmuyor
                  </div>
                  <input type="file" ref={fileRef} onChange={handleLateUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                  <button onClick={() => fileRef.current?.click()} disabled={isUploading} className="w-full rounded-2xl border-2 border-dashed border-slate-300 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 inline-flex items-center justify-center gap-2 min-h-[44px] transition-colors disabled:opacity-50">
                    {isUploading ? <><Loader2 size={16} className="animate-spin" /> Yükleniyor...</> : <><UploadCloud size={16} /> Belge Ekle</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function MetricCard({ label, value, subtle = false }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl border p-4 min-h-[64px] flex flex-col justify-center',
      subtle ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    )}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wide', subtle ? 'text-slate-400' : 'text-slate-400')}>{label}</p>
      <p className={cn('mt-1 text-lg font-black tracking-tight tabular-nums', subtle ? 'text-slate-900' : 'text-white')}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 shrink-0 pt-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-900 text-right">{value}</p>
    </div>
  );
}
