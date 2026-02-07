# Complete run-through: local frontend + prod backend

Use this checklist after the backend is deployed to verify the app works end-to-end against production.

## 1. Confirm local frontend uses prod backend

- **`.env`** (or `.env.local`) must contain:
  ```bash
  REACT_APP_API_URL=https://automate-my-blog-backend.vercel.app
  ```
- **No trailing slash** on the URL.
- If you changed `.env`, **restart the dev server** (`npm start`); Create React App only reads env at startup.

## 2. Start the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## 3. Verify API target

- Open DevTools → **Network** tab.
- Trigger any request (e.g. load the app, sign in, or run analysis).
- Confirm request URLs go to `https://automate-my-blog-backend.vercel.app` (not localhost:3001).

## 4. Run-through: onboarding funnel (Issue #261)

Use a **fresh session** to see the full funnel (e.g. incognito or clear `localStorage` for the app origin).

1. **Landing**
   - You should see the onboarding funnel (website input + “Analyze your site” title), not the dashboard.

2. **Website input**
   - Enter a valid website URL (e.g. `https://stripe.com` or any public site).
   - Click **Analyze**.
   - Progress should appear (“Reading your pages…”, “Analyzing…”, etc.) via the job stream from **prod**.

3. **Analysis result**
   - After the job completes, you should see:
     - Narration: “I analyzed your website and found a clear focus…”
     - **What I found** carousel with analysis cards (Business, Target audience, Content focus, Keywords).
     - **Edit** and **Confirm & Continue** buttons.

4. **Edit (optional)**
   - Click **Edit**.
   - Change one or more of: Business name, Target audience, Content focus.
   - Check that **What changed?** diff updates.
   - Click **Apply changes** → carousel/content should reflect edits.
   - (Optional) Click **Get suggestion** → placeholder toast until backend provides generateCleanedEdit.

5. **Confirm & Continue**
   - Click **Confirm & Continue**.
   - Audience step should unlock.

6. **Audience**
   - Narration: “I identified audience segments…”
   - Either **audience cards** from the backend (if scenarios were returned) or **one fallback segment** from analysis.
   - Select one segment → topic step unlocks.

7. **Topic**
   - Narration: “Based on your audience…”
   - Topic carousel (from analysis or placeholders).
   - Select a topic.

8. **Signup (if logged out)**
   - If not logged in: **Claim your free article** card with Register | Sign In.
   - Register or sign in → content narration and funnel completion.

9. **Content narration**
   - “I’ll create your article next…”
   - Funnel completes → you land on the **dashboard** (3-tab layout).

## 5. Run-through: returning user

- If you are **logged in** and have **completed analysis** (and workflow state is restored):
  - Opening the app should show the **dashboard** directly, not the funnel.
- To see the funnel again: clear `localStorage` for the app and reload, or use an incognito window.

## 6. Run-through: dashboard (after funnel or as returning user)

- **Posts** tab: list/grid of posts; create post flow if you use it.
- **Workflow** tab: workflow steps; website analysis step should work against prod (job creation, stream, result).
- **Leads** tab (if available): leads from prod.

## 7. Things to watch for

- **CORS:** If requests fail with CORS errors, prod backend must allow `http://localhost:3000` (or your dev origin).
- **Auth:** Login/register hit prod; JWT is for prod. All subsequent API and SSE requests use that token.
- **SSE:** Job stream (`/api/v1/jobs/:jobId/stream`) and narrative stream use the same base URL; auth via query param for EventSource.
- **Errors:** Check DevTools Console and Network for 4xx/5xx or failed EventSource. Backend logs (e.g. Vercel) can help for server errors.

## 8. Quick sanity check (no UI)

From the repo root:

```bash
# Replace with your prod URL if different
export REACT_APP_API_URL=https://automate-my-blog-backend.vercel.app

# If backend exposes a health or root endpoint:
curl -s -o /dev/null -w "%{http_code}\n" "$REACT_APP_API_URL/health"
# or
curl -s -o /dev/null -w "%{http_code}\n" "$REACT_APP_API_URL/"
```

Non-5xx (e.g. 200 or 404) means the host is reachable.

---

*Doc created for post-deploy verification with prod backend.*
