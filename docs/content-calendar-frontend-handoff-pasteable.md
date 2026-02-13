# Content Calendar — Frontend Summary (Copy-Paste Ready)

## Endpoints

| Purpose | Method | URL |
|---------|--------|-----|
| All subscribed strategies + calendars | GET | `/api/v1/strategies/content-calendar` |
| Single strategy detail | GET | `/api/v1/audiences/:id` |
| List audiences (with `has_content_calendar`) | GET | `/api/v1/audiences` |

All require **`Authorization: Bearer <token>`**.

---

## Calendar testbed (`/calendar-testbed`)

- Append **`?testbed=1`** (or header **`X-Calendar-Testbed: 1`**) on that page.
- Backend returns **fixture data** when real data is empty so you can build without purchases.

---

## Response handling

- **`contentIdeas`** / **`content_ideas`** – array of up to 30 items.  
  Shape: `{ dayNumber, title, searchIntent?, format?, keywords? }`.
- **`contentCalendarGeneratedAt`** – `null` when still generating, ISO string when ready.
- **`_testbed`** – present when fixture data is returned (useful for debugging).

---

## UI states

| State | Condition | UI |
|-------|-----------|-----|
| **Generating** | `contentIdeas.length === 0` | Show “Calendar generating…” and poll every 5–10s for up to ~2 min. |
| **Ready** | `contentIdeas.length > 0` | Render the 30-day calendar. |
| **Empty** | `strategies.length === 0` | “Subscribe to a strategy to get your calendar.” |

---

## Handoff doc

- **`docs/content-calendar-frontend-handoff-pasteable.md`** – this file (copy-pasteable summary).
- **`docs/CONTENT_CALENDAR_FRONTEND_HANDOFF.md`** – full handoff with types, examples, and checklist.
