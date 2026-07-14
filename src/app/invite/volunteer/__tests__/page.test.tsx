/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@/lib/test-utils";
import VolunteerInvitePage from "../page";

const mockRedirect = jest.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const mockGetInviteByToken = jest.fn();
const mockAcceptVolunteerInvite = jest.fn();
const mockGetUser = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/auth/user-management", () => ({
  getInviteByToken: (...args: unknown[]) => mockGetInviteByToken(...args),
  acceptVolunteerInvite: (...args: unknown[]) =>
    mockAcceptVolunteerInvite(...args),
}));

jest.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  }),
}));

describe("VolunteerInvitePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a missing token message", async () => {
    render(await VolunteerInvitePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/invite required/i)).toBeInTheDocument();
  });

  it("renders an invalid invite message", async () => {
    mockGetInviteByToken.mockResolvedValue(null);

    render(
      await VolunteerInvitePage({
        searchParams: Promise.resolve({ token: "bad-token" }),
      }),
    );

    expect(screen.getByText(/invite unavailable/i)).toBeInTheDocument();
  });

  it("renders sign-in guidance for invited users who are not authenticated", async () => {
    mockGetInviteByToken.mockResolvedValue({
      id: "invite-1",
      email: "volunteer@example.com",
      status: "pending",
    });
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(
      await VolunteerInvitePage({
        searchParams: Promise.resolve({ token: "invite-token" }),
      }),
    );

    expect(screen.getByText(/you're invited to join the app/i)).toBeInTheDocument();
    expect(screen.getByText(/volunteer@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to sign in/i })).toBeInTheDocument();
  });

  it("accepts the invite and redirects onboarded users to the dashboard", async () => {
    mockGetInviteByToken.mockResolvedValue({
      id: "invite-1",
      email: "volunteer@example.com",
      status: "pending",
    });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "volunteer@example.com",
          user_metadata: {
            onboarded: true,
            display_name: "Volunteer User",
          },
        },
      },
    });

    await expect(
      VolunteerInvitePage({
        searchParams: Promise.resolve({ token: "invite-token" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(mockAcceptVolunteerInvite).toHaveBeenCalledWith({
      token: "invite-token",
      userId: "user-1",
      email: "volunteer@example.com",
      displayName: "Volunteer User",
    });
  });

  it("accepts the invite and redirects new users to onboarding", async () => {
    mockGetInviteByToken.mockResolvedValue({
      id: "invite-1",
      email: "volunteer@example.com",
      status: "pending",
    });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-2",
          email: "volunteer@example.com",
          user_metadata: {
            onboarded: false,
            name: "Volunteer User",
          },
        },
      },
    });

    await expect(
      VolunteerInvitePage({
        searchParams: Promise.resolve({ token: "invite-token" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding");

    expect(mockAcceptVolunteerInvite).toHaveBeenCalledWith({
      token: "invite-token",
      userId: "user-2",
      email: "volunteer@example.com",
      displayName: "Volunteer User",
    });
  });
});