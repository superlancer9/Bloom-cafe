import Image from "next/image";
import { images, siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="bg-linen-dim border-t border-linen-border py-12 mt-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-linen-border">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image
                src={images.emblem}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 object-contain rounded-full"
              />
              <span className="font-serif text-lg font-medium text-espresso">
                {siteConfig.cafeName}
              </span>
            </div>
            <p className="text-xs text-espresso-soft font-light">
              Makati neighborhood café. Made for slow mornings and unhurried afternoons.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-espresso-soft font-light">
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terracotta transition-colors"
            >
              Instagram: {siteConfig.instagramHandle}
            </a>
            <a
              href={`mailto:${siteConfig.publicEmail}`}
              className="hover:text-terracotta transition-colors"
            >
              Email: {siteConfig.publicEmail}
            </a>
            <span>{siteConfig.addressShort}</span>
            <span>{siteConfig.openingHours}</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-serif text-base text-espresso italic">
            See you in the morning.
          </p>
          <p className="text-xs text-espresso-soft/60 font-light">
            &copy; {siteConfig.cafeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
