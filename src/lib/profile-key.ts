// Ключ ОСОБИ серед збережених профілів акаунта. Раніше ключем був email, але на один
// email брокер/сімʼя оформлюють поліси на десятки різних людей — тож email особу не
// ідентифікує. Пріоритет: ІПН → ПІБ + дата народження → email (останній фолбек).
// Чистий модуль без DOM/БД — імпортується і клієнтом (localStorage), і сервером (Postgres).

export interface ProfileKeyFields {
  identificationCode?: string | null;
  surname?: string | null;
  name?: string | null;
  surnameLat?: string | null;
  nameLat?: string | null;
  dateBirth?: string | null;
  email?: string | null;
}

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function profileKey(p: ProfileKeyFields | null | undefined): string {
  if (!p) return "";
  const ipn = (p.identificationCode ?? "").replace(/\D/g, "");
  if (ipn.length >= 8) return `ipn:${ipn}`;
  const surname = norm(p.surname) || norm(p.surnameLat);
  const name = norm(p.name) || norm(p.nameLat);
  if (surname || name) return `person:${surname}|${name}|${norm(p.dateBirth)}`;
  return norm(p.email);
}

/** Усі ключі, під якими ця особа МОГЛА бути збережена раніше (щоб злити старий запис,
 *  а не плодити дублі): новий ключ, ключ за ПІБ без ІПН і легасі-ключ за email. */
export function profileKeyCandidates(p: ProfileKeyFields | null | undefined): string[] {
  if (!p) return [];
  const out = [profileKey(p), profileKey({ ...p, identificationCode: "" }), norm(p.email)];
  return out.filter((k, i) => k && out.indexOf(k) === i);
}
