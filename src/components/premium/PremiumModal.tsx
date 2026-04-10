'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal } from '@/components/ui/Portal';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { 
    opacity: 1, 
    backdropFilter: 'blur(16px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { 
    opacity: 0, 
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.3, ease: 'easeIn' }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.5, 
      type: 'spring', 
      damping: 25, 
      stiffness: 300,
      mass: 0.8
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20, 
    filter: 'blur(10px)',
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  }
};

export function PremiumModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
}: PremiumModalProps) {
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
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
            {/* Cinematic Backdrop */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-slate-900/40 pointer-events-auto"
              onClick={onClose}
            />

            {/* Premium Grain Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Modal Container */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'relative w-full rounded-[40px] border border-white/20 bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.1)_inset] pointer-events-auto',
                'max-h-[min(90vh,1200px)] overflow-hidden flex flex-col',
                maxWidth
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Refined Header area */}
              <div className="flex items-center justify-between px-8 py-7 border-b border-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{title || 'İşlem Merkezi'}</h3>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-4 italic px-0.5">Premium Modül Sistemi</p>
                </div>
                
                <button
                  onClick={onClose}
                  className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 transition-all hover:bg-slate-900 hover:scale-110 active:scale-95 border border-slate-100"
                >
                  <X size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="p-2">{children}</div>
              </div>

              {/* Minimal Footer Accent */}
              <div className="h-2 bg-gradient-to-r from-blue-600/5 via-blue-600/10 to-blue-600/5" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
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
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-slate-900/40 pointer-events-auto"
              onClick={onClose}
            />

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-2xl max-h-[min(90vh,1200px)] overflow-hidden rounded-[40px] border border-white/20 bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.1)_inset] pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-8 py-7 border-b border-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid size={20} className="text-blue-600" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{title || 'Detay Paneli'}</h3>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-7 italic px-0.5">Detaylı Kayıt İnceleniyor</p>
                </div>

                <button
                  onClick={onClose}
                  className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 transition-all hover:bg-slate-900 hover:scale-110 active:scale-95 border border-slate-100"
                >
                  <X size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="p-2">{children}</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}


