import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "muted";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
    success: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
    info: "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
    muted: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
