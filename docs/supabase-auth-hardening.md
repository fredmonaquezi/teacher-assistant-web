# Supabase Auth Hardening Checklist

Use this after commit 29 to align hosted Supabase Auth settings with local `supabase/config.toml`.

## Goal
- Require confirmed email before sign-in.
- Require stronger passwords.
- Require reauthentication before password changes.
- Optionally enable MFA (TOTP) when ready.

## Dashboard Steps (Hosted Project)
1. Open Supabase Dashboard for your project.
2. Go to `Authentication` -> `Providers` -> `Email`.
3. Set `Confirm email` to `ON`.
4. Set `Secure password change` to `ON`.
5. Save.
6. Go to `Authentication` -> `Settings` -> `Password security`.
7. Set `Minimum password length` to `10` (or higher).
8. Set complexity requirement to include upper/lowercase letters, numbers, and symbols.
9. Save.

## Optional MFA (TOTP)
1. Go to `Authentication` -> `Multi-Factor Auth`.
2. Enable TOTP only if you are ready to support the full MFA challenge flow in the app.
3. Keep MFA disabled for now if the app does not yet have the MFA verification UI.

## Quick Verification
1. Create a new account with a weak password and verify it is rejected.
2. Create a new account with a strong password and verify email confirmation is required before login.
3. Sign in and attempt password change; verify reauthentication is required.

## Notes
- This is a dashboard config change, not a SQL migration.
- Apply these settings separately for each Supabase environment (dev/staging/prod).
