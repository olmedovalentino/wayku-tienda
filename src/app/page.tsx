import { Hero } from "@/components/home/Hero";
import { BestSellers } from "@/components/home/BestSellers";
import { SpecialOffer } from "@/components/home/SpecialOffer";

export default function Home() {
  return (
    <div className="flex flex-col bg-white">
      <Hero />
      <BestSellers />
      <SpecialOffer />
    </div>
  );
}
