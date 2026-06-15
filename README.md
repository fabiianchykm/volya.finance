# volya.finance

Веб-застосунок для оформлення автоцивілки (ОСЦПВ) в Україні. Інтеграція з Ukasko REST API: пошук авто за номером → пропозиції страховиків → оформлення → OTP → оплата → поліс на email.

**Стек:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, NextAuth (Auth.js v5, Google), Framer Motion.

## Локальний запуск

```bash
npm install
cp .env.example .env.local   # і заповнити значення (див. нижче)
npm run dev
```

Відкрити http://localhost:3000

## Змінні середовища

Усі змінні описані в `.env.example`. Коротко:

| Змінна | Призначення |
|---|---|
| `UKASKO_EMAIL`, `UKASKO_PASSWORD` | Креди партнерського кабінету Ukasko |
| `UKASKO_ENV` | `dev` — тестовий контур, інакше — прод |
| `NEXT_PUBLIC_APP_URL` | Публічний URL застосунку (зашивається у білд) |
| `AUTH_URL` | Базовий URL для NextAuth callback-ів |
| `AUTH_SECRET` | Секрет NextAuth — `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth client |

> `NEXT_PUBLIC_*` зашивається під час білду — після зміни потрібен **новий деплой**, не лише рестарт.

## Деплой (Vercel)

1. Запушити репозиторій на GitHub.
2. На [vercel.com](https://vercel.com) → **Add New Project** → імпорт репо (Next.js визначиться автоматично).
3. **Settings → Environment Variables** — додати всі змінні з таблиці вище
   (для бойового — `Production`, для тестового — `Preview`).
4. Деплой. Push у `main` → production, push у гілку → preview.

**Google OAuth** — у [Cloud Console](https://console.cloud.google.com/apis/credentials) додати для кожного домену:
- Authorized JavaScript origins: `https://<домен>`
- Authorized redirect URIs: `https://<домен>/api/auth/callback/google`

HTTPS обов'язковий: без нього NextAuth у проді не видасть secure-cookie і Google-логін не запрацює (Vercel дає HTTPS автоматично).

## Скрипти

```bash
npm run dev     # розробка
npm run build   # продакшн-білд
npm run start   # запуск білда
npm run lint    # eslint
```
