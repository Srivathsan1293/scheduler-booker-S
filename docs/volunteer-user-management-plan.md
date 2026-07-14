## Plan: Supabase Volunteer User Management

Add a role-backed user management capability on top of the current Next.js + Supabase app by introducing a dedicated user profile/role model, an invite-only volunteer signup flow, and an admin-only dashboard screen. Recommended approach: keep Supabase Auth for identity, move authorization into first-class database tables instead of auth metadata, and gate admin pages/routes with server-side profile checks.

**Steps**
1. Phase 1 — Data model and authorization foundation.
   - Add a new SQL migration alongside the existing schema in c:\dev\scheduler-booker to create:
     - a role enum or constrained text column with values `super_admin` and `volunteer`
     - a `user_profiles` table keyed by `auth.users.id` with fields such as `role`, `email`, `display_name`, `onboarded`, `invited_by`, `created_at`, `updated_at`
     - a `volunteer_invites` table with `email`, `role`, `token_hash`, `status`, `expires_at`, `invited_by`, `accepted_user_id`, `created_at`, `updated_at`
   - Add indexes and RLS policies so profile self-read is possible if needed, while admin management remains server-only through protected API routes.
   - Backfill existing authenticated users into `user_profiles` with a safe default role of `volunteer`, then document a manual SQL step to promote the first super admin. This bootstrap step blocks admin UI testing.
2. Phase 2 — Shared server auth helpers. Depends on step 1.
   - Add a small server-side authorization utility near c:\dev\scheduler-booker\src\lib to fetch the current user plus `user_profiles` row and expose guards such as `requireAuthenticatedUser` and `requireSuperAdmin`.
   - Keep `user_profiles.role` as the source of truth. Do not rely on `auth.users.user_metadata` for authorization, although metadata can be mirrored for convenience if the app already reads it elsewhere.
   - Reuse `createSupabaseServerClient()` for session-bound checks and `createSupabaseServiceClient()` only inside server API routes that need to manage invites or profiles across users.
3. Phase 3 — Admin-only management APIs. Depends on step 2.
   - Add admin routes under c:\dev\scheduler-booker\src\app\api for:
     - listing users/profiles
     - creating a volunteer invite and sending the signup email
     - optionally resending or revoking pending invites
   - The create-invite route should:
     - verify the caller is `super_admin`
     - normalize the email and prevent duplicate active invites
     - create a secure random token, store only a hash in `volunteer_invites`, and set an expiration window
     - generate a signup URL that points to a dedicated volunteer signup path
     - send the email through Supabase-backed email delivery (Supabase Auth/admin invite or a Supabase function-backed mail path, depending on configured SMTP/template support)
   - Add a public invite-validation route that resolves a token to invite state without exposing the raw token after lookup.
4. Phase 4 — Invite-only volunteer signup flow. Depends on steps 1 and 3.
   - Extend the current signup flow so invited volunteers can only register through a signed invite link.
   - Add a dedicated volunteer signup page under c:\dev\scheduler-booker\src\app that:
     - validates the invite token before rendering the form
     - pre-fills and locks the invited email
     - creates the Supabase Auth user
     - creates or updates the matching `user_profiles` row with role `volunteer`
     - marks the invite accepted and links it to the created auth user
   - Preserve the current general signup/onboarding path unless the product decision is to make all new accounts invite-only. For this request, only volunteer onboarding is invite-gated.
   - Adjust onboarding so invited volunteers do not choose a free-form account type; they continue through the availability/profile setup that the scheduler app already needs.
5. Phase 5 — Super-admin dashboard screen. Depends on steps 2 and 3. Parallelizable with step 4 after the shared schema is in place.
   - Add an admin-only dashboard page under c:\dev\scheduler-booker\src\app\dashboard showing:
     - current users with role and onboarding status
     - pending invites with status/expiry
     - a form to invite a volunteer by email
   - Reuse the existing server-page auth pattern from dashboard pages and the existing client pattern from appointments/forms:
     - server component gate on load
     - client list/form component using TanStack Query
     - snackbar feedback for success/error states
   - Add a quick action card and navbar link visible only to `super_admin`.
