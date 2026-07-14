import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/lib/test-utils";
import UserManagementScreen from "../UserManagementScreen";

const mockSuccess = jest.fn();
const mockError = jest.fn();
const mockMutateAsync = jest.fn();
const mockUpdateMutateAsync = jest.fn();
const mockUseUserManagementData = jest.fn();

jest.mock("@/components/snackbar", () => ({
  useSnackbar: () => ({
    success: mockSuccess,
    error: mockError,
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
  }),
}));

jest.mock("@/lib/hooks/useUserManagement", () => ({
  useUserManagementData: () => mockUseUserManagementData(),
  useCreateVolunteerInvite: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useUpdateVolunteerInvite: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

describe("UserManagementScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserManagementData.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        users: [
          {
            id: "user-1",
            email: "admin@example.com",
            display_name: "Admin User",
            role: "super_admin",
            onboarded: true,
            invited_by: null,
            created_at: "2026-07-14T10:00:00.000Z",
            updated_at: "2026-07-14T10:00:00.000Z",
          },
          {
            id: "user-2",
            email: "volunteer@example.com",
            display_name: "Volunteer User",
            role: "volunteer",
            onboarded: false,
            invited_by: "user-1",
            created_at: "2026-07-14T11:00:00.000Z",
            updated_at: "2026-07-14T11:00:00.000Z",
          },
        ],
        invites: [
          {
            id: "invite-1",
            email: "pending@example.com",
            role: "volunteer",
            status: "pending",
            token_hash: "hash",
            invited_by: "user-1",
            accepted_user_id: null,
            expires_at: "2026-07-21T12:00:00.000Z",
            created_at: "2026-07-14T12:00:00.000Z",
            updated_at: "2026-07-14T12:00:00.000Z",
          },
        ],
      },
    });
  });

  it("renders users and pending invites", () => {
    render(<UserManagementScreen />);

    expect(screen.getByText(/invite a volunteer/i)).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Volunteer User")).toBeInTheDocument();
    expect(screen.getByText("pending@example.com")).toBeInTheDocument();
  });

  it("submits a new volunteer invite", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ success: true });

    render(<UserManagementScreen />);

    await user.type(
      screen.getByLabelText(/volunteer email/i),
      "new-volunteer@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: "new-volunteer@example.com",
      });
    });

    expect(mockSuccess).toHaveBeenCalledWith(
      "Volunteer invite email sent successfully.",
    );
  });

  it("re-sends a pending invite", async () => {
    const user = userEvent.setup();
    mockUpdateMutateAsync.mockResolvedValue({ success: true });

    render(<UserManagementScreen />);

    await user.click(screen.getByRole("button", { name: /resend/i }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        inviteId: "invite-1",
        action: "resend",
      });
    });

    expect(mockSuccess).toHaveBeenCalledWith(
      "Volunteer invite email re-sent successfully.",
    );
  });

  it("revokes a pending invite", async () => {
    const user = userEvent.setup();
    mockUpdateMutateAsync.mockResolvedValue({ success: true });

    render(<UserManagementScreen />);

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        inviteId: "invite-1",
        action: "revoke",
      });
    });

    expect(mockSuccess).toHaveBeenCalledWith(
      "Volunteer invite revoked successfully.",
    );
  });
});