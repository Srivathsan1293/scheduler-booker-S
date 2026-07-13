import { renderHook, act } from "@testing-library/react";
import { useAvailability } from "../../../lib/hooks/useAvailability";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useAvailabilityData } from "../../../lib/hooks/useAvailabilityData";
import { useAvailabilityActions } from "../../../lib/hooks/useAvailabilityActions";
import { TimeSlotUtils } from "../../../lib/utils/timeSlotUtils";

// Mock dependencies
jest.mock("../../../lib/hooks/useAuth");
jest.mock("../../../lib/hooks/useAvailabilityData");
jest.mock("../../../lib/hooks/useAvailabilityActions");

// Create a comprehensive mock that handles all the method chaining
interface MockChain {
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  order: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  insert: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  onConflict: jest.Mock;
}

const createMockChain = (
  finalResult = { data: [], error: null }
): MockChain => {
  const chain: MockChain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(finalResult)),
    order: jest.fn(() => Promise.resolve(finalResult)),
    gte: jest.fn(() => chain),
    lte: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    upsert: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    onConflict: jest.fn(() => Promise.resolve({ error: null })),
  };
  return chain;
};

jest.mock("../../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => createMockChain()),
  },
}));

// Mock cache utilities
jest.mock("../../../lib/cache-utils", () => ({
  saveToCache: jest.fn(),
  loadFromCache: jest.fn(() => null),
  clearCache: jest.fn(),
  updateCacheAvailability: jest.fn(),
  updateCacheWorkingHours: jest.fn(),
  updateCacheSettings: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAvailabilityData = useAvailabilityData as jest.MockedFunction<
  typeof useAvailabilityData
>;
const mockUseAvailabilityActions =
  useAvailabilityActions as jest.MockedFunction<typeof useAvailabilityActions>;

describe("useAvailability", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2023-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    // Mock useAvailabilityData
    mockUseAvailabilityData.mockReturnValue({
      loadAvailability: jest.fn(),
      loadBookingsForMonth: jest.fn(() => Promise.resolve({})),
      loadTimeSlotsForMonth: jest.fn(() =>
        Promise.resolve({ exceptionsMap: new Map(), slotsMap: new Map() })
      ),
      processMonthDays: jest.fn(),
    });

    // Mock useAvailabilityActions
    mockUseAvailabilityActions.mockReturnValue({
      toggleWorkingDay: jest.fn(),
      toggleTimeSlot: jest.fn(),
      regenerateDaySlots: jest.fn(),
    });
  });

  it("initializes with empty settings that are loaded later", () => {
    const { result } = renderHook(() => useAvailability());

    // The hook starts with zero values and loads data asynchronously
    expect(result.current.settings.slotDuration).toBe(0);
    expect(result.current.settings.advanceBookingDays).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it("prevents settings updates when slotDuration is 0", () => {
    const { result } = renderHook(() => useAvailability());

    // Initially settings are all 0
    expect(result.current.settings.slotDuration).toBe(0);

    // Try to update settings - should be prevented due to guard clause
    act(() => {
      result.current.updateSettings({ slotDuration: 90 });
    });

    // Settings should remain unchanged due to the guard clause
    expect(result.current.settings.slotDuration).toBe(0);
  });

  it("handles working hours updates when no data is loaded", () => {
    const { result } = renderHook(() => useAvailability());

    // The hook starts with an empty working hours array
    expect(result.current.workingHours).toEqual([]);

    // Attempting to update working hours when array is empty should be safe
    act(() => {
      result.current.updateWorkingHours(0, "startTime", "10:00");
    });

    // Should still be empty since the updateWorkingHours function returns early when length is 0
    expect(result.current.workingHours).toEqual([]);
  });

  it("generates default time slots correctly", () => {
    const timeSlots = TimeSlotUtils.generateDefaultTimeSlots(
      "09:00",
      "17:00",
      60
    );

    expect(timeSlots).toHaveLength(8); // 8 one-hour slots from 9 AM to 5 PM
    expect(timeSlots[0].startTime).toBe("09:00");
    expect(timeSlots[0].endTime).toBe("10:00");
    expect(timeSlots[0].isAvailable).toBe(true);
  });

  it("updates day availability correctly", () => {
    const { result } = renderHook(() => useAvailability());
    const testDate = new Date("2024-01-15");

    act(() => {
      result.current.updateDayAvailability(testDate, {
        isWorkingDay: false,
        timeSlots: [],
      });
    });

    const dateKey = TimeSlotUtils.formatDateKey(testDate);
    expect(result.current.availability[dateKey]?.isWorkingDay).toBe(false);
  });

  it("uses the local calendar day when formatting availability keys", () => {
    const testDate = new Date(2024, 0, 15);

    expect(TimeSlotUtils.formatDateKey(testDate)).toBe("2024-01-15");
  });

  it("toggles working day status", () => {
    const { result } = renderHook(() => useAvailability());
    const testDate = new Date("2024-01-15");

    // First, set up the day
    act(() => {
      result.current.updateDayAvailability(testDate, {
        isWorkingDay: true,
        timeSlots: [],
      });
    });

    const dateKey = TimeSlotUtils.formatDateKey(testDate);
    expect(result.current.availability[dateKey]?.isWorkingDay).toBe(true);

    // Note: The actual toggleWorkingDay is mocked, so we're testing the updateDayAvailability functionality
    // In a real scenario, toggleWorkingDay would be called but since it's mocked, we test direct updates
    act(() => {
      result.current.updateDayAvailability(testDate, {
        isWorkingDay: false,
        timeSlots: [],
      });
    });

    expect(result.current.availability[dateKey]?.isWorkingDay).toBe(false);
  });

  it("manages time slot availability", () => {
    const { result } = renderHook(() => useAvailability());
    const testDate = new Date("2024-01-15");
    const testSlot = {
      id: "test-slot",
      startTime: "09:00",
      endTime: "10:00",
      isAvailable: true,
    };

    // First, set up the day with a time slot
    act(() => {
      result.current.updateDayAvailability(testDate, {
        isWorkingDay: true,
        timeSlots: [testSlot],
      });
    });

    const dateKey = TimeSlotUtils.formatDateKey(testDate);
    expect(
      result.current.availability[dateKey]?.timeSlots[0]?.isAvailable
    ).toBe(true);

    // Update the slot to be unavailable
    const updatedSlot = { ...testSlot, isAvailable: false };
    act(() => {
      result.current.updateDayAvailability(testDate, {
        isWorkingDay: true,
        timeSlots: [updatedSlot],
      });
    });

    expect(
      result.current.availability[dateKey]?.timeSlots[0]?.isAvailable
    ).toBe(false);
  });

  it("handles refresh calendar correctly", () => {
    const { result } = renderHook(() => useAvailability());
    const testDate = new Date("2024-01-15");

    // Set up some availability data
    act(() => {
      result.current.updateDayAvailability(testDate, {
        isWorkingDay: true,
        timeSlots: [],
      });
    });

    // Verify data exists
    const dateKey = TimeSlotUtils.formatDateKey(testDate);
    expect(result.current.availability[dateKey]).toBeDefined();

    // Refresh calendar
    act(() => {
      result.current.refreshCalendar();
    });

    // Verify data is cleared
    expect(result.current.availability[dateKey]).toBeUndefined();
  });
});
