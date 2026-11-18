"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Нещодавні номери авто: запамʼятовуємо після вдалого пошуку в реєстрі чи
// розрахунку (localStorage цього браузера) і додаємо номери з полісів акаунта,
// якщо людина увійшла. Підказуємо під полем номера на калькуляторах — один тап
// замість набору. Лише номер + марка/модель/рік, жодних персональних даних.

export interface RecentPlate {
  plate: string;          // нормалізований: без пробілів, великими
  mark?: string;
  model?: string;
  year?: number;
  ts: number;
}

const KEY = "volya_recent_plates";
const MAX = 6;
const EVT = "volya:recent-plates";

export function normalizePlateKey(p: string): string {
  return p.toUpperCase().replace(/[^A-ZА-ЯІЇЄ0-9]/g, "");
}

/** «AA1234BB» → «AA 1234 BB» для показу. */
export function prettyPlate(p: string): string {
  const raw = normalizePlateKey(p);
  if (raw.length === 8) return `${raw.slice(0, 2)} ${raw.slice(2, 6)} ${raw.slice(6)}`;
  return raw;
}

function read(): RecentPlate[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.plate === "string") : [];
  } catch {
    return [];
  }
}
function write(list: RecentPlate[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch {}
  try { window.dispatchEvent(new CustomEvent(EVT)); } catch {}
}

export function rememberPlate(plate: string, meta: { mark?: string | null; model?: string | null; year?: number | null } = {}): void {
  const key = normalizePlateKey(plate);
  if (key.length < 6) return;
  const rest = read().filter((x) => x.plate !== key);
  const prev = read().find((x) => x.plate === key);
  write([{
    plate: key,
    mark: meta.mark || prev?.mark || undefined,
    model: meta.model || prev?.model || undefined,
    year: meta.year || prev?.year || undefined,
    ts: Date.now(),
  }, ...rest]);
}

export function forgetPlate(plate: string): void {
  const key = normalizePlateKey(plate);
  write(read().filter((x) => x.plate !== key));
}

// Номери з полісів акаунта — один запит на сесію вкладки.
let accountPlatesPromise: Promise<RecentPlate[]> | null = null;
function loadAccountPlates(): Promise<RecentPlate[]> {
  if (!accountPlatesPromise) {
    accountPlatesPromise = fetch("/api/policies", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const rows = (j?.data ?? []) as { vehicle?: { plate?: string; mark?: string; model?: string; year?: number }; createdAt?: string }[];
        const out: RecentPlate[] = [];
        for (const r of rows) {
          const key = normalizePlateKey(r.vehicle?.plate ?? "");
          if (key.length < 6 || out.some((x) => x.plate === key)) continue;
          out.push({ plate: key, mark: r.vehicle?.mark, model: r.vehicle?.model, year: r.vehicle?.year, ts: r.createdAt ? Date.parse(r.createdAt) : 0 });
        }
        return out;
      })
      .catch(() => []);
  }
  return accountPlatesPromise;
}

/** Нещодавні номери: локальні + з полісів акаунта (якщо увійшов), без дублів, свіжі перші. */
export function useRecentPlates(): RecentPlate[] {
  const { status } = useSession();
  const [local, setLocal] = useState<RecentPlate[]>([]);
  const [account, setAccount] = useState<RecentPlate[]>([]);

  useEffect(() => {
    const sync = () => setLocal(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void loadAccountPlates().then((list) => { if (!cancelled) setAccount(list); });
    return () => { cancelled = true; };
  }, [status]);

  const merged: RecentPlate[] = [];
  for (const p of [...local, ...account]) {
    const i = merged.findIndex((x) => x.plate === p.plate);
    if (i === -1) merged.push(p);
    else merged[i] = { ...p, ...merged[i], mark: merged[i].mark || p.mark, model: merged[i].model || p.model, year: merged[i].year || p.year };
  }
  return merged.sort((a, b) => b.ts - a.ts).slice(0, MAX);
}
