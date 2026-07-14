import { createSupabaseServiceClient } from "@/lib/supabase-server";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/database.types";
import type { AppRole } from "@/lib/auth/roles";

export class UserManagementError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserManagementError";
    this.status = status;
  }
}

export interface UpsertUserProfileInput {
  userId: string;
  email: string;
  displayName?: string | null;
  invitedBy?: string | null;
  onboarded?: boolean;
  role?: AppRole;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createInviteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function hashInviteToken(token: string) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );

  return Array.from(new Uint8Array(buffer), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export async function upsertUserProfile(input: UpsertUserProfileInput) {
  const supabase = createSupabaseServiceClient();
  const payload: TablesInsert<"user_profiles"> = {
    id: input.userId,
    email: normalizeEmail(input.email),
    display_name: input.displayName ?? null,
    invited_by: input.invitedBy ?? null,
    onboarded: input.onboarded ?? false,
    ...(input.role ? { role: input.role } : {}),
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new UserManagementError(error.message, 500);
  }

  return data;
}

export async function listUserManagementData() {
  const supabase = createSupabaseServiceClient();

  const [{ data: users, error: usersError }, { data: invites, error: invitesError }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("volunteer_invites")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  if (usersError) {
    throw new UserManagementError(usersError.message, 500);
  }

  if (invitesError) {
    throw new UserManagementError(invitesError.message, 500);
  }

  return {
    users: users ?? [],
    invites: invites ?? [],
  };
}

export async function getInviteByToken(token: string) {
  const supabase = createSupabaseServiceClient();
  const tokenHash = await hashInviteToken(token);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("volunteer_invites")
    .select("*")
    .eq("token_hash", tokenHash)
    .gte("expires_at", now)
    .maybeSingle();

  if (error) {
    throw new UserManagementError(error.message, 500);
  }

  return data;
}

export async function createVolunteerInvite(options: {
  email: string;
  invitedBy: string;
  origin: string;
}) {
  const supabase = createSupabaseServiceClient();
  const normalizedEmail = normalizeEmail(options.email);
  const now = new Date().toISOString();

  const { data: existingInvite, error: existingInviteError } = await supabase
    .from("volunteer_invites")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .gte("expires_at", now)
    .maybeSingle();

  if (existingInviteError) {
    throw new UserManagementError(existingInviteError.message, 500);
  }

  if (existingInvite) {
    throw new UserManagementError(
      "A pending invite already exists for this email.",
      409,
    );
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfileError) {
    throw new UserManagementError(existingProfileError.message, 500);
  }

  if (existingProfile) {
    throw new UserManagementError(
      "A user with this email already exists.",
      409,
    );
  }

  const token = createInviteToken();
  const tokenHash = await hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invitePayload: TablesInsert<"volunteer_invites"> = {
    email: normalizedEmail,
    expires_at: expiresAt,
    invited_by: options.invitedBy,
    role: "volunteer",
    status: "pending",
    token_hash: tokenHash,
  };

  const { data: invite, error: inviteError } = await supabase
    .from("volunteer_invites")
    .insert(invitePayload)
    .select("*")
    .single();

  if (inviteError) {
    throw new UserManagementError(inviteError.message, 500);
  }

  const emailResult = await sendVolunteerInviteEmail({
    inviteId: invite.id,
    email: normalizedEmail,
    origin: options.origin,
    token,
  });

  return {
    invite,
    invitePath: emailResult.invitePath,
    redirectTo: emailResult.redirectTo,
  };
}

async function sendVolunteerInviteEmail(options: {
  inviteId: string;
  email: string;
  origin: string;
  token: string;
}) {
  const supabase = createSupabaseServiceClient();

  const invitePath = `/invite/volunteer?token=${encodeURIComponent(options.token)}`;
  const redirectTo = `${options.origin}${invitePath}`;

  const { error: inviteEmailError } = await supabase.auth.admin.inviteUserByEmail(
    options.email,
    {
      data: {
        invite_id: options.inviteId,
        role: "volunteer",
      },
      redirectTo,
    },
  );

  if (inviteEmailError) {
    throw new UserManagementError(inviteEmailError.message, 500);
  }

  return {
    invitePath,
    redirectTo,
  };
}

export async function resendVolunteerInvite(options: {
  inviteId: string;
  origin: string;
}) {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data: invite, error: inviteError } = await supabase
    .from("volunteer_invites")
    .select("*")
    .eq("id", options.inviteId)
    .maybeSingle();

  if (inviteError) {
    throw new UserManagementError(inviteError.message, 500);
  }

  if (!invite || invite.status !== "pending") {
    throw new UserManagementError("Only pending invites can be resent.", 400);
  }

  if (invite.expires_at < now) {
    throw new UserManagementError("This invite has expired and cannot be resent.", 400);
  }

  const token = createInviteToken();
  const tokenHash = await hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: updatedInvite, error: updateError } = await supabase
    .from("volunteer_invites")
    .update({
      token_hash: tokenHash,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", options.inviteId)
    .select("*")
    .single();

  if (updateError) {
    throw new UserManagementError(updateError.message, 500);
  }

  const emailResult = await sendVolunteerInviteEmail({
    inviteId: updatedInvite.id,
    email: updatedInvite.email,
    origin: options.origin,
    token,
  });

  return {
    invite: updatedInvite,
    invitePath: emailResult.invitePath,
    redirectTo: emailResult.redirectTo,
  };
}

export async function revokeVolunteerInvite(options: { inviteId: string }) {
  const supabase = createSupabaseServiceClient();

  const { data: invite, error: inviteError } = await supabase
    .from("volunteer_invites")
    .select("*")
    .eq("id", options.inviteId)
    .maybeSingle();

  if (inviteError) {
    throw new UserManagementError(inviteError.message, 500);
  }

  if (!invite || invite.status !== "pending") {
    throw new UserManagementError("Only pending invites can be revoked.", 400);
  }

  const { data: updatedInvite, error: updateError } = await supabase
    .from("volunteer_invites")
    .update({
      status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", options.inviteId)
    .select("*")
    .single();

  if (updateError) {
    throw new UserManagementError(updateError.message, 500);
  }

  return updatedInvite;
}

export async function acceptVolunteerInvite(options: {
  token: string;
  userId: string;
  email: string;
  displayName?: string | null;
}) {
  const supabase = createSupabaseServiceClient();
  const invite = await getInviteByToken(options.token);

  if (!invite || invite.status !== "pending") {
    throw new UserManagementError("This invite is invalid or has expired.", 404);
  }

  if (normalizeEmail(invite.email) !== normalizeEmail(options.email)) {
    throw new UserManagementError(
      "This invite does not match the signed-in user.",
      403,
    );
  }

  const updatedProfile = await upsertUserProfile({
    userId: options.userId,
    email: options.email,
    displayName: options.displayName,
    invitedBy: invite.invited_by,
    onboarded: false,
    role: "volunteer",
  });

  const inviteUpdate: TablesUpdate<"volunteer_invites"> = {
    accepted_user_id: options.userId,
    status: "accepted",
    updated_at: new Date().toISOString(),
  };

  const { error: inviteUpdateError } = await supabase
    .from("volunteer_invites")
    .update(inviteUpdate)
    .eq("id", invite.id);

  if (inviteUpdateError) {
    throw new UserManagementError(inviteUpdateError.message, 500);
  }

  return {
    invite,
    profile: updatedProfile,
  };
}

export type ManagedUser = Tables<"user_profiles">;
export type ManagedInvite = Tables<"volunteer_invites">;