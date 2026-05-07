'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteDocument, uploadDocument } from '@/features/belgeler/actions';
import { toast } from '@/hooks/useToast';

type ContractDoc = {
  id: string;
  fileName: string;
  fileUrl: string;
  relatedId: string;
  uploadedAt?: string;
  createdAt?: string;
};

type LocationOption = { id: string; name: string };

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 15;

const inputBase =
  'w-full rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200';

export default function ContractsClientUI({
  initialContracts,
  locations,
}: {
  initialContracts: ContractDoc[];
  locations: LocationOption[];
}) {
  const [contracts, setContracts] = useState(initialContracts);
  const [locationId, setLocationId] = useState('global');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [filterLoc, setFilterLoc] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locationNameMap = useMemo(
    () => new Map(locations.map((loc) => [loc.id, loc.name])),
    [locations]
  );

  const filteredContracts = useMemo(() => {
    if (filterLoc === 'all') return contracts;
    return contracts.filter((c) => c.relatedId === filterLoc);
  }, [contracts, filterLoc]);

  const processUpload = async (file: File) => {
    setError('');
    setSuccessMsg('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Desteklenmeyen dosya türü. Yalnızca PDF, JPG, PNG ve WebP kabul edilmektedir.');
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      setError(`Dosya boyutu çok büyük (${sizeMB.toFixed(1)}MB). Maksimum ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('relatedType', 'contract');
    formData.append('relatedId', locationId);

    const res = await uploadDocument(formData);

    if (!res.success) {
      setError(res.error || 'Sözleşme yüklenemedi.');
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newDoc: ContractDoc = {
      id: `doc_temp_${Date.now()}`,
      fileName: file.name,
      fileUrl: res.publicUrl || '',
      relatedId: locationId,
      createdAt: new Date().toISOString(),
    };
    setContracts((prev) => [newDoc, ...prev]);
    setSuccessMsg(`"${file.name}" başarıyla yüklendi.`);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    await processUpload(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processUpload(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu sözleşmeyi silmek istediğinize emin misiniz?')) return;
    setDeletingId(id);
    const res = await deleteDocument(id);
    if (!res.success) {
      toast.error(res.error || 'Silme işlemi başarısız.');
      setDeletingId(null);
      return;
    }
    setContracts((prev) => prev.filter((doc) => doc.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header>
        <p className="apple-eyebrow">Belge Arşivi</p>
        <h1 className="apple-headline mt-3">Sözleşmeler</h1>
        <p className="mt-4 apple-body max-w-2xl">
          Lokasyon bazlı kira ve operasyon sözleşmelerini güvenli şekilde yönetin.
        </p>
      </header>

      {/* Upload Section */}
      <section className="apple-card p-6 space-y-5">
        <div>
          <p className="apple-eyebrow">Yükle</p>
          <h2 className="apple-title-1 mt-2">Sözleşme Ekle</h2>
          <p className="mt-2 text-[14px] text-[--text-secondary]">
            PDF, JPG, PNG veya WebP. Maksimum {MAX_SIZE_MB}MB.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={`${inputBase} pl-10 pr-10 py-3 appearance-none cursor-pointer min-h-[44px]`}
            >
              <option value="global">Genel Sözleşme</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
          </div>

          <label className="elite-button-primary cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Upload className="w-4 h-4" strokeWidth={1.75} />}
            {uploading ? 'Yükleniyor…' : 'Dosya Seç'}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-[18px] border border-dashed p-8 text-center transition-colors duration-200 cursor-pointer',
            isDragging
              ? 'border-[--accent] bg-[--accent-soft]'
              : 'border-[--border-strong] bg-[--bg-subtle] hover:border-[--text-tertiary]'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload
            className={cn(
              'w-8 h-8 mx-auto mb-3 transition-colors',
              isDragging ? 'text-[--accent]' : 'text-[--text-tertiary]'
            )}
            strokeWidth={1.5}
          />
          <p className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>
            {isDragging ? 'Dosyayı buraya bırakın…' : 'Sürükleyin veya tıklayın'}
          </p>
          <p className="text-[12px] text-[--text-tertiary] mt-2">
            PDF · JPG · PNG · WebP
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-xl bg-[--danger-soft] px-4 py-3"
            >
              <AlertCircle size={16} strokeWidth={1.75} className="text-[--danger] shrink-0" />
              <p className="text-[14px] text-[--danger] font-medium">{error}</p>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-xl bg-[--accent-soft] px-4 py-3"
            >
              <CheckCircle2 size={16} strokeWidth={1.75} className="text-[--accent] shrink-0" />
              <p className="text-[14px] text-[--accent] font-medium">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Contracts List */}
      <section className="apple-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <p className="apple-eyebrow">Arşiv</p>
            <h3 className="apple-title-1 mt-2">
              Yüklü Sözleşmeler <span className="text-[--text-tertiary] font-normal tabular-nums">({filteredContracts.length})</span>
            </h3>
          </div>
          <div className="relative">
            <select
              value={filterLoc}
              onChange={(e) => setFilterLoc(e.target.value)}
              className="rounded-full bg-[--bg-elevated] border border-transparent px-4 py-2 pr-10 text-[13px] text-[--text] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors appearance-none cursor-pointer min-h-[36px]"
            >
              <option value="all">Tüm Lokasyonlar</option>
              <option value="global">Genel</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-state-icon" />
            <p className="empty-state-title">Henüz sözleşme yüklenmedi</p>
            <p className="empty-state-desc">Yukarıdaki formu kullanarak sözleşme yükleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredContracts.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  layout
                  className="flex items-center justify-between gap-3 rounded-xl p-3.5 hover:bg-[--bg-subtle] transition-colors duration-200"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[--bg-elevated] flex items-center justify-center shrink-0 text-[--text-secondary]">
                      <FileText className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[--text] truncate" style={{ letterSpacing: '-0.005em' }}>
                        {doc.fileName}
                      </p>
                      <p className="text-[12px] text-[--text-tertiary] tabular-nums">
                        {doc.relatedId === 'global' ? 'Genel' : locationNameMap.get(doc.relatedId) || 'Lokasyon'} · {formatDocumentDate(doc)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {doc.fileUrl && (
                      <Link
                        href={doc.fileUrl}
                        target="_blank"
                        className="rounded-full bg-[--bg-elevated] px-3 py-1.5 text-[12px] font-medium text-[--text-secondary] hover:text-[--text] transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
                      >
                        <ExternalLink size={12} strokeWidth={1.75} />
                        Aç
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] disabled:opacity-60 transition-colors"
                      aria-label="Sil"
                    >
                      {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" strokeWidth={1.75} />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

function formatDocumentDate(doc: { uploadedAt?: string; createdAt?: string }) {
  const dateValue = doc.uploadedAt ?? doc.createdAt;
  if (!dateValue) return 'Tarih yok';
  return new Date(dateValue).toLocaleDateString('tr-TR');
}
