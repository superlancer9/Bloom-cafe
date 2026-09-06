# Bloom & Bean — Café Reservation Demo

A Next.js café site whose reservation form writes into a Google Sheet, emails the
guest from the owner's Gmail, and puts a confirmed booking on Google Calendar —
using **one spreadsheet-bound Google Apps Script project**. No Google Cloud
Console, no service account, no private key, no custom domain.

```
ReservationForm
  -> POST /api/reservations        (server validation + reservation code)
  -> Apps Script Web App doPost(e)
  -> "Reservation Tracker" row saved as Pending
  -> Gmail request email sent to the guest

Staff change Pending -> Paid in the Sheet
  -> installable onEdit trigger
  -> 90-minute Calendar event, guest invited
  -> Event ID saved in the note on the Status cell
```

## Run it locally

```bash
npm install
npm run dev
```

The site works immediately. Submitting the form returns a friendly
"reservations unavailable" message until you finish the six checkpoints below.

---

# Setup wizard — six checkpoints

Work through these in order. Each one has a success condition you can see.

## ☐ Checkpoint 1 — Create and format the Google Sheet

1. Go to <https://sheets.new> and name the file anything you like.
2. Double-click the tab at the bottom and rename it to exactly:
   `Reservation Tracker`
3. Leave **row 1** for a decorative title (type "Bloom & Bean Reservations" in A1).
4. In **row 2**, type these eight headers, one per column, exactly:

   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | Status | Email Link | Full Name | Phone number | Email address | Date of visit | Arrival time | Note |

5. Select `A3:A200`, then **Data → Data validation → Add rule → Dropdown**, and
   add these five options, spelled exactly:
   `Paid`, `Pending`, `Follow up`, `Double booking`, `No reply`. Click **Done**.

**Success looks like:** clicking any cell in column A from row 3 down shows a
dropdown with those five choices.

**Common failure:** the tab is named "Reservation tracker" or "Sheet1". The name
is case-sensitive — the script will not find it. Rename the tab.

---

## ☐ Checkpoint 2 — Paste the Apps Script code

1. In that same spreadsheet: **Extensions → Apps Script**.
2. Delete everything in the `Code.gs` editor and paste the full contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.
3. Click the **gear icon (Project Settings)** on the left and tick
   **"Show 'appsscript.json' manifest file in editor"**.
4. Go back to the **Editor**, open `appsscript.json`, and replace its contents
   with [`apps-script/appsscript.json`](apps-script/appsscript.json).
5. Click the **save icon**.

**Success looks like:** the file list on the left shows `Code.gs` and
`appsscript.json`, and there are no red error markers.

**Common failure:** pasting on top of the old `function myFunction() {}` instead
of replacing it, which leaves a stray brace. Select all (Cmd/Ctrl+A) before
pasting.

---

## ☐ Checkpoint 3 — Script Properties and timezone

1. In the Apps Script editor: **Project Settings** (gear icon).
2. Set **Time zone** to `(GMT+08:00) Manila`.
3. Scroll to **Script Properties → Edit script properties → Add script property**
   and add these six:

   | Property | Value to enter |
   |---|---|
   | `SHARED_SECRET` | a long random string you invent — you will paste the same one into Vercel in Checkpoint 6. Generate one with `openssl rand -base64 32` |
   | `SHEET_NAME` | `Reservation Tracker` |
   | `CALENDAR_ID` | `primary` |
   | `REPLY_TO` | the café's public email address |
   | `PAYMENT_NUMBER` | the GCash/bank number shown in the email, e.g. `0917 123 4567` |
   | `PAYMENT_QR_URL` | a public `https://` image URL, or leave blank |

4. Click **Save script properties**.
5. Back in the spreadsheet: **File → Settings → Time zone → (GMT+08:00) Manila →
   Save settings**.

**Success looks like:** six rows in the Script Properties table, and both the
script and the spreadsheet showing Manila time.

**Common failure:** leaving the spreadsheet on a US timezone. Calendar events
then land at the wrong hour. Both timezones must say Manila.

---

## ☐ Checkpoint 4 — Authorize and install the trigger

1. In the Apps Script editor, choose **`authorizeServices`** from the function
   dropdown at the top and click **Run**.
