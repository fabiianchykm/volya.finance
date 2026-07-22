import { initializeApp, getApps, applicationDefault, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Серверна перевірка Firebase ID-токена (з Phone Auth). На App Hosting облікові
// дані беруться з середовища (ADC — сервісний акаунт Cloud Run).

function adminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];
  return initializeApp({ credential: applicationDefault(), projectId: "volya-finance-itsolutions" });
}

/** Повертає підтверджений номер телефону з ID-токена, або null. */
export async function verifyFirebasePhone(idToken: string): Promise<string | null> {
  try {
    const decoded = await getAuth(adminApp()).verifyIdToken(idToken);
    return (decoded.phone_number as string | undefined) ?? null;
  } catch {
    return null;
  }
}
