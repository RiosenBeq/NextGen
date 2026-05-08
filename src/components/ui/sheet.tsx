"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[9998] bg-white/70 backdrop-blur-2xl backdrop-saturate-150 sui-overlay",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-[9999] gap-0 bg-[--surface] shadow-[0_24px_60px_rgba(15,23,42,0.18),0_8px_24px_rgba(15,23,42,0.10)] flex flex-col",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-[--border-strong] sui-sheet-top",
        bottom:
          "inset-x-0 bottom-0 border-t border-[--border-strong] rounded-t-[22px] max-h-[92dvh] sui-sheet-bottom",
        left:
          "inset-y-0 left-0 h-full w-3/4 sm:max-w-lg border-r border-[--border-strong] sui-sheet-left",
        right:
          "inset-y-0 right-0 h-full w-full sm:max-w-lg border-l border-[--border-strong] sui-sheet-right",
        responsive:
          "inset-x-0 bottom-0 border-t border-[--border-strong] rounded-t-[22px] max-h-[92dvh] sui-sheet-responsive md:inset-x-auto md:bottom-auto md:inset-y-0 md:right-0 md:h-full md:w-full md:max-w-lg md:rounded-none md:max-h-none md:border-l",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showClose?: boolean
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, showClose = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {/* Drag handle (only for bottom-sheet variants) */}
      {(side === "bottom" || side === "responsive") && (
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-[--border-strong]" />
        </div>
      )}
      {children}
      {showClose && (
        <SheetPrimitive.Close
          className="absolute right-4 top-4 sm:right-6 sm:top-6 w-11 h-11 rounded-full text-[--text-tertiary] transition-colors hover:bg-[--bg-elevated] hover:text-[--text] flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-[--accent-soft]"
          aria-label="Kapat"
        >
          <X size={20} strokeWidth={1.75} />
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1 px-6 sm:px-8 pt-5 sm:pt-7 pb-5 border-b border-[--border-soft] pr-16",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto px-6 sm:px-8 py-6",
      className
    )}
    style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    {...props}
  />
)
SheetBody.displayName = "SheetBody"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 sm:px-8 py-5 border-t border-[--border-soft]",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "text-[22px] sm:text-[24px] font-semibold text-[--text] truncate",
      className
    )}
    style={{ letterSpacing: "-0.022em" }}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-[14px] text-[--text-secondary]", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
