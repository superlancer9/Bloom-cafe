import { randomInt } from "node:crypto";
import { todayInCafeTimezone } from "./manila";

/** Unambiguous alphabet: no 0/O, 1/I to keep codes easy to read aloud. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * BB-YYYYMMDD-A1B2 — generated server-side with cryptographically secure
 * randomness so two simultaneous submissions cannot collide in practice.
 */
export function generateReservationCode(now: Date = new Date()): string {
  const datePart = todayInCafeTimezone(now).replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return `BB-${datePart}-${suffix}`;
}
