import Link from "next/link";
import { redirect } from "next/navigation";
import {
  acceptVolunteerInvite,
  getInviteByToken,
} from "@/lib/auth/user-management";
import { createSupabaseServerClient } from "@/lib/supabase-server";

interface VolunteerInvitePageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function VolunteerInvitePage({
  searchParams,
}: VolunteerInvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/30 bg-white/85 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-gray-900">Invite required</h1>
          <p className="mt-3 text-gray-700">
            This page can only be opened from a volunteer invitation email.
          </p>
        </div>
      </div>
    );
  }

  const invite = await getInviteByToken(token);

  if (!invite || invite.status !== "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/30 bg-white/85 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-gray-900">Invite unavailable</h1>
          <p className="mt-3 text-gray-700">
            This volunteer invite is invalid, expired, or has already been used.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/30 bg-white/85 p-8 shadow-xl backdrop-blur-sm">
          <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            Volunteer invitation
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            You&apos;re invited to join the app
          </h1>
          <p className="mt-3 text-gray-700">
            This invitation is reserved for <span className="font-semibold text-gray-900">{invite.email}</span>.
            Use the email link that was sent to you to complete account setup. After the invite is accepted,
            you&apos;ll be brought back here automatically.
          </p>
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            If you reached this page directly, go back to the invitation email and open the secure link from there.
          </div>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  await acceptVolunteerInvite({
    token,
    userId: user.id,
    email: user.email,
    displayName:
      user.user_metadata?.display_name ?? user.user_metadata?.name ?? null,
  });

  redirect(user.user_metadata?.onboarded ? "/dashboard" : "/onboarding");
}