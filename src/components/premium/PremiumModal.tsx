'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal/Drawer component'leri React Portal ile <body>'ye render edilir.
 * Bu sayede sayfa içindeki overflow:hidden, transform veya stacking-context
 * tuzaklarından bağımsız olarak her zaman viewport ortasında doğru z-index ile
 * gözükürler.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted;
}

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
  const mounted = useMounted();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-4 sm:p-6 overflow-y-auto"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full rounded-[22px] border border-[--border] bg-[--surface]',
              'shadow-[0_30px_80px_rgba(0,0,0,0.18),0_8px_24px_rgba(0,0,0,0.08)]',
              'max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden flex flex-col',
              'my-auto',
              maxWidth
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'premium-modal-title' : undefined}
          >
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-7 pb-5 border-b border-[--border-soft]">
              <div className="min-w-0">
                <h3
                  id="premium-modal-title"
                  className="text-[22px] sm:text-[24px] font-semibold text-[--text] truncate"
                  style={{ letterSpacing: '-0.022em' }}
                >
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

            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

interface PremiumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Mobilde alttan açılan bottom-sheet, desktop'ta sağdan giren drawer.
 * Her iki modda da viewport'un ortasına/önüne hizalı; createPortal ile
 * body'ye taşınmıştır.
 */
export function PremiumDrawer({
  isOpen,
  onClose,
  title,
  subtitle = 'Kayıt detayları ve düzenleme alanı',
  children,
}: PremiumDrawerProps) {
  const mounted = useMounted();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isOpen, onClose]);

  if (!mounted) return null;

  // Mobilde alttan slide-up bottom sheet, desktop'ta sağdan slide drawer
  const motionProps = isDesktop
    ? {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
      }
    : {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
      };

  const containerClass = isDesktop
    ? 'fixed inset-y-0 right-0 z-[9999] flex w-full max-w-lg'
    : 'fixed inset-x-0 bottom-0 z-[9999] flex max-h-[92dvh] w-full';

  const panelClass = isDesktop
    ? 'relative flex h-full w-full flex-col border-l border-[--border] bg-[--surface] shadow-[-30px_0_80px_rgba(0,0,0,0.18),-8px_0_24px_rgba(0,0,0,0.08)]'
    : 'relative flex w-full flex-col rounded-t-[22px] border-t border-[--border] bg-[--surface] shadow-[0_-20px_60px_rgba(0,0,0,0.18)] max-h-[92dvh]';

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-md"
          />

          <motion.div
            {...motionProps}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={containerClass}
          >
            <div className={panelClass} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              {/* Mobile drag handle */}
              {!isDesktop && (
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-[--border-strong]" />
                </div>
              )}

              <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-5 sm:pt-7 pb-5 border-b border-[--border-soft]">
                <div className="min-w-0">
                  <h3
                    className="text-[22px] sm:text-[24px] font-semibold text-[--text] truncate"
                    style={{ letterSpacing: '-0.022em' }}
                  >
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

              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
