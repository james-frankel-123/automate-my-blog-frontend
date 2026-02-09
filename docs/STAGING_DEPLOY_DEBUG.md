# Debug: No frontend deployments for staging in Vercel

Use this guide when the staging Vercel project isn’t deploying or when Vercel doesn’t list the `staging` branch.

Staging deployments are **not** created by GitHub Actions. They are created by **Vercel’s Git integration** when you push to the branch that the staging project uses as its Production Branch.

## 1. Confirm the staging project exists and is connected

- In [Vercel Dashboard](https://vercel.com/dashboard), open the project you use for staging (e.g. **automate-my-blog-frontend-staging**).
- **Settings → Git:** Confirm it is connected to the correct repo (e.g. `Automate-My-Blog/automate-my-blog-frontend`). If it says “No Git Repository”, connect it (Connect Git Repository → GitHub → choose the repo).

## 2. Vercel doesn’t show the `staging` branch (branch exists in GitHub)

If the Production Branch dropdown (or branch list) in Vercel doesn’t list `staging` even though it exists in GitHub:

- **Reconnect the repo:** In the project, go to **Settings → Git**. Disconnect the current repository, then **Connect Git Repository** again and select the same repo. Vercel will re-fetch branches; `staging` should appear after a short delay.
- **Type the branch name:** If there is a text field for Production Branch (or “Branch”), try typing **`staging`** exactly and save. Some UIs allow custom branch names even if they’re not in the dropdown yet.
- **GitHub App permissions:** In **GitHub → Settings → Applications → Vercel**, ensure the Vercel app has **Repository access** to this repo (or “All repositories”). If the app was only recently granted access, disconnect and reconnect the repo in Vercel (step above).
- **Same repo:** Confirm the Vercel project is connected to **the same GitHub repo** where you see the `staging` branch (e.g. `Automate-My-Blog/automate-my-blog-frontend`). A project connected to a different repo or a fork won’t show this repo’s branches.

After reconnecting or fixing permissions, set **Production Branch** to **`staging`** and save.

## 3. Set the Production Branch to `staging`

- In that same project: **Settings → Git → Production Branch**.
- Set it to **`staging`** (not `main`). Save.
- With this, every **push** to `staging` will trigger a new deployment for that project. Previews will still be built for other branches/PRs if you have them enabled.

## 4. Confirm the `staging` branch exists and has been pushed

- In GitHub: **Code** → switch branch to **staging**. If it doesn’t exist, create it (e.g. from `main`) and push.
- Vercel only deploys when there is a push to a branch it’s watching. If `staging` was never pushed after connecting the project, or the project was set to a different branch, you won’t see staging deployments.

## 5. Trigger a deployment

- Push a commit to `staging` (e.g. merge a PR into `staging`, or push from local: `git push origin staging`).
- In the staging project in Vercel, open **Deployments**. A new deployment should appear within a minute or two.

## 6. Check Vercel’s GitHub access

- **Vercel Dashboard → Settings → Git** (team or account): ensure the GitHub connection is authorized and the repo is in the list.
- If the repo was recently connected or permissions changed, try disconnecting and reconnecting the repo for the staging project.

## 7. Summary checklist

| Check | Where |
|-------|--------|
| Staging project exists | Vercel Dashboard → project list |
| Project connected to correct repo | Project → Settings → Git |
| Production Branch = `staging` | Project → Settings → Git → Production Branch |
| `staging` branch exists on GitHub | GitHub → Code → branch dropdown |
| At least one push to `staging` after connecting | Push or merge to `staging`, then check Deployments |

If all of the above are correct and you still see no deployments, check the **Deployments** tab for that project for failed or cancelled builds, and **Settings → Git** for any Vercel errors or “missing permission” messages.
