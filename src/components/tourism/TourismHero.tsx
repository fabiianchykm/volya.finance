"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, ShieldCheck, HeartPulse, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Туристичне страхування — поки лід-форма (онлайн-калькулятор підключимо, коли
// Ukasko надасть довідник країн). Клієнт лишає номер → заявка в sales-бот.

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export function TourismHero() {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = phone.replace(/\D/g, "");
  const valid = digits.length === 9;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: `380${digits}`, source: "Туристичне страхування" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error ?? "Не вдалося надіслати. Спробуйте ще раз.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="relative overflow-x-hidden pb-20 pt-32 sm:pb-28 sm:pt-40 animate-gradient"
      style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)" }} />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 w-full text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <Plane className="h-7 w-7 text-indigo-300" />
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Туристичне страхування —
              <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                захист у подорожі за кордон
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-zinc-300">
              Медична допомога, нещасні випадки та ризики поїздки. Залиште номер — підберемо вигідний поліс під вашу подорож.
            </p>
          </div>

          {!done ? (
            <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-6">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Ваш номер телефону</label>
              <div className="flex items-center rounded-2xl border border-zinc-200 bg-white px-4 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <span className="select-none pr-3 text-xl font-semibold text-zinc-500">+380</span>
                <span className="mr-3 h-7 w-px bg-zinc-200" />
                <input
                  type="tel" inputMode="numeric" autoFocus placeholder="67 123 45 67"
                  value={formatUaPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  className="w-full bg-transparent py-3.5 text-xl font-semibold tracking-wider text-zinc-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300 outline-none"
                />
              </div>
              {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}
              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!valid || loading} className="mt-4 w-full rounded-2xl">
                Підібрати поліс
              </Button>
              <p className="mt-2 text-center text-xs text-zinc-400">Менеджер передзвонить і допоможе оформити.</p>
            </form>
          ) : (
            <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl sm:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Заявку прийнято!</h2>
                  <p className="mt-1 text-sm text-zinc-600">Ми зателефонуємо найближчим часом і підберемо вигідне туристичне страхування для вашої подорожі.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-indigo-100">
            <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-indigo-300" /> Медичне покриття</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-300" /> Для віз і кордону</span>
            <span className="flex items-center gap-2"><Plane className="h-4 w-4 text-indigo-300" /> Онлайн за хвилини</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
