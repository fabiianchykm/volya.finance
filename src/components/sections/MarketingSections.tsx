import { FeaturesSection } from "./FeaturesSection";
import { InsurersSection } from "./InsurersSection";
import { ReviewsSection } from "./ReviewsSection";
import { ReferralBanner } from "./ReferralBanner";
import { FAQSection } from "./FAQSection";
import { CTAWrapper } from "./CTAWrapper";

// Спільний маркетинговий блок під усіма сторінками (головна + продукти): переваги,
// страхові, відгуки, CTA (+ FAQ за потреби). Один компонент — щоб не дублювати
// й не забувати оновлювати кожну сторінку окремо.
export function MarketingSections({ showFaq = false }: { showFaq?: boolean }) {
  return (
    <>
      <FeaturesSection />
      <InsurersSection />
      <ReferralBanner />
      <ReviewsSection />
      {showFaq && <FAQSection />}
      <CTAWrapper />
    </>
  );
}
