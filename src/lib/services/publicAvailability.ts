import { eachDayOfInterval, format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  extractTimeFromTimestamp,
  formatTime,
} from "@/lib/utils/serverTimeFormat";

type PublicSupabaseClient = SupabaseClient<Database>;

type BookingForDate = {
  start_time: string;
  end_time: string;
  status: string;
  client_name: string;
  client_email: string;
  notes: string | null;
};

export interface PublicTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  startTimeDisplay?: string;
  endTimeDisplay?: string;
  isAvailable: boolean;
  isBooked: boolean;
  bookingStatus?: string;
  bookingDetails?: {
    clientName: string;
    clientEmail: string;
    notes?: string;
    status: string;
  };
}

export interface PublicDayAvailability {
  date: Date;
  timeSlots: PublicTimeSlot[];
  isWorkingDay: boolean;
  message?: string;
}

interface PublicAvailabilityContext {
  shouldUse12HourFormat: boolean;
  slotDuration: number;
  workingHoursByDay: Map<
    number,
    {
      start_time: string;
      end_time: string;
      is_working: boolean;
    }
  >;
  customSlotsByDate: Map<
    string,
    Array<{
      start_time: string;
      end_time: string;
      is_available: boolean | null;
      is_booked: boolean | null;
    }>
  >;
  bookingsByDate: Map<string, BookingForDate[]>;
}

