import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Booking,
  WorkingHours as WorkingHoursType,
  AvailabilitySettings as AvailabilitySettingsType,
  TimeSlot as TimeSlotType,
} from "../types/availability";
import * as Sentry from "@sentry/nextjs";

// Additional types for mutations
interface CreateBooking {
  timeSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
}

interface CreatePublicBooking {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
}

interface Login {
  email: string;
  password: string;
}

interface Signup {
  email: string;
  password: string;
}

interface Onboarding {
  businessName: string;
  businessType: string;
  timeZone: string;
  slotDuration: number;
  advanceBookingDays: number;
  workingHours: Array<{
    day: string;
    startTime: string;
    endTime: string;
    isWorking: boolean;
  }>;
}

interface AvailabilitySettings {
  slot_duration: number;
  advance_booking_days: number;
  timezone: string;
}

interface WorkingHours {
  workingHours: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_working: boolean;
  }>;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Exception {
  date: string;
  is_working_day: boolean;
  reason?: string;
}

interface PublicAvailableDatesResponse {
  availableDates: string[];
}

// Query Keys
export const queryKeys = {
  bookings: ["bookings"] as const,
  availability: {
    workingHours: ["availability", "workingHours"] as const,
    settings: ["availability", "settings"] as const,
    dayDetails: (date: string) => ["availability", "dayDetails", date] as const,
    exceptions: ["availability", "exceptions"] as const,
  },
  auth: {
    check: ["auth", "check"] as const,
    user: ["auth", "user"] as const,
  },
  user: {
    timeFormat: ["user", "timeFormat"] as const,
    onboarding: ["user", "onboarding"] as const,
  },
} as const;

