import { Fragment } from "react";

// Простий рендер контенту допису: порожній рядок — новий абзац; "## " — підзаголовок;
// рядки "- " поспіль — маркований список. Без зовнішніх markdown-залежностей.
export function PostBody({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {block.slice(3).trim()}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  {l.trim().slice(2)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {lines.map((l, j) => (
              <Fragment key={j}>
                {l}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