function getSlotDurationMinutes(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function sortSlotsByStartTime(slots: PublicTimeSlot[]) {
  slots.sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function applyBookings(slots: PublicTimeSlot[], bookings: BookingForDate[]) {
  slots.forEach((slot) => {
    const booking = bookings.find((entry) => {
      const bookingStartTime = extractTimeFromTimestamp(entry.start_time);
      const bookingEndTime = extractTimeFromTimestamp(entry.end_time);

      return (
        bookingStartTime === slot.startTime && bookingEndTime === slot.endTime
      );
    });

    if (!booking) {
      return;
    }

    slot.isAvailable = false;
    slot.isBooked = true;
    slot.bookingStatus = booking.status;
    slot.bookingDetails = {
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      notes: booking.notes ?? undefined,
      status: booking.status,
    };
  });
}

export async function createPublicAvailabilityContext(
  supabase: PublicSupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<PublicAvailabilityContext> {
  const [settingsResult, workingHoursResult, customSlotsResult, bookingsResult] =
    await Promise.all([
      supabase
        .from("user_availability_settings")
        .select("time_format_12h, slot_duration_minutes")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_working_hours")
        .select("day_of_week, start_time, end_time, is_working")
        .eq("user_id", userId),
      supabase
        .from("user_time_slots")
        .select("date, start_time, end_time, is_available, is_booked")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date")
        .order("start_time"),
      supabase
        .from("bookings")
        .select("date, start_time, end_time, status, client_name, client_email, notes")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .in("status", ["confirmed", "pending"]),
    ]);

  if (settingsResult.error) {
    throw settingsResult.error;
  }

  if (workingHoursResult.error) {
    throw workingHoursResult.error;
  }

  if (customSlotsResult.error) {
    throw customSlotsResult.error;
  }

  if (bookingsResult.error) {
    throw bookingsResult.error;
  }

  const workingHoursByDay = new Map<
    number,
    {
      start_time: string;
      end_time: string;
      is_working: boolean;
    }
  >();

  for (const workingHour of workingHoursResult.data ?? []) {
    workingHoursByDay.set(workingHour.day_of_week, {
      start_time: workingHour.start_time,
      end_time: workingHour.end_time,
      is_working: workingHour.is_working,
    });
  }

  const customSlotsByDate = new Map<
    string,
    Array<{
      start_time: string;
      end_time: string;
      is_available: boolean | null;
      is_booked: boolean | null;
    }>
  >();

  for (const customSlot of customSlotsResult.data ?? []) {
    const existingSlots = customSlotsByDate.get(customSlot.date) ?? [];
    existingSlots.push({
      start_time: customSlot.start_time,
      end_time: customSlot.end_time,
      is_available: customSlot.is_available,
      is_booked: customSlot.is_booked,
    });
    customSlotsByDate.set(customSlot.date, existingSlots);
  }

  const bookingsByDate = new Map<string, BookingForDate[]>();

  for (const booking of bookingsResult.data ?? []) {
    const existingBookings = bookingsByDate.get(booking.date) ?? [];
    existingBookings.push({
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status,
      client_name: booking.client_name,
      client_email: booking.client_email,
      notes: booking.notes,
    });
    bookingsByDate.set(booking.date, existingBookings);
  }

  return {
    shouldUse12HourFormat: settingsResult.data?.time_format_12h ?? false,
    slotDuration:
      settingsResult.data?.slot_duration_minutes === 480 ? 480 : 240,
    workingHoursByDay,
    customSlotsByDate,
    bookingsByDate,
  };
}

export function buildPublicDayAvailability(
  dateKey: string,
  userId: string,
  context: PublicAvailabilityContext
): PublicDayAvailability {
  const dayOfWeek = new Date(dateKey).getDay();
  const workingHours = context.workingHoursByDay.get(dayOfWeek);
  const customTimeSlots = context.customSlotsByDate.get(dateKey) ?? [];
  const existingBookings = context.bookingsByDate.get(dateKey) ?? [];

  if (!workingHours || !workingHours.is_working) {
    if (customTimeSlots.length === 0) {
      return {
        date: new Date(dateKey),
        timeSlots: [],
        isWorkingDay: false,
        message: "No working hours or custom slots configured for this day",
      };
    }

    const customOnlySlots = customTimeSlots
      .map((customSlot) => {
        const startTime = extractTimeFromTimestamp(customSlot.start_time);
        const endTime = extractTimeFromTimestamp(customSlot.end_time);

        if (getSlotDurationMinutes(startTime, endTime) !== context.slotDuration) {
          return null;
        }

        const slot: PublicTimeSlot = {
          id: `${userId}-${dateKey}-${startTime}-${endTime}`,
          startTime,
          endTime,
          isAvailable:
            customSlot.is_available !== false && !customSlot.is_booked,
          isBooked: customSlot.is_booked ?? false,
        };

        if (context.shouldUse12HourFormat) {
          slot.startTimeDisplay = formatTime(startTime, false);
          slot.endTimeDisplay = formatTime(endTime, false);
        }

        return slot;
      })
      .filter((slot): slot is PublicTimeSlot => slot !== null);

    applyBookings(customOnlySlots, existingBookings);
    sortSlotsByStartTime(customOnlySlots);

    return {
      date: new Date(dateKey),
      timeSlots: customOnlySlots,
      isWorkingDay: true,
      message: "Using custom time slots for non-working day",
    };
  }

  const timeSlots: PublicTimeSlot[] = [];
  const startTimeStr = extractTimeFromTimestamp(workingHours.start_time);
  const endTimeStr = extractTimeFromTimestamp(workingHours.end_time);

  let currentTime = new Date(`2000-01-01T${startTimeStr}`);
  const endTime = new Date(`2000-01-01T${endTimeStr}`);

  while (currentTime < endTime) {
    const slotStart = currentTime.toTimeString().slice(0, 5);
    const slotEnd = new Date(currentTime.getTime() + context.slotDuration * 60000)
      .toTimeString()
      .slice(0, 5);

    if (new Date(`2000-01-01T${slotEnd}`) <= endTime) {
      const timeSlot: PublicTimeSlot = {
        id: `${userId}-${dateKey}-${slotStart}-${slotEnd}`,
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: true,
        isBooked: false,
      };

      if (context.shouldUse12HourFormat) {
        timeSlot.startTimeDisplay = formatTime(slotStart, false);
        timeSlot.endTimeDisplay = formatTime(slotEnd, false);
      }

      timeSlots.push(timeSlot);
    }

    currentTime = new Date(currentTime.getTime() + context.slotDuration * 60000);
  }

  for (const customSlot of customTimeSlots) {
    const startTime = extractTimeFromTimestamp(customSlot.start_time);
    const endTime = extractTimeFromTimestamp(customSlot.end_time);

    if (getSlotDurationMinutes(startTime, endTime) !== context.slotDuration) {
      continue;
    }

    const existingIndex = timeSlots.findIndex(
      (slot) => slot.startTime === startTime && slot.endTime === endTime
    );

    if (existingIndex !== -1) {
      timeSlots[existingIndex].isAvailable =
        customSlot.is_available !== false && !customSlot.is_booked;
      timeSlots[existingIndex].isBooked = customSlot.is_booked ?? false;
      continue;
    }

    const addedSlot: PublicTimeSlot = {
      id: `${userId}-${dateKey}-${startTime}-${endTime}`,
      startTime,
      endTime,
      isAvailable: customSlot.is_available !== false && !customSlot.is_booked,
      isBooked: customSlot.is_booked ?? false,
    };

    if (context.shouldUse12HourFormat) {
      addedSlot.startTimeDisplay = formatTime(startTime, false);
      addedSlot.endTimeDisplay = formatTime(endTime, false);
    }

    timeSlots.push(addedSlot);
  }

  applyBookings(timeSlots, existingBookings);
  sortSlotsByStartTime(timeSlots);

  return {
    date: new Date(dateKey),
    timeSlots,
    isWorkingDay: true,
  };
}

export async function getPublicAvailableDatesInRange(
  supabase: PublicSupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
) {
  const context = await createPublicAvailabilityContext(
    supabase,
    userId,
    startDate,
    endDate
  );

  return eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  })
    .map((date) => format(date, "yyyy-MM-dd"))
    .filter((dateKey) => {
      const availability = buildPublicDayAvailability(dateKey, userId, context);

      return availability.timeSlots.some(
        (timeSlot) => timeSlot.isAvailable && !timeSlot.isBooked
      );
    });
}