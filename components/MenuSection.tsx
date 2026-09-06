import Image from "next/image";
import { images, menu, type MenuSection as MenuSectionType } from "@/lib/site-config";

function MenuGroup({ section }: { section: MenuSectionType }) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso font-normal pb-3 border-b border-linen-border flex items-center justify-between gap-4">
        <span>{section.title}</span>
        <span className="text-xs uppercase tracking-wider text-espresso-soft font-sans font-normal text-right">
          {section.note}
        </span>
      </h3>
      <div className="divide-y divide-linen-border">
        {section.items.map((item) => (
          <div key={item.name} className="py-4 flex justify-between items-start gap-4">
            <div>
              <h4 className="font-medium text-espresso text-base">{item.name}</h4>
              <p className="text-xs text-espresso-soft font-light mt-1">
                {item.description}
              </p>
            </div>
            <span className="font-mono text-sm text-espresso font-medium whitespace-nowrap">
              {item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuSection() {
  const [coffee, breakfast, kitchen] = menu;

  return (
    <section
      id="menu"
      className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-linen-border"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-olive font-medium block mb-2">
            Our Offerings
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-espresso font-normal tracking-tight">
            A few things we make.
          </h2>
        </div>
        <p className="text-xs text-espresso-soft font-light max-w-sm">
          Simple recipes made with honest ingredients, sourced close to home. Prices
          subject to change.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="space-y-8">
          <MenuGroup section={coffee} />
          <MenuGroup section={breakfast} />
        </div>

        <div className="space-y-8 flex flex-col justify-between">
          <MenuGroup section={kitchen} />

          <div className="pt-2">
            <div className="relative rounded-xl overflow-hidden bg-linen-dim border border-linen-border aspect-[16/9]">
              <Image
                src={images.food}
                alt="Avocado sourdough toast, a fresh grain bowl, and an iced pour-over on a café table"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
            <p className="text-xs text-espresso-soft mt-2.5 font-light italic">
              Prepared in our open kitchen throughout the morning and afternoon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
