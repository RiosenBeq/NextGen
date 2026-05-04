'use client';
import { useRouter } from 'next/navigation';

import React, { useRef, useState } from 'react';
import {
  Plus,
  Wallet,
  FileText,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import PremiumExpenseTable from '@/components/premium/PremiumExpenseTable';
import {
  uploadExpenseAttachment,
  updateExpenseAttachment,
} from '@/features/ledger/actions';
import { toast } from '@/hooks/useToast';

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

const cardShadow =
  'shadow-[0_1px_3px_rgba(15,23,42,0.04),_0_1px_2px_rgba(15,23,42,0.06)]';

export default function ExpensesClientUI({
  expenses,
  locations,
  documents,
  total,
  thisMonthTotal,
}: ExpensesClientProps) {
  const router = useRouter();
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
      if (!upload.success || !upload.publicUrl)
        throw new Error(upload.error || 'Yükleme başarısız');

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
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Gider Yönetim Merkezi
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 inline-flex items-center gap-3">
            <Wallet className="w-7 h-7 text-slate-400" strokeWidth={1.75} />
            Gider Yönetimi
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Gider kayıtları, belge durumu ve ödeme detaylarını tek panelden yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <MetricCard label="Bu Ay" value={formatCurrency(thisMonthTotal)} subtle />
          <MetricCard label="Toplam" value={formatCurrency(total)} />
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
          >
            <Plus size={16} /> Yeni Gider
          </button>
        </div>
      </header>

      <PremiumExpenseTable
        expenses={expenses}
        locations={locations}
        documents={documents}
        onView={(exp: ExpenseItem) => {
          setSelectedExpense(exp);
          setIsDrawerOpen(true);
        }}
        onEdit={(exp: ExpenseItem) => {
          setEditingExpense(exp);
          setShowForm(true);
        }}
      />

      <PremiumModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Gider Kaydı Güncelle' : 'Gider Kaydı Ekle'}
        maxWidth="max-w-2xl"
      >
        <ExpenseForm
          locations={locations}
          initialData={editingExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
            router.refresh();
          }}
        />
      </PremiumModal>

      <PremiumDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Gider Detayı"
      >
        {selectedExpense && (
          <div className="space-y-6 py-2">
            <div
              className={`rounded-2xl border border-slate-200/70 bg-slate-50/50 p-5 ${cardShadow}`}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                Tutar
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {formatCurrency(selectedExpense.amountWithVat)}
              </p>
            </div>

            <div className="space-y-4">
              <DetailRow label="Açıklama" value={selectedExpense.description} />
              <DetailRow
                label="Tip"
                value={selectedExpense.type === 'RECURRING' ? 'Aylık' : 'Tek Sefer'}
              />
              <DetailRow
                label="Durum"
                value={selectedExpense.isOfficial ? 'Resmi Evrak' : 'Belgesiz'}
              />
              <DetailRow
                label="Şube"
                value={selectedExpense.location?.name || 'Genel'}
              />
              <DetailRow
                label="Tarih"
                value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400 inline-flex items-center gap-2">
                <FileText size={14} /> Belge Durumu
              </p>

              {selectedExpense.attachmentUrl ? (
                <a
                  href={selectedExpense.attachmentUrl}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100/60 transition-colors duration-200"
                >
                  <div className="inline-flex items-center gap-2 text-emerald-700 text-sm font-medium">
                    <CheckCircle2 size={16} /> Belge mevcut
                  </div>
                  <ChevronRight size={16} className="text-emerald-500" />
                </a>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 w-full">
                    <AlertCircle size={16} /> Belge bulunmuyor
                  </div>
                  <input
                    type="file"
                    ref={fileRef}
                    onChange={handleLateUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all duration-200 inline-flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Yükleniyor...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} /> Belge Ekle
                      </>
                    )}
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

function MetricCard({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  const cardShadow =
    'shadow-[0_1px_3px_rgba(15,23,42,0.04),_0_1px_2px_rgba(15,23,42,0.06)]';
  return (
    <div
      className={`min-w-[160px] rounded-2xl border p-4 ${cardShadow} ${
        subtle
          ? 'bg-white border-slate-200/70'
          : 'bg-slate-900 border-slate-900'
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-widest ${
          subtle ? 'text-slate-400' : 'text-slate-400'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold tracking-tight tabular-nums ${
          subtle ? 'text-slate-900' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
