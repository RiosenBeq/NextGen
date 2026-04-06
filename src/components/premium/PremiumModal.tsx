'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function PremiumModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Blur Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className={cn(
              "relative w-full bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col border border-slate-100",
              maxWidth
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100/50">
               {title ? (
                 <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
               ) : <div />}
               <button
                 onClick={onClose}
                 className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all active:scale-95 group"
               >
                 <X size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
               </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function PremiumDrawer({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          {/* Backdrop Blur Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[4px]"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col border-l border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-10 py-8 flex items-center justify-between border-b border-slate-50">
               <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{title || 'Detaylar'}</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1 italic">Finansal kayıt ve operasyon analizi</p>
               </div>
               <button
                 onClick={onClose}
                 className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all active:scale-95 group"
               >
                 <X size={24} strokeWidth={2} className="group-hover:rotate-90 transition-transform duration-300" />
               </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

