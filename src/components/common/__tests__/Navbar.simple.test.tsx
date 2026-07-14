import React from "react";
import { render, screen } from "@/lib/test-utils";
import Navbar from "../Navbar";

const mockUsePathname = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/auth/LogoutButton", () => {
  return function MockLogoutButton() {
    return <button type="button">Logout</button>;
  };
});

describe("Navbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("shows the Users link for authenticated super admins", () => {
    render(<Navbar isAuthed={true} isSuperAdmin={true} />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /availability/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /users/i })).toBeInTheDocument();
  });

  it("hides the Users link for non-admin authenticated users", () => {
    render(<Navbar isAuthed={true} isSuperAdmin={false} />);

    expect(screen.queryByRole("link", { name: /users/i })).not.toBeInTheDocument();
  });
});