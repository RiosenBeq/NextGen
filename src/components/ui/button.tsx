import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-medium tracking-[-0.01em] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[--accent-soft] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[--accent] text-white shadow-[0_6px_20px_rgba(0,113,227,0.18)] hover:bg-[--accent-hover] hover:-translate-y-px hover:shadow-[0_10px_30px_rgba(0,113,227,0.28)] active:translate-y-0 active:opacity-95",
        secondary:
          "bg-[--surface] text-[--text] border border-[--border-strong] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[--bg-elevated] hover:border-[--text-tertiary] hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)] active:translate-y-0",
        outline:
          "bg-transparent text-[--text] border border-[--border-strong] hover:bg-[--bg-elevated] hover:border-[--text-tertiary]",
        ghost:
          "bg-transparent text-[--text] hover:bg-[--bg-elevated]",
        accent:
          "bg-transparent text-[--accent] hover:bg-[--accent-tint] hover:text-[--accent-hover]",
        destructive:
          "bg-[--danger] text-white shadow-[0_6px_20px_rgba(255,59,48,0.18)] hover:bg-[#FF453A] hover:-translate-y-px active:translate-y-0",
        success:
          "bg-[--success] text-white shadow-[0_6px_20px_rgba(52,199,89,0.18)] hover:bg-[#30B954] hover:-translate-y-px active:translate-y-0",
        link:
          "bg-transparent text-[--accent] underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-11 px-[22px] py-3 min-h-[44px]",
        sm: "h-9 px-4 text-[14px] min-h-[36px]",
        lg: "h-12 px-7 text-[16px] min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-0",
        "icon-sm": "h-9 w-9 min-h-[36px] min-w-[36px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
