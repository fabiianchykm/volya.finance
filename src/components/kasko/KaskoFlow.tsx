"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Phone } from "lucide-react";
import { KaskoHero } from "./KaskoHero";
import { PhoneModal } from "./PhoneModal";
import { KASKO_PRODUCTS, type KaskoProduct } from "./products";
import { Button } from "@/components/ui/Button";
import type { VehicleData } from "@/types/insurance";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";

const VehicleConfirmModal = dynamic(
  () => import("@/components/insurance/VehicleConfirmModal").then((m) => m.VehicleConfirmModal),
  { ssr: false }
);

type Step = "hero" | "success";

export function KaskoFlow({ product = "kasko" }: { product?: KaskoProduct }) {
  const config = KASKO_PRODUCTS[product];
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("hero");
  const [plate, setPlate] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Крок 1: номер авто → авто-lookup у реєстрі, далі завжди показуємо модалку.
  const handlePlateSearch = async (p: string) => {
    setLoading(true);
    setLookupError(null);
    trackEvent("calculate_cost", { product });
    try {
      const res = await fetch(`/api/vehicle/${encodeURIComponent(p)}`);
      const json = await res.json();
      if (json.success) {
        const car = json.data;
        setVehicle({
          number: car.number ?? p,
          vin: car.vin ?? "",
          year: Number(car.year),
          model: car.model ?? "",
          mark: car.mark ?? "",
          autoCategory: car.autoCategory ?? "B1",
          ...(car.city?.id
            ? {
                cityId: car.city.id,
                cityName: car.city.name_full_name_ua || car.city.name_ua || "",
                zone: car.city.zone,
              }
            : { cityId: 1, cityName: "м. Київ", zone: 1 }),
        });
      } else {
        setLookupError(json.error ?? t({ uk: "Авто не знайдено в реєстрі", en: "Vehicle not found in the registry" }));
        setVehicle(null);
      }
    } catch {
      setLookupError(t({ uk: "Помилка з'єднання з реєстром", en: "Connection error with the registry" }));
      setVehicle(null);
    } finally {
      setPlate(p);
      setLoading(false);
      setShowVehicleModal(true);
    }
  };

  // Крок 2: авто підтверджено → закриваємо модалку авто, відкриваємо ввід телефону.
  const handleVehicleConfirm = (v: VehicleData) => {
    setVehicle(v);
    setShowVehicleModal(false);
    setSubmitError(null);
    setShowPhoneModal(true);
  };

  // Крок 3: телефон → надсилаємо заявку менеджеру.
  const handlePhoneSubmit = async (phone: string) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/kasko", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          phone,
          product: config.label,
          vehicle: vehicle
            ? {
                number: vehicle.number,
                mark: vehicle.mark,
                model: vehicle.model,
                year: vehicle.year,
                vin: vehicle.vin,
                cityName: vehicle.cityName,
              }
            : {},
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? t({ uk: "Не вдалося надіслати заявку", en: "Failed to submit the request" }));
      trackEvent("generate_lead", { form: "kasko", product });
      setShowPhoneModal(false);
      setStep("success");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t({ uk: "Помилка надсилання", en: "Submission error" }));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4 pt-32 pb-16">
        <div className="w-full max-w-md rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Заявку прийнято!", en: "Request received!" })}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Менеджер передзвонить вам найближчим часом і підбере найкращі умови", en: "A manager will call you back shortly and will select the best" })} {t({ uk: config.label, en: config.labelEn })}
            {" "}{t({ uk: "для", en: "terms for" })} {vehicle?.mark ? `${vehicle.mark} ${vehicle.model}` : t({ uk: "вашого авто", en: "your car" })}.
          </p>
          <Button
            variant="outline"
            size="md"
            className="mx-auto mt-6 flex items-center gap-2"
            onClick={() => {
              setStep("hero");
              setVehicle(null);
              setPlate("");
            }}
          >
            <Phone className="h-4 w-4" />
            {t({ uk: "Подати ще одну заявку", en: "Submit another request" })}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <KaskoHero
        onSearch={handlePlateSearch}
        loading={loading}
        titleLead={config.heroTitleLead}
        titleLeadEn={config.heroTitleLeadEn}
        titleHighlight={config.heroTitleHighlight}
        titleHighlightEn={config.heroTitleHighlightEn}
        subtitle={config.heroSubtitle}
        subtitleEn={config.heroSubtitleEn}
        cta={config.cta}
        ctaEn={config.ctaEn}
      />

      <VehicleConfirmModal
        open={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        vehicle={vehicle}
        plate={plate}
        onConfirm={handleVehicleConfirm}
        loading={loading}
        lookupError={lookupError}
      />

      <PhoneModal
        open={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handlePhoneSubmit}
        loading={submitting}
        error={submitError}
      />
    </>
  );
}
