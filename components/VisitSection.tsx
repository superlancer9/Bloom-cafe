import Image from "next/image";
import { images, siteConfig } from "@/lib/site-config";

export function VisitSection() {
  return (
    <section
      id="visit"
      className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-linen-border"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl overflow-hidden bg-linen-dim border border-linen-border aspect-[4/3] shadow-sm">
            <Image
              src={images.storefront}
              alt="The Bloom & Bean storefront in Makati with an outdoor bench and plants"
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>
          <p className="text-xs text-espresso-soft mt-3 font-light italic">
            Corner storefront with sidewalk timber bench and bicycle rack.
          </p>
        </div>

        <div className="lg:col-span-6 lg:pl-6 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-olive font-medium block mb-2">
              Location &amp; Hours
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-espresso font-normal tracking-tight mb-4">
              Find us in Makati.
            </h2>
            <p className="text-espresso-soft text-base font-light leading-relaxed">
              Tucked into a quiet corner shaded by trees. Walkable from the neighborhood
              parks.
            </p>
          </div>

          <dl className="space-y-4 text-sm font-light divide-y divide-linen-border pt-2">
            <div className="pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
              <dt className="font-medium text-espresso text-xs uppercase tracking-wider">
                Address
              </dt>
              <dd className="text-espresso-soft sm:text-right">{siteConfig.address}</dd>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
              <dt className="font-medium text-espresso text-xs uppercase tracking-wider">
                Opening Hours
              </dt>
              <dd className="text-espresso-soft sm:text-right">
                <p>{siteConfig.openingHours}</p>
                <p className="text-xs text-espresso-soft/80">
                  {siteConfig.openingHoursNote}
                </p>
              </dd>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
              <dt className="font-medium text-espresso text-xs uppercase tracking-wider">
                Phone
              </dt>
              <dd className="text-espresso-soft sm:text-right font-mono">
                {siteConfig.phone}
              </dd>
            </div>
          </dl>

          <div className="flex justify-end">
            <a
              href={siteConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-terracotta font-medium text-sm hover:text-terracotta-dark transition-colors group"
            >
              <span>Open in Google Maps</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