2. Google will ask for permission. Choose your account → **Advanced** →
   **Go to (project name) (unsafe)** → **Allow**. (This warning is normal for a
   script you wrote yourself; it is not published to other users.)
3. Choose **`setupReservationTrigger`** and click **Run**.
4. Choose **`checkSetup`** and click **Run**, then read the Execution log.

**Success looks like:** the log from `checkSetup` says every required property is
`set`, `onReservationEdit triggers installed: 1 (correct)`, the sheet and
calendar are accessible, and both timezones say `Asia/Manila`.

**Common failure:** running `onReservationEdit` by hand. It needs the edit event
that Sheets supplies and will just log an error. Use `diagnoseSelectedPaidRow`
to test a row instead.

---

## ☐ Checkpoint 5 — Deploy as a Web App

1. Top right of the Apps Script editor: **Deploy → New deployment**.
2. Click the **gear next to "Select type" → Web app**.
3. Fill in:
   - **Description:** `Reservations v1`
   - **Execute as:** `Me (your@gmail.com)`
   - **Who has access:** `Anyone`
4. Click **Deploy**, then **Authorize access** if asked.
5. Copy the **Web app URL** — the lower one, which **ends in `/exec`**.

> The **Deployment ID** is the short code shown above the URL. It is *not* the
> Web App URL. The URL you need starts with `https://script.google.com/macros/s/`
> and ends with `/exec`. A URL ending in `/dev` is the testing URL and will not
> work from Vercel.

**Success looks like:** opening the `/exec` URL in a browser shows
`{"ok":true,"service":"bloom-and-bean-reservations"}`.

**Common failure:** "Who has access" left on *Only myself*. Google then serves a
sign-in HTML page to the server, and the site reports a configuration error.
Fix with **Deploy → Manage deployments → Edit → change access to Anyone**.

---

## ☐ Checkpoint 6 — Configure the site and test end to end

1. **Locally:** copy `.env.example` to `.env.local` and fill in:
   ```
   APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
   APPS_SCRIPT_SHARED_SECRET=<the same string as SHARED_SECRET>
   ```
2. **On Vercel:** *Project → Settings → Environment Variables* → add the same
   two names and values for **Production, Preview and Development** → **Save**,
   then *Deployments → ⋯ → Redeploy*.
3. Open the site, scroll to **Save a table**, and submit a real reservation with
   your own email address.
4. Check the Sheet, then change that row's Status from **Pending** to **Paid**.

**Success looks like:**
- The site says *"Request received. Your table is pending confirmation…"*
- A new row appears in `Reservation Tracker` with Status `Pending` and a clickable
  **Open email** link in column B.
- The request email arrives, subject `BB-… | Your Bloom & Bean Reservation Request`.
- After switching to `Paid`: a 90-minute Calendar event appears, the guest gets an
  invitation, and hovering the Status cell shows a note with `Event ID:`.

**Common failure:** the secret in Vercel does not match `SHARED_SECRET`. The site
then shows the generic "could not save your request" message. Re-copy the value
into both places, then redeploy.

---

## After you change `Code.gs` later

Editing the code does **not** update the live Web App. Push a new version, keeping
the same `/exec` URL:

**Deploy → Manage deployments → (pencil) Edit → Version: New version → Deploy**

Never use *New deployment* for an update — that mints a different `/exec` URL and
your environment variable will point at the old code.

---

## Where the café's details live

Everything non-secret is in [`lib/site-config.ts`](lib/site-config.ts): name,
deposit, timezone, address, hours, phone, WhatsApp link, Maps link, Instagram,
public email, reservation duration, and the whole menu. Values in
`[SQUARE BRACKETS]` are placeholders awaiting real business details and are
deliberately visible on the page.

The WhatsApp button is a plain fixed link to `siteConfig.whatsappUrl` — replace
`https://wa.me/63REPLACE_WITH_NUMBER` with the café's number. It needs no API and
no environment variable.

## Secrets

`APPS_SCRIPT_WEB_APP_URL` and `APPS_SCRIPT_SHARED_SECRET` are read only in
server code (`lib/apps-script.ts`) and are never sent to the browser. Never
prefix either with `NEXT_PUBLIC_`.

## Checks

```bash
npm run build
npx tsc --noEmit
npm run lint
```
