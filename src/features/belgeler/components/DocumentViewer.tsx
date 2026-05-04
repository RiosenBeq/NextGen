'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, FileText, Download, Trash2, Calendar, HardDrive } from 'lucide-react';
import { deleteDocument } from '../actions';

interface DocumentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface Props {
  documents: DocumentItem[];
  showDelete?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewer({ documents, showDelete = true }: Props) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string>('');

  if (documents.length === 0) return null;

  const handleDelete = async (id: string) => {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    await deleteDocument(id);
  };

  const isImage = (mime: string) => mime?.startsWith('image/');

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all overflow-hidden"
          >
            {/* Preview area */}
            <button
              onClick={() => { setViewUrl(doc.fileUrl); setViewType(doc.mimeType); }}
              className="w-full aspect-square flex items-center justify-center p-4 cursor-pointer"
            >
              {isImage(doc.mimeType) ? (
                <img
                  src={doc.fileUrl}
                  alt={doc.fileName}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-80 transition-opacity">
                  <FileText className="w-10 h-10 text-indigo-400" />
                  <span className="text-[8px] font-black text-zinc-500 uppercase">PDF</span>
                </div>
              )}
            </button>

            {/* Info strip */}
            <div className="px-3 py-2.5 border-t border-white/5 bg-black/30">
              <p className="text-[9px] font-bold text-zinc-300 truncate">{doc.fileName}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[8px] text-zinc-600 flex items-center gap-1">
                  <HardDrive className="w-2.5 h-2.5" />
                  {formatFileSize(doc.fileSize)}
                </span>
                <span className="text-[8px] text-zinc-600 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>

            {/* Actions overlay */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-zinc-400 hover:text-white transition-colors"
              >
                <Download className="w-3 h-3" />
              </a>
              <button
                onClick={() => { setViewUrl(doc.fileUrl); setViewType(doc.mimeType); }}
                className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-zinc-400 hover:text-white transition-colors"
              >
                <Eye className="w-3 h-3" />
              </button>
              {showDelete && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {viewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8"
            onClick={() => setViewUrl(null)}
          >
            <button
              onClick={() => setViewUrl(null)}
              className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[85vh] overflow-auto rounded-2xl"
            >
              {isImage(viewType) ? (
                <img
                  src={viewUrl}
                  alt="Belge"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              ) : (
                <iframe
                  src={viewUrl}
                  className="w-full h-[80vh] rounded-2xl bg-white"
                  title="Belge Görüntüleme"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
