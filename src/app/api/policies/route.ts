import { NextRequest, NextResponse } from "next/server";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { auth } from "@/auth";
import { savePolicy, getPoliciesByEmail } from "@/lib/policies";
import { trySendTelegram, notifyDevError, escapeHtml } from "@/lib/telegram";
import { resolveReferrerByCode, recordReferralConversion } from "@/lib/referral";

// POST — зберегти оформлений поліс під email клієнта (логін не обовʼязковий:
// купити можна гостем, у кабінеті поліс зʼявиться після входу з тим же email).
export async function POST(req: NextRequest) {
  // Захист від cross-site + легкий ліміт на запис, щоб не спамили.
  const blocked = guardRequest(req, { name: "policies", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { id, email, contractId, orderId, company, vehicle, price, startDate, endDate } = body ?? {};
    if (!id || !email) {
      return NextResponse.json({ success: false, error: "Бракує id або email" }, { status: 400 });
    }
    await savePolicy({
      id: String(id),
      email: String(email),
      contractId: contractId ?? null,
      orderId: orderId ?? null,
      company: company ?? null,
      vehicle: vehicle ?? {},
      price: typeof price === "number" ? price : null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    });

    // Sales-бот: успішний онлайн-продаж ОСЦПВ. Не має ламати відповідь клієнту.
    const car = [vehicle?.mark, vehicle?.model].filter(Boolean).join(" ") || "—";
    const saleLines = [
      "✅ <b>Оформлено ОСЦПВ</b>",
      "",
      `🏢 Компанія: ${escapeHtml(String(company ?? "—"))}`,
      `🚙 Авто: ${escapeHtml(car)}${vehicle?.year ? `, ${vehicle.year}` : ""}`,
      vehicle?.plate ? `🔢 Номер: <code>${escapeHtml(String(vehicle.plate))}</code>` : null,
      typeof price === "number" ? `💰 Сума: <b>${price} грн</b>` : null,
      startDate && endDate ? `📅 Період: ${escapeHtml(String(startDate))} — ${escapeHtml(String(endDate))}` : null,
      `📧 Email: <code>${escapeHtml(String(email))}</code>`,
    ].filter(Boolean);
    await trySendTelegram("sales", saleLines.join("\n"));

    // Реферальна атрибуція: якщо покупець прийшов за чиїмось посиланням (cookie ref),
    // нараховуємо реферу бонус 5%. Не має ламати відповідь клієнту.
    const ref = req.cookies.get("ref")?.value;
    if (ref) {
      try {
        const referrer = await resolveReferrerByCode(ref);
        if (referrer) {
          await recordReferralConversion({
            referrerEmail: referrer,
            referredEmail: String(email),
            policyId: String(id),
            price: typeof price === "number" ? price : null,
          });
        }
      } catch (e) {
        console.error("[policies] referral attribution error:", e instanceof Error ? e.message : e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[policies] save error:", e instanceof Error ? e.message : e);
    await notifyDevError("policies save", e);
    return NextResponse.json({ success: false, error: "Не вдалося зберегти поліс" }, { status: 500 });
  }
}

// GET — поліси ЛИШЕ залогіненого користувача (ключ — email його акаунта).
export async function GET(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ success: false, error: "Не авторизовано" }, { status: 401 });
  }

  try {
    const policies = await getPoliciesByEmail(email);
    return NextResponse.json({ success: true, data: policies });
  } catch (e) {
    console.error("[policies] list error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Не вдалося завантажити поліси" }, { status: 500 });
  }
}