// API Functions
const api = {
  // Bookings
  async fetchBookings(): Promise<{ bookings: Booking[] }> {
    try {
      const response = await fetch("/api/bookings");
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchBookings", type: "client" },
      });
      throw error;
    }
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      const response = await fetch(`/api/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update booking status");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "updateBookingStatus", type: "client" },
      });
      throw error;
    }
  },

  // Availability
  async fetchWorkingHours(): Promise<WorkingHoursType[]> {
    try {
      const response = await fetch("/api/availability/working-hours");
      if (!response.ok) {
        throw new Error("Failed to fetch working hours");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchWorkingHours", type: "client" },
      });
      throw error;
    }
  },

  async fetchAvailabilitySettings(): Promise<AvailabilitySettingsType> {
    try {
      const response = await fetch("/api/availability/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch availability settings");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchAvailabilitySettings", type: "client" },
      });
      throw error;
    }
  },

  async fetchDayDetails(date: string): Promise<{
    bookings: Booking[];
    timeSlots: TimeSlotType[];
  }> {
    try {
      const response = await fetch(`/api/availability/day-details?date=${date}`);
      if (!response.ok) {
        throw new Error("Failed to fetch day details");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchDayDetails", type: "client" },
      });
      throw error;
    }
  },

  async fetchAvailabilityExceptions(): Promise<
    Record<string, { isWorkingDay: boolean; reason?: string }>
  > {
    try {
      const response = await fetch("/api/availability/exceptions");
      if (!response.ok) {
        throw new Error("Failed to fetch availability exceptions");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchAvailabilityExceptions", type: "client" },
      });
      throw error;
    }
  },

  // Auth
  async checkAuth(): Promise<{ isAuthenticated: boolean }> {
    const response = await fetch("/api/auth/check");
    if (!response.ok) {
      return { isAuthenticated: false };
    }
    return { isAuthenticated: true };
  },

  async checkOnboarding(): Promise<{ isOnboarded: boolean }> {
    const response = await fetch("/api/user/onboarding");
    if (!response.ok) {
      return { isOnboarded: false };
    }
    const data = await response.json();
    return { isOnboarded: data.isOnboarded };
  },

  // Day availability for booking forms
  async fetchDayAvailability(date: string): Promise<{
    timeSlots: TimeSlotType[];
    isWorkingDay: boolean;
  }> {
    try {
      const response = await fetch(`/api/availability/day-details?date=${date}`);
      if (!response.ok) {
        throw new Error("Failed to fetch day availability");
      }
      const data = await response.json();
      return {
        timeSlots: data.timeSlots || [],
        isWorkingDay: data.isWorkingDay || false,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchDayAvailability", type: "client" },
      });
      throw error;
    }
  },

  async fetchPublicDayAvailability(
    date: string,
    userId: string
  ): Promise<{
    timeSlots: TimeSlotType[];
    isWorkingDay: boolean;
  }> {
    try {
      const response = await fetch(
        `/api/availability/public?date=${date}&userId=${userId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch public day availability");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchPublicDayAvailability", type: "client" },
      });
      throw error;
    }
  },

  async fetchPublicAvailableDates(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<PublicAvailableDatesResponse> {
    try {
      const response = await fetch(
        `/api/availability/public-dates?userId=${encodeURIComponent(
          userId
        )}&startDate=${encodeURIComponent(
          startDate
        )}&endDate=${encodeURIComponent(endDate)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch public available dates");
      }

      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchPublicAvailableDates", type: "client" },
      });
      throw error;
    }
  },

  // User preferences
  async fetchTimeFormat(): Promise<{ time_format_12h: boolean }> {
    try {
      const response = await fetch("/api/user/time-format");
      if (!response.ok) {
        throw new Error("Failed to fetch time format preference");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchTimeFormat", type: "client" },
      });
      throw error;
    }
  },

  async updateTimeFormat(is12Hour: boolean): Promise<void> {
    try {
      const response = await fetch("/api/user/time-format", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time_format_12h: is12Hour }),
      });
      if (!response.ok) {
        throw new Error("Failed to update time format preference");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "updateTimeFormat", type: "client" },
      });
      throw error;
    }
  },

  // Mutation API functions
  // Bookings
  async createBooking(
    data: CreateBooking
  ): Promise<{ success: boolean; bookingId: string }> {
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "createBooking", type: "client" },
      });
      throw error;
    }
  },

  async createPublicBooking(
    data: CreatePublicBooking
  ): Promise<{ message: string; booking: Booking; accessToken: string }> {
    try {
      const response = await fetch("/api/bookings/public-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create public booking");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "createPublicBooking", type: "client" },
      });
      throw error;
    }
  },

  async deleteBooking(bookingId: string): Promise<void> {
    try {
      const response = await fetch(`/api/bookings?bookingId=${bookingId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete booking");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "deleteBooking", type: "client" },
      });
      throw error;
    }
  },

  // Auth
  async login(data: Login): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to login");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "login", type: "client" },
      });
      throw error;
    }
  },

  async signup(data: Signup): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sign up");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "signup", type: "client" },
      });
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to logout");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "logout", type: "client" },
      });
      throw error;
    }
  },

  // Onboarding
  async completeOnboarding(data: Onboarding): Promise<{ success: boolean }> {
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete onboarding");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "completeOnboarding", type: "client" },
      });
      throw error;
    }
  },

  // Availability Settings
  async updateAvailabilitySettings(data: AvailabilitySettings): Promise<void> {
    try {
      const response = await fetch("/api/availability/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update availability settings"
        );
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "updateAvailabilitySettings", type: "client" },
      });
      throw error;
    }
  },

  // Working Hours
  async updateWorkingHours(data: WorkingHours): Promise<void> {
    try {
      const response = await fetch("/api/availability/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update working hours");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "updateWorkingHours", type: "client" },
      });
      throw error;
    }
  },

  // Time Slots
  async createTimeSlots(data: {
    date: string;
    slots: TimeSlot[];
  }): Promise<void> {
    try {
      const response = await fetch("/api/availability/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create time slots");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "createTimeSlots", type: "client" },
      });
      throw error;
    }
  },

  async updateTimeSlot(data: TimeSlot): Promise<void> {
    try {
      const response = await fetch("/api/availability/time-slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update time slot");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "updateTimeSlot", type: "client" },
      });
      throw error;
    }
  },

  async deleteTimeSlotsForDate(date: string): Promise<void> {
    try {
      const response = await fetch("/api/availability/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, action: "delete" }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete time slots");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "deleteTimeSlotsForDate", type: "client" },
      });
      throw error;
    }
  },

  // Exceptions
  async saveException(data: Exception): Promise<void> {
    try {
      const response = await fetch("/api/availability/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save exception");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "saveException", type: "client" },
      });
      throw error;
    }
  },

  // Public Booking Access by Token
  async fetchBookingByToken(token: string): Promise<{ booking: Booking }> {
    try {
      const response = await fetch(`/api/bookings/public-view?token=${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch booking");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "fetchBookingByToken", type: "client" },
      });
      throw error;
    }
  },

  async updateBookingByToken(data: {
    token: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    notes?: string;
  }): Promise<{ message: string; booking: Booking }> {
    try {
      const response = await fetch("/api/bookings/public-view", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update booking");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "updateBookingByToken", type: "client" },
      });
      throw error;
    }
  },

  async cancelBookingByToken(token: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`/api/bookings/public-view?token=${token}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel booking");
      }
      return response.json();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "cancelBookingByToken", type: "client" },
      });
      throw error;
    }
  },
};

