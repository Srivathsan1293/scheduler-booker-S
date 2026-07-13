import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
// Removed unused imports: addMonths, startOfMonth
import {
  formatTime,
  extractTimeFromTimestamp,
} from "@/lib/utils/serverTimeFormat";
import * as Sentry from "@sentry/nextjs";

type BookingDetails = {
  clientName: string;
  clientEmail: string;
  notes: string | null;
  status: string;
};

type ApiTimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  startTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
  endTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
  isAvailable: boolean;
  isBooked: boolean;
  bookingDetails?: BookingDetails;
};

function getSlotDurationMinutes(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

// This endpoint is for authenticated users to fetch their own availability
// details, including private booking information.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  console.log("🔥 DAY-DETAILS API CALLED:", {
    url: request.url,
    date,
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  try {
    if (!date) {
      console.log("🔥 ERROR: Missing date parameter");
      return NextResponse.json(
        { message: "Missing required date parameter" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Fetch user's time format preference from database
    const { data: userSettings } = await supabase
      .from("user_availability_settings")
      .select("time_format_12h")
      .eq("user_id", userId)
      .single();

    const shouldUse12HourFormat = userSettings?.time_format_12h || false;

    // Validate that the requested date is within a reasonable booking range
    // (past 30 days to future 90 days)
    const requestedDate = new Date(date);
    const today = new Date();
    const pastLimit = new Date(today);
    pastLimit.setDate(today.getDate() - 30);
    const futureLimit = new Date(today);
    futureLimit.setDate(today.getDate() + 90);

    if (requestedDate < pastLimit || requestedDate > futureLimit) {
      return NextResponse.json(
        {
          message:
            "Date is outside the allowed booking range. You can only view availability for the past 30 days to 90 days in the future.",
        },
        { status: 400 }
      );
    }

    // Get working hours for the day
    // Parse the date as a local date to avoid timezone issues
    const localDate = new Date(date + "T00:00:00");
    const jsDayOfWeek = localDate.getDay();
    const dayOfWeek = jsDayOfWeek; // No conversion needed - both use 0-6

    console.log("🔥 Working hours query:", {
      userId,
      date,
      localDate: localDate.toISOString(),
      jsDayOfWeek,
      dayOfWeek,
      originalDateObject: new Date(date),
      originalDateString: new Date(date).toString(),
    });

    const { data: workingHours, error: workingHoursError } = await supabase
      .from("user_working_hours")
      .select("*")
      .eq("user_id", userId)
      .eq("day_of_week", dayOfWeek)
      .single();

    console.log("🔥 Working hours result:", {
      workingHours,
      workingHoursError,
      isWorking: workingHours?.is_working,
      startTime: workingHours?.start_time,
      endTime: workingHours?.end_time,
      dayOfWeek,
      jsDayOfWeek,
    });

    // Check for custom time slots for this specific date
    const { data: customTimeSlots } = await supabase
      .from("user_time_slots")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("start_time");

    const { data: settings } = await supabase
      .from("user_availability_settings")
      .select("slot_duration_minutes")
      .eq("user_id", userId)
      .single();

    const slotDuration = settings?.slot_duration_minutes === 480 ? 480 : 240;

    console.log(
      "🔥 CUSTOM TIME SLOTS FETCHED:",
      customTimeSlots?.length || 0,
      "slots"
    );

    // Always generate the full set of time slots from working hours first
    let timeSlots: ApiTimeSlot[] = [];

    if (workingHoursError || !workingHours || !workingHours.is_working) {
      console.log("🔥 NOT A WORKING DAY OR NO WORKING HOURS FOUND:", {
        workingHoursError,
        workingHours,
        isWorking: workingHours?.is_working,
        dayOfWeek,
        userId,
      });

      // If there are custom slots for this date, return those instead of empty
      if (customTimeSlots && customTimeSlots.length > 0) {
        console.log(
          "🔥 Using custom slots for non-working day or missing working hours"
        );

        const customOnly: ApiTimeSlot[] = customTimeSlots
          .map((customSlot) => {
            const startTime = extractTimeFromTimestamp(customSlot.start_time);
            const endTime = extractTimeFromTimestamp(customSlot.end_time);

            if (getSlotDurationMinutes(startTime, endTime) !== slotDuration) {
              return null;
            }

            const slot: ApiTimeSlot = {
              id: `${userId}-${date}-${startTime}-${endTime}`,
              startTime,
              endTime,
              isAvailable: customSlot.is_available,
              isBooked: customSlot.is_booked || false,
            };

            if (shouldUse12HourFormat) {
              slot.startTimeDisplay = formatTime(startTime, false);
              slot.endTimeDisplay = formatTime(endTime, false);
            }

            return slot;
          })
          .filter((slot): slot is ApiTimeSlot => slot !== null);

        // Merge booking info
        const { data: existingBookings } = await supabase
          .from("bookings")
          .select(
            "start_time, end_time, status, client_name, client_email, notes"
          )
          .eq("user_id", userId)
          .eq("date", date);

        if (existingBookings) {
          customOnly.forEach((slot) => {
            const booking = existingBookings.find((b) => {
              const bookingStartTime = extractTimeFromTimestamp(b.start_time);
              const bookingEndTime = extractTimeFromTimestamp(b.end_time);
              return (
                bookingStartTime === slot.startTime &&
                bookingEndTime === slot.endTime
              );
            });
            if (booking) {
              const blocksSlot =
                booking.status === "pending" || booking.status === "confirmed";
              if (blocksSlot) {
                slot.isAvailable = false;
                slot.isBooked = true;
              }
              slot.bookingDetails = {
                clientName: booking.client_name,
                clientEmail: booking.client_email,
                notes: booking.notes,
                status: booking.status,
              };
            }
          });
        }

        return NextResponse.json({
          date: new Date(date),
          timeSlots: customOnly,
          isWorkingDay: true, // Treat as working because there are explicit slots
        });
      }

      // Fall back to empty when no custom slots exist
      // If no working hours found, try to get all working hours to debug
      const { data: allWorkingHours } = await supabase
        .from("user_working_hours")
        .select("*")
        .eq("user_id", userId);

      console.log("🔥 ALL WORKING HOURS FOR USER:", allWorkingHours);

      return NextResponse.json({
        date: new Date(date),
        timeSlots: [],
        isWorkingDay: false,
        debug: {
          requestedDayOfWeek: dayOfWeek,
          allWorkingHours: allWorkingHours?.map((wh) => ({
            day_of_week: wh.day_of_week,
            is_working: wh.is_working,
            start_time: wh.start_time,
            end_time: wh.end_time,
          })),
        },
      });
    }

    console.log("🔥 Slot duration settings:", {
      settings,
      slotDuration,
      userId,
    });

    // Extract time portion from working hours (they might be stored as timestamps)
    const startTime = extractTimeFromTimestamp(workingHours.start_time);
    const endTime = extractTimeFromTimestamp(workingHours.end_time);

    console.log("🔥 Working hours extracted:", {
      originalStart: workingHours.start_time,
      extractedStart: startTime,
      originalEnd: workingHours.end_time,
      extractedEnd: endTime,
    });

    // Generate time slots
    const slots: ApiTimeSlot[] = [];
    let currentTime = new Date(`2000-01-01T${startTime}`);
    const endTimeDate = new Date(`2000-01-01T${endTime}`);

    console.log("🔥 Time slot generation:", {
      startTime,
      endTime,
      slotDuration,
      currentTime: currentTime.toISOString(),
      endTimeDate: endTimeDate.toISOString(),
    });

    while (currentTime < endTimeDate) {
      const slotStart = currentTime.toTimeString().slice(0, 5);
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000)
        .toTimeString()
        .slice(0, 5);

      if (new Date(`2000-01-01T${slotEnd}`) <= endTimeDate) {
        const slot: ApiTimeSlot = {
          id: `${userId}-${date}-${slotStart}-${slotEnd}`,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: true, // Default to available
          isBooked: false,
        };

        // Add display formatting if user prefers 12-hour format
        if (shouldUse12HourFormat) {
          slot.startTimeDisplay = formatTime(slotStart, false); // false = 12-hour format
          slot.endTimeDisplay = formatTime(slotEnd, false);
        }

        slots.push(slot);
        console.log("🔥 Generated slot:", { slotStart, slotEnd });
      }

      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    console.log("🔥 Total slots generated:", slots.length);

    timeSlots = slots;

    console.log(
      "🔥 Generated time slots:",
      timeSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        id: slot.id,
      }))
    );

    // Now apply any custom overrides from the database
    if (customTimeSlots && customTimeSlots.length > 0) {
      console.log("🔥 APPLYING CUSTOM TIME SLOT OVERRIDES");
      console.log("🔥 Custom time slots found:", customTimeSlots.length);
      customTimeSlots.forEach((customSlot) => {
        const startTime = extractTimeFromTimestamp(customSlot.start_time);
        const endTime = extractTimeFromTimestamp(customSlot.end_time);

        if (getSlotDurationMinutes(startTime, endTime) !== slotDuration) {
          console.log("🔥 Skipping legacy custom slot due to duration mismatch:", {
            startTime,
            endTime,
            slotDuration,
          });
          return;
        }

        console.log("🔥 Processing custom slot:", {
          originalStart: customSlot.start_time,
          extractedStart: startTime,
          originalEnd: customSlot.end_time,
          extractedEnd: endTime,
          isAvailable: customSlot.is_available,
        });

        // Find the corresponding slot in our generated slots
        const existingSlotIndex = timeSlots.findIndex(
          (slot) => slot.startTime === startTime && slot.endTime === endTime
        );

        if (existingSlotIndex !== -1) {
          // Update the existing slot with custom data
          console.log(
            "🔥 Updating existing slot at index",
            existingSlotIndex,
            "from",
            timeSlots[existingSlotIndex].isAvailable,
            "to",
            customSlot.is_available
          );
          timeSlots[existingSlotIndex].isAvailable = customSlot.is_available;
          console.log("🔥 Slot after update:", {
            startTime: timeSlots[existingSlotIndex].startTime,
            endTime: timeSlots[existingSlotIndex].endTime,
            isAvailable: timeSlots[existingSlotIndex].isAvailable,
          });
        } else {
          // Add a new custom slot if it doesn't exist in the generated set
          console.log("🔥 Adding new custom slot:", {
            startTime,
            endTime,
            isAvailable: customSlot.is_available,
          });
          const newSlot: ApiTimeSlot = {
            id: `${userId}-${date}-${startTime}-${endTime}`,
            startTime,
            endTime,
            isAvailable: customSlot.is_available,
            isBooked: false,
          };

          // Add display formatting if user prefers 12-hour format
          if (shouldUse12HourFormat) {
            newSlot.startTimeDisplay = formatTime(startTime, false); // false = 12-hour format
            newSlot.endTimeDisplay = formatTime(endTime, false);
          }

          timeSlots.push(newSlot);
        }
      });
    }

    // Check for existing bookings to enrich the time slots
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("start_time, end_time, status, client_name, client_email, notes")
      .eq("user_id", userId)
      .eq("date", date);

    if (existingBookings) {
      timeSlots.forEach((slot) => {
        const booking = existingBookings.find((b) => {
          // Extract time portion from booking timestamps for comparison
          const bookingStartTime = extractTimeFromTimestamp(b.start_time);
          const bookingEndTime = extractTimeFromTimestamp(b.end_time);
          return (
            bookingStartTime === slot.startTime &&
            bookingEndTime === slot.endTime
          );
        });

        if (booking) {
          // Only block the slot if booking is pending or confirmed
          const blocksSlot =
            booking.status === "pending" || booking.status === "confirmed";
          if (blocksSlot) {
            slot.isAvailable = false;
            slot.isBooked = true;
          }
          slot.bookingDetails = {
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            notes: booking.notes,
            status: booking.status,
          };
        }
      });
    }

    // Apply time formatting
    console.log("🔥 Should format times?", shouldUse12HourFormat);
    if (shouldUse12HourFormat) {
      console.log("🔥 Formatting times for", timeSlots.length, "slots");
      timeSlots.forEach((slot) => {
        slot.startTimeDisplay = formatTime(slot.startTime, false); // false = 12-hour format
        slot.endTimeDisplay = formatTime(slot.endTime, false);
      });
      console.log(
        "🔥 Sample formatted slot:",
        timeSlots[0]
          ? {
              startTime: timeSlots[0].startTime,
              startTimeDisplay: timeSlots[0].startTimeDisplay,
            }
          : "No slots"
      );
    }

    console.log("🔥 RETURNING UNIFIED RESPONSE WITH FORMATTING!");
    return NextResponse.json({
      date: new Date(date),
      timeSlots,
      isWorkingDay: true,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "availability/day-details/GET", type: "server" },
    });
    console.error("Error in day-details availability:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
