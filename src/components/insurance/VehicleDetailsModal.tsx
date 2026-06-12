"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { VehicleData } from "@/types/insurance";

export interface VehicleDetails {
  odometr: string;
  kilometers: string;
  capacity: string;
  numberOfSeats: string;
  ownWeight: string;
  totalWeight: string;
  birthdayAt: string;
}

interface VehicleDetailsModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: VehicleData;
  customerBirthDate: string; // timestamp → ми конвертуємо в dd.mm.yyyy
  onSubmit: (details: VehicleDetails) => void;
  loading?: boolean;
}

function timestampToDMY(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function VehicleDetailsModal({
  open,
  onClose,
  vehicle,
  customerBirthDate,
  onSubmit,
  loading,
}: VehicleDetailsModalProps) {
  const [form, setForm] = useState<VehicleDetails>({
    odometr: "",
    kilometers: "",
    capacity: vehicle.capacity ? String(vehicle.capacity) : "",
    numberOfSeats: vehicle.numberOfSeats ? String(vehicle.numberOfSeats) : "",
    ownWeight: vehicle.ownWeight ? String(vehicle.ownWeight) : "",
    totalWeight: vehicle.totalWeight ? String(vehicle.totalWeight) : "",
    birthdayAt: customerBirthDate,
  });

  const set = (key: keyof VehicleDetails) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isElectric = vehicle.autoCategory === "B5";

  return (
    <Modal open={open} onClose={onClose} title="Дані транспортного засобу" size="lg" preventOutsideClose>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Дані з API — тільки для перегляду */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Дані з реєстру
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {[
              { label: "Марка", value: vehicle.mark },
              { label: "Модель", value: vehicle.model },
              { label: "Рік", value: vehicle.year },
              { label: "Номер", value: vehicle.number },
              { label: "VIN", value: vehicle.vin || "—" },
              { label: "Категорія", value: vehicle.autoCategory },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{label}</span>
                <span className="text-xs font-semibold text-zinc-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Дата народження водія */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Водій
          </p>
          <Input
            label="Дата народження наймолодшого водія (дд.мм.рррр)"
            placeholder="01.01.1990"
            value={form.birthdayAt}
            onChange={set("birthdayAt")}
            required
          />
        </div>

        {/* Пробіг */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Пробіг
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Поточний пробіг (км)"
              placeholder="50000"
              value={form.odometr}
              onChange={set("odometr")}
              required
            />
            <Input
              label="Максимальний пробіг ТЗ (км)"
              placeholder="200000"
              value={form.kilometers}
              onChange={set("kilometers")}
              required
            />
          </div>
        </div>

        {/* Технічні характеристики */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Технічні характеристики
          </p>
          <div className="grid grid-cols-2 gap-3">
            {isElectric ? (
              <Input
                label="Потужність (кВт)"
                placeholder="150"
                value={form.capacity}
                onChange={set("capacity")}
                required
              />
            ) : (
              <Input
                label="Об'єм двигуна (см³)"
                placeholder="1600"
                value={form.capacity}
                onChange={set("capacity")}
                required
              />
            )}
            <Input
              label="Кількість місць"
              placeholder="5"
              value={form.numberOfSeats}
              onChange={set("numberOfSeats")}
              required
            />
            <Input
              label="Маса без навантаження (кг)"
              placeholder="1200"
              value={form.ownWeight}
              onChange={set("ownWeight")}
              required
            />
            <Input
              label="Повна маса (кг)"
              placeholder="1600"
              value={form.totalWeight}
              onChange={set("totalWeight")}
              required
            />
          </div>
        </div>

        <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
          Продовжити
        </Button>
      </form>
    </Modal>
  );
}
