import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, selected, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-white p-5 transition-all duration-200",
        hover && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        selected
          ? "border-indigo-400 shadow-md shadow-indigo-100 ring-1 ring-indigo-400"
          : "border-zinc-100 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}
