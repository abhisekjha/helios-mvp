import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variantClasses = {
    default: "border-border bg-primary text-primary-foreground hover:bg-brand-primary-hover",
    secondary: "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "text-foreground border-border bg-background hover:bg-muted",
  }

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)} 
      {...props} 
    />
  )
}

export { Badge }
