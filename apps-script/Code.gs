/**
 * Bloom & Bean — spreadsheet-bound reservation backend.
 *
 * Responsibilities:
 *   1. doPost(e)               receive a validated reservation from the Next.js server
 *   2.                         write it into the "Reservation Tracker" sheet as Pending
 *   3.                         send the request-received email from the owner's Gmail
 *   4. onReservationEdit(e)    when staff change Pending -> Paid, create a 90-minute
 *                              Calendar event and invite the guest
 *
 * Script Properties used (Project Settings -> Script Properties):
 *   SHARED_SECRET     required, must match APPS_SCRIPT_SHARED_SECRET in Vercel
 *   SHEET_NAME        default "Reservation Tracker"
 *   CALENDAR_ID       default "primary"
 *   REPLY_TO          required, the cafe's public reply-to address
 *   PAYMENT_NUMBER    required, e.g. the GCash number shown in the email
 *   PAYMENT_QR_URL    optional, a public https:// image URL; omitted when blank
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

var CAFE_NAME = 'Bloom & Bean';
var DEFAULT_SHEET_NAME = 'Reservation Tracker';
var FIRST_DATA_ROW = 3;
var TEMPLATE_ROW = 3;
var LAST_COLUMN = 8; // A..H
var STATUS_COLUMN = 1;
var TIMEZONE = 'Asia/Manila';
var DEPOSIT_LABEL = 'PHP 100';
var RESERVATION_DURATION_MINUTES = 90;
var CODE_PATTERN = /^BB-\d{8}-[A-Z0-9]{4}$/;
var CODE_SEARCH_PATTERN = /BB-\d{8}-[A-Z0-9]{4}/;
var ALLOWED_TIMES = ['08:00', '09:30', '11:30', '13:00', '15:00', '16:30'];
var MAX_GUESTS = 8;
var LOCK_TIMEOUT_MS = 30000;

// Brand palette, mirrored from lib/site-config.ts.
var COLOR_LINEN = '#FAF7F2';
var COLOR_LINEN_DIM = '#F3ECE4';
var COLOR_BORDER = '#E6DCD1';
var COLOR_ESPRESSO = '#241C18';
var COLOR_ESPRESSO_SOFT = '#453831';
var COLOR_TERRACOTTA = '#C86D51';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function prop_(key, fallback) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback === undefined ? '' : fallback;
  }
  return String(value).trim();
}

function sheetName_() {
  return prop_('SHEET_NAME', DEFAULT_SHEET_NAME);
}

function calendarId_() {
  return prop_('CALENDAR_ID', 'primary');
}

/** Length-independent comparison so the response time leaks nothing useful. */
function constantTimeEquals_(a, b) {
  a = String(a === null || a === undefined ? '' : a);
  b = String(b === null || b === undefined ? '' : b);
  var length = Math.max(a.length, b.length);
  var diff = a.length ^ b.length;
  for (var i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Neutralises spreadsheet formula injection. Control characters are stripped
 * (newlines kept, since column H is multi-line), and a leading = + - @ gets a
 * single apostrophe prefix so the cell stays literal text.
 */
function safeCell_(value) {
  var text = value === null || value === undefined ? '' : String(value);
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  if (/^[=+\-@]/.test(text)) {
    return "'" + text;
  }
  return text;
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function failure_(errorCode) {
  return jsonOutput_({ ok: false, recorded: false, emailSent: false, errorCode: errorCode });
}

function escapeHtml_(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function orNone_(value) {
  var text = String(value === null || value === undefined ? '' : value).trim();
  return text === '' ? 'None' : text;
}

function formatVisitDate_(isoDate) {
  var parts = isoDate.split('-');
  var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  return Utilities.formatDate(date, TIMEZONE, 'MMMM d, yyyy');
}

function formatArrivalTime_(time) {
  var parts = time.split(':');
  var hour = Number(parts[0]);
  var minute = parts[1];
  var suffix = hour >= 12 ? 'PM' : 'AM';
  var hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return hour12 + ':' + minute + ' ' + suffix;
}

function nowStamp_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "MMMM d, yyyy 'at' h:mm a") + ' PHT';
}

// ---------------------------------------------------------------------------
// Validation (Apps Script re-validates everything; it never trusts the caller)
// ---------------------------------------------------------------------------

function validateReservation_(body) {
  function str(value, max) {
    var text = String(value === null || value === undefined ? '' : value).trim();
    return text.length > max ? text.slice(0, max) : text;
  }

  var reservationCode = str(body.reservationCode, 32);
  if (!CODE_PATTERN.test(reservationCode)) return null;

  var fullName = str(body.fullName, 80);
  if (fullName.length < 2) return null;

  var email = str(body.email, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  var phone = str(body.phone, 25);
  if (!/^[+()\-.\s0-9]{7,25}$/.test(phone)) return null;
  if ((phone.match(/\d/g) || []).length < 7) return null;

  var date = str(body.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  var time = str(body.time, 5);
  if (ALLOWED_TIMES.indexOf(time) === -1) return null;

  var guests = Number(body.guests);
  if (!isFinite(guests) || Math.floor(guests) !== guests || guests < 1 || guests > MAX_GUESTS) {
    return null;
  }

  return {
    reservationCode: reservationCode,
    fullName: fullName,
    email: email,
    phone: phone,
    date: date,
    time: time,
    guests: guests,
    occasion: str(body.occasion, 120),
    requests: str(body.requests, 300),
    submittedAt: str(body.submittedAt, 60) || nowStamp_()
  };
}

// ---------------------------------------------------------------------------
// Web App entry point
// ---------------------------------------------------------------------------

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (parseError) {
    return failure_('bad_json');
  }

  if (!body || typeof body !== 'object') return failure_('bad_json');

  var expected = prop_('SHARED_SECRET', '');
  if (!expected) {
    console.error('SHARED_SECRET script property is not set.');
    return failure_('server_not_configured');
  }
  if (!constantTimeEquals_(body.secret, expected)) {
    return failure_('unauthorized');
  }

  var reservation = validateReservation_(body);
  if (!reservation) return failure_('invalid_payload');

  var lock = LockService.getScriptLock();
  var haveLock = false;
  var written;
  try {
    haveLock = lock.tryLock(LOCK_TIMEOUT_MS);
    if (!haveLock) return failure_('busy');
    written = writeReservationRow_(reservation);
  } catch (writeError) {
    console.error('Sheet write failed: ' + writeError);
    return failure_('write_failed');
  } finally {
    if (haveLock) {
      lock.releaseLock();
    }
  }

  if (written === 'duplicate') {
    // The row already exists — treat as recorded, but do not email twice.
    return jsonOutput_({
      ok: true,
      recorded: true,
      emailSent: true,
      reservationCode: reservation.reservationCode
    });
  }

  // Email only after the row is safely stored, so a Gmail outage never costs
  // us the reservation.
  var emailSent = false;
  try {
    sendRequestEmail_(reservation);
    emailSent = true;
  } catch (mailError) {
    console.error('Gmail send failed: ' + mailError);
  }

  return jsonOutput_({
    ok: true,
    recorded: true,
    emailSent: emailSent,
    reservationCode: reservation.reservationCode
  });
}

/** Web App GET is only a liveness probe — it never exposes data. */
function doGet() {
  return jsonOutput_({ ok: true, service: 'bloom-and-bean-reservations' });
}

// ---------------------------------------------------------------------------
// Sheet writing
// ---------------------------------------------------------------------------

function getTrackerSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName_());
  if (!sheet) throw new Error('Sheet "' + sheetName_() + '" was not found.');
  return sheet;
}

function buildNote_(reservation) {
  return [
    'Reservation Code: ' + reservation.reservationCode,
    'Guests: ' + reservation.guests,
    'Occasion: ' + orNone_(reservation.occasion),
    'Requests: ' + orNone_(reservation.requests),
    'Submitted: ' + reservation.submittedAt
  ].join('\n');
}

/**
 * A HYPERLINK into Gmail's search, not a mailto:. Staff click "Open email" and
 * land on the request email we just sent, found by its reservation code.
 * The code has already been matched against CODE_PATTERN, so it cannot contain
 * a quote that would break out of the formula.
 */
function buildEmailLinkFormula_(reservationCode) {
  var query = encodeURIComponent('in:anywhere "' + reservationCode + '"');
  var url = 'https://mail.google.com/mail/u/0/#search/' + query;
  return '=HYPERLINK("' + url + '","Open email")';
}

function isRowEmpty_(values) {
  // Ignore column A: the Status dropdown may hold a prepared blank or default.
  for (var i = 1; i < values.length; i++) {
    if (String(values[i] === null || values[i] === undefined ? '' : values[i]).trim() !== '') {
      return false;
    }
  }
  return true;
}

/**
 * Returns 'duplicate' if the reservation code is already in column H, otherwise
 * writes the eight cells and returns the row number.
 */
function writeReservationRow_(reservation) {
  var sheet = getTrackerSheet_();
  var lastRow = sheet.getLastRow();
  var maxRows = sheet.getMaxRows();

  var targetRow = 0;
  if (lastRow >= FIRST_DATA_ROW) {
    var scanCount = lastRow - FIRST_DATA_ROW + 1;
    var existing = sheet.getRange(FIRST_DATA_ROW, 1, scanCount, LAST_COLUMN).getValues();
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i][7]).indexOf(reservation.reservationCode) !== -1) {
        return 'duplicate';
      }
      if (!targetRow && isRowEmpty_(existing[i])) {
        targetRow = FIRST_DATA_ROW + i;
      }
    }
  }

  if (!targetRow) {
    // Look past the last written row for prepared-but-untouched blank rows.
    var firstUnscanned = Math.max(lastRow + 1, FIRST_DATA_ROW);
    if (firstUnscanned <= maxRows) {
      targetRow = firstUnscanned;
    } else {
      // No prepared row remains: append one and copy formatting + data
      // validation from the row-3 template. Values are never copied.
      sheet.insertRowsAfter(maxRows, 1);
      targetRow = maxRows + 1;
      var template = sheet.getRange(TEMPLATE_ROW, 1, 1, LAST_COLUMN);
      var destination = sheet.getRange(targetRow, 1, 1, LAST_COLUMN);
      template.copyTo(destination, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
      template.copyTo(destination, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
      sheet.setRowHeight(targetRow, sheet.getRowHeight(TEMPLATE_ROW));
    }
  }

  // Exactly eight cells, written in place so the dropdown, conditional
  // formatting and row styling of the prepared row survive.
  sheet.getRange(targetRow, 1, 1, LAST_COLUMN).setValues([
    [
      'Pending',
      buildEmailLinkFormula_(reservation.reservationCode),
      safeCell_(reservation.fullName),
      safeCell_(reservation.phone),
      safeCell_(reservation.email),
      safeCell_(formatVisitDate_(reservation.date)),
      safeCell_(formatArrivalTime_(reservation.time)),
      safeCell_(buildNote_(reservation))
    ]
  ]);

  SpreadsheetApp.flush();
  return targetRow;
}

// ---------------------------------------------------------------------------
// Request-received email
// ---------------------------------------------------------------------------

function buildEmailBodies_(reservation) {
  var replyTo = prop_('REPLY_TO', '');
  var paymentNumber = prop_('PAYMENT_NUMBER', '[ADD PAYMENT NUMBER]');
  var qrUrl = prop_('PAYMENT_QR_URL', '');
  var prettyDate = formatVisitDate_(reservation.date);
  var prettyTime = formatArrivalTime_(reservation.time);

  var rows = [
    ['Reservation code', reservation.reservationCode],
    ['Date', prettyDate],
    ['Arrival time', prettyTime],
    ['Guests', String(reservation.guests)],
    ['Occasion', orNone_(reservation.occasion)],
    ['Requests', orNone_(reservation.requests)]
  ];

  var rowsHtml = rows
    .map(function (row) {
      return (
        '<tr>' +
        '<td style="padding:8px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:' +
        COLOR_ESPRESSO_SOFT +
        ';">' +
        escapeHtml_(row[0]) +
        '</td>' +
        '<td style="padding:8px 0;font-size:15px;color:' +
        COLOR_ESPRESSO +
        ';text-align:right;">' +
        escapeHtml_(row[1]) +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  var qrHtml = '';
  if (/^https:\/\//i.test(qrUrl)) {
    qrHtml =
      '<div style="text-align:center;margin-top:16px;">' +
      '<img src="' +
      escapeHtml_(qrUrl) +
      '" alt="Payment QR code" width="180" style="width:180px;max-width:100%;border-radius:12px;border:1px solid ' +
      COLOR_BORDER +
      ';" />' +
      '</div>';
  }

  var html =
    '<!doctype html><html><body style="margin:0;padding:0;background:' +
    COLOR_LINEN +
    ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' +
    COLOR_LINEN +
    ';padding:24px 12px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ' +
    COLOR_BORDER +
    ';border-radius:16px;padding:32px;font-family:Helvetica,Arial,sans-serif;">' +
    '<tr><td>' +
    '<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:' +
    COLOR_TERRACOTTA +
    ';">Reservation request</p>' +
    '<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:26px;color:' +
    COLOR_ESPRESSO +
    ';">Thank you, ' +
    escapeHtml_(reservation.fullName) +
    '.</h1>' +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:' +
    COLOR_ESPRESSO_SOFT +
    ';">We have your request for a table at ' +
    escapeHtml_(CAFE_NAME) +
    '. <strong>Your table is not confirmed yet</strong> &mdash; our staff review every request by hand, and we will write again once it is confirmed.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ' +
    COLOR_BORDER +
    ';border-bottom:1px solid ' +
    COLOR_BORDER +
    ';margin:0 0 20px;">' +
    rowsHtml +
    '</table>' +
    '<div style="background:' +
    COLOR_LINEN_DIM +
    ';border-radius:12px;padding:20px;">' +
    '<h2 style="margin:0 0 8px;font-family:Georgia,serif;font-weight:normal;font-size:18px;color:' +
    COLOR_ESPRESSO +
    ';">To hold your table</h2>' +
    '<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:' +
    COLOR_ESPRESSO_SOFT +
    ';">Please send a <strong>' +
    escapeHtml_(DEPOSIT_LABEL) +
    '</strong> deposit to <strong>' +
    escapeHtml_(paymentNumber) +
    '</strong> and reply with your receipt. Use your reservation code <strong>' +
    escapeHtml_(reservation.reservationCode) +
    '</strong> as the reference.</p>' +
    '<p style="margin:0;font-size:13px;line-height:1.6;color:' +
    COLOR_ESPRESSO_SOFT +
    ';">The deposit goes towards your bill on the day.</p>' +
    qrHtml +
    '</div>' +
    '<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:' +
    COLOR_ESPRESSO_SOFT +
    ';">Questions? Just reply to this email' +
    (replyTo ? ' or write to ' + escapeHtml_(replyTo) : '') +
    '.</p>' +
    '<p style="margin:16px 0 0;font-family:Georgia,serif;font-style:italic;font-size:15px;color:' +
    COLOR_ESPRESSO +
    ';">See you in the morning.</p>' +
    '</td></tr></table>' +
    '<p style="margin:16px 0 0;font-size:11px;color:' +
    COLOR_ESPRESSO_SOFT +
    ';font-family:Helvetica,Arial,sans-serif;">' +
    escapeHtml_(CAFE_NAME) +
    ' &middot; This is a reservation request, not a confirmation.</p>' +
    '</td></tr></table></body></html>';

  var plainLines = [
    CAFE_NAME + ' - reservation request received',
    '',
    'Thank you, ' + reservation.fullName + '.',
    'Your table is NOT confirmed yet. Our staff review every request by hand.',
    '',
    'Reservation code: ' + reservation.reservationCode,
    'Date: ' + prettyDate,
    'Arrival time: ' + prettyTime,
    'Guests: ' + reservation.guests,
    'Occasion: ' + orNone_(reservation.occasion),
    'Requests: ' + orNone_(reservation.requests),
    '',
    'To hold your table, send a ' +
      DEPOSIT_LABEL +
      ' deposit to ' +
      paymentNumber +
      ' and reply with your receipt, using ' +
      reservation.reservationCode +
      ' as the reference.'
  ];

  if (/^https:\/\//i.test(qrUrl)) {
    plainLines.push('Payment QR: ' + qrUrl);
  }

  plainLines.push('');
  plainLines.push('Questions? Reply to this email' + (replyTo ? ' or write to ' + replyTo : '') + '.');
  plainLines.push('');
  plainLines.push('See you in the morning.');
  plainLines.push(CAFE_NAME);

  return { html: html, plain: plainLines.join('\n') };
}

function sendRequestEmail_(reservation) {
  var bodies = buildEmailBodies_(reservation);
  var options = {
    name: CAFE_NAME,
    htmlBody: bodies.html
  };
  var replyTo = prop_('REPLY_TO', '');
  if (replyTo) options.replyTo = replyTo;

  GmailApp.sendEmail(
    reservation.email,
    reservation.reservationCode + ' | Your ' + CAFE_NAME + ' Reservation Request',
    bodies.plain,
    options
  );
}

// ---------------------------------------------------------------------------
// Pending -> Paid  =>  Calendar event
// ---------------------------------------------------------------------------

/**
 * Installable edit trigger handler. Install it with setupReservationTrigger();
 * never run it by hand — it needs the event object Sheets supplies.
 */
function onReservationEdit(e) {
  if (!e || !e.range) {
    console.error(
      'onReservationEdit was called without an edit event. Install it with setupReservationTrigger() ' +
        'and test with diagnoseSelectedPaidRow() instead.'
    );
    return;
  }

  var range = e.range;
  if (range.getNumRows() !== 1 || range.getNumColumns() !== 1) return;
  if (range.getColumn() !== STATUS_COLUMN) return;

  var row = range.getRow();
  if (row < FIRST_DATA_ROW) return; // rows 1 and 2 are the title and headers

  var sheet = range.getSheet();
  if (sheet.getName() !== sheetName_()) return;

  var status = String(e.value === null || e.value === undefined ? '' : e.value)
    .trim()
    .toLowerCase();
  if (status !== 'paid') return; // Pending, Follow up, Double booking, No reply: ignore.

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
    console.error('Could not acquire the script lock for row ' + row + '.');
    return;
  }

  try {
    createCalendarEventForRow_(sheet, row);
  } catch (error) {
    console.error(
      'Calendar creation failed for row ' + row + ': ' + error + '\n' + (error && error.stack)
    );
    writeStatusNote_(
      sheet,
      row,
      [
        'Calendar creation failed',
        'Error: ' + safeErrorMessage_(error),
        'Last attempted: ' + nowStamp_()
      ].join('\n')
    );
  } finally {
    lock.releaseLock();
  }
}

function safeErrorMessage_(error) {
  var message = String((error && error.message) || error || 'Unknown error');
  return message.length > 200 ? message.slice(0, 200) + '...' : message;
}

function writeStatusNote_(sheet, row, note) {
  sheet.getRange(row, STATUS_COLUMN).setNote(note);
}

/** Parses column F / column G whether Sheets hands back a Date or a string. */
function parseVisitStart_(dateValue, timeValue) {
  var year, month, day;

  if (Object.prototype.toString.call(dateValue) === '[object Date]' && !isNaN(dateValue)) {
    var iso = Utilities.formatDate(dateValue, TIMEZONE, 'yyyy-MM-dd').split('-');
    year = Number(iso[0]);
    month = Number(iso[1]);
    day = Number(iso[2]);
  } else {
    var text = String(dateValue || '').trim();
    var isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      year = Number(isoMatch[1]);
      month = Number(isoMatch[2]);
      day = Number(isoMatch[3]);
    } else {
      var parsed = new Date(text);
      if (isNaN(parsed)) throw new Error('Could not read the date of visit in column F.');
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
      day = parsed.getDate();
    }
  }

  var hour, minute;
  if (Object.prototype.toString.call(timeValue) === '[object Date]' && !isNaN(timeValue)) {
    hour = Number(Utilities.formatDate(timeValue, TIMEZONE, 'H'));
    minute = Number(Utilities.formatDate(timeValue, TIMEZONE, 'm'));
  } else {
    var timeText = String(timeValue || '')
      .trim()
      .toUpperCase();
    var match = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) throw new Error('Could not read the arrival time in column G.');
    hour = Number(match[1]);
    minute = Number(match[2]);
    if (match[3] === 'PM' && hour !== 12) hour += 12;
    if (match[3] === 'AM' && hour === 12) hour = 0;
  }

  // Build the instant in Asia/Manila regardless of the runtime's own timezone.
  var utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  var offsetText = Utilities.formatDate(new Date(utcGuess), TIMEZONE, 'Z'); // e.g. +0800
  var sign = offsetText.charAt(0) === '-' ? -1 : 1;
  var offsetMinutes =
    sign * (Number(offsetText.substr(1, 2)) * 60 + Number(offsetText.substr(3, 2)));
  return new Date(utcGuess - offsetMinutes * 60000);
}

function createCalendarEventForRow_(sheet, row) {
  var existingNote = String(sheet.getRange(row, STATUS_COLUMN).getNote() || '');
  if (existingNote.indexOf('Event ID:') !== -1) {
    console.log('Row ' + row + ' already has a Calendar event. Skipping.');
    return;
  }

  var values = sheet.getRange(row, 1, 1, LAST_COLUMN).getValues()[0];
  var fullName = String(values[2] || '').trim();
  var phone = String(values[3] || '').trim();
  var email = String(values[4] || '').trim();
  var note = String(values[7] || '').trim();

  if (!fullName || !email) throw new Error('This row is missing a name or an email address.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('The email address in column E is not valid.');
  }

  var start = parseVisitStart_(values[5], values[6]);
  var end = new Date(start.getTime() + RESERVATION_DURATION_MINUTES * 60000);

  var calendar = CalendarApp.getCalendarById(calendarId_());
  if (!calendar) throw new Error('Calendar "' + calendarId_() + '" is not accessible.');

  var codeMatch = note.match(CODE_SEARCH_PATTERN);
  var reservationCode = codeMatch ? codeMatch[0] : '';

  var description = [
    CAFE_NAME + ' reservation - confirmed (Paid)',
    '',
    'Name: ' + fullName,
    'Phone: ' + (phone || 'None'),
    'Email: ' + email,
    '',
    note
  ].join('\n');

  var event = calendar.createEvent(
    CAFE_NAME + ' - ' + fullName + (reservationCode ? ' (' + reservationCode + ')' : ''),
    start,
    end,
    { description: description, guests: email, sendInvites: true }
  );

  // Status stays "Paid"; only the note changes.
  writeStatusNote_(
    sheet,
    row,
    [
      'Calendar confirmed',
      'Event ID: ' + event.getId(),
      'Created: ' + nowStamp_(),
      'Guest invited: ' + email
    ].join('\n')
  );
}

// ---------------------------------------------------------------------------
// One-time setup and diagnostics — run these from the Apps Script editor
// ---------------------------------------------------------------------------

/** Run once. Grants the Sheet, Gmail and Calendar permissions in one prompt. */
function authorizeServices() {
  var sheet = getTrackerSheet_();
  var quota = MailApp.getRemainingDailyQuota();
  var calendar = CalendarApp.getCalendarById(calendarId_());
  ScriptApp.getProjectTriggers();
  console.log(
    'Authorized. Sheet: "' +
      sheet.getName() +
      '". Calendar: "' +
      (calendar ? calendar.getName() : 'NOT ACCESSIBLE') +
      '". Remaining email quota today: ' +
      quota +
      '.'
  );
}

/** Run once. Removes duplicate triggers and installs exactly one edit trigger. */
function setupReservationTrigger() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onReservationEdit') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  ScriptApp.newTrigger('onReservationEdit').forSpreadsheet(spreadsheet).onEdit().create();
  console.log(
    'Removed ' + removed + ' old trigger(s). Installed 1 onEdit trigger for onReservationEdit.'
  );
}

