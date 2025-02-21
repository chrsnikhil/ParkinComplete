import * as React from "react"
import { cn } from "@/lib/utils"

// We extend from HTMLInputElement to get all native input props while allowing for additional custom props
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Custom props
  error?: string
  helperText?: string
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, startAdornment, endAdornment, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {startAdornment && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {startAdornment}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            startAdornment && "pl-10",
            endAdornment && "pr-10",
            error && "border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endAdornment}
          </div>
        )}
        {(error || helperText) && (
          <p className={cn("mt-1 text-sm", error ? "text-red-500" : "text-gray-500")}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input } 