/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@/lib/test-utils";
import DashboardPage from "../page";

const mockRequireAuthenticatedProfile = jest.fn();
const mockIsSuperAdmin = jest.fn();

jest.mock("@/lib/auth/roles", () => ({
  requireAuthenticatedProfile: (...args: unknown[]) =>
    mockRequireAuthenticatedProfile(...args),
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin(...args),
}));

jest.mock("@/components/dashboard/ShareBookingButton", () => {
  return function MockShareBookingButton({ userId }: { userId: string }) {
    return <div>Share booking for {userId}</div>;
  };
});

jest.mock("@/components/ui/Breadcrumbs", () => {
  return function MockBreadcrumbs() {
    return <nav>Breadcrumbs</nav>;
  };
});

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the Manage Users card for super admins", async () => {
    mockRequireAuthenticatedProfile.mockResolvedValue({
      user: { id: "user-1" },
      profile: { role: "super_admin" },
    });
    mockIsSuperAdmin.mockReturnValue(true);

    render(await DashboardPage());

    expect(screen.getByText(/manage users/i)).toBeInTheDocument();
    expect(screen.getByText(/invite volunteers and monitor roles/i)).toBeInTheDocument();
  });

  it("hides the Manage Users card for volunteers", async () => {
    mockRequireAuthenticatedProfile.mockResolvedValue({
      user: { id: "user-2" },
      profile: { role: "volunteer" },
    });
    mockIsSuperAdmin.mockReturnValue(false);

    render(await DashboardPage());

    expect(screen.queryByText(/manage users/i)).not.toBeInTheDocument();
  });
});