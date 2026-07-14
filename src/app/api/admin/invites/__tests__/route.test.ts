/**
 * @jest-environment node
 */

import * as route from "../route";

const mockGetCurrentUserProfile = jest.fn();
const mockIsSuperAdmin = jest.fn();
const mockCreateVolunteerInvite = jest.fn();
const mockResendVolunteerInvite = jest.fn();
const mockRevokeVolunteerInvite = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

jest.mock("@/lib/auth/roles", () => ({
  getCurrentUserProfile: (...args: unknown[]) =>
    mockGetCurrentUserProfile(...args),
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin(...args),
}));

jest.mock("@/lib/auth/user-management", () => ({
  createVolunteerInvite: (...args: unknown[]) =>
    mockCreateVolunteerInvite(...args),
  resendVolunteerInvite: (...args: unknown[]) =>
    mockResendVolunteerInvite(...args),
  revokeVolunteerInvite: (...args: unknown[]) =>
    mockRevokeVolunteerInvite(...args),
  UserManagementError: class MockUserManagementError extends Error {
    status: number;

    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

describe("POST /api/admin/invites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no authenticated user exists", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({ user: null, profile: null });

    const request = new Request("http://localhost:3000/api/admin/invites", {
      method: "POST",
      body: JSON.stringify({ email: "volunteer@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await route.POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid request payloads", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "super_admin" },
    });
    mockIsSuperAdmin.mockReturnValue(true);

    const request = new Request("http://localhost:3000/api/admin/invites", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await route.POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please provide a valid email address.",
    });
  });

  it("creates a volunteer invite for super admins", async () => {
    const invite = {
      id: "invite-1",
      email: "volunteer@example.com",
      role: "volunteer",
      status: "pending",
      token_hash: "hash",
      invited_by: "user-1",
      accepted_user_id: null,
      expires_at: "2026-07-21T12:00:00.000Z",
      created_at: "2026-07-14T12:00:00.000Z",
      updated_at: "2026-07-14T12:00:00.000Z",
    };

    mockGetCurrentUserProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "super_admin" },
    });
    mockIsSuperAdmin.mockReturnValue(true);
    mockCreateVolunteerInvite.mockResolvedValue({
      invite,
      invitePath: "/invite/volunteer?token=test-token",
    });

    const request = new Request("http://localhost:3000/api/admin/invites", {
      method: "POST",
      body: JSON.stringify({ email: "volunteer@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await route.POST(request);

    expect(mockCreateVolunteerInvite).toHaveBeenCalledWith({
      email: "volunteer@example.com",
      invitedBy: "user-1",
      origin: "http://localhost:3000",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      invite,
      invitePath: "/invite/volunteer?token=test-token",
    });
  });
});

describe("PATCH /api/admin/invites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid invite actions", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "super_admin" },
    });
    mockIsSuperAdmin.mockReturnValue(true);

    const request = new Request("http://localhost:3000/api/admin/invites", {
      method: "PATCH",
      body: JSON.stringify({ inviteId: "bad-id", action: "resend" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await route.PATCH(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please provide a valid invite id.",
    });
  });

  it("re-sends a pending invite", async () => {
    const invite = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "volunteer@example.com",
      role: "volunteer",
      status: "pending",
      token_hash: "hash",
      invited_by: "user-1",
      accepted_user_id: null,
      expires_at: "2026-07-21T12:00:00.000Z",
      created_at: "2026-07-14T12:00:00.000Z",
      updated_at: "2026-07-14T12:00:00.000Z",
    };

    mockGetCurrentUserProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "super_admin" },
    });
    mockIsSuperAdmin.mockReturnValue(true);
    mockResendVolunteerInvite.mockResolvedValue({
      invite,
      invitePath: "/invite/volunteer?token=fresh-token",
    });

    const request = new Request("http://localhost:3000/api/admin/invites", {
      method: "PATCH",
      body: JSON.stringify({
        inviteId: invite.id,
        action: "resend",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await route.PATCH(request);

    expect(mockResendVolunteerInvite).toHaveBeenCalledWith({
      inviteId: invite.id,
      origin: "http://localhost:3000",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      invite,
      invitePath: "/invite/volunteer?token=fresh-token",
    });
  });

  it("revokes a pending invite", async () => {
    const invite = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      email: "volunteer@example.com",
      role: "volunteer",
      status: "revoked",
      token_hash: "hash",
      invited_by: "user-1",
      accepted_user_id: null,
      expires_at: "2026-07-21T12:00:00.000Z",
      created_at: "2026-07-14T12:00:00.000Z",
      updated_at: "2026-07-14T12:30:00.000Z",
    };

    mockGetCurrentUserProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "super_admin" },
    });
    mockIsSuperAdmin.mockReturnValue(true);
    mockRevokeVolunteerInvite.mockResolvedValue(invite);

    const request = new Request("http://localhost:3000/api/admin/invites", {
      method: "PATCH",
      body: JSON.stringify({
        inviteId: invite.id,
        action: "revoke",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await route.PATCH(request);

    expect(mockRevokeVolunteerInvite).toHaveBeenCalledWith({
      inviteId: invite.id,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      invite,
    });
  });
});