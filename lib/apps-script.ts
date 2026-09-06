import "server-only";

export type AppsScriptResult = {
  ok: boolean;
  recorded: boolean;
  emailSent: boolean;
  reservationCode?: string;
  errorCode?: string;
};

export type AppsScriptOutcome =
  | { kind: "ok"; result: AppsScriptResult }
  | { kind: "not_configured" }
  | { kind: "html_response" }
  | { kind: "transport_error" };

const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Posts a validated reservation to the spreadsheet-bound Apps Script Web App.
 *
 * Apps Script answers a POST with a 302 to script.googleusercontent.com, so
 * redirects must be followed. If the final response is HTML rather than JSON,
 * the deployment's "Who has access" is almost certainly not set to "Anyone" and
 * Google served a sign-in page instead.
 */
export async function postToAppsScript(
  payload: Record<string, unknown>
): Promise<AppsScriptOutcome> {
  const url = process.env.APPS_SCRIPT_WEB_APP_URL;
  const secret = process.env.APPS_SCRIPT_SHARED_SECRET;

  if (!url || !secret) return { kind: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      cache: "no-store",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, secret }),
      signal: controller.signal,
    });

    const text = await response.text();
    const trimmed = text.trim();

    if (!trimmed.startsWith("{")) return { kind: "html_response" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { kind: "html_response" };
    }

    if (typeof parsed !== "object" || parsed === null) return { kind: "transport_error" };

    const raw = parsed as Record<string, unknown>;
    return {
      kind: "ok",
      result: {
        ok: raw.ok === true,
        recorded: raw.recorded === true,
        emailSent: raw.emailSent === true,
        reservationCode:
          typeof raw.reservationCode === "string" ? raw.reservationCode : undefined,
        errorCode: typeof raw.errorCode === "string" ? raw.errorCode : undefined,
      },
    };
  } catch {
    // Deliberately does not log the payload or the upstream body: both may
    // contain guest personal data or the shared secret.
    return { kind: "transport_error" };
  } finally {
    clearTimeout(timer);
  }
}
