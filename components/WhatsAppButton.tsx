import { siteConfig } from "@/lib/site-config";

/**
 * Plain fixed link — no API, no environment variable, always visible.
 */
export function WhatsAppButton() {
  return (
    <a
      href={siteConfig.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Message ${siteConfig.cafeName} on WhatsApp`}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-olive px-4 py-3 text-linen shadow-lg hover:bg-olive-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96A9.9 9.9 0 0 0 19.1 4.9 9.9 9.9 0 0 0 12.04 2Zm0 18.16h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.09.81.82-3.01-.2-.31a8.24 8.24 0 0 1 12.79-10.2 8.18 8.18 0 0 1 2.42 5.83c0 4.56-3.71 8.21-8.24 8.21Zm4.52-6.16c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.16.24-.63.8-.78.97-.14.16-.29.19-.53.06-.25-.12-1.05-.38-1.99-1.23-.74-.65-1.23-1.46-1.38-1.71-.14-.24-.01-.37.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.55c.13.16 1.73 2.64 4.19 3.7.58.26 1.04.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
      </svg>
      <span className="text-sm font-medium">WhatsApp</span>
    </a>
  );
}
