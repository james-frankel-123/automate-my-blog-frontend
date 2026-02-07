# Investor Demo Runbook

Use this checklist to keep the frontend **bulletproof** for the Monday investor demo.

---

## Pre-demo checklist (day before or morning of)

- [ ] **Backend is up**  
  - Confirm `REACT_APP_API_URL` points to a live, healthy backend (no 5xx, CORS enabled).
- [ ] **Environment**  
  - Copy `.env.example` to `.env` if needed; set `REACT_APP_API_URL` to the demo backend.
- [ ] **Build**  
  - Run `npm run build` and fix any build errors.
- [ ] **Lint & tests**  
  - `npm run lint` and `npm test -- --watchAll=false` (fix any failures).
- [ ] **Browser**  
  - Use a clean Chrome/Edge profile (or incognito) to avoid cached errors or old sessions.
- [ ] **Network**  
  - Prefer a stable connection; avoid VPNs that might block the API.

---

## Recommended demo flow (5–7 minutes)

1. **Landing (logged out)**  
   - Open the app URL. Expect: clean hero/workflow UI, no console errors.
2. **Website analysis**  
   - Enter a simple, fast site (e.g. `https://stripe.com` or your own). Click Analyze.  
   - Expect: progress/loading state, then analysis results (narrative, sections).  
   - If the backend is slow: mention “typically 30–60 seconds” and stay on the progress state.
3. **Sign up / log in (if needed)**  
   - Register or log in so the rest of the flow is in context.
4. **Audience & content**  
   - Move to audience selection, then start a post or view existing content.  
   - Avoid deep dives into admin/sandbox unless asked.

---

## If something breaks during the demo

- **Blank screen**  
  - Refresh once. The app uses an Error Boundary and an unhandled-rejection handler to avoid silent crashes; a refresh usually recovers.
- **“Something went wrong” (Error Boundary)**  
  - Click **Try again**. If it persists, refresh and retry the last action (e.g. Analyze, Login).
- **API / network errors (toasts)**  
  - “Request timed out” or “Couldn’t finish reading your site”: say the backend may be under load and retry once, or switch to a different URL/site.
- **Login/register fails**  
  - Confirm backend auth endpoints are up; fallback: describe the flow while showing the UI.

---

## What’s hardened in the app

- **Error Boundary**  
  - Wraps the main app; render errors show “Something went wrong” + **Try again** (no raw error message in production).
- **Unhandled promise rejections**  
  - Handled in `index.js` so they don’t leave a blank screen; in development they’re logged to the console.
- **API errors**  
  - Critical paths (e.g. website analysis, auth) use try/catch and user-facing messages (toasts / empty states).
- **Web Vitals import**  
  - `reportWebVitals` catches dynamic-import failures so they don’t surface as unhandled rejections.

---

## URLs to avoid during the demo

- `/streaming-testbed` — internal testbed; skip unless you need to show streaming explicitly.
- Admin/Sandbox tabs — use only if you’ve rehearsed and the backend supports them.

---

## Quick commands

```bash
# Production build
npm run build

# Serve production build locally (optional)
npx serve -s build -l 3000

# Lint + tests
npm run lint && npm test -- --watchAll=false
```

---

*Last updated for investor demo readiness.*
