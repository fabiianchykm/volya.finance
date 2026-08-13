"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, Pencil, ChevronDown, Check, CalendarRange } from "lucide-react";

interface City { id: number; name_ua: string; name_full_name_ua: string; zone: number; }
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import type { VehicleData } from "@/types/insurance";
import { AUTO_CATEGORIES } from "@/lib/constants";
import { searchMarks, searchModels } from "@/lib/car-catalog";
import { cityShort } from "@/lib/utils";

interface VehicleConfirmModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: VehicleData | null;
  plate: string;
  onConfirm: (vehicle: VehicleData, periodId?: number) => void;
  loading?: boolean;
  lookupError?: string | null;
  /** Відкрити одразу у формі редагування (для зміни даних з екрана пропозицій). */
  editMode?: boolean;
  /** Початковий період поліса: 12 = рік, 6 = пів року. Undefined → перемикач не показуємо (КАСКО). */
  periodId?: number;
}

const categoryLabels: Record<string, string> = {
  B1: "до 1600 см³ (Легковий)",
  B2: "1601–2000 см³ (Легковий)",
  B3: "2001–3000 см³ (Легковий)",
  B4: "більше 3001 см³ (Легковий)",
  B5: "Електромобіль",
  A1: "Мотоцикл до 300 см³",
  A2: "Мотоцикл більше 300 см³",
  D1: "Автобус до 20 місць",
  D2: "Автобус більше 20 місць",
  C1: "Вантажний до 20 т",
  C2: "Вантажний більше 20 т",
  E: "Причіп до вантажних",
  F: "Причіп до легкових",
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

// Авто «знайдене» лише коли реєстр повернув ключові поля для розрахунку ОСЦПВ.
// Без них (порожня марка, year=0, порожня категорія) показувати «підтвердження» не можна.
function isVehicleComplete(v: VehicleData | null): boolean {
  return !!(v && v.mark && v.year && v.autoCategory);
}

export function VehicleConfirmModal({
  open,
  onClose,
  vehicle,
  plate,
  onConfirm,
  loading,
  lookupError,
  editMode,
  periodId,
}: VehicleConfirmModalProps) {
  const [manualMode, setManualMode] = useState(true);
  const [period, setPeriod] = useState(periodId ?? 12);
  const [form, setForm] = useState({
    mark: "",
    model: "",
    year: String(currentYear - 5),
    autoCategory: "B1",
    vin: "",
  });
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || selectedCity) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/vehicle/cities?q=${encodeURIComponent(cityQuery)}`);
      const json = await res.json();
      if (json.success) setCityResults(json.data);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery, selectedCity]);

  // Синхронізуємо форму з даними авто в момент відкриття модалки. Робимо це
  // під час рендеру (рекомендований React патерн «adjusting state on prop change»),
  // а не в ефекті — так немає видимого миготіння між manual/auto і не порушується
  // правило set-state-in-effect. Блок спрацьовує один раз на кожне відкриття.
  if (open && !wasOpen) {
    setWasOpen(true);
    setPeriod(periodId ?? 12);
    // Авто вважаємо «знайденим» лише якщо реєстр повернув КЛЮЧОВІ поля (марка, рік,
    // категорія). Порожні/нульові дані (year=0, категорія «») → одразу форма ручного
    // вводу, а не екран підтвердження з "‚ 0".
    const complete = isVehicleComplete(vehicle);
    setManualMode(!complete || !!lookupError || !!editMode);
    setForm({
      mark: vehicle?.mark ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ? String(vehicle.year) : String(currentYear - 5),
      autoCategory: vehicle?.autoCategory || "B1",
      vin: vehicle?.vin ?? "",
    });
    if (vehicle?.cityId) {
      const name = vehicle.cityName ?? "";
      setSelectedCity({ id: vehicle.cityId, name_ua: name, name_full_name_ua: name, zone: vehicle.zone ?? 0 });
      setCityQuery(name);
    } else {
      setSelectedCity(null);
      setCityQuery("");
    }
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleConfirm = () => {
    if (vehicle && !manualMode) {
      onConfirm(vehicle, period);
      return;
    }
    // Ручний ввід: місто з вибору, із дефолтом Київ, якщо не обрано.
    const manualVehicle: VehicleData = {
      number: plate,
      vin: form.vin,
      year: Number(form.year),
      model: form.model,
      mark: form.mark,
      autoCategory: form.autoCategory,
      cityId: selectedCity?.id ?? 1,
      cityName: selectedCity?.name_full_name_ua || selectedCity?.name_ua || "м. Київ",
      zone: selectedCity?.zone ?? 1,
    };
    onConfirm(manualVehicle, period);
  };

  const vehicleComplete = isVehicleComplete(vehicle);
  const isFound = vehicleComplete && !manualMode;
  // Ручний ввід через невдалий/неповний авто-пошук (а не через кнопку «Дані невірні?»).
  const manualDueToLookup = manualMode && !editMode && !vehicleComplete;

  // Єдине поле вибору міста реєстрації — використовується і в авто-, і в ручному
  // режимі. Засіяне з реєстру, якщо той повернув місто; інакше користувач обирає сам.
  const cityField = (
    <div className="relative" ref={cityRef}>
      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Місто реєстрації ТЗ
      </label>
      <input
        type="text"
        value={cityQuery}
        onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
        placeholder="Введіть місто..."
        spellCheck={false}
        className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 outline-none transition-colors dark:bg-zinc-900 dark:text-zinc-100 ${selectedCity ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/40" : "border-zinc-200 focus:border-indigo-400 dark:border-zinc-700"}`}
      />
      {!selectedCity && (
        <p className="mt-1 text-xs text-amber-600 font-medium">
          Оберіть місто реєстрації зі списку
        </p>
      )}
      {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden dark:border-zinc-700 dark:bg-zinc-900">
          {cityResults.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => { setSelectedCity(city); setCityQuery(cityShort(city.name_full_name_ua ?? city.name_ua)); setCityResults([]); }}
              className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors dark:text-zinc-200 dark:hover:bg-zinc-800/60"
            >
              {cityShort(city.name_full_name_ua ?? city.name_ua)}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={manualMode ? (vehicleComplete ? "Змінити дані авто" : "Введіть дані авто вручну") : undefined}
      size="md"
      className={isFound ? "bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900" : ""}
    >
      <div className="space-y-4">

        {/* Авто не знайдено / реєстр повернув неповні дані → підказка ручного вводу */}
        {manualDueToLookup && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Авто не знайдено в реєстрі
              </p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                Перевірте номер або введіть дані вручну — це займе 30 секунд
              </p>
            </div>
          </div>
        )}

        {/* Auto-filled from API */}
        {vehicle && !manualMode && (
          <div className="space-y-4">

            {/* Номерний знак */}
            <div className="flex justify-center">
              <div className="flex rounded-lg overflow-hidden border-2 border-zinc-400" style={{ height: 48 }}>
                <div className="flex flex-col items-center justify-center bg-blue-700 px-1.5 gap-0.5" style={{ width: 32 }}>
                  <div className="grid grid-cols-3 gap-[2px]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-[3px] w-[3px] rounded-full bg-yellow-300 opacity-90" />
                    ))}
                  </div>
                  <span className="text-white font-bold" style={{ fontSize: 8, letterSpacing: 1 }}>UA</span>
                </div>
                <div className="flex items-center bg-white px-4">
                  <span className="font-bold text-zinc-900 tracking-widest" style={{ fontSize: 20, fontFamily: 'monospace' }}>
                    {vehicle.number}
                  </span>
                </div>
              </div>
            </div>

            {/* Марка, модель, рік */}
            <div className="text-center">
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {vehicle.mark} {vehicle.model}, {vehicle.year}
              </p>
            </div>

            {/* Місце реєстрації */}
            <div className="text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">Місце реєстрації: </span>
                {vehicle.cityName?.replace(/,?\s*Україна$/i, '')}
              </p>
            </div>

            {/* VIN та категорія */}
            <div className="text-center space-y-1">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">VIN: </span>
                {vehicle.vin || '—'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">Категорія: </span>
                {vehicle.autoCategory} · {categoryLabels[vehicle.autoCategory] ?? vehicle.autoCategory}
              </p>
            </div>

            {/* Кнопка змінити */}
            <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setManualMode(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-zinc-400 hover:text-indigo-600 transition-colors py-2 dark:text-zinc-500 dark:hover:text-indigo-400"
              >
                <Pencil className="h-3.5 w-3.5" />
                Дані невірні?
              </button>
            </div>
          </div>
        )}

        {/* Manual form */}
        {manualMode && (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
              <span className="text-sm font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100">
                {plate}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AutocompleteInput
                label="Марка авто"
                placeholder="Toyota"
                value={form.mark}
                onChange={(v) => setForm((f) => ({ ...f, mark: v }))}
                options={searchMarks(form.mark)}
                required
              />
              <AutocompleteInput
                label="Модель"
                placeholder="Camry"
                value={form.model}
                onChange={(v) => setForm((f) => ({ ...f, model: v }))}
                options={searchModels(form.mark, form.model)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Рік випуску
                </label>
                <select
                  value={form.year}
                  onChange={set("year")}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Категорія ТЗ
                </label>
                <select
                  value={form.autoCategory}
                  onChange={set("autoCategory")}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {AUTO_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.value} — {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="VIN-код (якщо є)"
              placeholder="KNEDE221266086429"
              value={form.vin}
              onChange={set("vin")}
            />

            {/* Пошук міста реєстрації */}
            {cityField}

            {vehicleComplete && !editMode && (
              <button
                onClick={() => setManualMode(false)}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                ← Повернутись до автоматичних даних
              </button>
            )}
          </div>
        )}

        {/* Період дії поліса — рік (за замовч.) або пів року. Лише ОСЦПВ. */}
        {periodId !== undefined && (
          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Період страхування</label>
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
        )}

        <div className="flex pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            loading={loading}
            className="w-full"
            disabled={manualMode && (!form.mark || !form.model)}
          >
            Підтвердити
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Гарний кастомний dropdown вибору періоду поліса (замість нативного select).
const PERIOD_OPTIONS = [
  { v: 12, l: "1 рік" },
  { v: 6, l: "Пів року" },
];

function PeriodSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const cur = PERIOD_OPTIONS.find((o) => o.v === value) ?? PERIOD_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-3 text-left transition-colors dark:bg-zinc-900 ${
          open ? "border-indigo-400 ring-1 ring-indigo-400" : "border-zinc-200 hover:border-indigo-300 dark:border-zinc-700"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <CalendarRange className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{cur.l}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform dark:text-zinc-500 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {PERIOD_OPTIONS.map((o) => {
            const active = o.v === value;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => { onChange(o.v); setOpen(false); }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-indigo-50 dark:bg-indigo-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span className={`text-sm font-semibold ${active ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-800 dark:text-zinc-200"}`}>{o.l}</span>
                {active && <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
