'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, Trash2, Loader2 } from 'lucide-react';
import { deleteDocument, uploadDocument } from '@/features/belgeler/actions';

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

  const locationNameMap = useMemo(
    () => new Map(locations.map((loc) => [loc.id, loc.name])),
    [locations]
  );

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('relatedType', 'contract');
    formData.append('relatedId', locationId);

    const res = await uploadDocument(formData);
    if (!res.success) {
      setError(res.error || 'Sözleşme yüklenemedi.');
      setUploading(false);
      return;
    }

    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu sözleşmeyi silmek istediğinize emin misiniz?')) return;
    setDeletingId(id);
    const res = await deleteDocument(id);
    if (!res.success) {
      alert(res.error || 'Silme işlemi başarısız.');
      setDeletingId(null);
      return;
    }
    setContracts((prev) => prev.filter((doc) => doc.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Sözleşme Yükle</h2>
            <p className="text-xs text-slate-500">Lokasyon bazlı veya genel sözleşmeleri yükleyebilirsiniz.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="global">Genel Sözleşme</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Yükleniyor...' : 'Dosya Seç'}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Yüklü Sözleşmeler</h3>
        {contracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            Henüz sözleşme yüklenmedi.
          </div>
        ) : (
          <div className="space-y-2">
            {contracts.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                {(() => {
                  const uploadedDate = doc.uploadedAt || doc.createdAt;
                  return (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{doc.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {doc.relatedId === 'global' ? 'Genel' : locationNameMap.get(doc.relatedId) || 'Lokasyon'} •{' '}
                    {uploadedDate
                      ? new Date(uploadedDate).toLocaleDateString('tr-TR')
                      : 'Tarih yok'}
                  </p>
                </div>
                  );
                })()}

                <div className="flex items-center gap-2">
                  <Link
                    href={doc.fileUrl}
                    target="_blank"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Görüntüle
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 disabled:opacity-60"
                  >
                    {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
