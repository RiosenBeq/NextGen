'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
            aria-hidden
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            ref={contentRef}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className={cn(
              'relative w-full rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_-24px_rgba(2,6,23,0.35)] overflow-hidden',
              maxWidth,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
              <div className="pr-12">
                {title && <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs md:text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>

              <button
                onClick={onClose}
                className="absolute right-4 top-4 md:right-5 md:top-5 p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                aria-label="Pencereyi kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[82vh] overflow-y-auto custom-scrollbar px-6 md:px-8 py-6 md:py-8">
              {children}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

export function PremiumDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative h-full w-full max-w-2xl bg-white border-l border-slate-200 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.4)] flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="px-6 md:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="pr-12">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">{title || 'Detay Paneli'}</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">{subtitle || 'Kayıt detayları ve belge yönetimi'}</p>
              </div>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 md:right-5 md:top-5 p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                aria-label="Paneli kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-6">
              {children}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
