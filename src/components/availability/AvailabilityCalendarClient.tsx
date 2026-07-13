"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";
import { useAvailability } from "@/lib/hooks/useAvailability";
import type { TimeSlot, Booking } from "@/lib/types/availability";
import { TimeSlotUtils } from "@/lib/utils/timeSlotUtils";

import DayDetailsModal from "./DayDetailsModal";
import SettingsModal from "./SettingsModal";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AvailabilityCalendarProps {}

export default function AvailabilityCalendarClient({}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const {
    availability,
    bookings,
    workingHours,
    settings,
    isFullyLoaded,
    updateWorkingHours,
    updateSettings,
    saveAvailability,
    isLoading,
    toggleWorkingDay,
    toggleTimeSlot,
    setAvailability,
    loadAvailability,
    loadTimeSlotsForMonth,
    loadAndSetBookings,
    processMonthDays,
    markTimeSlotsLoaded,
  } = useAvailability();

  // Function to refresh calendar data for a specific date
  const refreshCalendarForDate = useCallback(
    async (date: Date) => {
      try {
        const startDate = new Date(date);
        const endDate = new Date(date);
        const monthData = await loadTimeSlotsForMonth(startDate, endDate);
        if (monthData) {
          const monthDays = [date];
          await processMonthDays(
            monthDays,
            monthData.exceptionsMap,
            monthData.slotsMap
          );
        }
      } catch (error) {
        console.warn("⚠️ Failed to refresh calendar data for date:", error);
      }
    },
    [loadTimeSlotsForMonth, processMonthDays]
  );

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Track if we've already processed the current month
  const processedMonthRef = useRef<string>("");
  const timeSlotsMarkedRef = useRef<boolean>(false);

  // Helper function to check if a date is within allowed booking range
  // (current month + first 15 days of next month)
  const isDateInAllowedRange = useCallback((date: Date) => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const nextMonth = addMonths(today, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    const cutoffDate = new Date(nextMonthStart);
    cutoffDate.setDate(15); // 15th day of next month

    return date >= currentMonthStart && date <= cutoffDate;
  }, []);

  // Helper function to get booking information for a specific day
  const getDayBookings = useCallback(
    (day: Date) => {
      const dateKey = TimeSlotUtils.formatDateKey(day);
      return bookings[dateKey] || [];
    },
    [bookings]
  );

  // Helper function to get booking status counts for a day
  const getDayBookingStats = useCallback(
    (day: Date) => {
      const dayBookings = getDayBookings(day);
      return {
        total: dayBookings.length,
        confirmed: dayBookings.filter((b: Booking) => b.status === "confirmed")
          .length,
        pending: dayBookings.filter((b: Booking) => b.status === "pending")
          .length,
        cancelled: dayBookings.filter((b: Booking) => b.status === "cancelled")
          .length,
        completed: dayBookings.filter((b: Booking) => b.status === "completed")
          .length,
      };
    },
    [getDayBookings]
  );

  // Main calendar processing effect - handles month changes and working hours updates
  useEffect(() => {
    // Only process if working hours are loaded AND data is fully loaded
    if (workingHours.length === 0 || !isFullyLoaded) {
      return;
    }

    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

    // Skip if month already processed
    if (processedMonthRef.current === monthKey) {
      return;
    }

    // Reset flags for new month
    timeSlotsMarkedRef.current = false;
    processedMonthRef.current = monthKey;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Generate time slots for each day in the month
    const days: Date[] = [];
    for (let i = 0; i < 31; i++) {
      const day = new Date(monthStart);
      day.setDate(monthStart.getDate() + i);
      if (day > monthEnd) break;
      days.push(new Date(day));
    }

    // Optimized: Process days in batch
    const processDaysOptimized = async () => {
      const processMonthStart = startOfMonth(currentMonth);
      const processMonthEnd = endOfMonth(currentMonth);

      // Load all month data in parallel - time slots and bookings
      const [monthData] = await Promise.all([
        loadTimeSlotsForMonth(processMonthStart, processMonthEnd),
        loadAndSetBookings(processMonthStart, processMonthEnd), // This now updates the state
      ]);

      if (monthData) {
        // Process all days with the batched data (no more database calls)
        await processMonthDays(
          days,
          monthData.exceptionsMap,
          monthData.slotsMap
        );
      }

      // Mark time slots as loaded after processing all days
      if (!timeSlotsMarkedRef.current) {
        setTimeout(() => {
          markTimeSlotsLoaded();
          timeSlotsMarkedRef.current = true;
        }, 50); // Reduced timeout since we're faster now
      }
    };

    processDaysOptimized();
  }, [
    currentMonth,
    workingHours,
    isFullyLoaded,
    availability,
    loadTimeSlotsForMonth,
    loadAndSetBookings,
    processMonthDays,
    markTimeSlotsLoaded,
    settings,
  ]);

  // Reset processed month when data changes (so calendar reprocesses with new data)
  useEffect(() => {
    processedMonthRef.current = "";
    timeSlotsMarkedRef.current = false;
  }, [workingHours, settings]);

  // Function to refresh calendar data
  const refreshCalendar = useCallback(async () => {
    // Clear current availability to force regeneration
    setAvailability({});

    // Reset processed month flag to force regeneration
    processedMonthRef.current = "";
    timeSlotsMarkedRef.current = false;

    // Force reload data from database
    await loadAvailability();
  }, [loadAvailability, setAvailability]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1)
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-Optimized Calendar Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-5 lg:mb-6">
        {/* Mobile Header - Stacked Layout */}
        <div className="block lg:hidden space-y-4">
          {/* Month Title and Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <CalendarDaysIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Manage your availability
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Previous month"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Next month"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="Open availability settings"
              >
                Settings
              </button>
            </div>
            <button
              onClick={refreshCalendar}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              title="Refresh calendar data"
            >
              <svg
                className="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {/* Remove the mobile menu since we now have direct buttons */}
        </div>

        {/* Desktop Header - Original Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <p className="text-sm text-gray-500">Manage your availability</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Previous month"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={refreshCalendar}
              className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400 flex items-center space-x-2"
              title="Refresh calendar data"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setShowSettingsModal(true);
              }}
              className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400 flex items-center space-x-2"
              title="Open availability settings"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Settings</span>
            </button>

            <button
              onClick={() => navigateMonth("next")}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Calendar Legend
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-gray-600">Available Slots</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Booked Slots</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-gray-600">Confirmed Meetings</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <span className="text-gray-600">Pending Meetings</span>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative">
        {/* Day headers - Hidden on mobile, shown on tablet+ */}
        <div className="hidden sm:grid sm:grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 sm:p-3 lg:p-4 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        {!isFullyLoaded || workingHours.length === 0 ? (
          <div className="p-4 sm:p-5 lg:p-8 text-center bg-gray-50 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
              Loading Calendar...
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please wait while we load your availability data.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Single column layout */}
            <div className="block sm:hidden space-y-3 p-4">
              {calendarDays
                .filter((day) => isSameMonth(day, currentMonth))
                .filter((day) => !isBefore(day, startOfDay(new Date()))) // Filter out past days on mobile
                .map((day) => {
                  const dateKey = TimeSlotUtils.formatDateKey(day);

                  // Get the default working day status from working hours
                  const dayOfWeek = day.getDay();
                  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  const dayHours = workingHours[dayIndex];

                  // Try multiple date key formats to find the data
                  const dayAvailability = availability[dateKey] ||
                    availability[day.toISOString()] ||
                    availability[day.toLocaleDateString()] || {
                      date: day,
                      timeSlots: [],
                      isWorkingDay: dayHours?.isWorking ?? false,
                    };

                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);
                  const isPastDay = isBefore(day, startOfDay(new Date()));

                  return (
                    <div
                      key={dateKey}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        isCurrentMonth
                          ? "bg-white border-gray-200"
                          : "bg-gray-50 border-gray-100"
                      } ${
                        isSelected ? "ring-2 ring-blue-500 ring-inset" : ""
                      } ${
                        isPastDay
                          ? "bg-gray-100 opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                      }`}
                      onClick={() => {
                        if (!isPastDay) {
                          setSelectedDate(day);
                          setShowDayModal(true);
                        }
                      }}
                      title={
                        isPastDay
                          ? "Past day - no interaction available"
                          : "Click to view and edit day details"
                      }
                    >
                      {/* Mobile day header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {format(day, "EEEE")}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(day, "MMMM d, yyyy")}
                            </div>
                          </div>
                          {isCurrentDay && (
                            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Working day toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkingDay(day);
                          }}
                          disabled={isPastDay}
                          className={`relative w-10 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                            isPastDay
                              ? "bg-gray-200 cursor-not-allowed"
                              : dayAvailability.isWorkingDay
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                          title={
                            isPastDay
                              ? "Past days cannot be modified"
                              : dayAvailability.isWorkingDay
                              ? "Click to mark as non-working day"
                              : "Click to mark as working day"
                          }
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                              dayAvailability.isWorkingDay
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Mobile day content */}
                      <div className="space-y-3">
                        {isPastDay ? (
                          dayAvailability.timeSlots.some(
                            (slot: TimeSlot) => slot.isBooked
                          ) ? (
                            <div className="space-y-2 opacity-50">
                              <div className="flex items-center space-x-2">
                                <ClockIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="text-sm text-gray-600 font-medium">
                                  {
                                    dayAvailability.timeSlots.filter(
                                      (slot: TimeSlot) => slot.isBooked
                                    ).length
                                  }{" "}
                                  past meetings
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-sm text-gray-400 opacity-50">
                              <PauseIcon className="w-4 h-4 flex-shrink-0" />
                              <span>Past day</span>
                            </div>
                          )
                        ) : !isPastDay &&
                          dayAvailability.isWorkingDay &&
                          dayAvailability.timeSlots.length > 0 &&
                          isDateInAllowedRange(day) ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <div className="text-sm text-gray-600 font-medium">
                                {
                                  dayAvailability.timeSlots.filter(
                                    (slot: TimeSlot) =>
                                      slot.isAvailable && !slot.isBooked
                                  ).length
                                }{" "}
                                slots available
                              </div>
                            </div>
                            {dayAvailability.timeSlots.some(
                              (slot: TimeSlot) => slot.isBooked
                            ) && (
                              <div className="flex items-center space-x-2">
                                <ClockIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="text-sm text-gray-600 font-medium">
                                  {
                                    dayAvailability.timeSlots.filter(
                                      (slot: TimeSlot) => slot.isBooked
                                    ).length
                                  }{" "}
                                  slots booked
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5 justify-center items-center p-2">
                              {dayAvailability.timeSlots.map(
                                (slot: TimeSlot) => (
                                  <div
                                    key={slot.id}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 shadow-sm ${
                                      slot.isBooked
                                        ? "bg-blue-500"
                                        : slot.isAvailable
                                        ? "bg-green-400"
                                        : "bg-gray-300"
                                    }`}
                                    title={`${slot.startTime} - ${
                                      slot.endTime
                                    } ${
                                      slot.isBooked
                                        ? "(Booked)"
                                        : slot.isAvailable
                                        ? "(Available)"
                                        : "(Unavailable)"
                                    }`}
                                  />
                                )
                              )}
                            </div>
                            {/* Booking legends */}
                            {(() => {
                              const dayBookingStats = getDayBookingStats(day);
                              if (dayBookingStats.total > 0) {
                                return (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                      <span className="text-xs text-gray-600">
                                        {dayBookingStats.confirmed +
                                          dayBookingStats.completed}{" "}
                                        meetings
                                      </span>
                                    </div>
                                    {dayBookingStats.pending > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                        <span className="text-xs text-gray-600">
                                          {dayBookingStats.pending} pending
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : !isPastDay &&
                          dayAvailability.isWorkingDay &&
                          dayAvailability.timeSlots.length > 0 &&
                          !isDateInAllowedRange(day) ? (
                          // Working day but outside allowed booking range
                          <div className="flex items-center space-x-2 text-sm text-orange-500 opacity-75">
                            <ClockIcon className="w-4 h-4 flex-shrink-0" />
                            <span>Beyond booking limit</span>
                          </div>
                        ) : !isPastDay && dayAvailability.isWorkingDay ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <XCircleIcon className="w-4 h-4 flex-shrink-0" />
                            <span>No slots configured</span>
                          </div>
                        ) : !isPastDay ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <PauseIcon className="w-4 h-4 flex-shrink-0" />
                            <span>Non-working day</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Desktop: 7-column grid layout */}
            <div className="hidden sm:grid sm:grid-cols-7">
              {calendarDays.map((day) => {
                const dateKey = TimeSlotUtils.formatDateKey(day);

                // Get the default working day status from working hours
                const dayOfWeek = day.getDay();
                const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const dayHours = workingHours[dayIndex];

                // Try multiple date key formats to find the data
                const dayAvailability = availability[dateKey] ||
                  availability[day.toISOString()] ||
                  availability[day.toLocaleDateString()] || {
                    date: day,
                    timeSlots: [],
                    isWorkingDay: dayHours?.isWorking ?? false,
                  };

                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);
                const isPastDay = isBefore(day, startOfDay(new Date()));

                return (
                  <div
                    key={dateKey}
                    className={`min-h-[100px] sm:min-h-[140px] lg:min-h-[160px] border-r border-b border-gray-100 ${
                      isCurrentMonth ? "bg-white" : "bg-gray-50"
                    } ${
                      isSelected ? "ring-2 ring-blue-500 ring-inset" : ""
                    } transition-all duration-200 ${
                      isPastDay
                        ? "bg-gray-100 opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (!isPastDay) {
                        setSelectedDate(day);
                        setShowDayModal(true);
                      }
                    }}
                    title={
                      isPastDay
                        ? "Past day - no interaction available"
                        : "Click to view and edit day details"
                    }
                  >
                    <div className="p-2 sm:p-3 lg:p-4">
                      {/* Date header - Mobile optimized */}
                      <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <span
                            className={`text-sm sm:text-base font-medium ${
                              isCurrentMonth
                                ? isCurrentDay
                                  ? "text-blue-600 font-bold"
                                  : "text-gray-900"
                                : "text-gray-400"
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                          {isCurrentDay && (
                            <span className="text-xs text-blue-600 font-medium hidden sm:inline">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Working day toggle - Mobile optimized */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent modal from opening
                            toggleWorkingDay(day);
                          }}
                          disabled={isPastDay}
                          className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full transition-all duration-200 ${
                            isPastDay
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : dayAvailability.isWorkingDay
                              ? "bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300"
                          }`}
                          title={
                            isPastDay
                              ? "Past days cannot be modified"
                              : dayAvailability.isWorkingDay
                              ? "Click to mark as non-working day"
                              : "Click to mark as working day"
                          }
                        >
                          {dayAvailability.isWorkingDay ? (
                            <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 mx-auto" />
                          ) : (
                            <PauseIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 mx-auto" />
                          )}
                        </button>
                      </div>

                      {/* Day content - Mobile optimized with better spacing */}
                      <div className="space-y-2 sm:space-y-2.5 lg:space-y-3">
                        {isPastDay ? (
                          // Past day - show meeting history but grayed out and non-interactive
                          dayAvailability.timeSlots.some(
                            (slot: TimeSlot) => slot.isBooked
                          ) ? (
                            <div className="space-y-1.5 sm:space-y-2 lg:space-y-3 opacity-50">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                <div className="text-xs text-gray-600 font-medium truncate">
                                  {
                                    dayAvailability.timeSlots.filter(
                                      (slot: TimeSlot) => slot.isBooked
                                    ).length
                                  }{" "}
                                  past meetings
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {dayAvailability.timeSlots
                                  .filter((slot: TimeSlot) => slot.isBooked)
                                  .slice(0, 3)
                                  .map((slot: TimeSlot) => (
                                    <div
                                      key={slot.id}
                                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400 shadow-sm"
                                      title={`${
                                        slot.startTimeDisplay || slot.startTime
                                      } - ${
                                        slot.endTimeDisplay || slot.endTime
                                      } (Past meeting)`}
                                    />
                                  ))}
                                {dayAvailability.timeSlots.filter(
                                  (slot: TimeSlot) => slot.isBooked
                                ).length > 3 && (
                                  <div className="text-xs text-gray-400 font-medium">
                                    +
                                    {dayAvailability.timeSlots.filter(
                                      (slot: TimeSlot) => slot.isBooked
                                    ).length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 sm:space-y-2 lg:space-y-3 opacity-50">
                              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-400">
                                <PauseIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">Past day</span>
                              </div>
                            </div>
                          )
                        ) : !isPastDay &&
                          dayAvailability.isWorkingDay &&
                          dayAvailability.timeSlots.length > 0 &&
                          isDateInAllowedRange(day) ? (
                          // Future/current day with available slots (within allowed range)
                          <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                              <div className="text-xs text-gray-600 font-medium truncate">
                                {
                                  dayAvailability.timeSlots.filter(
                                    (slot: TimeSlot) =>
                                      slot.isAvailable && !slot.isBooked
                                  ).length
                                }{" "}
                                slots available
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-center items-center p-1">
                              {dayAvailability.timeSlots.map(
                                (slot: TimeSlot) => (
                                  <div
                                    key={slot.id}
                                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 shadow-sm ${
                                      slot.isBooked
                                        ? "bg-blue-500"
                                        : slot.isAvailable
                                        ? "bg-green-400"
                                        : "bg-gray-300"
                                    }`}
                                    title={`${slot.startTime} - ${
                                      slot.endTime
                                    } ${
                                      slot.isBooked
                                        ? "(Booked)"
                                        : slot.isAvailable
                                        ? "(Available)"
                                        : "(Unavailable)"
                                    }`}
                                  />
                                )
                              )}
                            </div>
                            {/* Booking legends for desktop */}
                            {(() => {
                              const dayBookingStats = getDayBookingStats(day);
                              if (dayBookingStats.total > 0) {
                                return (
                                  <div className="space-y-1">
                                    {dayBookingStats.confirmed +
                                      dayBookingStats.completed >
                                      0 && (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></div>
                                        <span className="text-xs text-gray-600 truncate">
                                          {dayBookingStats.confirmed +
                                            dayBookingStats.completed}{" "}
                                          meetings
                                        </span>
                                      </div>
                                    )}
                                    {dayBookingStats.pending > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                                        <span className="text-xs text-gray-600 truncate">
                                          {dayBookingStats.pending} pending
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : !isPastDay && dayAvailability.isWorkingDay ? (
                          <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-400">
                            <XCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              No slots configured
                            </span>
                          </div>
                        ) : !isPastDay &&
                          dayAvailability.isWorkingDay &&
                          dayAvailability.timeSlots.length > 0 &&
                          !isDateInAllowedRange(day) ? (
                          // Working day but outside allowed booking range
                          <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-orange-500 opacity-75">
                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              Beyond booking limit
                            </span>
                          </div>
                        ) : !isPastDay ? (
                          <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-400">
                            <PauseIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">Non-working day</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        selectedDate={selectedDate}
        availability={availability}
        workingHours={workingHours}
        toggleTimeSlot={toggleTimeSlot}
        toggleWorkingDay={toggleWorkingDay}
        onCalendarRefresh={refreshCalendarForDate}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        workingHours={workingHours}
        settings={settings}
        updateWorkingHours={updateWorkingHours}
        updateSettings={updateSettings}
        saveAvailability={saveAvailability}
        isLoading={isLoading}
      />
    </div>
  );
}
