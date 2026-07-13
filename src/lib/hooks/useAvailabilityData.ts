import { useCallback } from "react";
import { TimeSlotUtils } from "../utils/timeSlotUtils";
import {
  ClientAvailabilityService,
  type UserWorkingHour,
} from "../services/clientAvailabilityService";
import { processMultipleDays } from "./availabilityUtils";
import { extractTimeFromTimestamp } from "../utils/serverTimeFormat";
import { formatTime } from "../utils/clientTimeFormat";
import type {
  TimeSlot,
  DayAvailability,
  WorkingHours,
  AvailabilitySettings,
  LoadingSteps,
} from "../types/availability";

// Extended type for working hours with display formatting
type UserWorkingHourWithDisplay = UserWorkingHour & {
  start_time_display?: string;
  end_time_display?: string;
};

const getSlotDurationMinutes = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
};

interface UseAvailabilityDataProps {
  setWorkingHours: (hours: WorkingHours[]) => void;
  setSettings: (settings: AvailabilitySettings) => void;
  setLoadingSteps: (
    steps: LoadingSteps | ((prev: LoadingSteps) => LoadingSteps)
  ) => void;
  setAvailability: (
    availability:
      | Record<string, DayAvailability>
      | ((
          prev: Record<string, DayAvailability>
        ) => Record<string, DayAvailability>)
  ) => void;
  workingHours: WorkingHours[];
  settings: AvailabilitySettings;
}

const normalizeSlotDuration = (slotDuration?: number) => {
  return slotDuration === 480 ? 480 : 240;
};

