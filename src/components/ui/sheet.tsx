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
      "fixed inset-0 z-[9998] sui-overlay sui-dialog-overlay",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "sui-premium-sheet fixed z-[9999] gap-0 flex flex-col",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 sui-sheet-top",
        bottom:
          "inset-x-0 bottom-0 rounded-t-[26px] max-h-[92dvh] sui-sheet-bottom",
        left:
          "inset-y-0 left-0 h-full w-[88%] sm:max-w-lg sui-sheet-left",
        right:
          "inset-y-0 right-0 h-full w-full sm:max-w-lg sui-sheet-right",
        responsive:
          "inset-x-0 bottom-0 rounded-t-[26px] max-h-[92dvh] sui-sheet-responsive md:inset-x-auto md:bottom-auto md:inset-y-0 md:right-0 md:h-full md:w-full md:max-w-lg md:rounded-none md:max-h-none",
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
        <div className="flex justify-center pt-2.5 pb-1 md:hidden">
          <div className="sui-sheet-handle" aria-hidden />
        </div>
      )}
      {children}
      {showClose && (
        <SheetPrimitive.Close
          className="absolute right-4 top-4 sm:right-5 sm:top-5 w-10 h-10 rounded-full text-[--text-tertiary] transition-all hover:bg-[--bg-elevated] hover:text-[--text] flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-[--accent-soft] z-[2]"
          aria-label="Kapat"
        >
          <X size={18} strokeWidth={2} />
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  eyebrow,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { eyebrow?: string }) => (
  <div
    className={cn(
      "sui-dialog-header relative flex flex-col gap-2 px-6 sm:px-8 pt-5 sm:pt-6 pb-5 pr-16",
      className
    )}
    {...props}
  >
    {eyebrow && <span className="sui-dialog-eyebrow">{eyebrow}</span>}
    {children}
  </div>
)
SheetHeader.displayName = "SheetHeader"

const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-7",
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
      "sui-dialog-footer flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 sm:px-8 py-4 sm:py-5",
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
      "font-semibold text-[--text] leading-tight",
      className
    )}
    style={{
      letterSpacing: "-0.024em",
      fontSize: "clamp(20px, 3.4vw, 26px)",
    }}
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
    className={cn("text-[14px] sm:text-[15px] text-[--text-secondary] leading-relaxed", className)}
    style={{ letterSpacing: "-0.005em" }}
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
