"use client";

import { useEffect } from "react";

// Захоплює ?ref=КОД із URL у cookie (30 днів), щоб при майбутній покупці
// прив'язати конверсію до рефера. Рендериться глобально в layout.
// Cookie не httpOnly — читається сервером при POST /api/policies (same-origin fetch).

export function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[a-z0-9]{4,16}$/i.test(ref)) {
      document.cookie = `ref=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, []);
  return null;
}
