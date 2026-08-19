"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Customer } from "@/types/api";
import { useI18n } from "@/lib/i18n";

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (customer: Customer) => void;
  loading?: boolean;
}

export function CustomerFormModal({ open, onClose, onSubmit, loading }: CustomerFormModalProps) {
  const { t } = useI18n();
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
    <Modal open={open} onClose={onClose} title={t({ uk: "Дані страхувальника (покупця)", en: "Policyholder (buyer) details" })} size="2xl" preventOutsideClose>
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Особисті дані", en: "Personal details" })}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label={t({ uk: "Прізвище", en: "Surname" })} value={form.surname} onChange={set("surname")} required />
            <Input label={t({ uk: "Ім'я", en: "First name" })} value={form.name} onChange={set("name")} required />
            <Input label={t({ uk: "По-батькові", en: "Patronymic" })} value={form.patronymic} onChange={set("patronymic")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label={t({ uk: "Дата народження", en: "Date of birth" })}
            type="date"
            value={form.dateBirth}
            onChange={set("dateBirth")}
            required
          />
          <Input
            label={t({ uk: "ІПН / ЄДРПО", en: "Tax ID / USREOU" })}
            value={form.identificationCode}
            onChange={set("identificationCode")}
            placeholder="1234567890"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label={t({ uk: "Телефон", en: "Phone" })}
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

        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "ID-карта (документ)", en: "ID card (document)" })}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={t({ uk: "Серія/Запис №", en: "Series / Record no." })}
              value={form.docSerial}
              onChange={set("docSerial")}
              placeholder="19860427-09718"
              required
            />
            <Input
              label={t({ uk: "Номер документа", en: "Document number" })}
              value={form.docNumber}
              onChange={set("docNumber")}
              required
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={t({ uk: "Ким видано (код органу)", en: "Issued by (authority code)" })}
              value={form.docIssuedBy}
              onChange={set("docIssuedBy")}
              required
            />
            <Input
              label={t({ uk: "Дата видачі", en: "Date of issue" })}
              type="date"
              value={form.docDate}
              onChange={set("docDate")}
              required
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Адреса проживання", en: "Residential address" })}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input label={t({ uk: "Вулиця", en: "Street" })} value={form.street} onChange={set("street")} required />
            </div>
            <Input label={t({ uk: "Будинок / кв.", en: "House / apt." })} value={form.house} onChange={set("house")} required />
          </div>
          <div className="mt-3">
            <Input label={t({ uk: "Місто", en: "City" })} value={form.city} onChange={set("city")} placeholder={t({ uk: "Київ", en: "Kyiv" })} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" size="md" onClick={onClose} className="flex-1">
            {t({ uk: "Скасувати", en: "Cancel" })}
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
            {t({ uk: "Продовжити", en: "Continue" })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
