"use client";

import { useEffect } from "react";
import { ATTR_COOKIE, type Attribution } from "@/lib/attribution";

// Запамʼятовуємо джерело першого заходу (utm/gclid/fbclid/referrer) у cookie на 30 днів.
// Перший дотик НЕ перезаписуємо — лише якщо прийшли нові utm-мітки (нова кампанія).
export function AttributionCapture() {
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const utm = (k: string) => q.get(k)?.trim().slice(0, 80) || undefined;
      let source = utm("utm_source");
      let medium = utm("utm_medium");
      const campaign = utm("utm_campaign");
      const content = utm("utm_content") || utm("utm_term");
      const refHost = (() => { try { return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch { return ""; } })();
      // Без utm: виводимо джерело з реферера / рекламних click-id.
      if (!source) {
        if (q.get("gclid") || q.get("gad_source")) { source = "google"; medium = medium || "cpc"; }
        else if (q.get("fbclid")) { source = /instagram/i.test(refHost) ? "instagram" : "facebook"; medium = medium || "social"; }
        else if (refHost && !/volya\.finance$/i.test(refHost)) {
          source = /google\./i.test(refHost) ? "google" : /instagram/i.test(refHost) ? "instagram" : /facebook|fb\.com/i.test(refHost) ? "facebook" : /t\.me|telegram/i.test(refHost) ? "telegram" : /threads/i.test(refHost) ? "threads" : /tiktok/i.test(refHost) ? "tiktok" : refHost;
          medium = medium || (/google\./i.test(refHost) ? "organic" : "referral");
        } else if (!refHost) { source = "direct"; }
      }
      const hasCookie = document.cookie.split("; ").some((c) => c.startsWith(ATTR_COOKIE + "="));
      const newCampaign = !!utm("utm_source") || !!q.get("gclid") || !!q.get("fbclid");
      if (hasCookie && !newCampaign) return; // перший дотик лишаємо
      if (!source) return;
      const a: Attribution = { source, medium, campaign, content, referrer: refHost || undefined, landing: window.location.pathname, at: new Date().toISOString() };
      const val = encodeURIComponent(JSON.stringify(a));
      document.cookie = `${ATTR_COOKIE}=${val}; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } catch { /* атрибуція не має ламати сторінку */ }
  }, []);
  return null;
}
