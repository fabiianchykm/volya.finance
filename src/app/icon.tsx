import { ImageResponse } from "next/og";

// Динамічний favicon — фірмова плашка з «V». Прибирає 404 на іконку вкладки.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
                    borderRadius: 7,
        }}
      >
        <svg viewBox="0 0 20 20" width="22" height="22"><path d="M0 0 L3.2 0 L10 13.6 L10 20 Z" fill="#fff" /><path d="M10 20 L10 13.6 L16.8 0 L20 0 Z" fill="#fff" fillOpacity="0.72" /></svg>
      </div>
    ),
    { ...size }
  );
}
