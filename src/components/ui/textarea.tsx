import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full min-h-[80px] rounded-xl bg-[--bg-elevated] border border-transparent px-4 py-3 text-[15px] text-[--text] placeholder:text-[--text-tertiary]",
          "transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:bg-[#ECECEE]",
          "focus:outline-none focus:bg-[--surface] focus:border-[--accent] focus:ring-4 focus:ring-[--accent-soft]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