/**
 * Select any cell in a Paid row, then run this. It reports what the Calendar
 * step would do, and creates the event if it is genuinely missing.
 */
function diagnoseSelectedPaidRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== sheetName_()) {
    console.log('Select a cell on the "' + sheetName_() + '" sheet first.');
    return;
  }
  var row = sheet.getActiveRange().getRow();
  if (row < FIRST_DATA_ROW) {
    console.log('Select a reservation row (row ' + FIRST_DATA_ROW + ' or below).');
    return;
  }

  var status = String(sheet.getRange(row, STATUS_COLUMN).getValue() || '')
    .trim()
    .toLowerCase();
  console.log('Row ' + row + ' status: "' + status + '"');
  if (status !== 'paid') {
    console.log('Nothing to do - the Calendar step only runs for Paid.');
    return;
  }

  var note = String(sheet.getRange(row, STATUS_COLUMN).getNote() || '');
  if (note.indexOf('Event ID:') !== -1) {
    console.log('An event already exists for this row:\n' + note);
    return;
  }

  try {
    createCalendarEventForRow_(sheet, row);
    console.log('Created the Calendar event. See the note on the Status cell.');
  } catch (error) {
    console.error('Failed: ' + error + '\n' + (error && error.stack));
    writeStatusNote_(
      sheet,
      row,
      [
        'Calendar creation failed',
        'Error: ' + safeErrorMessage_(error),
        'Last attempted: ' + nowStamp_()
      ].join('\n')
    );
  }
}

