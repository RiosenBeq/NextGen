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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={onClose}
          />

          <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto flex min-h-full w-full items-center justify-center">
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'relative w-full rounded-[22px] border border-[--border] bg-[--surface]',
                  'shadow-[0_20px_60px_rgba(0,0,0,0.12)]',
                  'max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden flex flex-col',
                  maxWidth
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-7 pb-5">
                  <div className="min-w-0">
                    <h3 className="text-[22px] sm:text-[24px] font-semibold text-[--text] truncate" style={{ letterSpacing: '-0.022em' }}>
                      {title || 'Form'}
                    </h3>
                    {subtitle && (
                      <p className="text-[14px] text-[--text-secondary] mt-1">{subtitle}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Kapat"
                    className="shrink-0 w-11 h-11 rounded-full text-[--text-tertiary] transition-colors hover:bg-[--bg-elevated] hover:text-[--text] flex items-center justify-center"
                  >
                    <X size={20} strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8">{children}</div>
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-lg">
            <motion.div
              initial={{ x: 32 }}
              animate={{ x: 0 }}
              exit={{ x: 32 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-screen w-full flex-col border-l border-[--border] bg-[--surface] shadow-[-20px_0_60px_rgba(0,0,0,0.08)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-7 pb-5">
                <div className="min-w-0">
                  <h3 className="text-[22px] sm:text-[24px] font-semibold text-[--text] truncate" style={{ letterSpacing: '-0.022em' }}>
                    {title || 'Detaylar'}
                  </h3>
                  {subtitle && (
                    <p className="text-[14px] text-[--text-secondary] mt-1">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Kapat"
                  className="shrink-0 w-11 h-11 rounded-full text-[--text-tertiary] transition-colors hover:bg-[--bg-elevated] hover:text-[--text] flex items-center justify-center"
                >
                  <X size={20} strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
