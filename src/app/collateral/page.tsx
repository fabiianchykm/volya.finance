import { LeadProductPage, leadProductMetadata } from "@/components/lead-product/LeadProductPage";

export const metadata = leadProductMetadata("collateral");

export default function Page() {
  return <LeadProductPage slug="collateral" />;
}