// Custom Query Hooks

// Bookings
export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: api.fetchBookings,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: string;
    }) => api.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

// Availability
export function useWorkingHours() {
  return useQuery({
    queryKey: queryKeys.availability.workingHours,
    queryFn: api.fetchWorkingHours,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAvailabilitySettings() {
  return useQuery({
    queryKey: queryKeys.availability.settings,
    queryFn: api.fetchAvailabilitySettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDayDetails(date: string | null) {
  return useQuery({
    queryKey: queryKeys.availability.dayDetails(date || ""),
    queryFn: () => api.fetchDayDetails(date!),
    enabled: !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAvailabilityExceptions() {
  return useQuery({
    queryKey: queryKeys.availability.exceptions,
    queryFn: api.fetchAvailabilityExceptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Auth
export function useAuthCheck() {
  return useQuery({
    queryKey: queryKeys.auth.check,
    queryFn: api.checkAuth,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false, // Don't retry auth failures
  });
}

export function useOnboardingCheck() {
  return useQuery({
    queryKey: queryKeys.user.onboarding,
    queryFn: api.checkOnboarding,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// User preferences
export function useTimeFormat() {
  return useQuery({
    queryKey: queryKeys.user.timeFormat,
    queryFn: api.fetchTimeFormat,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateTimeFormat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (is12Hour: boolean) => api.updateTimeFormat(is12Hour),
    onSuccess: () => {
      // Update the cache immediately
      const currentData = queryClient.getQueryData(
        queryKeys.user.timeFormat
      ) as { time_format_12h: boolean } | undefined;
      queryClient.setQueryData(queryKeys.user.timeFormat, {
        time_format_12h: !currentData?.time_format_12h,
      });
      // Also invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: queryKeys.user.timeFormat });
    },
  });
}

// Day availability for booking forms
export function useDayAvailability(date: string | null) {
  return useQuery({
    queryKey: ["availability", "day", date],
    queryFn: () => api.fetchDayAvailability(date!),
    enabled: !!date,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePublicDayAvailability(
  date: string | null,
  userId: string | null
) {
  return useQuery({
    queryKey: ["availability", "public", "day", date, userId],
    queryFn: () => api.fetchPublicDayAvailability(date!, userId!),
    enabled: !!date && !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePublicAvailableDates(
  userId: string | null,
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: [
      "availability",
      "public",
      "dates",
      userId,
      startDate,
      endDate,
    ],
    queryFn: () => api.fetchPublicAvailableDates(userId!, startDate!, endDate!),
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 30 * 1000,
  });
}

// Custom Mutation Hooks

// Booking Mutations
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBooking) => api.createBooking(data),
    onSuccess: () => {
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      // Also invalidate day availability since bookings affect availability
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useCreatePublicBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePublicBooking) => api.createPublicBooking(data),
    onSuccess: (_, variables) => {
      // Invalidate public day availability for the specific date and user
      queryClient.invalidateQueries({
        queryKey: [
          "availability",
          "public",
          "day",
          variables.date,
          variables.userId,
        ],
      });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => api.deleteBooking(bookingId),
    onSuccess: () => {
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      // Also invalidate day availability since bookings affect availability
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

// Auth Mutations
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Login) => api.login(data),
    onSuccess: () => {
      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.check });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.onboarding });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Signup) => api.signup(data),
    onSuccess: () => {
      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.check });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.onboarding });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
}

// Onboarding Mutation
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Onboarding) => api.completeOnboarding(data),
    onSuccess: () => {
      // Invalidate onboarding status
      queryClient.invalidateQueries({ queryKey: queryKeys.user.onboarding });
      // Invalidate availability settings and working hours since onboarding sets them up
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.settings,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.workingHours,
      });
    },
  });
}

// Availability Settings Mutation
export function useUpdateAvailabilitySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AvailabilitySettings) =>
      api.updateAvailabilitySettings(data),
    onSuccess: () => {
      // Invalidate availability settings
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.settings,
      });
    },
  });
}

