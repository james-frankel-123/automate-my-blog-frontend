# Vercel Staging Environment Setup

This doc describes how to configure a **staging** environment for the frontend. You can use either:

- A **separate** Vercel project named `automate-my-blog-frontend-staging` (sections 1–5 below), or  
- The **existing** Vercel project with a staging environment (e.g. Production branch = `main`, staging from branch `staging` or a Vercel “Staging” environment).

The **“Approve and push to production”** workflow (section 6) works either way and respects branch protection on `main`.

## 1. Create the staging project in Vercel (if using a separate project)

1. In the [Vercel dashboard](https://vercel.com/dashboard), click **Add New…** → **Project**.
2. **Import** the same Git repository as production (e.g. `Automate-My-Blog/automate-my-blog-frontend`).
3. Set the **Project Name** to: `automate-my-blog-frontend-staging`.
4. Use the same **Framework Preset** and **Root Directory** as production (Create React App / root).
5. **Do not** override Build Command or Output Directory unless you have a reason.

## 2. Branch and deployment behavior (recommended for “approve and push to production”)

Use **Option A** so you have a clear path to an “approve and push to production” button:

- **Staging project:** Set **Production Branch** to `staging`. Pushes to `staging` update the staging URL; other branches get Preview URLs.
- **Production project:** Keep **Production Branch** as `main`. Pushes to `main` deploy to production (existing deploy workflow).

Flow:

1. Work happens on feature branches → PRs merge into **`staging`** (or you push directly to `staging`).
2. Staging site updates from `staging`. You verify at the staging URL.
3. When ready, you run **“Promote staging to production”** (see below) → merges `staging` into `main` → production Vercel project deploys from `main`.

**Option B – Same as main:** Leave staging project’s Production Branch as `main` and distinguish via env vars only. You lose the explicit “staging branch → production branch” promotion step.

## 3. Environment variables

In the staging project: **Settings → Environment Variables**.

Add at least:

| Name                 | Value (example)                          | Environments   |
|----------------------|------------------------------------------|----------------|
| `REACT_APP_API_URL`  | Your staging backend URL                 | Production, Preview |

Use a staging backend URL (e.g. a separate Vercel backend project or a staging API) so staging does not hit production APIs.

Other optional vars (see `.env.example`):

- `REACT_APP_STREAMING_ENABLED` – e.g. `true` for staging.
- `REACT_APP_GITHUB_REPO` – same as production if you want.

Apply to **Production** and **Preview** as needed.

## 4. GitHub secrets (only if you deploy via GitHub Actions)

The existing **production** deploy uses:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_TOKEN`

For **staging**, you can either:

- **Let Vercel deploy from Git** (recommended for staging): no extra GitHub secrets. Vercel will build and deploy on push to the branch you configured.
- **Deploy staging from GitHub Actions:** create a **second** Vercel project (this one), then add **separate** secrets for it, e.g.:
  - `VERCEL_ORG_ID_STAGING` (can be same as prod if same org)
  - `VERCEL_PROJECT_ID_STAGING` (from this project’s settings)
  - Same `VERCEL_TOKEN` can be used for both projects.

If you use Actions, add a job or workflow that runs on the staging branch and uses the staging project ID (see [Vercel: Deploy with GitHub Actions](https://vercel.com/docs/deployments/configure-a-build#using-the-vercel-github-action)).

## 5. URLs after setup

- **Staging (Production deployment of this project):**  
  `https://automate-my-blog-frontend-staging.vercel.app` (or your custom domain if you add one).
- **Previews:**  
  Each branch/PR will get a preview URL like `https://automate-my-blog-frontend-staging-<hash>-<team>.vercel.app`.

## 6. “Approve and push to production” button (works with branch protection)

A manual GitHub Action **creates a PR from `staging` into `main`**. You merge the PR in GitHub when ready; no bypass of branch protection is required.

**How to run it:**

1. In GitHub: **Actions** → **Promote staging to production**.
2. Click **Run workflow**.
3. In the input, type **`production`** (exactly) and run.
4. The workflow creates a PR (or reuses an existing open one). Open the PR link from the workflow run summary.
5. **Merge the PR** in GitHub (reviews/checks apply per your branch protection). Once merged, the deploy workflow runs and deploys to production.

If there is already an open PR from `staging` to `main`, the workflow simply reports that PR so you can merge it.

## 7. Summary checklist

- [ ] Staging available (separate project **automate-my-blog-frontend-staging** or existing project’s staging environment)
- [ ] Staging deploys from branch **`staging`** (or your chosen branch)
- [ ] `REACT_APP_API_URL` (and any other env vars) set for staging
- [ ] One deployment to staging to confirm the URL works
- [ ] “Promote staging to production” workflow creates a PR; merge that PR to deploy (branch protection applies as usual)
