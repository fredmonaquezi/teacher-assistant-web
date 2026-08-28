# Teacher Codex integration rollout

Use this order so visitors never reach Toolbox with shared authentication enabled
before its account-backed tables and redirect allow-list are ready.

## 1. Check existing Toolbox account data

Teacher Toolbox previously used a separate Supabase project. Before cutover,
check whether that project contains real users or rows in `custom_prompts`.

- If it has no production data, continue with the new shared project.
- If it has production data, export and migrate the users/prompts before
  changing the public deployment. Do not delete the old project during rollout.

## 2. Prepare the shared Supabase project

Use the Teacher Assistant Supabase project as the canonical account system.

1. Apply `20260828010000_create_teacher_toolbox_tables.sql` with the normal
   migration workflow.
2. In Authentication → URL Configuration, set:
   - Site URL: `https://www.teachercodex.com/`
   - Redirect URL: `https://www.teachercodex.com/**`
   - Local Teacher Assistant URLs: `http://127.0.0.1:5173/**` and
     `http://localhost:5173/**`
   - Local Toolbox URLs: `http://127.0.0.1:4173/**` and
     `http://localhost:4173/**`
3. If Google sign-in is enabled, add `https://www.teachercodex.com` as an
   authorized JavaScript origin. Keep the Supabase project callback URL as the
   authorized redirect URI.

## 3. Deploy Teacher Toolbox

Deploy the `teachertoolbox` repository first. Verify its direct Vercel URL still:

- opens games without an account;
- returns sign-in links to `https://www.teachercodex.com/toolbox/`;
- saves a custom prompt for a signed-in test user;
- links back to the Teacher Codex landing page.

## 4. Deploy Teacher Codex / Teacher Assistant

Deploy this repository after Toolbox is ready. Its Vercel configuration keeps
the custom domain here and proxies `/toolbox/*` to the Toolbox deployment.

Verify:

- `/` shows the two-product landing page;
- `/teacherassistant/` requires a teacher account;
- `/teacherassistant/reset-password` handles recovery links;
- `/toolbox/` opens the public game library without changing the browser URL;
- signing in through either product is recognized by the other;
- signing out in one product signs the shared account out in the other;
- `teachercodex.com` redirects to the canonical `www.teachercodex.com` host.

## Rollback

If the proxy or shared session fails, roll the Teacher Codex Vercel project back
to its previous deployment first. The separately deployed Toolbox URL and the
old Toolbox Supabase project should remain available until the rollout has been
verified.
