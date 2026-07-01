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
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, letterSpacing: -1 }}>
          <span>volya</span>
          <span style={{ color: "#a5b4fc" }}>.finance</span>
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
