# Volunteer User Management

This feature adds a Supabase-backed role model with two roles:

- `super_admin`
- `volunteer`

It also adds an admin-only dashboard route for user management and a volunteer invite flow.

## Files Added

- `supabase-user-management.sql`
- `src/lib/auth/roles.ts`
- `src/lib/auth/user-management.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/invites/route.ts`
- `src/app/invite/volunteer/page.tsx`
- `src/app/dashboard/users/page.tsx`
- `src/components/admin/UserManagementScreen.tsx`
- `src/lib/hooks/useUserManagement.ts`
- `src/lib/types/user-management.ts`

## Supabase Setup

Run `supabase-user-management.sql` against the project database.

This creates:

- `app_role` enum
- `user_profiles` table
- `volunteer_invites` table
- RLS policies for self-profile access
- indexes for role and invite lookups
- backfill logic for existing `auth.users`

## Bootstrap the First Admin

After running the SQL, promote the first admin manually:

```sql
UPDATE user_profiles
SET role = 'super_admin'
WHERE email = 'admin@example.com';
```

Without this step, nobody can access the user management screen.

## New Routes

- `/dashboard/users`
  - Super-admin only user management screen.
- `/api/admin/users`
  - Returns users and invite records for the admin UI.
- `/api/admin/invites`
  - Sends a volunteer invite email through Supabase Auth.
- `/invite/volunteer?token=...`
  - Invite landing route used after the Supabase invite email flow.

## Current Behavior

- New signups are mirrored into `user_profiles` with the default `volunteer` role.
- Onboarding updates `user_profiles.display_name` and `user_profiles.onboarded`.
- The root layout and navbar now render admin navigation only for `super_admin`.
- The dashboard shows a `Manage Users` card only for `super_admin`.

## Operational Notes

- Invite emails rely on Supabase Auth email delivery being configured correctly.
- Existing emails with pending invites are blocked from duplicate invite creation.
- Existing users are blocked from being invited again as volunteers.
- The invite route currently assumes the Supabase email invite flow completes authentication before redirecting back to `/invite/volunteer`.

## Validation

TypeScript validation completed successfully with:

```bash
npm run type-check
```