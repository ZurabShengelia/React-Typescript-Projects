import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-md border px-4 py-3 text-sm", {
  variants: {
    variant: {
      info: "border-base-border bg-base-raised text-ink-muted",
      danger: "border-danger/30 bg-danger-muted text-danger",
      success: "border-success/30 bg-success-muted text-success",
      warning: "border-warning/30 bg-warning-muted text-warning",
    },
  },
  defaultVariants: { variant: "info" },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}
