"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-xs font-medium text-zinc-500"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center rounded-xl border bg-white transition-colors",
            error
              ? "border-red-400 focus-within:border-red-500"
              : "border-zinc-200 focus-within:border-indigo-400",
            className
          )}
        >
          {prefix && (
            <span className="pl-3.5 text-zinc-400 text-sm">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-transparent px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none",
              prefix && "pl-2",
              suffix && "pr-2"
            )}
            {...props}
          />
          {suffix && (
            <span className="pr-3.5 text-zinc-400 text-sm">{suffix}</span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
