import { LeadProductPage, leadProductMetadata } from "@/components/lead-product/LeadProductPage";

export const metadata = leadProductMetadata("passengers");

export default function Page() {
  return <LeadProductPage slug="passengers" />;
}
