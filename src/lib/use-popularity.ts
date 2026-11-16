"use client";

import { useEffect, useState } from "react";
import type { InsurerPopularity } from "./offer-ranking";

// Популярність страхових (к-сть оформлених полісів за рік) з /api/insurers/popular.
// Один запит на завантаження сторінки — результат кешується в модулі й ділиться між
// усіма списками пропозицій. Поки нема відповіді (або БД недоступна) — {}.
let cache: InsurerPopularity | null = null;
let inflight: Promise<InsurerPopularity> | null = null;

function load(): Promise<InsurerPopularity> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/insurers/popular", { cache: "force-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<{ counts?: unknown }>) : ({} as { counts?: unknown })))
      .then((j) => { cache = (j?.counts && typeof j.counts === "object" ? j.counts : {}) as InsurerPopularity; return cache; })
      .catch(() => { cache = {}; return cache; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function usePopularity(): InsurerPopularity {
  const [pop, setPop] = useState<InsurerPopularity>(() => cache ?? {});
  useEffect(() => {
    let alive = true;
    void load().then((p) => { if (alive) setPop(p); });
    return () => { alive = false; };
  }, []);
  return pop;
}