/** Reports configuration health without ever printing a secret value. */
function checkSetup() {
  var report = [];
  var required = ['SHARED_SECRET', 'REPLY_TO', 'PAYMENT_NUMBER'];
  var optional = ['SHEET_NAME', 'CALENDAR_ID', 'PAYMENT_QR_URL'];

  for (var i = 0; i < required.length; i++) {
    report.push(required[i] + ': ' + (prop_(required[i], '') ? 'set' : 'MISSING'));
  }
  for (var j = 0; j < optional.length; j++) {
    var value = prop_(optional[j], '');
    report.push(optional[j] + ': ' + (value ? 'set' : 'not set (using default)'));
  }

  var triggerCount = 0;
  var triggers = ScriptApp.getProjectTriggers();
  for (var k = 0; k < triggers.length; k++) {
    if (triggers[k].getHandlerFunction() === 'onReservationEdit') triggerCount++;
  }
  report.push(
    'onReservationEdit triggers installed: ' +
      triggerCount +
      (triggerCount === 1 ? ' (correct)' : ' (expected 1 - run setupReservationTrigger)')
  );

  try {
    var sheet = getTrackerSheet_();
    report.push('Sheet "' + sheet.getName() + '": accessible, ' + sheet.getMaxRows() + ' rows');
  } catch (sheetError) {
    report.push('Sheet: NOT ACCESSIBLE - ' + safeErrorMessage_(sheetError));
  }

  try {
    var calendar = CalendarApp.getCalendarById(calendarId_());
    report.push(
      'Calendar: ' + (calendar ? '"' + calendar.getName() + '" accessible' : 'NOT ACCESSIBLE')
    );
  } catch (calendarError) {
    report.push('Calendar: NOT ACCESSIBLE - ' + safeErrorMessage_(calendarError));
  }

  report.push(
    'Spreadsheet timezone: ' + SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone()
  );
  report.push('Script timezone: ' + Session.getScriptTimeZone());
  report.push('Remaining email quota today: ' + MailApp.getRemainingDailyQuota());

  console.log(report.join('\n'));
}
