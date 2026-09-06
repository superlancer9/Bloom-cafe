import Image from "next/image";
import { images } from "@/lib/site-config";

export function AfternoonSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-linen-border">
      <div className="max-w-2xl mb-8">
        <span className="text-xs uppercase tracking-widest text-terracotta font-medium block mb-2">
          Afternoon
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-espresso font-normal tracking-tight mb-4">
          Lunch, coffee, then maybe one more.
        </h2>
        <p className="text-espresso-soft text-base sm:text-lg font-light leading-relaxed">
          The kitchen stays open, the coffee keeps coming, and nobody is watching the
          clock.
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-linen-dim border border-linen-border aspect-[16/9] shadow-sm">
        <Image
          src={images.food}
          alt="Afternoon light over a table with coffee, salad, and lunch plates"
          fill
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover"
        />
      </div>
    </section>
  );
}
