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
  maxWidth?: string; // e.g. 'max-w-2xl'
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
  const animSpeed = settings.SETTING_ANIMATION_SPEED; // 0: Fast, 1: Normal, 2: Slow
  
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-all"
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
                "w-full bg-[#0f1117] border border-white/10 rounded-[32px] shadow-2xl pointer-events-auto overflow-hidden relative flex flex-col max-h-[90vh]",
                maxWidth
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header (Optional) */}
              {title && (
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{title}</h3>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                  )}
                </div>
              )}

              {/* Close Button Absolute (if no title) */}
              {!title && showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-50 p-3 rounded-full bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white backdrop-blur shadow-xl border border-white/10 transition-all active:scale-90"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
