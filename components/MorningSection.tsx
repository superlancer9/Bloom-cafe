import Image from "next/image";
import { images } from "@/lib/site-config";

export function MorningSection() {
  return (
    <section
      id="about"
      className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-linen-border"
    >
      <div className="max-w-2xl mb-10 md:mb-14">
        <span className="text-xs uppercase tracking-widest text-terracotta font-medium block mb-2">
          Morning
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-espresso font-normal tracking-tight mb-4">
          First coffee. Something warm from the oven.
        </h2>
        <p className="text-espresso-soft text-base sm:text-lg font-light leading-relaxed">
          We start early. Coffee on, pastries out, kitchen warming up.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="md:col-span-7">
          <div className="relative rounded-xl overflow-hidden bg-linen-dim border border-linen-border aspect-[4/3]">
            <Image
              src={images.latte}
              alt="Close-up of a freshly poured latte in a handcrafted ceramic mug"
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
          </div>
          <p className="text-xs text-espresso-soft mt-3 font-light italic">
            Double shot espresso, velvety oat milk, roasted locally.
          </p>
        </div>
        <div className="md:col-span-5 md:pt-10">
          <div className="relative rounded-xl overflow-hidden bg-linen-dim border border-linen-border aspect-[4/3]">
            <Image
              src={images.bakery}
              alt="Freshly baked sourdough and croissants on a linen bakery cloth"
              fill
              sizes="(max-width: 768px) 100vw, 460px"
              className="object-cover"
            />
          </div>
          <p className="text-xs text-espresso-soft mt-3 font-light italic">
            Wild-ferment sourdough loaves and laminated butter croissants every morning at
            7:30.
          </p>
        </div>
      </div>
    </section>
  );
}
