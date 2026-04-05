'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useSettings } from '@/providers/SettingsProvider';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function ModernModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  showCloseButton = true
}: ModernModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  const isTopPosition = settings.SETTING_POPUP_POSITION === 1;
  const animSpeed = settings.SETTING_ANIMATION_SPEED;
  
  const transition = {
    type: "spring" as const,
    damping: animSpeed === 0 ? 35 : (animSpeed === 2 ? 15 : 25),
    stiffness: animSpeed === 0 ? 500 : (animSpeed === 2 ? 150 : 350)
  };

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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-all"
          />

          {/* Modal Container */}
          <div className={cn(
            "fixed inset-0 z-[101] flex p-4 md:p-6 pointer-events-none transition-all duration-500",
            isTopPosition ? "items-start justify-center pt-[10vh]" : "items-center justify-center"
          )}>
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: isTopPosition ? -40 : 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: isTopPosition ? -40 : 20 }}
              transition={transition}
              className={cn(
                "w-full bg-white border border-slate-200 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden relative flex flex-col max-h-[90vh]",
                maxWidth
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {title && (
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              )}

              {/* Close Button Absolute (if no title) */}
              {!title && showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-white shadow-md border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all active:scale-95"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
