import type { AppRole, UserProfile, VolunteerInvite } from "@/lib/auth/roles";

export type ManagedUser = UserProfile;
export type ManagedInvite = VolunteerInvite;

export interface UserManagementResponse {
  users: ManagedUser[];
  invites: ManagedInvite[];
}

export interface CreateVolunteerInviteRequest {
  email: string;
}

export interface CreateVolunteerInviteResponse {
  success: true;
  invite: ManagedInvite;
  invitePath: string;
}

export interface UpdateVolunteerInviteRequest {
  inviteId: string;
  action: "resend" | "revoke";
}

export interface UpdateVolunteerInviteResponse {
  success: true;
  invite: ManagedInvite;
  invitePath?: string;
}

export interface UserRoleOption {
  label: string;
  value: AppRole;
}