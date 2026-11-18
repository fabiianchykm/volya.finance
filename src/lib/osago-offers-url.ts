// URL екрана пропозицій автоцивілки: /osago?step=offers&plate=…(&ob&ph&yd).
// Спільний для флоу (перехід на пропозиції) і чекауту («Назад» з 1-го кроку —
// на пропозиції, а не на екран номера). Персональних даних, крім дат народження
// для тарифу, в URL немає; ІПН береться з кукі.
export function buildOsagoOffersUrl(
  plate: string,
  buyer?: { birthDate?: string | null; policyholderBirthDate?: string | null; youngestBirthDate?: string | null } | null,
  pathname = "/osago",
): string {
  const sp = new URLSearchParams({ step: "offers", plate });
  if (buyer?.policyholderBirthDate) sp.set("ph", buyer.policyholderBirthDate);
  if (buyer?.youngestBirthDate) sp.set("yd", buyer.youngestBirthDate);
  if (buyer?.birthDate) sp.set("ob", buyer.birthDate);
  return `${pathname}?${sp.toString()}`;
}
