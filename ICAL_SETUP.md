# iCal Two-Way Availability Sync

Syncs room **availability** (not rates) between Anli and OTAs like Airbnb and
Booking.com using the iCal calendar format both platforms already support.

## What it does

**Direction 1 — Export (Anli → OTA): blocking OTA dates from Anli bookings**

- `POST /ical/feeds` (API-key guarded) creates a feed for one room and returns
  a URL like `https://<channel-manager>/ical/<64-hex-token>/calendar.ics`.
- The feed is generated live on every request from the shared `guest` table
  (live stays: not voided, not checked out) plus any external blocks imported
  from OTAs, so it never fights the channel.
- Every event is a generic `Busy - Anli` all-day block — **no guest names or
  PII ever leave Anli** in the feed.
- The hotel pastes this URL into the OTA:
  - **Airbnb:** Listing editor → Pricing & availability → Calendar sync →
    **Import calendar** → paste the URL.
  - **Booking.com:** Extranet → Property → **iCal connection** → add the URL.

**Direction 2 — Import (OTA → Anli): blocking Anli rooms from OTA bookings**

- `POST /ical/import-sources` (API-key guarded) registers the OTA's export
  URL for one Anli room. (Airbnb: same Calendar sync page → **Export
  calendar**; Booking.com: iCal connection page → export URL.)
- A cron job polls every source every 30 minutes and stores the blocked nights
  as external holds (`ical_external_block`). `POST /ical/import-sources/:id/sync`
  triggers one poll immediately.
- External blocks are holds, not guest stays: no PII, no charges. The PMS
  reads them via `GET /ical/external-blocks?hotelId=&roomId=` (phase 2 will
  honor them in Anli's own availability checks).
- `DELETE /ical/import-sources/:id` also removes that source's blocks.

## Management endpoints (all API-key guarded)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/ical/feeds` | Create feed → returns `url` + `token` |
| GET | `/ical/feeds?hotelId=` | List feeds (token omitted) |
| POST | `/ical/feeds/:id/rotate` | New token (invalidates old URL) |
| DELETE | `/ical/feeds/:id` | Delete feed |
| POST | `/ical/import-sources` | Register OTA export URL |
| GET | `/ical/import-sources?hotelId=` | List sources + last poll status |
| POST | `/ical/import-sources/:id/sync` | Poll now |
| DELETE | `/ical/import-sources/:id` | Delete source + its blocks |
| GET | `/ical/external-blocks?hotelId=&roomId=` | List external holds |
| GET | `/ical/:token/calendar.ics` | **Public** export feed (token is the auth) |

`POST /ical/feeds` body: `{ hotelId, roomId, roomNumber?, label? }`
`POST /ical/import-sources` body:
`{ hotelId, roomId, roomNumber?, sourceName, sourceUrl }`

## Environment

- `ICAL_PUBLIC_BASE_URL` — public base URL used when returning feed URLs
  (e.g. `https://channel-manager-8rq4.onrender.com`). Falls back to the
  request's own host when unset.
- Run the migration (`1792400000000-IcalSync`) to create the
  `ical_feed`, `ical_import_source`, and `ical_external_block` tables.
  Migrations only run when `MIGRATIONS_RUN=true`.
- Add `node-ical` (`npm install`) — new dependency for feed parsing.

## Important caveats

1. **Not real-time.** OTAs poll iCal feeds every few hours, and Anli polls
   imports every 30 minutes. A booking made on either side inside that window
   can still double-book. iCal is the safety net; the channel APIs
   (Booking.com Connect, Airbnb API — see `src/api/implementations/`) are the
   real-time path.
2. **Availability only — no rates.** iCal has no rate field. Rate sync must go
   through the channel APIs, never iCal.
3. **No guest data crosses the boundary.** Export emits generic busy blocks;
   import stores date ranges only.
4. **Recurring events (RRULE) are not expanded** during import. OTA exports
   are normally flattened per-booking, so this rarely matters.
5. If a feed URL ever leaks, rotate it (`POST /ical/feeds/:id/rotate`) —
   the old URL stops working immediately.
