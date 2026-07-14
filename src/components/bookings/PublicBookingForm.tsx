"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { UserIcon } from "@heroicons/react/24/outline";
import { useSnackbar } from "@/components/snackbar";
import {
  usePublicAvailableDates,
  usePublicDayAvailability,
  useCreatePublicBooking,
} from "@/lib/hooks/queries";
import {
  publicBookingFormSchema,
  type PublicBookingFormData,
} from "@/lib/validations/booking";
import SharedAvailabilityCalendar from "./SharedAvailabilityCalendar";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  startTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
  endTimeDisplay?: string; // Formatted display time (when user prefers 12-hour format)
  isAvailable: boolean;
  isBooked?: boolean;
}

interface PublicBookingFormProps {
  userId: string;
}

export default function PublicBookingForm({ userId }: PublicBookingFormProps) {
  const router = useRouter();
  const today = startOfDay(new Date());
  const rangeStart = format(today, "yyyy-MM-dd");
  const rangeEnd = format(addDays(today, 29), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const { success, error, warning } = useSnackbar();

  const { data: availableDatesResponse, isLoading: isAvailableDatesLoading } =
    usePublicAvailableDates(userId, rangeStart, rangeEnd);

  const availableDateKeys = availableDatesResponse?.availableDates ?? [];
  const availableDates = availableDateKeys.map((date) => parseISO(date));

  useEffect(() => {
    if (availableDateKeys.length === 0) {
      return;
    }

    const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

    if (availableDateKeys.includes(selectedDateKey)) {
      return;
    }

    setSelectedDate(availableDates[0]);
    setSelectedTimeSlot(null);
  }, [availableDateKeys, availableDates, selectedDate]);

  // Use TanStack Query for public day availability
  const dateString = format(selectedDate, "yyyy-MM-dd");
  const { data: dayAvailability, isLoading } = usePublicDayAvailability(
    dateString,
    userId
  );
  const createPublicBookingMutation = useCreatePublicBooking();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PublicBookingFormData>({
    resolver: zodResolver(publicBookingFormSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      notes: "",
    },
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.isAvailable && !slot.isBooked) {
      setSelectedTimeSlot(slot);
    }
  };

  const onSubmit = async (data: PublicBookingFormData) => {
    if (!selectedTimeSlot || !selectedDate) {
      warning("Please select a date and time slot");
      return;
    }

    try {
      const result = await createPublicBookingMutation.mutateAsync({
        userId,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        notes: data.notes,
      });

      // Redirect to booking details page with access token
      if (result.accessToken) {
        success(
          "Booking created successfully! Redirecting to your booking details..."
        );

        // Small delay to show the success message, then redirect
        setTimeout(() => {
          router.push(`/booking/${result.accessToken}`);
        }, 1000);
      }
    } catch (err) {
      console.error("Error submitting booking:", err);
      error(
        err instanceof Error
          ? err.message
          : "Error submitting booking. Please try again."
      );
    }
  };

  return (
    <div className="space-y-6">
      <SharedAvailabilityCalendar
        onDateSelect={handleDateSelect}
        onTimeSlotSelect={handleTimeSlotSelect}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        availableDates={availableDates}
        dayAvailability={
          dayAvailability ? { ...dayAvailability, date: selectedDate } : null
        }
        isLoading={isLoading || isAvailableDatesLoading}
        showBookingDetails={false}
        noAvailableDatesMessage="No time slots are currently available. Please check back later."
      />

      {/* Booking Form */}
      {selectedTimeSlot && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-purple-600" />
            Your Information
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Name *
                </label>
                <input
                  type="text"
                  id="clientName"
                  {...register("clientName")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.clientName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Email *
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  {...register("clientEmail")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.clientEmail ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientEmail.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="clientPhone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="clientPhone"
                  {...register("clientPhone")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.clientPhone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.clientPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientPhone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Special Notes
                </label>
                <input
                  type="text"
                  id="notes"
                  {...register("notes")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.notes ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Any special requirements"
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.notes.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  w-full sm:w-auto px-6 py-3 text-white font-medium rounded-lg transition-all
                  ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                  }
                `}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting Request...
                  </div>
                ) : (
                  `Request ${
                    selectedTimeSlot.startTimeDisplay ||
                    selectedTimeSlot.startTime
                  } - ${
                    selectedTimeSlot.endTimeDisplay || selectedTimeSlot.endTime
                  }`
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