6. Phase 6 — Layout and navigation updates. Depends on step 2.
   - Update the root layout/navbar data flow so the server layout passes enough auth context to render admin-only navigation, not just `isAuthed`.
   - Add an admin-only entry on the dashboard landing page and keep volunteers from seeing it.
   - Apply server-side guards to the admin route itself so hidden links are not the only protection.
7. Phase 7 — Tests and verification. Depends on all prior steps.
   - Add or update route tests for:
     - super-admin access allowed
     - volunteer access denied on admin APIs/pages
     - invite creation validation and duplicate-invite handling
     - invite-token validation and acceptance flow
   - Add component tests for navbar/dashboard conditional admin links and the invite form happy/error paths.
   - Run focused validation: type-check, relevant Jest tests for auth/signup/navbar/admin routes, then a manual end-to-end check with Supabase configured.

**Relevant files**
- c:\dev\scheduler-booker\src\lib\supabase-server.ts — reuse `createSupabaseServerClient()` and `createSupabaseServiceClient()` for session-bound vs admin operations.
- c:\dev\scheduler-booker\src\middleware.ts — keep session protection here, but do not move role checks into middleware unless later needed; page/API guards should remain the primary authorization layer.
- c:\dev\scheduler-booker\src\app\layout.tsx — expand auth context passed to the navbar so admin navigation can render safely on the server.
- c:\dev\scheduler-booker\src\components\common\Navbar.tsx — add conditional admin navigation entry.
- c:\dev\scheduler-booker\src\app\dashboard\page.tsx — add a super-admin quick action entry and preserve existing dashboard behavior for volunteers.
- c:\dev\scheduler-booker\src\components\auth\SignupForm.tsx — reuse form/error UX patterns for the invite-only volunteer signup page.
- c:\dev\scheduler-booker\src\app\api\auth\signup\route.ts — adapt or complement the current signup route so invited volunteer signup can create the auth account and tie it to an invite/profile.
- c:\dev\scheduler-booker\src\app\api\user\onboarding\route.ts — adjust onboarding persistence so it updates `user_profiles` and remains compatible with role-aware accounts.
- c:\dev\scheduler-booker\src\lib\hooks\queries.ts — extend query keys, API calls, and mutations for user list + invite workflows.
- c:\dev\scheduler-booker\src\components\appointments\AppointmentsList.tsx — reference list/mutation/snackbar structure for the admin users screen.
- c:\dev\scheduler-booker\src\app\dashboard\appointments\page.tsx — reference server-side protected page pattern.
- c:\dev\scheduler-booker\supabase-migrations.sql — existing schema reference; implementation may either append a new migration file or add a new checked-in SQL file following the repo’s migration practice.

**Verification**
1. Run `npm run type-check`.
2. Run focused Jest coverage for signup/auth/navbar/admin screens and new admin API route tests.
3. Manually verify: promote one existing user to `super_admin`, log in, open the admin screen, send an invite, open the emailed link, complete volunteer signup, confirm the new volunteer can access normal dashboard routes but is denied the admin route.
4. Manually verify failure cases: expired invite, reused invite, duplicate invite for same pending email, and direct access to the admin screen as a volunteer.

**Decisions**
- Use dedicated Supabase tables for roles and invites; do not make authorization depend on auth metadata.
- Volunteer signup is invite-only through a dedicated link with locked email.
- The first super admin is assigned manually in the database, not through public UI.
- Scope includes user management, role enforcement, and invite-backed volunteer signup.
- Scope excludes broader role hierarchies, self-service role changes, and non-Supabase email providers.

**Further Considerations**
1. Email delivery prerequisite: Supabase Auth/admin invite email sending requires working SMTP/template configuration in the Supabase project. If that is not already configured, implementation should either add that setup or temporarily expose a copyable invite link for local testing.
2. Existing-account handling: if an invited email already has an auth account, the create-invite flow should decide between blocking the invite, linking the existing account as a volunteer, or offering a resend/role-upgrade path. Recommended default: block duplicates and surface a clear admin message in the first iteration.
3. Migration shape: if the repository is moving toward true incremental SQL migrations, create a new migration file instead of editing the bootstrap script directly; otherwise document clearly that `supabase-migrations.sql` remains the canonical setup file.