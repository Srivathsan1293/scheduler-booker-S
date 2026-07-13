import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  extractTimeFromTimestamp,
  formatTime,
} from "@/lib/utils/serverTimeFormat";
import * as Sentry from "@sentry/nextjs";

function getSlotDurationMinutes(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");

  try {
    if (!date || !userId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch user's time format preference
    const { data: userSettings } = await supabase
      .from("user_availability_settings")
      .select("time_format_12h, slot_duration_minutes")
      .eq("user_id", userId)
      .single();

    const shouldUse12HourFormat = userSettings?.time_format_12h || false;
    const slotDuration = userSettings?.slot_duration_minutes === 480 ? 480 : 240;

    // Get working hours for the day
    // Note: getDay() returns 0-6 (Sunday-Saturday), and our database uses 0-6 (Sunday-Saturday)
    const jsDayOfWeek = new Date(date).getDay();
    const dayOfWeek = jsDayOfWeek; // No conversion needed - both use 0-6

    console.log(
      `🔍 Checking availability for user ${userId}, date ${date}, JS day: ${jsDayOfWeek}, DB day: ${dayOfWeek}`
    );

    // First, let's check what working hours exist for this user
    const { data: allWorkingHours, error: allWorkingHoursError } =
      await supabase
        .from("user_working_hours")
        .select("*")
        .eq("user_id", userId);

    console.log(`🔍 All working hours for user:`, {
      allWorkingHours,
      allWorkingHoursError,
      count: allWorkingHours?.length || 0,
    });

    const { data: workingHours, error: workingHoursError } = await supabase
      .from("user_working_hours")
      .select("*")
      .eq("user_id", userId)
      .eq("day_of_week", dayOfWeek)
      .single();

    console.log(`🔍 Working hours for day ${dayOfWeek}:`, {
      workingHours,
      workingHoursError,
    });

    // Check for custom time slots/exceptions for this specific date
    // These can override the default working hours
    const { data: customTimeSlots, error: timeSlotsError } = await supabase
      .from("user_time_slots")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("start_time");

    console.log(`🔍 Custom time slots for ${date}:`, {
      customTimeSlots,
      timeSlotsError,
      count: customTimeSlots?.length || 0,
    });

    // Note: Do not early-return with custom slots. Prefer to show custom/one-off slots
    // even when the default working hours mark the day as non-working.

    // If default working hours are missing or non-working, but there are custom slots,
    // build the response from custom slots only.
    if (workingHoursError || !workingHours || !workingHours.is_working) {
      if (customTimeSlots && customTimeSlots.length > 0) {
        console.log(
          `🔍 No/default non-working hours for day ${dayOfWeek}, but found custom slots. Building from custom slots.`
        );

        const customOnlySlots: Array<{
          id: string;
          startTime: string;
          endTime: string;
          startTimeDisplay?: string;
          endTimeDisplay?: string;
          isAvailable: boolean;
          isBooked: boolean;
        }> = customTimeSlots
          .map((customSlot) => {
            const startTime = extractTimeFromTimestamp(customSlot.start_time);
            const endTime = extractTimeFromTimestamp(customSlot.end_time);

            if (getSlotDurationMinutes(startTime, endTime) !== slotDuration) {
              return null;
            }

            const slot = {
              id: `${userId}-${date}-${startTime}-${endTime}`,
              startTime,
              endTime,
              isAvailable:
                customSlot.is_available !== false && !customSlot.is_booked,
              isBooked: customSlot.is_booked || false,
            } as {
              id: string;
              startTime: string;
              endTime: string;
              startTimeDisplay?: string;
              endTimeDisplay?: string;
              isAvailable: boolean;
              isBooked: boolean;
            };

            if (shouldUse12HourFormat) {
              slot.startTimeDisplay = formatTime(startTime, false);
              slot.endTimeDisplay = formatTime(endTime, false);
            }
            return slot;
          })
          .filter(
            (
              slot
            ): slot is {
              id: string;
              startTime: string;
              endTime: string;
              startTimeDisplay?: string;
              endTimeDisplay?: string;
              isAvailable: boolean;
              isBooked: boolean;
            } => slot !== null
          );

        // Check for existing bookings and mark slots as unavailable
        const { data: existingBookings } = await supabase
          .from("bookings")
          .select(
            "start_time, end_time, status, client_name, client_email, notes"
          )
          .eq("user_id", userId)
          .eq("date", date)
          .in("status", ["confirmed", "pending"]);

        if (existingBookings) {
          customOnlySlots.forEach((slot) => {
            const booking = existingBookings.find((b) => {
              const bookingStartTime = extractTimeFromTimestamp(b.start_time);
              const bookingEndTime = extractTimeFromTimestamp(b.end_time);
              return (
                bookingStartTime === slot.startTime &&
                bookingEndTime === slot.endTime
              );
            });
            if (booking) {
              slot.isAvailable = false;
              slot.isBooked = true;
            }
          });
        }

        return NextResponse.json({
          date: new Date(date),
          timeSlots: customOnlySlots,
          // Treat as working day since there are explicit available slots
          isWorkingDay: true,
          message: "Using custom time slots for non-working day",
        });
      }

      // No working hours and no custom slots → empty
      console.log(
        `🔍 No working hours and no custom slots for day ${dayOfWeek}, returning empty slots`
      );
      return NextResponse.json({
        date: new Date(date),
        timeSlots: [],
        isWorkingDay: false,
        message: "No working hours or custom slots configured for this day",
      });
    }

    // Generate time slots
    const timeSlots: Array<{
      id: string;
      startTime: string;
      endTime: string;
      startTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
      endTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
      isAvailable: boolean;
      isBooked: boolean;
      bookingStatus?: string;
      bookingDetails?: {
        clientName: string;
        clientEmail: string;
        notes?: string;
        status: string;
      };
    }> = [];

    // Extract time portion from timestamp (e.g., "2025-09-04T09:00:00+00:00" -> "09:00:00")
    const startTimeStr = extractTimeFromTimestamp(workingHours.start_time);
    const endTimeStr = extractTimeFromTimestamp(workingHours.end_time);

    let currentTime = new Date(`2000-01-01T${startTimeStr}`);
    const endTime = new Date(`2000-01-01T${endTimeStr}`);

    while (currentTime < endTime) {
      const slotStart = currentTime.toTimeString().slice(0, 5);
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000)
        .toTimeString()
        .slice(0, 5);

      if (new Date(`2000-01-01T${slotEnd}`) <= endTime) {
        const timeSlot = {
          id: `${userId}-${date}-${slotStart}-${slotEnd}`,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: true,
          isBooked: false,
          ...(shouldUse12HourFormat && {
            startTimeDisplay: formatTime(slotStart, false), // false = 12-hour format
            endTimeDisplay: formatTime(slotEnd, false),
          }),
        };

        timeSlots.push(timeSlot);
      }

      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    // Overlay any custom time slots (exceptions)
    if (customTimeSlots && customTimeSlots.length > 0) {
      customTimeSlots.forEach((customSlot) => {
        const startTime = extractTimeFromTimestamp(customSlot.start_time);
        const endTime = extractTimeFromTimestamp(customSlot.end_time);

        if (getSlotDurationMinutes(startTime, endTime) !== slotDuration) {
          return;
        }

        const existingIndex = timeSlots.findIndex(
          (s) => s.startTime === startTime && s.endTime === endTime
        );

        if (existingIndex !== -1) {
          // Update availability on existing generated slot
          timeSlots[existingIndex].isAvailable =
            customSlot.is_available !== false && !customSlot.is_booked;
          timeSlots[existingIndex].isBooked = customSlot.is_booked || false;
        } else {
          // Add custom-only slot not present in generated set
          const added = {
            id: `${userId}-${date}-${startTime}-${endTime}`,
            startTime,
            endTime,
            isAvailable:
              customSlot.is_available !== false && !customSlot.is_booked,
            isBooked: customSlot.is_booked || false,
          } as (typeof timeSlots)[number];

          if (shouldUse12HourFormat) {
            added.startTimeDisplay = formatTime(startTime, false);
            added.endTimeDisplay = formatTime(endTime, false);
          }

          timeSlots.push(added);
        }
      });
    }

    // Check for existing bookings and mark slots as unavailable
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("start_time, end_time, status, client_name, client_email, notes")
      .eq("user_id", userId)
      .eq("date", date)
      .in("status", ["confirmed", "pending"]);

    if (existingBookings) {
      timeSlots.forEach((slot) => {
        const booking = existingBookings.find((b) => {
          const bookingStartTime = extractTimeFromTimestamp(b.start_time);
          const bookingEndTime = extractTimeFromTimestamp(b.end_time);
          return (
            bookingStartTime === slot.startTime &&
            bookingEndTime === slot.endTime
          );
        });
        if (booking) {
          slot.isAvailable = false;
          slot.isBooked = true;
        }
      });
    }

    return NextResponse.json({
      date: new Date(date),
      timeSlots,
      isWorkingDay: true,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "availability/public/GET", type: "server" },
    });
    console.error("Error in public availability:", error);
    console.error("Request params:", { date, userId });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
