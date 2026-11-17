import { ImageResponse } from "next/og";

// Соцкартка для шерингу (og:image / twitter image) — генерується динамічно.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "volya.finance — Страхування авто онлайн";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "linear-gradient(135deg, #06040f, #1e1060 55%, #4f46e5)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", fontSize: 72, fontWeight: 700 }}>
          <svg viewBox="0 0 20 20" width="58" height="58" style={{ marginRight: 12, marginBottom: 6 }}>
            <path d="M0 0 L3.2 0 L10 13.6 L10 20 Z" fill="#a5b4fc" />
            <path d="M10 20 L10 13.6 L16.8 0 L20 0 Z" fill="#8b5cf6" />
          </svg>
          <span style={{ letterSpacing: 10 }}>OLYA</span>
          <span style={{ color: "#a5b4fc", fontSize: 48, marginLeft: -6, marginBottom: 6 }}>.finance</span>
        </div>
        <div style={{ fontSize: 44, marginTop: 28, color: "#e4e4e7" }}>
          Страхування авто онлайн
        </div>
        <div style={{ fontSize: 28, marginTop: 18, color: "#a1a1aa" }}>
          Автоцивілка · КАСКО · Зелена карта
        </div>
      </div>
    ),
    { ...size }
  );
}
