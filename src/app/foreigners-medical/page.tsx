import { LeadProductPage, leadProductMetadata } from "@/components/lead-product/LeadProductPage";

export const metadata = leadProductMetadata("foreigners-medical");

export default function Page() {
  return <LeadProductPage slug="foreigners-medical" />;
}
