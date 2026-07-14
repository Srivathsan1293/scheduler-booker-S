"use client";

import { format, addDays, startOfDay, isBefore } from "date-fns";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  startTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
  endTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
  isAvailable: boolean;
  isBooked?: boolean;
  bookingStatus?:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed"
    | "no-show";
  bookingDetails?: {
    clientName: string;
    clientEmail: string;
    notes?: string;
    status: string;
  };
}

interface DayAvailability {
  date: Date;
  timeSlots: TimeSlot[];
  isWorkingDay: boolean;
}

interface SharedAvailabilityCalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  availableDates?: Date[];
  dayAvailability: DayAvailability | null;
  isLoading: boolean;
  showBookingDetails?: boolean; // Control whether to show booking information
  noAvailableDatesMessage?: string;
}

export default function SharedAvailabilityCalendar({
  onDateSelect,
  onTimeSlotSelect,
  selectedDate,
  selectedTimeSlot,
  availableDates,
  dayAvailability,
  isLoading,
  showBookingDetails = false,
  noAvailableDatesMessage = "No available dates right now.",
}: SharedAvailabilityCalendarProps) {
  const hasAvailableDatesProp = availableDates !== undefined;
  const dateOptions = hasAvailableDatesProp
    ? availableDates
    : Array.from({ length: 30 }, (_, index) =>
        addDays(startOfDay(new Date()), index)
      );

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.isAvailable && !slot.isBooked) {
      onTimeSlotSelect(slot);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
          Select Date
        </h3>
        {hasAvailableDatesProp && dateOptions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
            {noAvailableDatesMessage}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {dateOptions.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                disabled={isDateDisabled(date)}
                className={`
                  p-3 text-sm font-medium rounded-lg transition-all
                  ${
                    selectedDate &&
                    format(selectedDate, "yyyy-MM-dd") ===
                      format(date, "yyyy-MM-dd")
                      ? "bg-blue-600 text-white shadow-lg"
                      : isDateDisabled(date)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-200 border border-gray-200"
                  }
                `}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {format(date, "EEE")}
                </div>
                <div className="text-lg">{format(date, "d")}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-green-600" />
            Available Time Slots for{" "}
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading availability...</p>
            </div>
          ) : dayAvailability && dayAvailability.isWorkingDay ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dayAvailability.timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() =>
                    slot.isAvailable && !slot.isBooked
                      ? handleTimeSlotSelect(slot)
                      : undefined
                  }
                  disabled={!slot.isAvailable || slot.isBooked}
                  className={`
                    p-3 text-sm font-medium rounded-lg border transition-all
                    ${
                      slot.isBooked
                        ? "bg-gray-50 text-gray-800 border-gray-300 cursor-not-allowed"
                        : selectedTimeSlot?.id === slot.id
                        ? "bg-green-600 text-white border-green-600 shadow-lg"
                        : slot.isAvailable
                        ? "bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-200"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }
                  `}
                  title={
                    slot.isBooked
                      ? showBookingDetails
                        ? `Booked: ${
                            slot.bookingDetails?.clientName || "Unknown"
                          } - ${
                            slot.bookingDetails?.status || "Unknown status"
                          }`
                        : "This time slot is not available"
                      : slot.isAvailable
                      ? "Available for booking"
                      : "Not available"
                  }
                >
                  <div className="font-semibold">
                    {slot.startTimeDisplay || slot.startTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    to {slot.endTimeDisplay || slot.endTime}
                    {slot.isBooked && showBookingDetails && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600 text-xs">👤</span>
                          <span className="text-xs font-medium text-gray-800">
                            {slot.bookingDetails?.clientName ||
                              "Unknown Client"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {slot.bookingDetails?.status === "confirmed" && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              ✓ Confirmed
                            </span>
                          )}
                          {slot.bookingDetails?.status === "pending" && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              ⏳ Pending
                            </span>
                          )}
                          {slot.bookingDetails?.status === "cancelled" && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              ✕ Cancelled
                            </span>
                          )}
                          {slot.bookingDetails?.status === "completed" && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              ✓ Completed
                            </span>
                          )}
                          {slot.bookingDetails?.status === "no-show" && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              • No Show
                            </span>
                          )}
                        </div>
                        {slot.bookingDetails?.notes && (
                          <div className="flex items-start gap-1.5">
                            <span className="text-gray-600 text-xs mt-0.5">
                              📝
                            </span>
                            <span className="text-xs text-gray-600 italic leading-tight">
                              &ldquo;{slot.bookingDetails.notes}&rdquo;
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No working hours set for this day.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
