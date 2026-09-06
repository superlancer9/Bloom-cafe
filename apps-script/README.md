# Apps Script backend

These two files belong in the **spreadsheet-bound** Apps Script project of the
Google Sheet that holds the `Reservation Tracker` tab
(**Extensions → Apps Script** from inside the Sheet). Do not create a standalone
script project, and do not create a second spreadsheet.

| File | Where it goes |
|---|---|
| `Code.gs` | replaces the contents of the editor's `Code.gs` |
| `appsscript.json` | the manifest (enable it in Project Settings → "Show 'appsscript.json' manifest file in editor") |

Full click-by-click setup is in the [root README](../README.md). Quick reference:

## Script Properties

| Key | Required | Default |
|---|---|---|
| `SHARED_SECRET` | yes | — must equal `APPS_SCRIPT_SHARED_SECRET` in the Next.js app |
| `SHEET_NAME` | no | `Reservation Tracker` |
| `CALENDAR_ID` | no | `primary` |
| `REPLY_TO` | yes | — |
| `PAYMENT_NUMBER` | yes | — |
| `PAYMENT_QR_URL` | no | blank; the QR block is omitted cleanly when empty |

Apps Script cannot read Vercel environment variables. These properties are the
script's only configuration.

## Functions you run by hand

| Function | When |
|---|---|
| `authorizeServices()` | once, to grant Sheet + Gmail + Calendar permissions |
| `setupReservationTrigger()` | once, removes duplicate triggers and installs exactly one installable edit trigger |
| `checkSetup()` | any time — reports missing properties, trigger count, sheet/calendar access and remaining email quota, without printing secret values |
| `diagnoseSelectedPaidRow()` | select a cell in a Paid row, then run it to see (and fix) why no event was created |

**Never run `onReservationEdit` directly.** It requires the edit event object
Sheets passes to an installable trigger; run `diagnoseSelectedPaidRow()` instead.

## Sheet contract

Row 1 is decorative. Row 2 holds the headers. Reservations start at row 3.

| Column | Header | Written by `doPost` |
|---|---|---|
| A | Status | `Pending` |
| B | Email Link | `=HYPERLINK(...,"Open email")` — a Gmail `in:anywhere` search for the reservation code, never a `mailto:` |
| C | Full Name | |
| D | Phone number | |
| E | Email address | |
| F | Date of visit | e.g. `September 5, 2026` |
| G | Arrival time | e.g. `11:30 AM` |
| H | Note | reservation code, guests, occasion, requests, submitted-at |

Exactly eight cells are written into an existing prepared row, so the Status
dropdown, conditional formatting and row height survive. A new row is appended
only when no prepared blank row remains, and it copies format and data validation
(never values) from row 3.

Allowed Status values: `Paid`, `Pending`, `Follow up`, `Double booking`, `No reply`.
Only `Paid` triggers the Calendar step; the others are ignored.

## Behaviour notes

- The shared secret is compared with a constant-time helper; a wrong or missing
  secret returns `{"ok":false,...,"errorCode":"unauthorized"}` and nothing is written.
- Every field is re-validated inside Apps Script — the Web App never trusts its caller.
- A script lock is held across the duplicate check and the write.
- A reservation code already present in column H is treated as a duplicate and is
  not written or emailed twice.
- The email is sent only after the row is safely stored, so a Gmail failure leaves
  the row saved as `Pending` and the site tells the guest to quote their code.
- Responses never contain stack traces, spreadsheet IDs, secrets or raw payloads.
  Full technical errors go to **Executions** in the Apps Script editor.
- Calendar bookkeeping lives in the note on the Status cell (column A). If that note
  already contains `Event ID:`, no second event is created.
