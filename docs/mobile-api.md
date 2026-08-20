# volya.finance — API для мобільного застосунку

Мобільний застосунок (React Native) — **тонкий клієнт**: усю логіку виконує наявний
бекенд (Next.js), застосунок лише викликає ці HTTP-ендпоінти. Бізнес-логіку (розрахунки,
declare, оплата, збереження поліса) НЕ дублювати.

## Базове

- **Base URL (прод):** `https://volya.finance`
- **Формат:** JSON. Успіх — `{ "success": true, ... }`; помилка — `{ "success": false, "error": "..." }` + відповідний HTTP-статус.
- **Заголовок доступу (обовʼязково для всіх викликів нижче):**
  `x-api-key: <MOBILE_API_KEY>`
  Бекенд захищений від сторонніх викликів (перевірка Origin/Referer). Мобільний клієнт
  проходить за спільним секретом у цьому заголовку. **Без нього — `403 «Доступ заборонено»`.**
  > Ключ у бінарнику застосунку не є справжнім секретом — це «мʼякий» бар'єр проти скрапінгу.
  > Персональні дані (поліси/профіль) додатково захищені сесією користувача (див. «Авторизація»).
- **Rate-limit:** кожен ендпоінт має ліміт запитів по IP (429 `Retry-After` при перевищенні). Не робіть агресивний polling.
- **User-Agent:** ставте реалістичний (не порожній).

## Авторизація (для персональних даних)

- Публічні ендпоінти (пошук авто, міста, прорахунок, оформлення, OTP, оплата, finalize) —
  достатньо `x-api-key`.
- Персональні (`GET /api/policies`, `/api/profile`) — потребують **сесії NextAuth**
  (Google або телефон/OTP). Для мобільного треба узгодити token-flow (JWT-сесія / cookie).
  **Це окрема задача** — на старті MVP можна робити без кабінету, а поліси показувати одразу
  після оформлення (з відповіді finalize).

---

## OSAGO / Автоцивілка — основний флоу

Порядок: **пошук авто → прорахунок → чернетка(draft) → OTP → declare → інвойс → оплата (LiqPay) → finalize**.

### 1. Пошук авто за номером
`GET /api/vehicle/{plate}`  (напр. `/api/vehicle/AA1234BB`)

Відповідь `data`:
```json
{
  "number": "AA1234BB", "vin": "…", "year": 2015, "model": "80", "mark": "AUDI",
  "autoCategory": "B1",
  "city": { "id": 1, "name_ua": "Київ", "name_full_name_ua": "м. Київ, …", "zone": 1 },
  "birthDateOwner": "1989-01-01",
  "additionalParameters": { "capacity": 1600, "numberOfSeats": 5, "ownWeight": 1000, "totalWeight": 1500 }
}
```
> З реєстру приходить лише **рік** народження власника (день/місяць — фейкові). Ліміт: 20 / 10 хв.

### 2. Пошук міста (ручний ввід, якщо авто не в реєстрі)
`GET /api/vehicle/cities?q=береж`  → `data: [{ id, name_ua, name_full_name_ua, zone }]` (мін. 2 символи).

### 3. Прорахунок пропозицій
`GET /api/insurance/offers` з query-параметрами:

| параметр | приклад | опис |
|---|---|---|
| `autoCategoryType` | `B1` | категорія ТЗ |
| `registrationPlaceId` | `1` | cityId |
| `zone` | `1` | зона |
| `carYear` | `2015` | рік випуску |
| `period_id` | `12` | 12=рік, 6=пів року |
| `customerType` | `1` | 1=фіз, 3=пільговик |
| `customerPrivilege` | `1` | id пільги |
| `registrationType` | `1` | |
| `startDate` | `21.08.2026` | DD.MM.YYYY (зазвичай завтра) |
| `carBirthdayAt` | `01.01.1989` | ДН власника |
| `policyholderBirthday` | `01.01.1990` | ДН страхувальника |
| `youngestBirthday` | `05.05.1995` | ДН наймолодшого водія |
| `nocache` | `1` | (опц.) свіжий offerId перед оформленням |

Різні СК рахують ціну за віком різної особи — бекенд робить це автоматично за трьома датами.

