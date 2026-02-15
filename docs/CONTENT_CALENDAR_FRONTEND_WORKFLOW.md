# Content Calendar — Frontend Workflow

This doc walks through how the frontend loads and displays the 30-day content calendar, and **why you see periodic `GET /api/v1/audiences/:id` calls** when the calendar is still generating.

---

## 1. Where the calendar is used

| Place | Component | Trigger |
|-------|-----------|--------|
| **Dashboard** (Returning user) | `ContentCalendarSection` | User selects a *subscribed* strategy in the carousel → calendar section appears above the posts list. |
| **Calendar testbed** | Same `ContentCalendarSection` | User picks "Live (audience ID)", selects an audience (or pastes ID), clicks "Load calendar". |

In both cases the same component is used: **`ContentCalendarSection`** in `src/components/Dashboard/ContentCalendarSection.js`.

---

## 2. Single-audience API call

- **Endpoint:** `GET /api/v1/audiences/:id` (e.g. `.../api/v1/audiences/e07de0a6-150d-47ee-a595-6f8bfa8967d9`).
- **Called by:** `autoBlogAPI.getAudience(strategyId)` inside `ContentCalendarSection`.
- **When:** On mount when `strategyId` is set, and then **repeatedly (polling)** if the calendar is not ready yet.

---

## 3. Flow inside `ContentCalendarSection`

1. **Mount**  
   - `strategyId` is set (from testbed selection or dashboard selected strategy).  
   - `useEffect` runs → calls `fetchAudience()` once.

2. **First response**  
   - **If** `audience.content_ideas` has length > 0 **or** `audience.content_calendar_generated_at` is set  
     → **Calendar ready.** Render the 30-day list. **No polling.**  
   - **Else**  
     → Treat as **“generating”**. Show spinner + “Your 30-day content calendar is being generated…” and **start polling**.

3. **Polling (why you see periodic calls)**  
   - **Interval:** Every **8 seconds** (`POLL_INTERVAL_MS = 8000`).  
   - **Action:** Call `fetchAudience()` again (same `GET /api/v1/audiences/:id`).  
   - **Stop when:**  
     - Response has `content_ideas.length > 0` or `content_calendar_generated_at` set → show list, stop polling.  
     - **Or** **2 minutes** have passed → show “Calendar is taking longer than expected…”, **polling continues** (only the timeout message is shown).  
   - **Cleanup:** On unmount or when `strategyId` changes, timers are cleared and polling stops.

So the **periodic `curl` you see** is this polling: the frontend is re-requesting the same audience every 8s until the backend has populated `content_ideas` / `content_calendar_generated_at` for that audience.

---

## 4. Backend meaning of “not ready”

- Right after a user subscribes to a strategy, the backend enqueues a **content_calendar** job.  
- Until that job finishes, for that audience:  
  - `content_ideas` is `[]` (or null).  
  - `content_calendar_generated_at` is null.  
- So the frontend keeps polling until the worker has written the 30 ideas and set `content_calendar_generated_at`.

---

## 5. Summary

| What you see | Reason |
|--------------|--------|
| One `GET /api/v1/audiences/:id` on “Load calendar” | Initial fetch in `ContentCalendarSection`. |
| Same call every ~8 seconds | Polling while calendar is “generating” (empty ideas, null `content_calendar_generated_at`). |
| Calls stop | When the backend returns a non-empty `content_ideas` or sets `content_calendar_generated_at`. |
| “Calendar is taking longer than expected” | Shown after 2 minutes; polling still runs until you leave the view or the backend returns ready. |

---

## 6. Optional: reduce polling in the testbed

If you want to **avoid periodic calls in the testbed** (e.g. when you’re only checking UI states), we can add a “Disable polling” or “Single fetch only” option in the testbed so that `ContentCalendarSection` is used in a “one-shot” mode and does not start the 8s poll. If you want that, say so and we can wire it (e.g. via a prop like `pollUntilReady={false}`).
