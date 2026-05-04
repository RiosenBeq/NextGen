'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { uploadDocument } from '../actions';

interface Props {
  relatedType: string; // 'expense' | 'investment' | 'income'
  relatedId: string;
  onUploadComplete?: () => void;
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentUploader({ relatedType, relatedId, onUploadComplete }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setStatus('error');
      setErrorMsg('Sadece PDF, JPG, PNG ve WebP dosyaları kabul edilir.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setStatus('error');
      setErrorMsg('Dosya boyutu 10MB\'ı aşamaz.');
      return;
    }

    setUploading(true);
    setStatus('idle');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('relatedType', relatedType);
    formData.append('relatedId', relatedId);

    const result = await uploadDocument(formData);

    setUploading(false);
    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        onUploadComplete?.();
      }, 1500);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Yükleme başarısız.');
    }
  }, [relatedType, relatedId, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
      >
        <Upload className="w-3 h-3" />
        Fatura Ekle
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => !uploading && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg premium-card p-8 bg-zinc-900 relative overflow-hidden"
            >
              {/* Close */}
              <button
                onClick={() => !uploading && setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <div className="mb-8">
                <h3 className="text-xl font-black text-white tracking-tight">Fatura / Belge Yükle</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">PDF, JPG, PNG — Maks. 10MB</p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : status === 'success'
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : status === 'error'
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-sm font-black text-white uppercase tracking-widest">Yükleniyor...</p>
                  </div>
                ) : status === 'success' ? (
                  <div className="flex flex-col items-center gap-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Başarıyla Yüklendi!</p>
                  </div>
                ) : status === 'error' ? (
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle className="w-12 h-12 text-rose-500" />
                    <p className="text-sm font-black text-rose-400 uppercase tracking-widest">Hata</p>
                    <p className="text-xs text-zinc-500">{errorMsg}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest mb-1">
                        Dosyayı sürükleyin veya tıklayın
                      </p>
                      <p className="text-[10px] text-zinc-500 font-bold">PDF, JPG, PNG formatları desteklenir</p>
                    </div>
                  </div>
                )}
              </div>

              {/* File type icons */}
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-zinc-600">
                  <FileText className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">PDF</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">JPG/PNG</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