**Відповідь** (увага — подвійний `data`):
```json
{ "success": true, "data": { "data": [ Offer, … ] } }
```
`Offer` (ключове): `offerId`, `companyId`, `companyName`, `companyNamePublic`, `price`,
`periodId`, `moduleId`, `company{…}`,
`listAutolawyer: [{ id, price, program }]` (program 2/3 — вищі пакети: Стандарт/Комфорт/Комфорт+),
`listDgo: { "<key>": { id, coverage, cost } }` (додаткове покриття — обʼєкт, не масив).

> `offerId` живе недовго — перед оформленням оновіть із `nocache=1`, інакше declare дасть 422.

### 4. Реєстрація pending-order (для надійної фіналізації)
`POST /api/pending-order`  → `{ orderId, product: "osago", orderPayload, meta }`
Зберігає повний payload у БД, щоб finalize міг доофорити навіть після оплати.

### 5. Створення поліса
`POST /api/insurance/order`
- Чернетка: `{ "action": "draft", …orderPayload }`
- Заявити: `{ "action": "declare", …orderPayload }`  → повертає `orderId`.

> `orderPayload` = повний обʼєкт замовлення ОСЦПВ (customer, car, offer, обрані опції). Структуру
> дзеркальте з веб-функції `buildOrderPayload` (файл `src/components/insurance/CheckoutClient.tsx`).
> Заповнюйте dgo/autolawyer id з обраних `listDgo`/`listAutolawyer`.

### 6. OTP (підтвердження email/телефону)
`POST /api/insurance/otp`
- Надіслати код: `{ "action": "send", "orderId": "…" }`
- Перевірити: `{ "action": "check", "orderId": "…", "otp": "1234" }` → `{ success, valid }`.

### 7. Інвойс + оплата
`POST /api/insurance/payment`
- Отримати інвойс: `{ "action": "invoice", "orderId": "…" }` → повертає дані інвойсу/URL LiqPay.
- Перевірити статус: `{ "action": "check", "orderId": "…" }`.

Оплату LiqPay у застосунку відкривайте у вбудованому браузері (in-app WebView) або через
LiqPay SDK; після повернення — крок 8.

### 8. Фіналізація (видача поліса)
`POST /api/finalize`  → `{ "orderId": "…" }`
- Якщо не оплачено: `{ success: true, paid: false }`.
- Якщо оплачено: підтверджує поліс у СК, зберігає в БД, повертає `contractId` (МТСБУ).

Альтернативно `POST /api/insurance/contract` `{ action: "confirm"|"download", orderId, contractId }` —
підтвердження/завантаження PDF.

---

## Інші продукти (аналогічно)

Групи роутів дзеркалять OSAGO:
- **Зелена карта:** `/api/greencard` (калк), `/api/greencard/order`
- **Туристичне:** `/api/tourism`, `/api/tourism/order`
- **Тварини:** `/api/pets`, `/api/pets/order`
- **Житло:** `/api/home`, `/api/home/cities`, `/api/home/order`
- **Міні-КАСКО:** `/api/mini-kasko`, `/api/mini-kasko/order`, `/api/mini-kasko/download/{orderId}`
- **Фіналізація — спільна:** `/api/finalize` (product-agnostic).

## Кабінет / профіль (потребують сесії)
- `GET /api/policies` → список полісів користувача (за email/телефоном сесії). 401 без авторизації.
- `GET|POST /api/profile` → профіль страхувальника (зашифрований у БД).

## Аналітика (опційно)
- `POST /api/lead`, `POST /api/track` — трекінг воронки (не обовʼязково для MVP).

---

## Сканування техпаспорта/номера (порада)
Найнадійніше: OCR **лише номерного знака** (ML Kit, підтримка кирилиці) → далі
`GET /api/vehicle/{plate}` підтягне всі дані з реєстру. Повний OCR техпаспорта — запасний
шлях (розпізнати VIN/номер), якщо авто нема в реєстрі.

## Що зробити на бекенді (цей репозиторій)
1. Згенерувати ключ: `openssl rand -hex 32`.
2. Додати секрет **MOBILE_API_KEY** у Firebase App Hosting
   (`apphosting.yaml` + `firebase apphosting:secrets:set MOBILE_API_KEY`) і в `.env.local` для dev.
3. Той самий ключ покласти в конфіг застосунку (env / secure store) і слати в `x-api-key`.
