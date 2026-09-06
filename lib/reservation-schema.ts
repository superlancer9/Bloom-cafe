import { z } from "zod";
import { arrivalTimeValues, MAX_GUESTS, MIN_GUESTS } from "./site-config";
import { todayInCafeTimezone } from "./manila";

/** Shared by the browser form and the API route — one source of truth. */
export const reservationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(80, "Name must be 80 characters or fewer."),

  email: z
    .email("Please enter a valid email address.")
    .trim()
    .max(120, "Email must be 120 characters or fewer."),

  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(25, "Phone number must be 25 characters or fewer.")
    .regex(/^[+()\-.\s0-9]+$/, "Phone may only contain digits and + ( ) - . spaces.")
    .refine(
      (v) => (v.match(/\d/g) ?? []).length >= 7,
      "Please enter at least 7 digits."
    ),

  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date.")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Please choose a valid date.")
    .refine((v) => v >= todayInCafeTimezone(), "Please choose today or a future date."),

  time: z.enum(arrivalTimeValues as [string, ...string[]], {
    error: () => "Please choose one of the available arrival times.",
  }),

  guests: z.coerce
    .number()
    .int("Guest count must be a whole number.")
    .min(MIN_GUESTS, `At least ${MIN_GUESTS} guest.`)
    .max(MAX_GUESTS, `For parties over ${MAX_GUESTS}, please message the café.`),

  occasion: z.string().trim().max(120, "Please keep this under 120 characters.").default(""),

  requests: z.string().trim().max(300, "Please keep this under 300 characters.").default(""),

  /** Honeypot — must stay empty. Bots fill it in. */
  website: z.string().max(200).optional().default(""),
});

export type ReservationInput = z.input<typeof reservationSchema>;
export type Reservation = z.output<typeof reservationSchema>;

export type ReservationStatus =
  | "success"
  | "recorded_email_failed"
  | "validation_error"
  | "config_error"
  | "error";

export type ReservationResponse = {
  status: ReservationStatus;
  message: string;
  reservationCode?: string;
  fieldErrors?: Record<string, string>;
};
