import { Fragment } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface HeroStep {
  icon: LucideIcon;
  label: string;
}

// Рядок кроків у героєві продукту (як в автоцивілці): пігулки з іконкою+назвою,
// зʼєднані шевронами. Горизонтальний скрол на вузьких екранах.
export function HeroSteps({ steps }: { steps: HeroStep[] }) {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex w-max items-center gap-1.5 px-4 sm:gap-2.5">
        {steps.map(({ icon: Icon, label }, i) => (
          <Fragment key={label}>
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-2 ring-1 ring-white/10 backdrop-blur-sm">
              <Icon className="h-4 w-4 text-indigo-300" />
              <span className="whitespace-nowrap text-sm font-medium text-zinc-200">{label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
