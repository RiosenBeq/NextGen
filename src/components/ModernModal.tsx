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

  // Settings Mapping
  const isTopPosition = settings.SETTING_POPUP_POSITION === 1;
  const animSpeed = settings.SETTING_ANIMATION_SPEED;
  
  const transition = {
    type: "spring" as const,
    damping: animSpeed === 0 ? 35 : (animSpeed === 2 ? 15 : 25),
    stiffness: animSpeed === 0 ? 500 : (animSpeed === 2 ? 150 : 350)
  };

  // Close on Escape key
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
                "w-full bg-[--surface] border border-[--border] rounded-2xl shadow-2xl pointer-events-auto overflow-hidden relative flex flex-col max-h-[90vh]",
                maxWidth
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {title && (
                <div className="px-6 py-5 border-b border-[--border] flex items-center justify-between bg-[--surface-alt]/50">
                  <h3 className="text-base font-semibold text-[--text-primary] tracking-tight">{title}</h3>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-[--surface-alt] text-[--text-muted] hover:text-[--text-primary] transition-all"
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
                  className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-[--surface] shadow-md border border-[--border] text-[--text-muted] hover:text-[--text-primary] hover:border-[--border-strong] transition-all active:scale-95"
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