export function useAvailabilityData({
  setWorkingHours,
  setSettings,
  setLoadingSteps,
  setAvailability,
  workingHours,
  settings,
}: UseAvailabilityDataProps) {
  // Load availability data
  const loadAvailability = useCallback(async () => {
    try {
      // Load working hours and settings using the new client service
      const [workingHoursData, settingsData] = await Promise.all([
        ClientAvailabilityService.loadWorkingHours(),
        ClientAvailabilityService.loadSettings(),
      ]);

      // Only set data if we actually received it from the database
      if (workingHoursData && workingHoursData.length > 0) {
        // Convert working hours to the expected format
        const convertedWorkingHours = workingHoursData.map(
          (wh: UserWorkingHour) => ({
            day: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][wh.day_of_week],
            startTime: wh.start_time,
            endTime: wh.end_time,
            startTimeDisplay: (wh as UserWorkingHourWithDisplay)
              .start_time_display,
            endTimeDisplay: (wh as UserWorkingHourWithDisplay).end_time_display,
            isWorking: wh.is_working,
          })
        );

        setWorkingHours(convertedWorkingHours);
        setLoadingSteps((prev) => ({ ...prev, workingHours: true }));
      } else {
        // Create default working hours if none exist
        await ClientAvailabilityService.createDefaultWorkingHours();
        // Reload the data
        const defaultWorkingHours =
          await ClientAvailabilityService.loadWorkingHours();
        if (defaultWorkingHours && defaultWorkingHours.length > 0) {
          const convertedWorkingHours = defaultWorkingHours.map(
            (wh: UserWorkingHour) => ({
              day: [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ][wh.day_of_week],
              startTime: wh.start_time,
              endTime: wh.end_time,
              startTimeDisplay: (wh as UserWorkingHourWithDisplay)
                .start_time_display,
              endTimeDisplay: (wh as UserWorkingHourWithDisplay)
                .end_time_display,
              isWorking: wh.is_working,
            })
          );
          setWorkingHours(convertedWorkingHours);
        }
        setLoadingSteps((prev) => ({ ...prev, workingHours: true }));
      }

      if (settingsData && settingsData.length > 0) {
        // Convert settings to the expected format
        const convertedSettings = {
          slotDuration: normalizeSlotDuration(
            settingsData[0].slot_duration_minutes
          ),
          advanceBookingDays: settingsData[0].advance_booking_days,
          timeFormat12h: settingsData[0].time_format_12h || false,
        };

        setSettings(convertedSettings);
        setLoadingSteps((prev) => ({ ...prev, settings: true }));
      } else {
        // Create default settings if none exist
        await ClientAvailabilityService.createDefaultSettings();
        // Reload the data
        const defaultSettings = await ClientAvailabilityService.loadSettings();
        if (defaultSettings && defaultSettings.length > 0) {
          const convertedSettings = {
            slotDuration: normalizeSlotDuration(
              defaultSettings[0].slot_duration_minutes
            ),
            advanceBookingDays: defaultSettings[0].advance_booking_days,
            timeFormat12h: defaultSettings[0].time_format_12h || false,
          };
          setSettings(convertedSettings);
        }
        setLoadingSteps((prev) => ({ ...prev, settings: true }));
      }

      // Mark exceptions and time slots as loaded
      setLoadingSteps((prev) => ({
        ...prev,
        exceptions: true,
        timeSlots: true,
      }));
    } catch {
      // Don't set fallback data on error - let the UI show the error state
      setLoadingSteps({
        workingHours: true,
        settings: true,
        exceptions: true,
        timeSlots: true,
      });
    }
  }, [setWorkingHours, setSettings, setLoadingSteps]);

  // Load bookings for a date range
  const loadBookingsForMonth = useCallback(
    async (startDate: Date, endDate: Date) => {
      try {
        const startDateStr = TimeSlotUtils.formatDateKey(startDate);
        const endDateStr = TimeSlotUtils.formatDateKey(endDate);

        console.log("📅 Loading bookings for month:", {
          startDateStr,
          endDateStr,
        });

        // Use server-side API that handles user authentication
        const response = await fetch(
          `/api/availability/bookings-for-month?startDate=${encodeURIComponent(
            startDateStr
          )}&endDate=${encodeURIComponent(endDateStr)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch bookings: ${response.status}`);
        }

        const data = await response.json();
        console.log("📅 Bookings loaded:", data);

        // The API already returns bookings grouped by date
        return data.bookings || {};
      } catch (error) {
        console.error("Failed to load bookings:", error);
        return {};
      }
    },
    []
  );

  // Optimized month loading
  const loadTimeSlotsForMonth = useCallback(
    async (startDate: Date, endDate: Date) => {
      try {
        const startDateStr = TimeSlotUtils.formatDateKey(startDate);
        const endDateStr = TimeSlotUtils.formatDateKey(endDate);

        const monthData =
          await ClientAvailabilityService.loadTimeSlotsForDateRange(
            startDateStr,
            endDateStr
          );

        // Convert the data to the expected format
        const exceptionsMap = new Map();
        const slotsMap = new Map();

        // Process exceptions
        monthData.exceptions?.forEach(
          (exception: {
            date: string;
            is_available: boolean;
            reason?: string;
          }) => {
            exceptionsMap.set(exception.date, {
              is_available: exception.is_available,
              reason: exception.reason,
            });
          }
        );

        // Process time slots
        monthData.timeSlots?.forEach(
          (slot: {
            date: string;
            id: string;
            start_time: string;
            end_time: string;
            is_available: boolean;
            is_booked?: boolean;
          }) => {
            const dateKey = slot.date;
            if (!slotsMap.has(dateKey)) {
              slotsMap.set(dateKey, []);
            }
            const startTime = extractTimeFromTimestamp(slot.start_time);
            const endTime = extractTimeFromTimestamp(slot.end_time);

            const timeSlot: TimeSlot = {
              id: slot.id,
              startTime,
              endTime,
              isAvailable: slot.is_available,
              isBooked: slot.is_booked,
            };

            if (
              getSlotDurationMinutes(startTime, endTime) !== settings.slotDuration
            ) {
              return;
            }

            // Apply time formatting if user prefers 12-hour format
            if (settings.timeFormat12h) {
              timeSlot.startTimeDisplay = formatTime(startTime, false);
              timeSlot.endTimeDisplay = formatTime(endTime, false);
            }

            slotsMap.get(dateKey).push(timeSlot);
          }
        );

        return { exceptionsMap, slotsMap };
      } catch (error) {
        console.error("Failed to load month data:", error);
        return {
          exceptionsMap: new Map(),
          slotsMap: new Map(),
        };
      }
    },
    [settings.timeFormat12h]
  );

  // Process multiple days with batched data
  const processMonthDays = useCallback(
    async (
      days: Date[],
      exceptionsMap: Map<string, { is_available: boolean; reason?: string }>,
      slotsMap: Map<string, TimeSlot[]>
    ) => {
      const newAvailability = processMultipleDays(
        days,
        workingHours,
        settings,
        exceptionsMap,
        slotsMap
      );

      // Update state with all processed days at once
      setAvailability((prev) => {
        const updated = { ...prev, ...newAvailability };
        return updated;
      });
    },
    [workingHours, settings, setAvailability]
  );

  return {
    loadAvailability,
    loadBookingsForMonth,
    loadTimeSlotsForMonth,
    processMonthDays,
  };
}
