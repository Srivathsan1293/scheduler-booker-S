import type {
  TimeSlot,
  WorkingHours,
  AvailabilitySettings,
  DayAvailability,
} from "../types/availability";
import { format } from "date-fns";
import { extractTimeFromTimestamp } from "./serverTimeFormat";
import { formatTime } from "./clientTimeFormat";

export class TimeSlotUtils {
  /**
   * Generates default time slots for a given time range and duration
   */
  static generateDefaultTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number,
    date?: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    console.log("🔥 generateDefaultTimeSlots called with:", {
      startTime,
      endTime,
      slotDuration,
      date,
    });

    // Ensure time strings have proper format (add seconds if missing)
    const startTimeFormatted = startTime.includes(":")
      ? startTime
      : `${startTime}:00`;
    const endTimeFormatted = endTime.includes(":") ? endTime : `${endTime}:00`;

    console.log("🔥 generateDefaultTimeSlots formatted times:", {
      startTimeFormatted,
      endTimeFormatted,
    });

    let currentTime = new Date(`2000-01-01T${startTimeFormatted}`);
    const endDateTime = new Date(`2000-01-01T${endTimeFormatted}`);

    console.log("🔥 generateDefaultTimeSlots Date objects:", {
      currentTime: currentTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    });

    while (currentTime < endDateTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
      if (slotEnd <= endDateTime) {
        const slotStart = currentTime.toTimeString().slice(0, 5);
        const slotEndTime = slotEnd.toTimeString().slice(0, 5);

        // Generate consistent IDs that match the public API format
        const slot = {
          id: date
            ? `slot-${date}-${slotStart}-${slotEndTime}`
            : `slot-${slotStart}-${slotEndTime}`,
          startTime: slotStart,
          endTime: slotEndTime,
          isAvailable: true,
          isBooked: false, // New slots are not booked by default
        };
        slots.push(slot);
      }

      // Move to next slot
      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    return slots;
  }

  /**
   * Maps JavaScript Date.getDay() to working hours array index
   * 0=Sunday becomes 6, 1=Monday becomes 0, etc.
   */
  static getWorkingHoursDayIndex(date: Date): number {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }

  /**
   * Gets the working hours for a specific date
   */
  static getWorkingHoursForDate(
    date: Date,
    workingHours: WorkingHours[]
  ): WorkingHours | undefined {
    const dayIndex = this.getWorkingHoursDayIndex(date);
    return workingHours[dayIndex];
  }

  /**
   * Formats date to ISO date string (YYYY-MM-DD)
   */
  static formatDateKey(date: Date): string {
    return format(date, "yyyy-MM-dd");
  }

  /**
   * Creates lookup maps from database results for fast access
   */
  static createExceptionsMap(
    exceptionsData: { date: string; is_available: boolean; reason?: string }[]
  ): Map<string, { is_available: boolean; reason?: string }> {
    const map = new Map();
    console.log("🔍 Creating exceptions map from data:", {
      inputExceptionsCount: exceptionsData?.length || 0,
      sampleInputExceptions: exceptionsData?.slice(0, 3) || [],
    });

    if (exceptionsData) {
      exceptionsData.forEach((exception) => {
        map.set(exception.date, exception);
      });
    }

    console.log("🔍 Created exceptions map:", {
      mapSize: map.size,
      sampleMapEntries: Array.from(map.entries()).slice(0, 2),
    });

    return map;
  }

  /**
   * Creates time slots lookup map from database results
   */
  static createSlotsMap(
    slotsData: {
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      is_available: boolean;
      is_booked?: boolean;
    }[],
    settings?: AvailabilitySettings
  ): Map<string, TimeSlot[]> {
    const map = new Map();
    console.log("🔍 Creating slots map from data:", {
      inputSlotsCount: slotsData?.length || 0,
      sampleInputSlots: slotsData?.slice(0, 3) || [],
    });

    if (slotsData) {
      slotsData.forEach((slot) => {
        const dateKey = slot.date;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }

        const startTime = extractTimeFromTimestamp(slot.start_time);
        const endTime = extractTimeFromTimestamp(slot.end_time);

        const timeSlot: TimeSlot = {
          id: slot.id,
          startTime,
          endTime,
          isAvailable: slot.is_available,
          isBooked: slot.is_booked || false,
        };

        // Apply time formatting if user prefers 12-hour format
        if (settings?.timeFormat12h) {
          timeSlot.startTimeDisplay = formatTime(startTime, false);
          timeSlot.endTimeDisplay = formatTime(endTime, false);
        }

        map.get(dateKey).push(timeSlot);
      });
    }

    console.log("🔍 Created slots map:", {
      mapSize: map.size,
      sampleMapEntries: Array.from(map.entries()).slice(0, 2),
    });

