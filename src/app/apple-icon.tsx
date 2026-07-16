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
          fontSize: 118,
          fontWeight: 700,
        }}
      >
        V
      </div>
    ),
    { ...size }
  );
}
