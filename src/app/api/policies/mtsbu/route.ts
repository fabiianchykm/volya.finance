import { NextRequest, NextResponse } from "next/server";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { getSessionIdentity } from "@/lib/session-identity";
import { resolveIdentities } from "@/lib/identity";
import { getPoliciesByIdentities, setPolicyMtsbuLink } from "@/lib/policies";
import { ukaskoService } from "@/services/ukasko";

// Пряме посилання на підтвердження поліса в реєстрі МТСБУ для кабінету.
// POST { id } → { link }. Якщо посилання вже в БД — віддаємо одразу; інакше
// беремо з contract/take Ukasko (той самий виклик, що й для PDF) і кешуємо,
// щоб наступного разу кнопка відкривалась миттєво. Лише для власника поліса.

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "policies-mtsbu", limit: 60, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  const { email, phone } = await getSessionIdentity();
  if (!email && !phone) return NextResponse.json({ success: false, error: "Не авторизовано" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

  try {
    const ids = await resolveIdentities({ email, phone });
    const policy = (await getPoliciesByIdentities(ids.emails, ids.phones)).find((p) => p.id === id);
    if (!policy) return NextResponse.json({ success: false, error: "Поліс не знайдено" }, { status: 404 });
    if (policy.mtsbuLink) return NextResponse.json({ success: true, link: policy.mtsbuLink, cached: true });
    if (policy.source === "manual" || !policy.contractId) return NextResponse.json({ success: true, link: null });

    let link: string | null = null;
    if (policy.product === "greencard") {
      const r = await ukaskoService.downloadGreenCardContract(policy.contractId);
      link = r.mtsbuLink ?? null;
    } else if (!policy.product || policy.product === "osago") {
      const r = await ukaskoService.downloadContract(policy.contractId);
      link = r.mtsbuLink ?? null;
    } else {
      return NextResponse.json({ success: true, link: null });
    }

    if (link) await setPolicyMtsbuLink(policy.id, link).catch(() => {});
    return NextResponse.json({ success: true, link });
  } catch (e) {
    // Договір ще формується тощо — не помилка для клієнта, кнопка лишиться на публічну перевірку.
    console.error("[policies/mtsbu]", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: true, link: null });
  }
}
