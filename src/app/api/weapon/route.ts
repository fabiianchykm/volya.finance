import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { sendTelegram, escapeHtml, notifyDevError } from "@/lib/telegram";
import { sourceLine } from "@/lib/attribution";
import { withIdempotency } from "@/lib/idempotency";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { saveLead } from "@/lib/leads";
import { WEAPON_TYPES, WEAPON_TERMS, WEAPON_SUMS, WEAPON_MAX_UNITS, weaponTypeLabel } from "@/components/weapon/weapon-options";

// Заявка на страхування відповідальності власника зброї. В Ukasko такого продукту
// немає — поліс оформлює менеджер у страховій (ПЗУ/Оранта/ТАС/Арсенал) за даними
// з дозволу. Тут лише приймаємо параметри й телефон → Telegram sales + лід у БД.

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "weapon", limit: 10, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 }); }

  const phone = String(b.phone ?? "");
  if (!isValidPhone(phone)) return NextResponse.json({ success: false, error: "Введіть коректний номер телефону" }, { status: 400 });

  const types = (Array.isArray(b.types) ? b.types : []).map(String).filter((v) => WEAPON_TYPES.some((w) => w.value === v));
  if (types.length === 0) return NextResponse.json({ success: false, error: "Оберіть вид зброї" }, { status: 400 });

  const units = Math.round(Number(b.units ?? 1));
  if (!Number.isFinite(units) || units < 1 || units > WEAPON_MAX_UNITS) return NextResponse.json({ success: false, error: "Вкажіть кількість одиниць" }, { status: 400 });

  const term = String(b.term ?? "1");
  if (!WEAPON_TERMS.some((t) => t.value === term)) return NextResponse.json({ success: false, error: "Оберіть строк" }, { status: 400 });

  const sum = Math.round(Number(b.sum ?? 0));
  if (!WEAPON_SUMS.some((s) => s.value === sum)) return NextResponse.json({ success: false, error: "Оберіть страхову суму" }, { status: 400 });

  const name = String(b.name ?? "").trim().slice(0, 80);
  const city = String(b.city ?? "").trim().slice(0, 80);
  const comment = String(b.comment ?? "").trim().slice(0, 300);
  const normalized = normalizePhone(phone);

  const lines = [
    "🎯 <b>Нова заявка: страхування зброї</b>",
    "",
    `📞 Телефон: <code>${escapeHtml(normalized)}</code>${name ? ` · ${escapeHtml(name)}` : ""}`,
    `🔫 Вид: ${escapeHtml(types.map(weaponTypeLabel).join(", "))}`,
    `🔢 Одиниць: ${units}`,
    `⏱ Строк: ${term === "3" ? "3 роки" : "1 рік"}`,
    `🛡 Страхова сума: ${sum.toLocaleString("uk-UA")} грн`,
    city ? `📍 Місто: ${escapeHtml(city)}` : null,
    comment ? `💬 ${escapeHtml(comment)}` : null,
    sourceLine(req),
  ].filter(Boolean) as string[];

  try {
    const idem = req.headers.get("idempotency-key");
    const { status, body } = await withIdempotency(
      idem ? `weapon:${idem}` : null,
      async () => {
        await sendTelegram("sales", lines.join("\n"));
        try {
          await saveLead({
            product: "weapon",
            customerName: name || null,
            phone: normalized,
            car: `${types.map(weaponTypeLabel).join(", ")} × ${units}`,
            stage: `зброя · ${term === "3" ? "3 роки" : "1 рік"} · ${sum.toLocaleString("uk-UA")} грн`,
          });
        } catch (e) {
          console.error("[weapon] lead save error:", e instanceof Error ? e.message : e);
        }
        return { status: 200, body: { success: true } };
      }
    );
    return NextResponse.json(body, { status });
  } catch (e) {
    console.error("[weapon] lead send error:", e instanceof Error ? e.message : e);
    await notifyDevError("weapon lead", e);
    return NextResponse.json({ success: false, error: "Не вдалося надіслати заявку. Зателефонуйте нам або спробуйте пізніше." }, { status: 500 });
  }
}