// Working Hours Mutation
export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WorkingHours) => api.updateWorkingHours(data),
    onSuccess: () => {
      // Invalidate working hours
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.workingHours,
      });
      // Also invalidate day availability since working hours affect it
      queryClient.invalidateQueries({ queryKey: ["availability", "day"] });
    },
  });
}

// Time Slot Mutations
export function useCreateTimeSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { date: string; slots: TimeSlot[] }) =>
      api.createTimeSlots(data),
    onSuccess: (_, variables) => {
      // Invalidate day details and availability for the specific date
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.dayDetails(variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: ["availability", "day", variables.date],
      });
    },
  });
}

export function useUpdateTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TimeSlot) => api.updateTimeSlot(data),
    onSuccess: (_, variables) => {
      // Invalidate day details and availability for the specific date
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.dayDetails(variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: ["availability", "day", variables.date],
      });
    },
  });
}

export function useDeleteTimeSlotsForDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => api.deleteTimeSlotsForDate(date),
    onSuccess: (_, date) => {
      // Invalidate day details and availability for the specific date
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.dayDetails(date),
      });
      queryClient.invalidateQueries({
        queryKey: ["availability", "day", date],
      });
    },
  });
}

// Exception Mutation
export function useSaveException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Exception) => api.saveException(data),
    onSuccess: (_, variables) => {
      // Invalidate availability exceptions
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.exceptions,
      });
      // Also invalidate day details and availability for the specific date
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.dayDetails(variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: ["availability", "day", variables.date],
      });
    },
  });
}

// Rebook Mutation - deletes old booking and creates new one
export function useRebookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      oldBookingId: string;
      newBooking: CreateBooking;
    }) => {
      // First create the new booking
      const newBooking = await api.createBooking(data.newBooking);
      // Then delete the old booking
      await api.deleteBooking(data.oldBookingId);
      return newBooking;
    },
    onSuccess: () => {
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      // Also invalidate day availability since bookings affect availability
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

// Public Booking Access by Token (no auth required)
export function useBookingByToken(token: string | null) {
  return useQuery({
    queryKey: ["booking", "token", token],
    queryFn: () => api.fetchBookingByToken(token!),
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once for token-based access
  });
}

export function useUpdateBookingByToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      token: string;
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      notes?: string;
    }) => api.updateBookingByToken(data),
    onSuccess: (_, variables) => {
      // Invalidate the specific booking query
      queryClient.invalidateQueries({
        queryKey: ["booking", "token", variables.token],
      });
    },
    onError: (error) => {
      Sentry.captureException(error);
    },
  });
}

export function useCancelBookingByToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => api.cancelBookingByToken(token),
    onSuccess: (_, token) => {
      // Invalidate the specific booking query to show updated status
      queryClient.invalidateQueries({
        queryKey: ["booking", "token", token],
      });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { type: "public-booking-cancel" },
      });
    },
  });
}
