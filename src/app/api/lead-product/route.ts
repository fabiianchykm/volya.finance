import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { sendTelegram, escapeHtml, notifyDevError } from "@/lib/telegram";
import { sourceLine } from "@/lib/attribution";
import { withIdempotency } from "@/lib/idempotency";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { saveLead } from "@/lib/leads";
import { getLeadProduct, leadFieldValueLabel, type LeadField } from "@/lib/lead-products";

// Універсальна заявка для продуктів «через менеджера» (пасажири, CMR, застава,
// МС іноземців…). Поля валідуються за конфігом продукту → Telegram sales + лід.

function validateField(f: LeadField, raw: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  const missing = { ok: false as const, error: `Заповніть поле «${f.label.uk}»` };
  switch (f.type) {
    case "select": {
      const v = String(raw ?? "");
      if (!v) return f.required ? missing : { ok: true, value: null };
      return f.options.some((o) => o.value === v) ? { ok: true, value: v } : { ok: false, error: `Невірне значення «${f.label.uk}»` };
    }
    case "chips": {
      const arr = (Array.isArray(raw) ? raw : raw ? [raw] : []).map(String).filter((v) => f.options.some((o) => o.value === v));
      if (arr.length === 0) return f.required ? missing : { ok: true, value: null };
      return { ok: true, value: f.multiple ? arr : arr[0] };
    }
    case "number": {
      if (raw === "" || raw === null || raw === undefined) return f.required ? missing : { ok: true, value: null };
      const n = Number(String(raw).replace(/\s/g, ""));
      if (!Number.isFinite(n)) return { ok: false, error: `«${f.label.uk}» має бути числом` };
      if (f.min !== undefined && n < f.min) return { ok: false, error: `«${f.label.uk}»: не менше ${f.min}` };
      if (f.max !== undefined && n > f.max) return { ok: false, error: `«${f.label.uk}»: не більше ${f.max}` };
      return { ok: true, value: n };
    }
    case "text": {
      const v = String(raw ?? "").trim().slice(0, f.maxLength ?? 200);
      if (!v) return f.required ? missing : { ok: true, value: null };
      return { ok: true, value: v };
    }
  }
}

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "lead-product", limit: 10, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 }); }

  const product = getLeadProduct(String(b.slug ?? ""));
  if (!product) return NextResponse.json({ success: false, error: "Невідомий продукт" }, { status: 400 });

  const phone = String(b.phone ?? "");
  if (!isValidPhone(phone)) return NextResponse.json({ success: false, error: "Введіть коректний номер телефону" }, { status: 400 });
  const name = String(b.name ?? "").trim().slice(0, 80);
  const fields = (b.fields ?? {}) as Record<string, unknown>;

  const rows: string[] = [];
  const brief: string[] = [];
  for (const f of product.fields) {
    const r = validateField(f, fields[f.key]);
    if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: 400 });
    if (r.value === null) continue;
    const label = leadFieldValueLabel(f, r.value);
    rows.push(`• ${escapeHtml(f.label.uk)}: <b>${escapeHtml(label)}</b>`);
    brief.push(label);
  }

  const normalized = normalizePhone(phone);
  const lines = [
    `${product.emoji} <b>Нова заявка: ${escapeHtml(product.label.uk)}</b>`,
    "",
    `📞 Телефон: <code>${escapeHtml(normalized)}</code>${name ? ` · ${escapeHtml(name)}` : ""}`,
    ...rows,
    sourceLine(req),
  ].filter(Boolean) as string[];

  try {
    const idem = req.headers.get("idempotency-key");
    const { status, body } = await withIdempotency(
      idem ? `lead-product:${product.slug}:${idem}` : null,
      async () => {
        await sendTelegram("sales", lines.join("\n"));
        try {
          await saveLead({ product: product.slug, customerName: name || null, phone: normalized, stage: brief.join(" · ").slice(0, 200) });
        } catch (e) {
          console.error(`[lead-product/${product.slug}] lead save error:`, e instanceof Error ? e.message : e);
        }
        return { status: 200, body: { success: true } };
      }
    );
    return NextResponse.json(body, { status });
  } catch (e) {
    console.error(`[lead-product/${product.slug}] send error:`, e instanceof Error ? e.message : e);
    await notifyDevError(`lead-product ${product.slug}`, e);
    return NextResponse.json({ success: false, error: "Не вдалося надіслати заявку. Зателефонуйте нам або спробуйте пізніше." }, { status: 500 });
  }
}
