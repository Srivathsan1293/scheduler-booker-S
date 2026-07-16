/**
 * @jest-environment node
 */

import * as route from "../route";

const mockSignUp = jest.fn();
const mockUpsertUserProfile = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

jest.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  }),
}));

jest.mock("@/lib/auth/user-management", () => ({
  upsertUserProfile: (...args: unknown[]) => mockUpsertUserProfile(...args),
}));

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;
    delete process.env.VERCEL_URL;
  });

  it("prefers the configured app domain for confirmation redirects", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://scheduler-booker.example.com";
    mockSignUp.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "volunteer@example.com",
          user_metadata: {},
        },
        session: null,
      },
      error: null,
    });
    mockUpsertUserProfile.mockResolvedValue(undefined);

    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "volunteer@example.com",
        password: "secret123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await route.POST(request);

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "volunteer@example.com",
      password: "secret123",
      options: {
        emailRedirectTo: "https://scheduler-booker.example.com",
      },
    });
    expect(response.status).toBe(200);
  });
});