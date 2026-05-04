'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function PremiumModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}: PremiumModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto flex min-h-full w-full items-center justify-center">
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'relative w-full rounded-2xl border border-slate-200/70 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.18)]',
                  'max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden flex flex-col',
                  maxWidth
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 px-8 pt-7 pb-5">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-900 truncate">
                      {title || 'Form'}
                    </h3>
                    {subtitle && (
                      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Kapat"
                    className="shrink-0 w-9 h-9 rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8">{children}</div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface PremiumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PremiumDrawer({
  isOpen,
  onClose,
  title,
  subtitle = 'Kayıt detayları ve düzenleme alanı',
  children,
}: PremiumDrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative flex h-screen w-full flex-col border-l border-slate-200/70 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-8 pt-7 pb-5">
                <div className="min-w-0">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900 truncate">
                    {title || 'Detaylar'}
                  </h3>
                  {subtitle && (
                    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Kapat"
                  className="shrink-0 w-9 h-9 rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-8">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
