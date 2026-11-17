import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { sendTelegram, escapeHtml, notifyDevError } from "@/lib/telegram";
import { sourceLine } from "@/lib/attribution";
import { withIdempotency } from "@/lib/idempotency";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { saveLead } from "@/lib/leads";
import { VIGNETTE_COUNTRIES, VIGNETTE_PERIODS, VIGNETTE_VEHICLES, vignetteCountryName, vignettePeriodLabel, vignetteVehicleLabel } from "@/components/vignette/vignette-options";

// Заявка на віньєтку (оплата платних доріг Європи). Онлайн-оформлення через API
// ще готується — поки менеджер купує е-віньєтку в офіційного оператора за
// номером авто й надсилає підтвердження. Тут приймаємо параметри → Telegram + лід.

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "vignette", limit: 10, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 }); }

  const phone = String(b.phone ?? "");
  if (!isValidPhone(phone)) return NextResponse.json({ success: false, error: "Введіть коректний номер телефону" }, { status: 400 });

  const countries = (Array.isArray(b.countries) ? b.countries : []).map(String).filter((c) => VIGNETTE_COUNTRIES.some((x) => x.code === c));
  if (countries.length === 0) return NextResponse.json({ success: false, error: "Оберіть країну" }, { status: 400 });

  const period = String(b.period ?? "");
  if (!VIGNETTE_PERIODS.some((p) => p.value === period)) return NextResponse.json({ success: false, error: "Оберіть строк" }, { status: 400 });

  const vehicle = String(b.vehicle ?? "car");
  if (!VIGNETTE_VEHICLES.some((v) => v.value === vehicle)) return NextResponse.json({ success: false, error: "Оберіть тип авто" }, { status: 400 });

  const plate = String(b.plate ?? "").toUpperCase().replace(/[^A-ZА-ЯІЇЄ0-9]/g, "").slice(0, 10);
  if (plate.length < 4) return NextResponse.json({ success: false, error: "Вкажіть номер авто" }, { status: 400 });

  const startDate = String(b.startDate ?? "").trim().slice(0, 10);
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(startDate)) return NextResponse.json({ success: false, error: "Вкажіть дату початку" }, { status: 400 });

  const name = String(b.name ?? "").trim().slice(0, 80);
  const normalized = normalizePhone(phone);

  const lines = [
    "🛣 <b>Нова заявка: віньєтка</b>",
    "",
    `📞 Телефон: <code>${escapeHtml(normalized)}</code>${name ? ` · ${escapeHtml(name)}` : ""}`,
    `🌍 Країни: ${escapeHtml(countries.map(vignetteCountryName).join(", "))}`,
    `⏱ Строк: ${escapeHtml(vignettePeriodLabel(period))} · з ${escapeHtml(startDate)}`,
    `🚗 Авто: ${escapeHtml(vignetteVehicleLabel(vehicle))} · <code>${escapeHtml(plate)}</code>`,
    sourceLine(req),
  ].filter(Boolean) as string[];

  try {
    const idem = req.headers.get("idempotency-key");
    const { status, body } = await withIdempotency(
      idem ? `vignette:${idem}` : null,
      async () => {
        await sendTelegram("sales", lines.join("\n"));
        try {
          await saveLead({
            product: "vignette",
            customerName: name || null,
            phone: normalized,
            car: plate,
            stage: `віньєтка · ${countries.join("+")} · ${vignettePeriodLabel(period)} з ${startDate}`,
          });
        } catch (e) {
          console.error("[vignette] lead save error:", e instanceof Error ? e.message : e);
        }
        return { status: 200, body: { success: true } };
      }
    );
    return NextResponse.json(body, { status });
  } catch (e) {
    console.error("[vignette] lead send error:", e instanceof Error ? e.message : e);
    await notifyDevError("vignette lead", e);
    return NextResponse.json({ success: false, error: "Не вдалося надіслати заявку. Зателефонуйте нам або спробуйте пізніше." }, { status: 500 });
  }
}
