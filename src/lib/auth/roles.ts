import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { Enums, Tables } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type AppRole = Enums<"app_role">;
export type UserProfile = Tables<"user_profiles">;
export type VolunteerInvite = Tables<"volunteer_invites">;

export interface AuthenticatedProfile {
  user: User;
  profile: UserProfile;
}

export function isSuperAdmin(role: AppRole | null | undefined) {
  return role === "super_admin";
}

export async function getCurrentUserProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { user, profile: null };
  }

  return { user, profile };
}

export async function requireAuthenticatedProfile(): Promise<AuthenticatedProfile> {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return { user, profile };
}

export async function requireSuperAdminPage(): Promise<AuthenticatedProfile> {
  const auth = await requireAuthenticatedProfile();

  if (!isSuperAdmin(auth.profile.role)) {
    redirect("/dashboard");
  }

  return auth;
}