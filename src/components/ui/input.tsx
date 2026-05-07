import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full min-h-[44px] rounded-xl bg-[--bg-elevated] border border-transparent px-4 py-3 text-[15px] text-[--text] placeholder:text-[--text-tertiary]",
          "transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:bg-[#ECECEE]",
          "focus:outline-none focus:bg-[--surface] focus:border-[--accent] focus:ring-4 focus:ring-[--accent-soft]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
