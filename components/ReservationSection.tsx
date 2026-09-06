"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  arrivalTimes,
  guestOptions,
  siteConfig,
} from "@/lib/site-config";
import { todayInCafeTimezone } from "@/lib/manila";
import {
  reservationSchema,
  type ReservationResponse,
  type ReservationStatus,
} from "@/lib/reservation-schema";

type FieldName =
  | "fullName"
  | "email"
  | "phone"
  | "guests"
  | "date"
  | "time"
  | "occasion"
  | "requests";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  guests: "2",
  date: "",
  time: "11:30",
  occasion: "",
  requests: "",
  website: "",
};

const labelClass =
  "block text-xs uppercase tracking-wider text-espresso-soft font-medium mb-1.5";
const inputClass =
  "w-full py-2.5 px-0 text-espresso text-sm input-underline placeholder:text-espresso-soft/40";

export function ReservationSection() {
  const formId = useId();
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ReservationResponse | null>(null);
  const submittingRef = useRef(false);

  const minDate = useMemo(() => todayInCafeTimezone(), []);
  const fieldId = (name: string) => `${formId}-${name}`;
  const errorId = (name: string) => `${formId}-${name}-error`;

  function update(name: keyof typeof emptyForm, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Guards against a double click landing two writes in the Sheet.
    if (submittingRef.current) return;

    const parsed = reservationSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setResult(null);
      const first = Object.keys(fieldErrors)[0];
      document.getElementById(fieldId(first))?.focus();
      return;
    }

    submittingRef.current = true;
    setPending(true);
    setErrors({});
    setResult(null);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json()) as ReservationResponse;
      setResult(body);
      if (body.fieldErrors) setErrors(body.fieldErrors);
      if (body.status === "success" || body.status === "recorded_email_failed") {
        setValues({ ...emptyForm, date: "", time: values.time });
      }
    } catch {
      setResult({
        status: "error",
        message:
          "We could not reach the café just now. Please check your connection and try again.",
      });
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  function fieldProps(name: FieldName) {
    const message = errors[name];
    return {
      id: fieldId(name),
      name,
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? errorId(name) : undefined,
    } as const;
  }

  return (
    <section
      id="reserve"
      className="max-w-4xl mx-auto px-6 py-16 md:py-24 border-t border-linen-border"
    >
      <div className="mb-10 text-center max-w-xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-olive font-medium block mb-2">
          Reservations
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-espresso font-normal tracking-tight mb-3">
          Save a table.
        </h2>
        <p className="text-espresso-soft text-base font-light leading-relaxed">
          Tell us when you are coming. We will take care of the rest.
        </p>
        <p className="text-xs text-espresso-soft/80 mt-2 italic font-light">
          Requests are reviewed manually by staff based on daily room capacity. A{" "}
          {siteConfig.depositCurrency}
          {siteConfig.depositAmount} deposit holds your table.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-linen-dim/60 p-8 sm:p-12 rounded-2xl border border-linen-border space-y-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label htmlFor={fieldId("fullName")} className={labelClass}>
              Full Name
            </label>
            <input
              {...fieldProps("fullName")}
              type="text"
              autoComplete="name"
              maxLength={80}
              required
              placeholder="e.g. Maria Clara"
              className={inputClass}
              value={values.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
            <FieldError id={errorId("fullName")} message={errors.fullName} />
          </div>

          <div>
            <label htmlFor={fieldId("email")} className={labelClass}>
              Email Address
            </label>
            <input
              {...fieldProps("email")}
              type="email"
              autoComplete="email"
              maxLength={120}
              required
              placeholder="maria@example.com"
              className={inputClass}
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <FieldError id={errorId("email")} message={errors.email} />
          </div>

          <div>
            <label htmlFor={fieldId("phone")} className={labelClass}>
              Phone Number
            </label>
            <input
              {...fieldProps("phone")}
              type="tel"
              autoComplete="tel"
              maxLength={25}
              required
              placeholder="+63 9XX XXX XXXX"
              className={inputClass}
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <FieldError id={errorId("phone")} message={errors.phone} />
          </div>

          <div>
            <label htmlFor={fieldId("guests")} className={labelClass}>
              Guests
            </label>
            <select
              {...fieldProps("guests")}
              className={`${inputClass} bg-transparent`}
              value={values.guests}
              onChange={(e) => update("guests", e.target.value)}
            >
              {guestOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError id={errorId("guests")} message={errors.guests} />
          </div>

          <div>
            <label htmlFor={fieldId("date")} className={labelClass}>
              Date of Visit
            </label>
            <input
              {...fieldProps("date")}
              type="date"
              autoComplete="off"
              required
              min={minDate}
              className={`${inputClass} bg-transparent`}
              value={values.date}
              onChange={(e) => update("date", e.target.value)}
            />
            <FieldError id={errorId("date")} message={errors.date} />
          </div>

          <div>
            <label htmlFor={fieldId("time")} className={labelClass}>
              Arrival Time
            </label>
            <select
              {...fieldProps("time")}
              className={`${inputClass} bg-transparent`}
              value={values.time}
              onChange={(e) => update("time", e.target.value)}
            >
              {arrivalTimes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError id={errorId("time")} message={errors.time} />
          </div>

          <div>
            <label htmlFor={fieldId("occasion")} className={labelClass}>
              Special Occasion
            </label>
            <input
              {...fieldProps("occasion")}
              type="text"
              autoComplete="off"
              maxLength={120}
              placeholder="Casual catch-up, quiet work, book club..."
              className={inputClass}
              value={values.occasion}
              onChange={(e) => update("occasion", e.target.value)}
            />
            <FieldError id={errorId("occasion")} message={errors.occasion} />
          </div>

          <div>
            <label htmlFor={fieldId("requests")} className={labelClass}>
              Special Requests
            </label>
            <input
              {...fieldProps("requests")}
              type="text"
              autoComplete="off"
              maxLength={300}
              placeholder="Window seating, high chair, dietary notes..."
              className={inputClass}
              value={values.requests}
              onChange={(e) => update("requests", e.target.value)}
            />
            <FieldError id={errorId("requests")} message={errors.requests} />
          </div>
        </div>

        {/* Honeypot — hidden from people, tempting to bots. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor={fieldId("website")}>Website</label>
          <input
            id={fieldId("website")}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-espresso-soft font-light text-center sm:text-left">
            * This form is a request for staff approval. It does not imply immediate
            confirmation.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-terracotta text-linen font-medium text-sm hover:bg-terracotta-dark transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Sending…" : "Send reservation request"}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-6">
        {result ? <ResultNotice result={result} /> : null}
      </div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-terracotta-dark">
      {message}
    </p>
  );
}

const NOTICE_TITLES: Record<ReservationStatus, string> = {
  success: "Request received",
  recorded_email_failed: "Request recorded",
  validation_error: "Please check your details",
  config_error: "Reservations unavailable",
  error: "Something went wrong",
};

function ResultNotice({ result }: { result: ReservationResponse }) {
  const isGood = result.status === "success";
  const tone = isGood ? "border-olive/30" : "border-terracotta/40";

  return (
    <div className={`p-6 rounded-xl bg-linen border ${tone} text-espresso`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            isGood ? "bg-olive/20 text-olive" : "bg-terracotta/20 text-terracotta-dark"
          }`}
          aria-hidden="true"
        >
          {isGood ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v5m0 3h.01" />
            </svg>
          )}
        </div>
        <div>
          <h4 className="font-medium text-sm text-espresso mb-1">
            {NOTICE_TITLES[result.status]}
          </h4>
          <p className="text-xs sm:text-sm text-espresso-soft font-light leading-relaxed">
            {result.message}
          </p>
          {result.reservationCode ? (
            <p className="mt-2 text-xs text-espresso font-mono">
              Reservation code: {result.reservationCode}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
