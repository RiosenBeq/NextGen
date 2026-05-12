"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[9998] sui-overlay sui-dialog-overlay",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean
  }
>(({ className, children, showClose = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "sui-premium-dialog fixed left-1/2 top-1/2 z-[9999] grid w-[calc(100%-1.5rem)] max-w-2xl gap-0",
        "max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden flex flex-col sui-dialog-content",
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close
          className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-[--bg-elevated]/60 text-[--text-secondary] transition-all hover:bg-[--bg-elevated] hover:text-[--text] active:scale-95 flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-[--accent-soft] z-[3]"
          aria-label="Kapat"
        >
          <X size={18} strokeWidth={2.25} />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  eyebrow,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { eyebrow?: string }) => (
  <div
    className={cn(
      "sui-dialog-header relative flex flex-col gap-3 px-6 sm:px-8 pt-9 sm:pt-10 pb-5 pr-16",
      className
    )}
    {...props}
  >
    {eyebrow && <span className="sui-dialog-eyebrow">{eyebrow}</span>}
    {children}
  </div>
)
DialogHeader.displayName = "DialogHeader"

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-7", className)}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
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
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[14px] sm:text-[15px] text-[--text-secondary] leading-relaxed", className)}
    style={{ letterSpacing: "-0.005em" }}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
