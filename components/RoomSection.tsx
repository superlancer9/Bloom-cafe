import Image from "next/image";
import { images } from "@/lib/site-config";

const features = [
  { color: "bg-terracotta", text: "Quiet corners with power points for reading and writing" },
  { color: "bg-olive", text: "Communal reclaimed timber tables for group discussions" },
  {
    color: "bg-terracotta",
    text: "Dog-friendly sidewalk outdoor bench beneath the linen awning",
  },
];

export function RoomSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-linen-border">
      <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center mb-10">
        <div className="md:col-span-6 lg:col-span-5">
          <h2 className="font-serif text-3xl sm:text-4xl text-espresso font-normal tracking-tight mb-4">
            Stay awhile.
          </h2>
          <p className="text-espresso-soft text-base sm:text-lg font-light leading-relaxed mb-6">
            Some people stay ten minutes. Some stay until lunch. There is room for both.
          </p>
          <ul className="space-y-3 text-sm text-espresso-soft font-light">
            {features.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${feature.color}`}
                  aria-hidden="true"
                />
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-6 lg:col-span-7">
          <div className="relative rounded-2xl overflow-hidden bg-linen-dim border border-linen-border shadow-sm aspect-[16/10]">
            <Image
              src={images.interior}
              alt="People chatting, reading, and working at wooden tables in Bloom & Bean"
              fill
              sizes="(max-width: 768px) 100vw, 660px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