    return map;
  }

  /**
   * Processes a single day's availability based on exceptions and working hours
   */
  static processDayAvailability(
    date: Date,
    workingHours: WorkingHours[],
    settings: AvailabilitySettings,
    exception?: { is_available: boolean; reason?: string },
    existingSlots: TimeSlot[] = []
  ): DayAvailability {
    const dateKey = this.formatDateKey(date);

    const dayHours = this.getWorkingHoursForDate(date, workingHours);
    console.log(`🔍 Processing day ${dateKey}:`, {
      hasException: !!exception,
      exceptionIsAvailable: exception?.is_available,
      existingSlotsCount: existingSlots.length,
      workingHours: dayHours,
      existingSlots: existingSlots.slice(0, 3), // Show first 3 slots for debugging
    });

    if (exception) {
      // Use exception data
      if (exception.is_available) {
        if (existingSlots.length > 0) {
          console.log(`📅 Day ${dateKey}: Using existing slots from exception`);
          return {
            date,
            timeSlots: existingSlots,
            isWorkingDay: true,
          };
        } else {
          // Generate slots for working day exception
          const dayHours = this.getWorkingHoursForDate(date, workingHours);
          if (dayHours && dayHours.isWorking) {
            const generatedSlots = this.generateDefaultTimeSlots(
              dayHours.startTime,
              dayHours.endTime,
              settings.slotDuration,
              dateKey
            );
            console.log(
              `📅 Day ${dateKey}: Generated ${generatedSlots.length} slots for exception`
            );
            return {
              date,
              timeSlots: generatedSlots,
              isWorkingDay: true,
            };
          } else {
            return {
              date,
              timeSlots: [],
              isWorkingDay: true, // Exception overrides default
            };
          }
        }
      } else {
        // Non-working day exception
        console.log(`📅 Day ${dateKey}: Non-working day exception`);
        return {
          date,
          timeSlots: existingSlots, // Preserve any existing bookings
          isWorkingDay: false,
        };
      }
    } else {
      // No exception, use working hours
      const dayHours = this.getWorkingHoursForDate(date, workingHours);

      if (dayHours && dayHours.isWorking) {
        // Always generate fresh slots based on working hours
        console.log(
          `📅 Day ${dateKey}: Generating fresh slots with working hours:`,
          {
            startTime: dayHours.startTime,
            endTime: dayHours.endTime,
            slotDuration: settings.slotDuration,
          }
        );
        const generatedSlots = this.generateDefaultTimeSlots(
          dayHours.startTime,
          dayHours.endTime,
          settings.slotDuration,
          dateKey
        );
        console.log(
          `📅 Day ${dateKey}: Generated ${generatedSlots.length} fresh slots`
        );

        // Apply custom overrides from existing slots (preserves bookings and custom availability)
        if (existingSlots.length > 0) {
          console.log(
            `📅 Day ${dateKey}: Applying ${existingSlots.length} custom overrides`
          );
          existingSlots.forEach((existingSlot) => {
            const slotIndex = generatedSlots.findIndex(
              (slot) =>
                slot.startTime === existingSlot.startTime &&
                slot.endTime === existingSlot.endTime
            );
            if (slotIndex !== -1) {
              // Apply custom availability and preserve booking status
              generatedSlots[slotIndex].isAvailable = existingSlot.isAvailable;
              generatedSlots[slotIndex].isBooked = existingSlot.isBooked;
              console.log(
                `📅 Day ${dateKey}: Applied override for ${
                  existingSlot.startTime
                }-${existingSlot.endTime}: ${
                  existingSlot.isAvailable ? "available" : "unavailable"
                }`
              );
            }
          });
        }

        return {
          date,
          timeSlots: generatedSlots,
          isWorkingDay: true,
        };
      } else {
        // Non-working day
        console.log(`📅 Day ${dateKey}: Non-working day`);
        return {
          date,
          timeSlots: existingSlots, // Preserve any existing bookings
          isWorkingDay: false,
        };
      }
    }
  }

  /**
   * Converts working hours array to database format
   */
  static formatWorkingHoursForDatabase(
    workingHours: WorkingHours[],
    userId: string
  ) {
    return workingHours.map((hour, index) => ({
      user_id: userId,
      day_of_week: index === 6 ? 0 : index + 1, // Monday=1, Tuesday=2, ..., Sunday=0
      start_time: hour.startTime,
      end_time: hour.endTime,
      is_working: hour.isWorking,
    }));
  }

  /**
   * Converts database working hours to frontend format
   */
  static formatWorkingHoursFromDatabase(
    hoursData: {
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_working: boolean;
    }[]
  ): WorkingHours[] {
    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return dayNames.map((day, index) => {
      // Map array index to day_of_week: Monday=1, Tuesday=2, ..., Sunday=0
      const dayOfWeek = index === 6 ? 0 : index + 1;
      const hourData = hoursData.find((h) => h.day_of_week === dayOfWeek);

      return {
        day,
        startTime: hourData?.start_time || "09:00",
        endTime: hourData?.end_time || "17:00",
        isWorking:
          hourData?.is_working !== undefined ? hourData.is_working : index < 5, // Mon-Fri working by default
      };
    });
  }
}
