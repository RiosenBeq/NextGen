'use client';
import { useRouter } from 'next/navigation';

import React, { useRef, useState } from 'react';
import {
  Plus,
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
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="apple-eyebrow">Gider Yönetimi</p>
          <h1 className="apple-headline mt-3">Gider <span className="hero-serif text-gradient-sunset">kayıtları</span></h1>
          <p className="mt-4 apple-body max-w-2xl">
            Gider kayıtları, belge durumu ve ödeme detaylarını tek panelden yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <MetricCard label="Bu Ay" value={formatCurrency(thisMonthTotal)} />
          <MetricCard label="Toplam" value={formatCurrency(total)} highlight />
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowForm(true);
            }}
            className="elite-button-primary"
          >
            <Plus size={16} strokeWidth={2} /> Yeni Gider
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
          <div className="space-y-6 py-4">
            <div className="rounded-[18px] bg-[--bg-elevated] p-5">
              <p className="text-[12px] text-[--text-tertiary]">Tutar</p>
              <p className="mt-1 text-[28px] md:text-[32px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.025em' }}>
                {formatCurrency(selectedExpense.amountWithVat)}
              </p>
            </div>

            <div className="space-y-4">
              <DetailRow label="Açıklama" value={selectedExpense.description} />
              <DetailRow label="Tip" value={selectedExpense.type === 'RECURRING' ? 'Aylık' : 'Tek Sefer'} />
              <DetailRow label="Durum" value={selectedExpense.isOfficial ? 'Resmi Evrak' : 'Belgesiz'} />
              <DetailRow label="Şube" value={selectedExpense.location?.name || 'Genel'} />
              <DetailRow label="Tarih" value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')} />
            </div>

            <div className="pt-5 border-t border-[--border] space-y-3">
              <p className="text-[13px] text-[--text-secondary] inline-flex items-center gap-2">
                <FileText size={14} strokeWidth={1.75} className="text-[--text-tertiary]" /> Belge Durumu
              </p>

              {selectedExpense.attachmentUrl ? (
                <a
                  href={selectedExpense.attachmentUrl}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-between rounded-xl bg-[--bg-elevated] hover:bg-[#ECECEE] px-4 py-3 transition-colors duration-200"
                >
                  <div className="inline-flex items-center gap-2 text-[14px] font-medium text-[--text]">
                    <CheckCircle2 size={16} strokeWidth={1.75} className="text-[--accent]" /> Belge mevcut
                  </div>
                  <ChevronRight size={16} strokeWidth={1.75} className="text-[--text-tertiary]" />
                </a>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-[14px] text-[--danger] bg-[--danger-soft] rounded-xl px-4 py-3 w-full">
                    <AlertCircle size={16} strokeWidth={1.75} /> Belge bulunmuyor
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
                    className="w-full rounded-full border border-[--border-strong] px-4 py-3 text-[14px] font-medium text-[--text] hover:bg-[--bg-elevated] transition-colors duration-200 inline-flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" strokeWidth={2} /> Yükleniyor…
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} strokeWidth={1.75} /> Belge Ekle
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
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`min-w-[160px] rounded-[18px] border border-[--border] p-4 ${highlight ? 'bg-[--bg-elevated]' : 'bg-[--surface]'}`}>
      <p className="text-[12px] text-[--text-tertiary]">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.018em' }}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[12px] text-[--text-tertiary]">{label}</p>
      <p className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{value}</p>
    </div>
  );
}
