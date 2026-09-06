import { NextResponse } from "next/server";
import { reservationSchema, type ReservationResponse } from "@/lib/reservation-schema";
import { generateReservationCode } from "@/lib/reservation-code";
import { postToAppsScript } from "@/lib/apps-script";
import { formatSubmittedAt } from "@/lib/manila";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGES = {
  success:
    "Request received. Your table is pending confirmation. We sent the payment instructions to your email.",
  emailFailed:
    "Your request was recorded, but we could not send the email. Please contact the café and provide your reservation code.",
  validation: "Please check the highlighted fields and try again.",
  config:
    "Reservations are temporarily unavailable. Please message the café directly — we're sorry for the trouble.",
  failure:
    "We could not save your request just now. Please try again in a moment, or message the café directly.",
};

function json(body: ReservationResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ status: "validation_error", message: MESSAGES.validation }, 400);
  }

  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json(
      { status: "validation_error", message: MESSAGES.validation, fieldErrors },
      400
    );
  }

  // Honeypot: a real guest never sees this field, so anything in it is a bot.
  // Answer with the normal success shape so scrapers learn nothing.
  if (parsed.data.website) {
    return json({ status: "success", message: MESSAGES.success }, 200);
  }

  const reservation = parsed.data;
  const reservationCode = generateReservationCode();

  const outcome = await postToAppsScript({
    reservationCode,
    fullName: reservation.fullName,
    email: reservation.email,
    phone: reservation.phone,
    date: reservation.date,
    time: reservation.time,
    guests: reservation.guests,
    occasion: reservation.occasion,
    requests: reservation.requests,
    submittedAt: formatSubmittedAt(),
  });

  if (outcome.kind === "not_configured") {
    console.error("[reservations] Apps Script env vars are missing.");
    return json({ status: "config_error", message: MESSAGES.config }, 503);
  }

  if (outcome.kind === "html_response") {
    console.error(
      "[reservations] Apps Script returned HTML instead of JSON. The Web App " +
        'deployment access is likely not set to "Anyone", or the URL does not end in /exec.'
    );
    return json({ status: "config_error", message: MESSAGES.config }, 502);
  }

  if (outcome.kind === "transport_error") {
    console.error("[reservations] Could not reach the Apps Script Web App.");
    return json({ status: "error", message: MESSAGES.failure }, 502);
  }

  const { result } = outcome;

  if (!result.recorded) {
    console.error(
      `[reservations] Apps Script rejected the write. errorCode=${result.errorCode ?? "unknown"}`
    );
    return json({ status: "error", message: MESSAGES.failure }, 502);
  }

  if (!result.emailSent) {
    return json(
      { status: "recorded_email_failed", message: MESSAGES.emailFailed, reservationCode },
      200
    );
  }

  return json({ status: "success", message: MESSAGES.success, reservationCode }, 200);
}
