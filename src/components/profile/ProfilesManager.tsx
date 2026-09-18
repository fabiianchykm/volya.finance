"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserRound, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { useI18n } from "@/lib/i18n";
import {
  listProfiles, fetchServerProfiles, putProfile, removeProfile,
  type CustomerProfile, type DocKind, type DocFields,
} from "@/lib/customer-profile";

// Кабінет «Мої дані»: усі збережені особи акаунта (сам, дружина, діти…) — можна
// редагувати будь-яке поле, дозаповнити порожні, видалити особу або додати нову.
// Ці ж дані підставляє пікер «Заповнити збереженими» в усіх продуктах.

const DOC_KINDS: { kind: DocKind; uk: string; en: string; serialUk: string; serialEn: string }[] = [
  { kind: "idcard",   uk: "ID-картка",            en: "ID card",              serialUk: "Запис № (УНЗР)", serialEn: "Record No. (UNZR)" },
  { kind: "passport", uk: "Паспорт (книжечка)",   en: "Passport (booklet)",   serialUk: "Серія",          serialEn: "Series" },
  { kind: "foreign",  uk: "Закордонний паспорт",  en: "International passport", serialUk: "Серія",        serialEn: "Series" },
  { kind: "license",  uk: "Посвідчення водія",    en: "Driver's licence",     serialUk: "Серія",          serialEn: "Series" },
];

const emptyDoc = (): DocFields => ({ serial: "", number: "", issuedBy: "", date: "" });

const emptyProfile = (): CustomerProfile => ({
  surname: "", name: "", patronymic: "", surnameLat: "", nameLat: "",
  phone: "", email: "", identificationCode: "", dateBirth: "", youngestBirthDate: "",
  street: "", house: "", docType: 3, docSerial: "", docNumber: "", docIssuedBy: "", docDate: "",
  docByKind: {}, lastDocKind: "idcard", city: null, cityQuery: "",
  passportSerial: "", passportNumber: "", passportDate: "", passportEndDate: "", passportIssuedBy: "",
  savedAt: 0,
});

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

function fullName(p: CustomerProfile): string {
  return [p.surname, p.name, p.patronymic].filter(Boolean).join(" ") || [p.surnameLat, p.nameLat].filter(Boolean).join(" ");
}

// Які ключові поля ще порожні — щоб підказати, що варто дозаповнити.
function missingFields(p: CustomerProfile, t: (x: { uk: string; en: string }) => string): string[] {
  const out: string[] = [];
  if (!p.surname || !p.name) out.push(t({ uk: "ПІБ", en: "full name" }));
  if (!p.dateBirth) out.push(t({ uk: "дата народження", en: "date of birth" }));
  if (!p.identificationCode) out.push(t({ uk: "ІПН", en: "tax ID" }));
  if (!p.phone) out.push(t({ uk: "телефон", en: "phone" }));
  if (!p.street || !p.house) out.push(t({ uk: "адреса", en: "address" }));
  const hasDoc = Object.values(p.docByKind ?? {}).some((d) => d && (d.number || d.serial));
  if (!hasDoc) out.push(t({ uk: "документ", en: "document" }));
  if (!p.surnameLat || !p.nameLat) out.push(t({ uk: "ПІБ латиницею", en: "name in Latin" }));
  return out;
}

export function ProfilesManager() {
  const { t } = useI18n();
  const { status } = useSession();
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // email особи або "new"
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    // Спершу локальний кеш (миттєво), потім усі особи з сервера (крос-девайс).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(listProfiles());
    void fetchServerProfiles().then((all) => { setProfiles(all); setLoading(false); });
  }, [status]);

  const refresh = () => setProfiles(listProfiles());

  const onSaved = (msg: string) => {
    setEditing(null);
    refresh();
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <div className="flex items-center gap-2 py-10 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />{t({ uk: "Завантажуємо…", en: "Loading…" })}</div>;
  }
  if (status !== "authenticated") {
    return <p className="py-10 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Увійдіть, щоб керувати збереженими даними.", en: "Sign in to manage your saved data." })}</p>;
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Check className="h-4 w-4" />{notice}
        </div>
      )}

      {profiles.length === 0 && editing !== "new" && (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {t({ uk: "Збережених осіб ще немає. Дані зберігаються автоматично при оформленні поліса — або додайте особу вручну.", en: "No saved people yet. Data is saved automatically when you buy a policy — or add a person manually." })}
        </p>
      )}

      {profiles.map((p) => (
        <div key={p.email} className="rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {editing === p.email ? (
            <ProfileForm
              initial={p}
              onCancel={() => setEditing(null)}
              onSaved={() => onSaved(t({ uk: "Дані збережено", en: "Saved" }))}
            />
          ) : (
            <ProfileRow
              p={p}
              onEdit={() => setEditing(p.email)}
              onDeleted={() => onSaved(t({ uk: "Особу видалено", en: "Person removed" }))}
            />
          )}
        </div>
      ))}

      {editing === "new" ? (
        <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm dark:border-indigo-900 dark:bg-zinc-900">
          <ProfileForm initial={emptyProfile()} isNew onCancel={() => setEditing(null)} onSaved={() => onSaved(t({ uk: "Особу додано", en: "Person added" }))} />
        </div>
      ) : (
        <Button variant="outline" size="md" className="flex w-full items-center justify-center gap-2" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" />{t({ uk: "Додати особу", en: "Add a person" })}
        </Button>
      )}
    </div>
  );
}

