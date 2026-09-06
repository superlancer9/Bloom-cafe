import Image from "next/image";
import { images, siteConfig } from "@/lib/site-config";

export function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 md:pt-14 md:pb-24">
      <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-end mb-8">
        <div className="md:col-span-8 lg:col-span-7">
          <p className="text-xs uppercase tracking-widest text-olive font-medium mb-3">
            {siteConfig.tagline}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-espresso font-normal tracking-tight leading-[1.15]">
            Coffee, and somewhere to sit.
          </h1>
        </div>
        <div className="md:col-span-4 lg:col-span-5 md:pb-2">
          <p className="text-espresso-soft text-base sm:text-lg leading-relaxed font-light mb-6">
            Doors open early. Come in for a quick cup, breakfast, or an afternoon that
            runs longer than planned.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#reserve"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-terracotta text-linen font-medium text-sm hover:bg-terracotta-dark transition-colors shadow-sm"
            >
              Reserve a Table
            </a>
            <a
              href="#menu"
              className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-linen-border text-espresso font-medium text-sm hover:border-espresso transition-colors"
            >
              See the Menu
            </a>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-linen-dim border border-linen-border/60 aspect-[16/9] shadow-sm mb-6">
        <Image
          src={images.interior}
          alt="Morning sunlight in the Bloom & Bean café, patrons relaxing with books and coffee"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-espresso-soft border-b border-linen-border pb-5 pt-1 font-light">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-olive" aria-hidden="true" />
          <span>
            Open today:{" "}
            <span className="font-medium text-espresso">{siteConfig.openToday}</span>
          </span>
          <span className="text-linen-border" aria-hidden="true">
            |
          </span>
          <span>Kitchen serves until {siteConfig.kitchenUntil}</span>
        </div>
        <div className="flex items-center gap-2 text-espresso-soft">
          <svg
            className="w-4 h-4 text-terracotta shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            Location:{" "}
            <span className="font-medium text-espresso">{siteConfig.addressShort}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
