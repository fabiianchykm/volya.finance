"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Легка i18n через React-контекст (без зміни URL, як перемикач теми). Переклади
// co-located: компонент викликає t({ uk: "...", en: "..." }). Якщо en немає —
// фолбек на uk, тож частковий переклад безпечний (нічого не ламається).
export type Lang = "uk" | "en";
export type Tr = { uk: string; en?: string };

interface I18nContext {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (tr: Tr) => string;
}

const Ctx = createContext<I18nContext>({
  lang: "uk",
  setLang: () => {},
  t: (tr) => tr.uk,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  // Сервер і ПЕРШИЙ клієнтський рендер — завжди uk (щоб не було hydration-розбіжності).
  const [lang, setLangState] = useState<Lang>("uk");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "uk") {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
    try { document.documentElement.lang = l; } catch {}
  }, []);

  const t = useCallback((tr: Tr) => (lang === "en" ? tr.en ?? tr.uk : tr.uk), [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
