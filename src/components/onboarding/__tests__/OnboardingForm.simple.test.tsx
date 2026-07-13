import React from "react";
import { render, screen, waitFor } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import OnboardingForm from "../OnboardingForm";
import { TEST_ONBOARDING_DATA } from "@/lib/test-utils";

describe("OnboardingForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step 1 with user type options", () => {
    render(<OnboardingForm />);

    expect(
      screen.getByText("Welcome to Digvijaya Yatra Booker!")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /are you setting up scheduling for a business or yourself/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText("🏢 Business")).toBeInTheDocument();
    expect(screen.getByText("👤 Individual")).toBeInTheDocument();
  });

  it("allows selecting business user type", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    const businessButton = screen.getByText("🏢 Business").closest("button");
    expect(businessButton).toBeInTheDocument();

    await user.click(businessButton!);

    expect(businessButton).toHaveClass("border-blue-500");
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business type/i)).toBeInTheDocument();
  });

  it("allows selecting individual user type", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    const individualButton = screen
      .getByText("👤 Individual")
      .closest("button");
    expect(individualButton).toBeInTheDocument();

    await user.click(individualButton!);

    expect(individualButton).toHaveClass("border-blue-500");
    expect(screen.queryByLabelText(/business name/i)).not.toBeInTheDocument();
  });

  it("completes step 1 with valid data", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    // Select business type
    const businessButton = screen.getByText("🏢 Business").closest("button");
    await user.click(businessButton!);

    // Fill in business details
    const businessNameInput = screen.getByLabelText(/business name/i);
    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const nameInput = screen.getByLabelText(/your name/i);
    const timezoneSelect = screen.getByLabelText(/timezone/i);
    const continueButton = screen.getByRole("button", {
      name: /continue to availability setup/i,
    });

    await user.type(businessNameInput, TEST_ONBOARDING_DATA.businessName!);
    await user.selectOptions(
      businessTypeSelect,
      TEST_ONBOARDING_DATA.businessType!
    );
    await user.type(nameInput, TEST_ONBOARDING_DATA.name);
    await user.selectOptions(timezoneSelect, TEST_ONBOARDING_DATA.timezone);

    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText("Set Your Availability")).toBeInTheDocument();
    });
  });

  it("shows 4-hour and 8-hour slot duration options on step 2", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    await user.click(screen.getByText("🏢 Business").closest("button")!);
    await user.type(
      screen.getByLabelText(/business name/i),
      TEST_ONBOARDING_DATA.businessName!
    );
    await user.selectOptions(
      screen.getByLabelText(/business type/i),
      TEST_ONBOARDING_DATA.businessType!
    );
    await user.type(screen.getByLabelText(/your name/i), TEST_ONBOARDING_DATA.name);
    await user.selectOptions(
      screen.getByLabelText(/timezone/i),
      TEST_ONBOARDING_DATA.timezone
    );

    await user.click(
      screen.getByRole("button", {
        name: /continue to availability setup/i,
      })
    );

    expect(await screen.findByText("Set Your Availability")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "4 hours" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "8 hours" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "1 hour" })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/appointment duration/i)).toHaveValue("240");
  });
});
