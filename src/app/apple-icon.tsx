import { ImageResponse } from "next/og";

// Apple touch icon (180×180) — фірмова плашка з «V». Прибирає 404 на іконку
// для iOS/крауллерів (додатково маршрутизуємо дефолтні шляхи через next.config).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "#fff",
                  }}
      >
        <svg viewBox="0 0 20 20" width="112" height="112"><path d="M0 0 L3.2 0 L10 13.6 L10 20 Z" fill="#fff" /><path d="M10 20 L10 13.6 L16.8 0 L20 0 Z" fill="#fff" fillOpacity="0.72" /></svg>
      </div>
    ),
    { ...size }
  );
}
