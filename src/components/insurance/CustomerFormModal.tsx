"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Customer } from "@/types/api";

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (customer: Customer) => void;
  loading?: boolean;
}

export function CustomerFormModal({ open, onClose, onSubmit, loading }: CustomerFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    patronymic: "",
    phone: "",
    email: "",
    identificationCode: "",
    dateBirth: "",
    street: "",
    house: "",
    city: "",
    docSerial: "",
    docNumber: "",
    docIssuedBy: "",
    docDate: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateBirth = Math.floor(new Date(form.dateBirth).getTime() / 1000);
    const dateOfIssue = Math.floor(new Date(form.docDate).getTime() / 1000);

    onSubmit({
      customerType: 1,
      name: form.name,
      surname: form.surname,
      patronymic: form.patronymic,
      identificationCode: form.identificationCode,
      dateBirth,
      phone: form.phone,
      email: form.email,
      documentation: {
        type: 3,
        serial: form.docSerial,
        number: form.docNumber,
        issuedBy: form.docIssuedBy,
        dateOfIssue,
        endDateOfIssue: null,
      },
      address: {
        cityId: 1,
        street: form.street,
        house: form.house,
        cityName: form.city || "Київ",
        full: `${form.street}, ${form.house}, ${form.city || "Київ"}`,
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Дані страхувальника" size="2xl" preventOutsideClose>
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Особисті дані
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Прізвище" value={form.surname} onChange={set("surname")} required />
            <Input label="Ім'я" value={form.name} onChange={set("name")} required />
            <Input label="По-батькові" value={form.patronymic} onChange={set("patronymic")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Дата народження"
            type="date"
            value={form.dateBirth}
            onChange={set("dateBirth")}
            required
          />
          <Input
            label="ІПН / ЄДРПО"
            value={form.identificationCode}
            onChange={set("identificationCode")}
            placeholder="1234567890"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Телефон"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+38 (0XX) XXX-XX-XX"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="email@example.com"
            required
          />
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            ID-карта (документ)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Серія/Запис №"
              value={form.docSerial}
              onChange={set("docSerial")}
              placeholder="19860427-09718"
              required
            />
            <Input
              label="Номер документа"
              value={form.docNumber}
              onChange={set("docNumber")}
              required
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Ким видано (код органу)"
              value={form.docIssuedBy}
              onChange={set("docIssuedBy")}
              required
            />
            <Input
              label="Дата видачі"
              type="date"
              value={form.docDate}
              onChange={set("docDate")}
              required
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Адреса проживання
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input label="Вулиця" value={form.street} onChange={set("street")} required />
            </div>
            <Input label="Будинок / кв." value={form.house} onChange={set("house")} required />
          </div>
          <div className="mt-3">
            <Input label="Місто" value={form.city} onChange={set("city")} placeholder="Київ" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" size="md" onClick={onClose} className="flex-1">
            Скасувати
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
            Продовжити
          </Button>
        </div>
      </form>
    </Modal>
  );
}
