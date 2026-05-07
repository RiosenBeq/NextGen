'use client';

/**
 * Backwards-compatible wrappers for legacy `<PremiumModal>` / `<PremiumDrawer>`
 * imports across the codebase. New code is encouraged to use the shadcn
 * primitives directly:
 *
 *   import { Dialog, DialogContent, ... } from '@/components/ui/dialog';
 *   import { Sheet, SheetContent, ... } from '@/components/ui/sheet';
 *
 * These wrappers preserve the original API:
 *   <PremiumModal isOpen={...} onClose={...} title="..." maxWidth="max-w-xl">
 *     <FormBody />
 *   </PremiumModal>
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(maxWidth)}>
        <DialogHeader>
          <DialogTitle>{title || 'Form'}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </DialogContent>
    </Dialog>
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
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="responsive">
        <SheetHeader>
          <SheetTitle>{title || 'Detaylar'}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
