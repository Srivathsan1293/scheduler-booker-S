"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  EnvelopeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useSnackbar } from "@/components/snackbar";
import {
  useCreateVolunteerInvite,
  useUpdateVolunteerInvite,
  useUserManagementData,
} from "@/lib/hooks/useUserManagement";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type InviteFormData = z.infer<typeof inviteSchema>;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function UserManagementScreen() {
  const { data, isLoading, error: fetchError } = useUserManagementData();
  const createInviteMutation = useCreateVolunteerInvite();
  const updateInviteMutation = useUpdateVolunteerInvite();
  const [search, setSearch] = useState("");
  const { success, error } = useSnackbar();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const users = data?.users ?? [];
  const invites = data?.invites ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.display_name ?? "").toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [search, users]);

  const pendingInvites = invites.filter((invite) => invite.status === "pending");

  const onSubmit = async (formData: InviteFormData) => {
    try {
      await createInviteMutation.mutateAsync({ email: formData.email });
      reset();
      success("Volunteer invite email sent successfully.");
    } catch (inviteError) {
      error(
        inviteError instanceof Error
          ? inviteError.message
          : "Failed to send volunteer invite.",
      );
    }
  };

  const handleInviteAction = async (
    inviteId: string,
    action: "resend" | "revoke",
  ) => {
    try {
      await updateInviteMutation.mutateAsync({ inviteId, action });
      success(
        action === "resend"
          ? "Volunteer invite email re-sent successfully."
          : "Volunteer invite revoked successfully.",
      );
    } catch (inviteError) {
      error(
        inviteError instanceof Error
          ? inviteError.message
          : "Failed to update volunteer invite.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-gray-600">Loading user management data...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {fetchError instanceof Error
            ? fetchError.message
            : "Failed to load user management data."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-600/10 p-3 ring-1 ring-blue-200">
              <EnvelopeIcon className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invite a volunteer</h2>
              <p className="mt-1 text-sm text-gray-700">
                Send a Supabase-backed email invite that guides a volunteer through account setup.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                Volunteer email
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                placeholder="volunteer@example.com"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              {errors.email ? (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={createInviteMutation.isPending}
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createInviteMutation.isPending ? "Sending invite..." : "Send invite"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm text-blue-900">
            Invites expire after 7 days. Existing users and already-pending invite emails are blocked.
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-600/10 p-3 ring-1 ring-amber-200">
              <ShieldCheckIcon className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending invites</h2>
              <p className="mt-1 text-sm text-gray-700">
                Monitor open invitations and verify when volunteers have not completed onboarding yet.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {pendingInvites.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 p-5 text-sm text-gray-600">
                No pending invites yet.
              </div>
            ) : (
              pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Expires {formatDateTime(invite.expires_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                        {invite.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInviteAction(invite.id, "resend")}
                          disabled={updateInviteMutation.isPending}
                          className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Resend
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInviteAction(invite.id, "revoke")}
                          disabled={updateInviteMutation.isPending}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3">
                <UserGroupIcon className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Users</h2>
                <p className="text-sm text-gray-600">
                  View current roles, onboarding status, and who already has access.
                </p>
              </div>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 md:max-w-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Onboarding
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/70">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No users matched your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-gray-900">
                        {user.display_name || "No display name"}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-700">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-700">
                      {user.onboarded ? "Completed" : "Pending"}
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-700">
                      {formatDateTime(user.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}