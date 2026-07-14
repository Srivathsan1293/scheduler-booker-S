/**
 * @jest-environment node
 */

import * as route from "../route";

const mockGetCurrentUserProfile = jest.fn();
const mockIsSuperAdmin = jest.fn();
const mockListUserManagementData = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

jest.mock("@/lib/auth/roles", () => ({
  getCurrentUserProfile: (...args: unknown[]) =>
    mockGetCurrentUserProfile(...args),
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin(...args),
}));

jest.mock("@/lib/auth/user-management", () => ({
  listUserManagementData: (...args: unknown[]) =>
    mockListUserManagementData(...args),
  UserManagementError: class MockUserManagementError extends Error {
    status: number;

    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no authenticated user exists", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({ user: null, profile: null });

    const response = await route.GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when the current user is not a super admin", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "volunteer" },
    });
    mockIsSuperAdmin.mockReturnValue(false);

    const response = await route.GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns user management data for super admins", async () => {
    const payload = {
      users: [
        {
          id: "user-1",
          email: "admin@example.com",
          display_name: "Admin",
          role: "super_admin",
          onboarded: true,
          invited_by: null,
          created_at: "2026-07-14T10:00:00.000Z",
          updated_at: "2026-07-14T10:00:00.000Z",
        },
      ],
      invites: [],
    };

    mockGetCurrentUserProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "super_admin" },
    });
    mockIsSuperAdmin.mockReturnValue(true);
    mockListUserManagementData.mockResolvedValue(payload);

    const response = await route.GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });
});