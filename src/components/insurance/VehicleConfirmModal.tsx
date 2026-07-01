"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, Pencil } from "lucide-react";

interface City { id: number; name_ua: string; name_full_name_ua: string; zone: number; }
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { VehicleData } from "@/types/insurance";
import { AUTO_CATEGORIES } from "@/lib/constants";

interface VehicleConfirmModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: VehicleData | null;
  plate: string;
  onConfirm: (vehicle: VehicleData) => void;
  loading?: boolean;
  lookupError?: string | null;
  /** Відкрити одразу у формі редагування (для зміни даних з екрана пропозицій). */
  editMode?: boolean;
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

export function VehicleConfirmModal({
  open,
  onClose,
  vehicle,
  plate,
  onConfirm,
  loading,
  lookupError,
  editMode,
}: VehicleConfirmModalProps) {
  const [manualMode, setManualMode] = useState(true);
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
    // editMode → одразу форма редагування; інакше форма лише якщо авто не знайдено.
    setManualMode(!vehicle || !!lookupError || !!editMode);
    setForm({
      mark: vehicle?.mark ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ? String(vehicle.year) : String(currentYear - 5),
      autoCategory: vehicle?.autoCategory ?? "B1",
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
      onConfirm(vehicle);
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
    onConfirm(manualVehicle);
  };

  const isFound = vehicle && !manualMode;

  // Єдине поле вибору міста реєстрації — використовується і в авто-, і в ручному
  // режимі. Засіяне з реєстру, якщо той повернув місто; інакше користувач обирає сам.
  const cityField = (
    <div className="relative" ref={cityRef}>
      <label className="mb-1.5 block text-xs font-medium text-zinc-500">
        Місто реєстрації ТЗ
      </label>
      <input
        type="text"
        value={cityQuery}
        onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
        placeholder="Введіть місто..."
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400"
      />
      {selectedCity ? (
        <p className="mt-1 text-xs text-emerald-600 font-medium">
          ✓ {selectedCity.name_full_name_ua || selectedCity.name_ua} (зона {selectedCity.zone})
        </p>
      ) : (
        <p className="mt-1 text-xs text-amber-600 font-medium">
          Оберіть місто реєстрації зі списку
        </p>
      )}
      {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
          {cityResults.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => { setSelectedCity(city); setCityQuery(city.name_full_name_ua ?? city.name_ua); setCityResults([]); }}
              className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {city.name_full_name_ua ?? city.name_ua}
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
      title={manualMode ? (vehicle ? "Змінити дані авто" : "Введіть дані авто вручну") : undefined}
      size="md"
      className={isFound ? "bg-emerald-50 border border-emerald-100" : ""}
    >
      <div className="space-y-4">

        {/* Auto-lookup failed notice */}
        {(lookupError || (!vehicle && !manualMode)) && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Авто не знайдено автоматично
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Введіть дані вручну — це займе 30 секунд
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
              <p className="text-xl font-bold text-zinc-900">
                {vehicle.mark} {vehicle.model}, {vehicle.year}
              </p>
            </div>

            {/* Місце реєстрації */}
            <div className="text-center">
              <p className="text-sm text-zinc-500">
                <span className="font-medium text-zinc-700">Місце реєстрації: </span>
                {vehicle.cityName?.replace(/,?\s*Україна$/i, '')}
              </p>
            </div>

            {/* VIN та категорія */}
            <div className="text-center space-y-1">
              <p className="text-sm text-zinc-500">
                <span className="font-medium text-zinc-700">VIN: </span>
                {vehicle.vin || '—'}
              </p>
              <p className="text-sm text-zinc-500">
                <span className="font-medium text-zinc-700">Категорія: </span>
                {vehicle.autoCategory} · {categoryLabels[vehicle.autoCategory] ?? vehicle.autoCategory}
              </p>
            </div>

            {/* Кнопка змінити */}
            <div className="pt-1 border-t border-zinc-100">
              <button
                onClick={() => setManualMode(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-zinc-400 hover:text-indigo-600 transition-colors py-2"
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
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-center">
              <span className="text-sm font-mono font-bold tracking-widest text-zinc-900">
                {plate}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Марка авто"
                placeholder="Toyota"
                value={form.mark}
                onChange={set("mark")}
                required
              />
              <Input
                label="Модель"
                placeholder="Camry"
                value={form.model}
                onChange={set("model")}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Рік випуску
                </label>
                <select
                  value={form.year}
                  onChange={set("year")}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Категорія ТЗ
                </label>
                <select
                  value={form.autoCategory}
                  onChange={set("autoCategory")}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400"
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

            {vehicle && !editMode && (
              <button
                onClick={() => setManualMode(false)}
                className="text-xs text-indigo-600 hover:underline"
              >
                ← Повернутись до автоматичних даних
              </button>
            )}
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
