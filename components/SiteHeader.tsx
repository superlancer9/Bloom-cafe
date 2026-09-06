import Image from "next/image";
import { images, siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-linen/90 backdrop-blur-md border-b border-linen-border/70">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group">
          <Image
            src={images.emblem}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 object-contain rounded-full border border-linen-border/80"
          />
          <span className="font-serif text-xl tracking-tight font-medium text-espresso group-hover:text-terracotta transition-colors">
            {siteConfig.cafeName}
          </span>
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-espresso-soft"
        >
          <a href="#about" className="hover:text-espresso transition-colors">
            About
          </a>
          <a href="#menu" className="hover:text-espresso transition-colors">
            Menu
          </a>
          <a href="#visit" className="hover:text-espresso transition-colors">
            Visit
          </a>
          <a
            href="#reserve"
            className="px-4 py-2 rounded-full border border-espresso text-espresso hover:bg-espresso hover:text-linen transition-all duration-200"
          >
            Reserve a Table
          </a>
        </nav>

        <a
          href="#reserve"
          className="md:hidden text-xs font-medium px-3.5 py-1.5 rounded-full border border-espresso text-espresso hover:bg-espresso hover:text-linen transition-colors"
        >
          Reserve
        </a>
      </div>
    </header>
  );
}
