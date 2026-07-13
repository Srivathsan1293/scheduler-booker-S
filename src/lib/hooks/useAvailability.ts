import { useState, useCallback, useEffect, useMemo } from "react";
import { useAvailabilityData } from "./useAvailabilityData";
import { useAvailabilityActions } from "./useAvailabilityActions";
import { TimeSlotUtils } from "../utils/timeSlotUtils";
import { ClientAvailabilityService } from "../services/clientAvailabilityService";
import type {
  DayAvailability,
  WorkingHours,
  AvailabilitySettings,
  LoadingSteps,
  Booking,
} from "../types/availability";

export function useAvailability() {
  // Core State
  const [availability, setAvailability] = useState<
    Record<string, DayAvailability>
  >({});
  const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [settings, setSettings] = useState<AvailabilitySettings>({
    slotDuration: 0,
    advanceBookingDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSteps, setLoadingSteps] = useState<LoadingSteps>({
    workingHours: false,
    settings: false,
    exceptions: false,
    timeSlots: false,
  });

  // Computed values
  const isFullyLoaded = useMemo(() => {
    return (
      workingHours.length > 0 &&
      settings.slotDuration > 0 &&
      loadingSteps.workingHours &&
      loadingSteps.settings &&
      loadingSteps.exceptions &&
      loadingSteps.timeSlots
    );
  }, [workingHours, settings, loadingSteps]);

  // Data loading hooks
  const {
    loadAvailability,
    loadBookingsForMonth,
    loadTimeSlotsForMonth,
    processMonthDays,
  } = useAvailabilityData({
    setWorkingHours,
    setSettings,
    setLoadingSteps,
    setAvailability,
    workingHours,
    settings,
  });

  // Function to load bookings and update state
  const loadAndSetBookings = useCallback(
    async (startDate: Date, endDate: Date) => {
      const fetchedBookings = await loadBookingsForMonth(startDate, endDate);
      // Merge with existing bookings to avoid losing data from other months
      setBookings((prev) => ({ ...prev, ...fetchedBookings }));
    },
    [loadBookingsForMonth]
  );

  // Update availability for a specific date
  const updateDayAvailability = useCallback(
    (date: Date, updates: Partial<DayAvailability>) => {
      const dateKey = TimeSlotUtils.formatDateKey(date);
      setAvailability((prev) => {
        const updated = {
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            ...updates,
            date,
          },
        };
        return updated;
      });
    },
    []
  );

  // Action hooks
  const { toggleWorkingDay, toggleTimeSlot, regenerateDaySlots } =
    useAvailabilityActions({
      availability,
      workingHours,
      settings,
      updateDayAvailability,
      loadTimeSlotsForMonth,
      processMonthDays,
    });

  // Load data on hook initialization
  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Update loading state
  useEffect(() => {
    if (isFullyLoaded) {
      setIsLoading(false);
    }
  }, [isFullyLoaded]);

  // Utility functions
  const saveAvailability = useCallback(async () => {
    if (settings.slotDuration === 0 || workingHours.length === 0) {
      return {
        success: false,
        message: "Availability settings are not loaded yet.",
      };
    }

    const dayOfWeekMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    try {
      await Promise.all([
        ClientAvailabilityService.saveSettings({
          slot_duration_minutes: settings.slotDuration,
          advance_booking_days: settings.advanceBookingDays,
        }),
        ClientAvailabilityService.saveWorkingHours(
          workingHours.map((hour) => ({
            day_of_week: dayOfWeekMap[hour.day.toLowerCase()],
            start_time: hour.startTime,
            end_time: hour.endTime,
            is_working: hour.isWorking,
          }))
        ),
      ]);

      await loadAvailability();

      return { success: true, message: "Settings saved successfully." };
    } catch (error) {
      console.error("Failed to save availability:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to save availability settings.",
      };
    }
  }, [loadAvailability, settings, workingHours]);

  const updateWorkingHours = useCallback(
    (index: number, field: keyof WorkingHours, value: string | boolean) => {
      if (workingHours.length === 0) return;

      setWorkingHours((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });

      // TODO: Add conflict resolution for working hours changes
      // When changing working hours, check for existing bookings that would be affected
      // Show warning dialog if conflicts exist, allow user to cancel or proceed
      // This should be implemented in a separate branch focused on conflict resolution
    },
    [workingHours]
  );

  const updateSettings = useCallback(
    (updates: Partial<AvailabilitySettings>) => {
      if (settings.slotDuration === 0) return;

      setSettings((prev) => {
        const updated = { ...prev, ...updates };
        return updated;
      });
    },
    [settings.slotDuration]
  );

  const resetCalendarToDefaults = useCallback(async () => {
    console.warn(
      "resetCalendarToDefaults is deprecated. Data is managed by ClientAvailabilityService."
    );
    return { success: true, message: "Calendar reset to defaults (no-op)" };
  }, []);

  const clearCalendarCache = useCallback(() => {
    console.log("Calendar cache cleared (no-op)");
  }, []);

  const refreshFromDatabase = useCallback(async () => {
    console.warn(
      "refreshFromDatabase is deprecated. Data is managed by ClientAvailabilityService."
    );
    return { success: true, message: "Refreshed from database (no-op)" };
  }, []);

  return {
    // State
    availability,
    bookings,
    workingHours,
    settings,
    isLoading,
    isFullyLoaded,
    loadingSteps,

    // Actions
    updateDayAvailability,
    toggleTimeSlot,
    toggleWorkingDay,
    updateWorkingHours,
    updateSettings,
    saveAvailability,
    loadAvailability,
    resetCalendarToDefaults,
    setAvailability,

    // Optimized batch functions
    loadTimeSlotsForMonth,
    loadBookingsForMonth, // Keep this for direct access if needed
    loadAndSetBookings, // Expose the new function
    processMonthDays,

    // Cache control
    clearCalendarCache,
    refreshFromDatabase,

    // Utilities
    markTimeSlotsLoaded: () => {
      setLoadingSteps((prev) => ({ ...prev, timeSlots: true }));
    },
    refreshCalendar: () => {
      setAvailability({});
    },

    // Per-day utilities
    regenerateDaySlots,
  };
}
