"use client";

import { useEffect, useState } from "react";
import type { ReviewSummaryMap } from "./reviews";

// Рейтинги страхових з відгуків наших клієнтів — один запит на вкладку.
let cache: ReviewSummaryMap | null = null;
let inflight: Promise<ReviewSummaryMap> | null = null;

function load(): Promise<ReviewSummaryMap> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/reviews/summary")
      .then((r) => (r.ok ? (r.json() as Promise<{ ratings?: ReviewSummaryMap }>) : { ratings: {} }))
      .then((j) => (cache = j.ratings ?? {}))
      .catch(() => (cache = {}));
  }
  return inflight;
}

export function useReviewSummaries(): ReviewSummaryMap {
  const [data, setData] = useState<ReviewSummaryMap>(cache ?? {});
  useEffect(() => {
    let alive = true;
    void load().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}
