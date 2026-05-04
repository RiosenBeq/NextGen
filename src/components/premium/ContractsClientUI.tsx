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

type LocationOption = {
  id: string;
  name: string;
};

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const MAX_SIZE_MB = 15;

const cardShadow =
  'shadow-[0_1px_3px_rgba(15,23,42,0.04),_0_1px_2px_rgba(15,23,42,0.06)]';

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150';

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
      setError(
        'Desteklenmeyen dosya türü. Yalnızca PDF, JPG, PNG ve WebP kabul edilmektedir.'
      );
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      setError(
        `Dosya boyutu çok büyük (${sizeMB.toFixed(1)}MB). Maksimum ${MAX_SIZE_MB}MB yüklenebilir.`
      );
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
    <div className="space-y-8 pb-20">
      {/* Upload Section */}
      <section
        className={cn(
          'rounded-2xl border border-slate-200/70 bg-white p-6 space-y-5',
          cardShadow
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Sözleşme Yükle
            </h2>
            <p className="text-sm text-slate-500">
              PDF, JPG, PNG veya WebP formatında, maksimum {MAX_SIZE_MB}MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={`${inputBase} pl-10 pr-10 py-2.5 appearance-none cursor-pointer`}
            >
              <option value="global">Genel Sözleşme</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-all duration-200">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? 'Yükleniyor...' : 'Dosya Seç'}
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
            'rounded-2xl border border-dashed p-8 text-center transition-all duration-200 cursor-pointer',
            isDragging
              ? 'border-blue-400 bg-blue-50/50'
              : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50/70'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload
            className={cn(
              'w-8 h-8 mx-auto mb-2 transition-colors',
              isDragging ? 'text-blue-500' : 'text-slate-300'
            )}
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-slate-600">
            {isDragging
              ? 'Dosyayı buraya bırakın...'
              : 'Sözleşmeyi buraya sürükleyin veya tıklayın'}
          </p>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mt-2">
            PDF, JPG, PNG, WebP
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <p className="text-sm text-rose-600 font-medium">{error}</p>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Contracts List */}
      <section
        className={cn(
          'rounded-2xl border border-slate-200/70 bg-white p-6',
          cardShadow
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            Yüklü Sözleşmeler{' '}
            <span className="text-slate-400 font-medium tabular-nums">
              ({filteredContracts.length})
            </span>
          </h3>
          <div className="relative">
            <select
              value={filterLoc}
              onChange={(e) => setFilterLoc(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 appearance-none cursor-pointer"
            >
              <option value="all">Tüm Lokasyonlar</option>
              <option value="global">Genel</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-10 text-center">
            <FileText
              className="w-10 h-10 text-slate-300 mx-auto mb-3"
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium text-slate-500">
              Henüz sözleşme yüklenmedi.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Yukarıdaki formu kullanarak sözleşme yükleyebilirsiniz.
            </p>
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
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  layout
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 p-3.5 hover:bg-slate-50/50 hover:border-slate-300/70 transition-all duration-200"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {doc.relatedId === 'global'
                          ? 'Genel'
                          : locationNameMap.get(doc.relatedId) || 'Lokasyon'}{' '}
                        • {formatDocumentDate(doc)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {doc.fileUrl && (
                      <Link
                        href={doc.fileUrl}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors duration-200 inline-flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        Görüntüle
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors duration-200 disabled:opacity-60"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
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
