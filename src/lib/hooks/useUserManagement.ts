"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateVolunteerInviteRequest,
  CreateVolunteerInviteResponse,
  UpdateVolunteerInviteRequest,
  UpdateVolunteerInviteResponse,
  UserManagementResponse,
} from "@/lib/types/user-management";

const userManagementQueryKey = ["admin", "user-management"] as const;

async function fetchUserManagementData(): Promise<UserManagementResponse> {
  const response = await fetch("/api/admin/users");

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to load user management data." }));
    throw new Error(errorData.error ?? "Failed to load user management data.");
  }

  return response.json();
}

async function createVolunteerInvite(
  payload: CreateVolunteerInviteRequest,
): Promise<CreateVolunteerInviteResponse> {
  const response = await fetch("/api/admin/invites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Failed to send volunteer invite.");
  }

  return result;
}

async function updateVolunteerInvite(
  payload: UpdateVolunteerInviteRequest,
): Promise<UpdateVolunteerInviteResponse> {
  const response = await fetch("/api/admin/invites", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Failed to update volunteer invite.");
  }

  return result;
}

export function useUserManagementData() {
  return useQuery({
    queryKey: userManagementQueryKey,
    queryFn: fetchUserManagementData,
    staleTime: 30 * 1000,
  });
}

export function useCreateVolunteerInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVolunteerInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userManagementQueryKey });
    },
  });
}

export function useUpdateVolunteerInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVolunteerInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userManagementQueryKey });
    },
  });
}