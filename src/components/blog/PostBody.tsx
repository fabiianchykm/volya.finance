import { Fragment } from "react";
import Link from "next/link";

// Інлайн-посилання [текст](/шлях) — внутрішні через Link, зовнішні — <a>.
function inline(text: string) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const cls = "font-medium text-indigo-600 dark:text-indigo-400 hover:underline";
    parts.push(m[2].startsWith("/") ? <Link key={k++} href={m[2]} className={cls}>{m[1]}</Link> : <a key={k++} href={m[2]} className={cls} rel="noopener">{m[1]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

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
                  <span>{inline(l.trim().slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {lines.map((l, j) => (
              <Fragment key={j}>
                {inline(l)}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
