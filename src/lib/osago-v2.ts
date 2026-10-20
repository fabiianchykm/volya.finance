import type { InsuranceOffer, OsagoV2Offer } from "@/types/api";

// Адаптер пропозиції ОСЦПВ з Ukasko API v2 у форму InsuranceOffer, яку споживає UI
// (OfferCard / OffersSection / CheckoutClient). Спільний для offers-роуту й тестів.

// Кінець дії поліса: початок + періоду місяців − 1 день (d.m.Y). v2 його не віддає.
function endDateFor(startDate: string, periodMonths: number): string | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(startDate);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  d.setMonth(d.getMonth() + periodMonths);
  d.setDate(d.getDate() - 1);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

// v2-пропозиція → форма InsuranceOffer, яку споживають OfferCard/OffersSection/Checkout.
export function toInsuranceOffer(o: OsagoV2Offer): InsuranceOffer {
  const dgoCompany = o.dgo?.company ?? null;
  return {
    offerId: o.offerId,
    companyId: o.company.id,
    companyName: o.company.name,
    companyNamePublic: o.company.name,
    company: {
      id: o.company.id,
      publicName: o.company.name,
      logo: o.company.logo ?? null,
      docProduct: o.company.docProduct ?? null,
      docCompany: o.company.docCompany ?? null,
      docAgent: o.company.docAgent ?? null,
      docZusp: o.company.docZusp ?? null,
      descriptionLink: o.company.descriptionLink ?? null,
    },
    price: Number(o.price) || 0,
    discountPrice: Number(o.discountPrice) || 0,
    discountPercent: o.discountPercent ?? null,
    startDate: o.startDate,
    endDate: endDateFor(o.startDate, Number(o.periodId) || 12),
    periodId: Number(o.periodId) || 12,
    dateFromMax: o.dateFromMax ?? null,
    autoCategoryType: o.autoCategoryType,
    customerType: Number(o.customerType) || 1,
    tariffName: o.tariffName ?? "",
    programmName: o.programName ?? null,
    ageSemantic: o.ageSemantic ?? null,
    driverAgeHint: o.driverAgeHint ?? null,
    dgoRequired: o.dgo?.required === true,
    listDgo: (o.dgo?.options ?? []).map((d) => ({
      id: d.id,
      cost: String(d.price),
      coverage: Number(d.coverage),
      company_id: dgoCompany?.id ?? o.company.id,
      companyName: dgoCompany?.name ?? null,
      sameCompany: o.dgo?.sameCompany !== false,
    })),
    listAutolawyer: (o.autolawyer?.options ?? []).map((a) => ({
      id: a.id,
      price: Number(a.price) || 0,
      program: a.program ?? null,
      programName: a.programName ?? null,
    })),
  };
}

