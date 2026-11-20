"use client";

// Відкриття договору (PDF) після асинхронного запиту.
//
// Проблема: window.open(url) ПІСЛЯ await уже не вважається реакцією на клік, і
// мобільні браузери (Safari, застосунок Google, Instagram/Telegram webview)
// мовчки блокують таке вікно — клієнт тисне «Завантажити», а нічого не
// відбувається (інцидент 19.11.2026, НВ ІНГО: 13 успішних запитів, жодного файлу).
//
// Рішення: на кліку синхронно відкриваємо порожню вкладку (це дозволено), після
// відповіді сервера ведемо її на договір. Якщо вкладку все одно заблокували або
// браузер її не підтримує — відкриваємо договір у поточній вкладці.

export function preOpenDownloadWindow(): Window | null {
  try {
    const w = window.open("", "_blank");
    if (w) {
      try {
        w.document.title = "Договір…";
        w.document.body.style.cssText = "font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#52525b";
        w.document.body.textContent = "Завантажуємо договір…";
      } catch { /* інший origin / обмеження — не критично */ }
    }
    return w;
  } catch {
    return null;
  }
}

/** Показує договір: у заздалегідь відкритій вкладці, інакше — новою вкладкою або в поточній. */
export function showDownload(url: string, pre: Window | null): void {
  if (pre && !pre.closed) {
    try { pre.location.href = url; return; } catch { /* впадемо в запасний варіант */ }
  }
  const w = window.open(url, "_blank");
  if (!w) window.location.href = url;
}

/** Закрити заздалегідь відкриту вкладку, якщо договір так і не отримали. */
export function closePreOpened(pre: Window | null): void {
  try { if (pre && !pre.closed) pre.close(); } catch { /* ignore */ }
}
