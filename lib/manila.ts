import { siteConfig } from "./site-config";

/** Today's calendar date in the café's timezone, as YYYY-MM-DD. */
export function todayInCafeTimezone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: siteConfig.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "September 5, 2026, 11:30 AM PHT" — used in the Sheet note and the email. */
export function formatSubmittedAt(now: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: siteConfig.timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  return `${formatted} PHT`;
}

/** "Saturday, September 5, 2026" from a YYYY-MM-DD string. */
export function formatVisitDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "11:30 AM" from a 24h HH:mm string. */
export function formatArrivalTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}
