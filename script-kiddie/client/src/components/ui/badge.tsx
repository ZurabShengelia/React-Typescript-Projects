import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium font-mono uppercase tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-base-raised text-ink-muted border border-base-border",
        accent: "bg-accent-muted text-accent",

        easy: "bg-success-muted text-success",
        success: "bg-success-muted text-success",
        danger: "bg-danger-muted text-danger",
        warning: "bg-warning-muted text-warning",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
