"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A47862] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[#A47862] text-white hover:bg-[#8F6550] active:scale-[0.98] shadow-lg shadow-[#A47862]/20",
        secondary:
          "bg-white text-[#A47862] border border-[#A47862]/30 hover:bg-[#A47862]/10 active:scale-[0.98]",
        ghost:
          "bg-transparent text-zinc-600 hover:bg-zinc-100 active:scale-[0.98]",
        danger:
          "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-500/20",
        outline:
          "bg-transparent text-zinc-800 border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
