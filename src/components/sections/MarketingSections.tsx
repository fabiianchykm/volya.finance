import { FeaturesSection } from "./FeaturesSection";
import { InsurersSection } from "./InsurersSection";
import { ReviewsSection } from "./ReviewsSection";
import { ReferralBanner } from "./ReferralBanner";
import { FAQSection } from "./FAQSection";
import { CTAWrapper } from "./CTAWrapper";
import type { FaqItem } from "@/lib/faq";

// Спільний маркетинговий блок під усіма сторінками (головна + продукти): переваги,
// страхові, відгуки, CTA (+ FAQ за потреби). Один компонент — щоб не дублювати
// й не забувати оновлювати кожну сторінку окремо. `faqItems`/`faqSubtitle` —
// щоб кожен продукт показував свій набір питань.
export function MarketingSections({
  showFaq = false,
  faqItems,
  faqSubtitle,
}: {
  showFaq?: boolean;
  faqItems?: FaqItem[];
  faqSubtitle?: string;
}) {
  return (
    <>
      {/* FAQ одразу під калькулятором/пропозиціями — питання виникають саме там,
          а не після відгуків і банерів. */}
      {showFaq && <FAQSection items={faqItems} subtitle={faqSubtitle} />}
      <FeaturesSection />
      <InsurersSection />
      <ReferralBanner />
      <ReviewsSection />
      <CTAWrapper />
    </>
  );
}
