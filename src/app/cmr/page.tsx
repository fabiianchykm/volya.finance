import { LeadProductPage, leadProductMetadata } from "@/components/lead-product/LeadProductPage";

export const metadata = leadProductMetadata("cmr");

export default function Page() {
  return <LeadProductPage slug="cmr" />;
}
