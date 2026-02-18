# Teacher Assistant Web

Teacher workflow app built with React + Vite + Supabase.

## What it does
- Manage classes, students, subjects, units, assessments, attendance, rubrics, groups, calendar, and profile settings.
- Uses Supabase Auth and Postgres with row-level security.
- Supports optional Google OAuth sign-in (feature-flagged).

## Tech stack
- React 18
- Vite
- Supabase JS client
- React Router
- React Query
- Vitest + Testing Library

## Prerequisites
- Node.js 20+ and npm
- Supabase project (URL + anon/publishable key)

## Local setup
1. Install dependencies:
```bash
npm install
```

2. Create local env file:
```bash
cp .env.example .env.local
```

3. Fill `.env.local`:
```bash
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-or-publishable-key>"
VITE_ENABLE_GOOGLE_AUTH="false"
VITE_GOOGLE_CLIENT_ID="<google-web-client-id>.apps.googleusercontent.com"
```

4. Start dev server:
```bash
npm run dev
```

## Available scripts
- `npm run dev` - start local dev server
- `npm run lint` - run ESLint
- `npm test` - run unit + UI tests
- `npm run build` - production build
- `npm run check:bundle` - enforce bundle-size limits

## Supabase migrations (CLI)
Use this when new SQL migrations are added:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Notes:
- `db push` applies all pending migrations in `supabase/migrations`.
- If you already applied some changes manually, notices like `already exists` are expected.

## Deploy (Vercel)
1. Push branch to GitHub.
2. Import repo in Vercel.
3. Add env vars in Vercel Project Settings -> Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_GOOGLE_AUTH`
- `VITE_GOOGLE_CLIENT_ID` (only if Google auth enabled)
4. Redeploy.

Security headers are defined in `vercel.json`.

## Production security header + OAuth verification checklist
Run this every time `vercel.json` changes.

1. Redeploy your hosting project so new headers go live.
2. Verify headers on production URL:
```bash
curl -sI https://<your-production-domain> | rg -i "content-security-policy|strict-transport-security|x-content-type-options|referrer-policy|permissions-policy|cross-origin-resource-policy"
```
3. Confirm email/password auth works on production (sign in + sign out).
4. If Google auth is enabled, click the Google button on production and complete login.
5. Open browser devtools console on production and confirm there are no CSP violations.
6. If you changed production domain, update both:
- Google Cloud OAuth -> Authorized JavaScript origins
- Supabase Auth -> Site URL and Redirect URLs

## Google OAuth setup (Supabase + Google Cloud)
### In Google Cloud (OAuth client type: Web)
- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - your production URL (for example `https://your-app.vercel.app`)
- Authorized redirect URI:
  - `https://<project-ref>.supabase.co/auth/v1/callback`

### In Supabase Dashboard
1. Authentication -> Providers -> Google -> Enable
2. Paste Google Client ID + Client Secret
3. Authentication -> URL Configuration:
- Site URL = your production app URL
- Add localhost and production URLs to Redirect URLs

### In app env
- `VITE_ENABLE_GOOGLE_AUTH="true"`
- `VITE_GOOGLE_CLIENT_ID="<google-web-client-id>.apps.googleusercontent.com"`

## Common OAuth errors
- `invalid_client`: wrong Client ID/Secret in Supabase provider config.
- `origin_mismatch`: current app URL missing from Google Authorized JavaScript origins.
- Button missing in production: env flag not set in hosting provider, or deployment not refreshed.

## Security notes
- Frontend must use only anon/publishable key. Never use service-role key in browser code.
- Extra hardening docs:
  - `docs/supabase-auth-hardening.md`
  - `docs/supabase-rls-rollout.md`

## Refactor notes
- Main style entrypoint is `src/styles/app-core.css`.
- Domain style files live under `src/styles/core/`.
