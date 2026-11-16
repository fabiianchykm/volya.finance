"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Smartphone, Mail, Plus, Loader2, Check, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhoneLogin } from "@/components/auth/PhoneLogin";
import { useI18n } from "@/lib/i18n";

interface LinkState {
  loggedIn: boolean;
  email?: string | null;
  phone?: string | null;
  emails?: string[];
  phones?: string[];
  links?: { email: string; phone: string }[];
}

function fmtPhone(p: string): string {
  const d = p.replace(/\D/g, "").replace(/^380/, "");
  return d.length === 9 ? `+380 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : p;
}

// «Способи входу»: які email-и та номери належать цьому акаунту. Усі вони дають
// один кабінет — одні поліси, один бонусний рахунок, одне реферальне посилання,
// хоч би як людина увійшла цього разу. Google-вхід може додати номер (код у
// Telegram/SMS), вхід за номером — привʼязати Google.
export function LinkedLogins() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<LinkState | null>(null);
  const [adding, setAdding] = useState<"phone" | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/account/link", { cache: "no-store" });
      setState(await r.json());
    } catch {
      setState({ loggedIn: false });
    }
  }, []);

  // Завантаження з /api/account/link (setState — лише після відповіді сервера).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  // Повернення з Google після «Привʼязати Google» (вхід за номером) — завершуємо звʼязок.
  useEffect(() => {
    if (params.get("link") !== "google") return;
    (async () => {
      try {
        const r = await fetch("/api/account/link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ complete: true }) });
        const json = await r.json().catch(() => ({}));
        setNotice(json?.success
          ? { kind: "ok", text: t({ uk: "Google-акаунт привʼязано. Тепер обидва входи ведуть в один кабінет.", en: "Google account linked. Both sign-ins now open the same account." }) }
          : { kind: "err", text: json?.error ?? t({ uk: "Не вдалося завершити привʼязку.", en: "Could not complete linking." }) });
      } finally {
        router.replace("/profile");
        void load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const linkGoogle = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/account/link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ intent: "google" }) });
      const json = await r.json().catch(() => ({}));
      if (!json?.success) { setNotice({ kind: "err", text: json?.error ?? t({ uk: "Спробуйте ще раз.", en: "Please try again." }) }); return; }
      await signIn("google", { callbackUrl: "/profile?link=google" });
    } finally {
      setBusy(false);
    }
  };

  const unlink = async (email: string, phone: string) => {
    setBusy(true);
    try {
      await fetch("/api/account/link", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, phone }) });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return <div className="flex items-center gap-2 py-6 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />{t({ uk: "Завантажуємо…", en: "Loading…" })}</div>;
  }
  if (!state.loggedIn) return null;

  const emails = state.emails ?? [];
  const phones = state.phones ?? [];
  const explicit = state.links ?? [];
  const isExplicit = (kind: "email" | "phone", v: string) => explicit.some((l) => (kind === "email" ? l.email === v : l.phone === v));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-1 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Способи входу", en: "Ways to sign in" })}</h2>
      </div>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        {t({ uk: "Те, чим ви входите в кабінет: Google-акаунт і/або номер телефону. Привʼяжіть обидва — і за номером, і через Google відкриватиметься один кабінет: ті самі поліси, бонуси й реферальне посилання. Контакти людей з ваших полісів сюди не входять.", en: "What you sign in with: a Google account and/or a phone number. Link both and either sign-in opens the same account: the same policies, bonuses and referral link. Contacts of people on your policies are not listed here." })}
      </p>

      {notice && (
        <div className={`mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${notice.kind === "ok" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}>
          {notice.kind === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{notice.text}
        </div>
      )}

      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {emails.map((e) => (
          <li key={e} className="flex items-center gap-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"><Mail className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{e}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {e === state.email ? t({ uk: "Поточний вхід · Google", en: "Current sign-in · Google" }) : t({ uk: "Google", en: "Google" })}
              </p>
            </div>
            {state.phone && e !== state.email && isExplicit("email", e) && (
              <button type="button" disabled={busy} onClick={() => unlink(e, state.phone!)} className="text-xs text-zinc-400 hover:text-red-500" aria-label={t({ uk: "Відвʼязати", en: "Unlink" })}><X className="h-4 w-4" /></button>
            )}
          </li>
        ))}
        {phones.map((p) => (
          <li key={p} className="flex items-center gap-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"><Smartphone className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{fmtPhone(p)}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {p === state.phone ? t({ uk: "Поточний вхід · номер телефону", en: "Current sign-in · phone number" }) : t({ uk: "Номер телефону", en: "Phone number" })}
              </p>
            </div>
            {state.email && p !== state.phone && isExplicit("phone", p) && (
              <button type="button" disabled={busy} onClick={() => unlink(state.email!, p)} className="text-xs text-zinc-400 hover:text-red-500" aria-label={t({ uk: "Відвʼязати", en: "Unlink" })}><X className="h-4 w-4" /></button>
            )}
          </li>
        ))}
      </ul>

      {/* Дії: Google-вхід додає номер; вхід за номером — Google. */}
      <div className="mt-4">
        {state.email && !adding && (
          <Button variant="outline" size="md" className="flex items-center gap-2" onClick={() => setAdding("phone")}>
            <Plus className="h-4 w-4" />{t({ uk: "Додати номер телефону", en: "Add a phone number" })}
          </Button>
        )}
        {state.email && adding === "phone" && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
            <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-300">{t({ uk: "Код надійде в Telegram, а якщо номера немає в Telegram — по SMS.", en: "The code arrives in Telegram, or by SMS if the number is not on Telegram." })}</p>
            <PhoneLogin mode="link" onLinked={() => { setAdding(null); setNotice({ kind: "ok", text: t({ uk: "Номер привʼязано. Вхід за ним веде в цей самий кабінет.", en: "Phone linked. Signing in with it opens this same account." }) }); void load(); }} />
            <button type="button" onClick={() => setAdding(null)} className="mt-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">{t({ uk: "Скасувати", en: "Cancel" })}</button>
          </div>
        )}
        {!state.email && state.phone && (
          <Button variant="outline" size="md" className="flex items-center gap-2" loading={busy} onClick={linkGoogle}>
            <Plus className="h-4 w-4" />{t({ uk: "Привʼязати Google-акаунт", en: "Link a Google account" })}
          </Button>
        )}
      </div>
    </section>
  );
}
