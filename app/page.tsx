import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { MorningSection } from "@/components/MorningSection";
import { RoomSection } from "@/components/RoomSection";
import { MenuSection } from "@/components/MenuSection";
import { AfternoonSection } from "@/components/AfternoonSection";
import { ReservationSection } from "@/components/ReservationSection";
import { VisitSection } from "@/components/VisitSection";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <div id="top">
      <SiteHeader />
      <main>
        <HeroSection />
        <MorningSection />
        <RoomSection />
        <MenuSection />
        <AfternoonSection />
        <ReservationSection />
        <VisitSection />
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