function ProfileRow({ p, onEdit, onDeleted }: { p: CustomerProfile; onEdit: () => void; onDeleted: () => void }) {
  const { t } = useI18n();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const missing = missingFields(p, t);
  const del = async () => {
    setBusy(true);
    await removeProfile(p.email);
    setBusy(false);
    onDeleted();
  };
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"><UserRound className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{fullName(p) || t({ uk: "Без імені", en: "No name" })}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {[p.email, p.phone ? `+380 ${formatUaPhone(p.phone)}` : "", p.identificationCode ? `ІПН ${p.identificationCode}` : ""].filter(Boolean).join(" · ")}
          </p>
          {missing.length > 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t({ uk: "Не заповнено: ", en: "Missing: " })}{missing.join(", ")}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {confirm ? (
          <>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t({ uk: "Видалити?", en: "Delete?" })}</span>
            <Button size="sm" variant="primary" loading={busy} onClick={del}>{t({ uk: "Так", en: "Yes" })}</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirm(false)}>{t({ uk: "Ні", en: "No" })}</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" className="flex items-center gap-1.5" onClick={onEdit}><Pencil className="h-3.5 w-3.5" />{t({ uk: "Редагувати", en: "Edit" })}</Button>
            <button type="button" onClick={() => setConfirm(true)} aria-label={t({ uk: "Видалити", en: "Delete" })} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ProfileForm({ initial, isNew, onCancel, onSaved }: { initial: CustomerProfile; isNew?: boolean; onCancel: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState<CustomerProfile>({ ...emptyProfile(), ...initial, docByKind: { ...(initial.docByKind ?? {}) } });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof CustomerProfile) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setDate = (k: keyof CustomerProfile) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const doc = (kind: DocKind): DocFields => f.docByKind?.[kind] ?? emptyDoc();
  const setDoc = (kind: DocKind, k: keyof DocFields, v: string) =>
    setF((s) => ({ ...s, docByKind: { ...(s.docByKind ?? {}), [kind]: { ...(s.docByKind?.[kind] ?? emptyDoc()), [k]: v } } }));

  const save = async () => {
    setErr(null);
    const email = f.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr(t({ uk: "Вкажіть коректний email — за ним зберігається особа.", en: "Enter a valid email — the person is stored under it." })); return; }
    setBusy(true);
    // Закордонний паспорт: тримаємо і в docByKind.foreign, і в passport*-полях (туристичне).
    const foreign = doc("foreign");
    const byKind = { ...(f.docByKind ?? {}) };
    if (foreign.serial || foreign.number) byKind.foreign = foreign;
    // Порожні типи документів не зберігаємо.
    for (const k of Object.keys(byKind) as DocKind[]) { const d = byKind[k]; if (d && !d.serial && !d.number && !d.issuedBy && !d.date) delete byKind[k]; }
    const lastKind: DocKind = (f.lastDocKind && byKind[f.lastDocKind]) ? f.lastDocKind : ((Object.keys(byKind)[0] as DocKind | undefined) ?? "idcard");
    const active = byKind[lastKind] ?? emptyDoc();
    const next: CustomerProfile = {
      ...f, email,
      phone: f.phone.replace(/\D/g, "").slice(0, 9),
      docByKind: byKind, lastDocKind: lastKind,
      docSerial: active.serial, docNumber: active.number, docIssuedBy: active.issuedBy, docDate: active.date,
      passportSerial: foreign.serial, passportNumber: foreign.number, passportDate: foreign.date, passportIssuedBy: foreign.issuedBy,
    };
    // Зміна email = інший ключ: старий запис прибираємо, щоб не було дубля.
    if (!isNew && initial.email && initial.email.toLowerCase() !== email) await removeProfile(initial.email);
    const ok = await putProfile(next);
    setBusy(false);
    if (!ok) { setErr(t({ uk: "Не вдалося зберегти на сервері. Перевірте з'єднання й спробуйте ще раз.", en: "Could not save to the server. Check your connection and try again." })); return; }
    onSaved();
  };

  return (
    <div className="space-y-5 px-5 py-5">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{isNew ? t({ uk: "Нова особа", en: "New person" }) : fullName(initial) || initial.email}</p>

      <Section title={t({ uk: "Особа", en: "Person" })}>
        <Input label={t({ uk: "Прізвище", en: "Surname" })} value={f.surname} onChange={set("surname")} />
        <Input label={t({ uk: "Ім'я", en: "First name" })} value={f.name} onChange={set("name")} />
        <Input label={t({ uk: "По батькові", en: "Patronymic" })} value={f.patronymic} onChange={set("patronymic")} />
        <DateInput label={t({ uk: "Дата народження", en: "Date of birth" })} value={f.dateBirth} onChange={setDate("dateBirth")} defaultYear={1990} />
        <Input label={t({ uk: "Прізвище латиницею", en: "Surname (Latin)" })} value={f.surnameLat ?? ""} onChange={set("surnameLat")} placeholder={t({ uk: "як у закордонному паспорті", en: "as in the passport" })} />
        <Input label={t({ uk: "Ім'я латиницею", en: "First name (Latin)" })} value={f.nameLat ?? ""} onChange={set("nameLat")} />
        <Input label={t({ uk: "ІПН", en: "Tax ID" })} inputMode="numeric" value={f.identificationCode} onChange={set("identificationCode")} placeholder="1234567890" />
        <Input label={t({ uk: "Телефон", en: "Phone" })} type="tel" inputMode="numeric" prefix="+380" value={formatUaPhone(f.phone)} onChange={(e) => setF((s) => ({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))} placeholder="67 123 45 67" />
        <Input label="Email" type="email" value={f.email} onChange={set("email")} placeholder="email@example.com" required />
      </Section>

      <Section title={t({ uk: "Адреса", en: "Address" })}>
        <Input label={t({ uk: "Місто", en: "City" })} value={f.cityQuery} onChange={(e) => setF((s) => ({ ...s, cityQuery: e.target.value, city: e.target.value === s.cityQuery ? s.city : null }))} placeholder={t({ uk: "Київ", en: "Kyiv" })} />
        <Input label={t({ uk: "Вулиця", en: "Street" })} value={f.street} onChange={set("street")} />
        <Input label={t({ uk: "Будинок / кв.", en: "House / apt." })} value={f.house} onChange={set("house")} />
      </Section>

      {DOC_KINDS.map((d) => (
        <Section key={d.kind} title={t({ uk: d.uk, en: d.en })}>
          <Input label={t({ uk: d.serialUk, en: d.serialEn })} value={doc(d.kind).serial} onChange={(e) => setDoc(d.kind, "serial", e.target.value)} />
          <Input label={t({ uk: "Номер", en: "Number" })} value={doc(d.kind).number} onChange={(e) => setDoc(d.kind, "number", e.target.value)} />
          <Input label={t({ uk: "Ким виданий", en: "Issued by" })} value={doc(d.kind).issuedBy} onChange={(e) => setDoc(d.kind, "issuedBy", e.target.value)} />
          <DateInput label={t({ uk: "Дата видачі", en: "Issue date" })} value={doc(d.kind).date} onChange={(v) => setDoc(d.kind, "date", v)} />
          {d.kind === "foreign" && (
            <DateInput label={t({ uk: "Дійсний до", en: "Valid until" })} value={f.passportEndDate ?? ""} onChange={setDate("passportEndDate")} />
          )}
        </Section>
      ))}

      {err && <p className="text-sm text-red-500">{err}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button variant="outline" size="md" className="flex items-center gap-1.5" onClick={onCancel} disabled={busy}><X className="h-4 w-4" />{t({ uk: "Скасувати", en: "Cancel" })}</Button>
        <Button variant="primary" size="md" className="flex items-center gap-1.5" loading={busy} onClick={save}><Check className="h-4 w-4" />{t({ uk: "Зберегти", en: "Save" })}</Button>
      </div>
    </div>
  );
}
