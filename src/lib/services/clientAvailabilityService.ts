export interface AvailabilityException {
  id?: string;
  user_id: string;
  date: string;
  is_available: boolean;
  reason?: string;
}

export interface UserTimeSlot {
  id?: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked?: boolean;
}

export interface TimeSlotForAPI {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface UserWorkingHour {
  id?: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export interface UserAvailabilitySettings {
  id?: string;
  user_id: string;
  slot_duration_minutes: number;
  advance_booking_days: number;
}

export class ClientAvailabilityService {
  // Settings operations
  static async loadSettings() {
    const response = await fetch("/api/availability/settings");
    if (!response.ok) {
      throw new Error("Failed to load settings");
    }
    const data = await response.json();
    return data.settings;
  }

  static async createDefaultSettings() {
    try {
      const defaultSettings = {
        slot_duration_minutes: 240,
        advance_booking_days: 30,
      };

      const response = await fetch("/api/availability/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: defaultSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save default settings");
      }

      return defaultSettings;
    } catch (error) {
      console.error("Failed to create default settings:", error);
      throw error;
    }
  }

  static async saveSettings(
    settings: Omit<UserAvailabilitySettings, "user_id">
  ) {
    try {
      const response = await fetch("/api/availability/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  }

  // Working hours operations
  static async loadWorkingHours() {
    const response = await fetch("/api/availability/working-hours");
    if (!response.ok) {
      throw new Error("Failed to load working hours");
    }
    const data = await response.json();
    return data.workingHours;
  }

  static async createDefaultWorkingHours() {
    try {
      const defaultHours = [
        {
          day_of_week: 1,
          start_time: "09:00",
          end_time: "17:00",
          is_working: true,
        }, // Monday
        {
          day_of_week: 2,
          start_time: "09:00",
          end_time: "17:00",
          is_working: true,
        }, // Tuesday
        {
          day_of_week: 3,
          start_time: "09:00",
          end_time: "17:00",
          is_working: true,
        }, // Wednesday
        {
          day_of_week: 4,
          start_time: "09:00",
          end_time: "17:00",
          is_working: true,
        }, // Thursday
        {
          day_of_week: 5,
          start_time: "09:00",
          end_time: "17:00",
          is_working: true,
        }, // Friday
        {
          day_of_week: 6,
          start_time: "10:00",
          end_time: "15:00",
          is_working: false,
        }, // Saturday
        {
          day_of_week: 0,
          start_time: "10:00",
          end_time: "15:00",
          is_working: false,
        }, // Sunday
      ];

      // Save each working hour to the database
      for (const hour of defaultHours) {
        await this.saveWorkingHours([hour]);
      }

      return defaultHours;
    } catch (error) {
      console.error("Failed to create default working hours:", error);
      throw error;
    }
  }

  static async saveWorkingHours(
    workingHoursData: Omit<UserWorkingHour, "user_id">[]
  ) {
    try {
      const response = await fetch("/api/availability/working-hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workingHours: workingHoursData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save working hours");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to save working hours:", error);
      throw error;
    }
  }

  // Time slots operations
  static async loadTimeSlotsForDateRange(startDate: string, endDate: string) {
    const response = await fetch(
      `/api/availability/days?startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) {
      throw new Error("Failed to load time slots for date range");
    }
    const data = await response.json();
    return data;
  }

  static async loadTimeSlotsForDate(date: string) {
    const response = await fetch(
      `/api/availability/days?startDate=${date}&endDate=${date}`
    );
    if (!response.ok) {
      throw new Error("Failed to load time slots for date");
    }
    const data = await response.json();
    return data.timeSlots || [];
  }

  static async saveTimeSlots(date: string, slotsData: TimeSlotForAPI[]) {
    try {
      console.log("🔄 saveTimeSlots called with:", { date, slotsData });

      if (slotsData.length === 0) {
        console.log("⚠️ No slots to save, returning early");
        return;
      }

      console.log("📅 Saving slots for date:", date);
      console.log("🔍 Debug - slotsData received:", slotsData);
      console.log("🔍 Debug - First slot received:", slotsData[0]);
      console.log(
        "🔍 Debug - First slot start_time:",
        slotsData[0]?.start_time
      );
      console.log("🔍 Debug - First slot end_time:", slotsData[0]?.end_time);

      const response = await fetch("/api/availability/time-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          timeSlots: slotsData,
        }),
      });

      console.log("📡 API response status:", response.status);
      console.log(
        "📡 API request body sent:",
        JSON.stringify(
          {
            date,
            timeSlots: slotsData,
          },
          null,
          2
        )
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error response:", errorData);
        throw new Error(
          errorData.error || `Failed to save time slots: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("✅ saveTimeSlots successful:", result);
      return result;
    } catch (error) {
      console.error("❌ saveTimeSlots failed:", error);
      throw error;
    }
  }

  static async updateTimeSlot(slotData: Omit<UserTimeSlot, "user_id">) {
    try {
      console.log("🔄 updateTimeSlot called with:", slotData);
      console.log("🔄 Request body will be:", {
        date: slotData.date,
        start_time: slotData.start_time,
        end_time: slotData.end_time,
        is_available: slotData.is_available,
      });

      const response = await fetch("/api/availability/time-slots", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: slotData.date,
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          is_available: slotData.is_available,
        }),
      });

      console.log("🔄 API response status:", response.status);
      const responseData = await response.json();
      console.log("🔄 API response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update time slot");
      }

      console.log("✅ updateTimeSlot successful");
      return responseData;
    } catch (error) {
      console.error("❌ updateTimeSlot failed:", error);
      throw error;
    }
  }

  static async deleteTimeSlotsForDate(date: string) {
    const response = await fetch("/api/availability/time-slots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        timeSlots: [],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete time slots for date");
    }
  }

  static async deleteAllTimeSlots() {
    // This would need a separate API endpoint
    console.log("deleteAllTimeSlots not implemented yet");
  }

  // Availability exceptions operations
  static async loadExceptionsForDateRange(startDate: string, endDate: string) {
    const response = await fetch(
      `/api/availability/days?startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) {
      throw new Error("Failed to load exceptions for date range");
    }
    const data = await response.json();
    return data.exceptions || [];
  }

  static async loadAllExceptions() {
    // This would need a separate API endpoint
    console.log("loadAllExceptions not implemented yet");
    return [];
  }

  static async loadExceptionForDate(date: string) {
    const response = await fetch(
      `/api/availability/days?startDate=${date}&endDate=${date}`
    );
    if (!response.ok) {
      throw new Error("Failed to load exception for date");
    }
    const data = await response.json();
    return data.exceptions?.[0] || null;
  }

  static async saveException(
    exception: Omit<AvailabilityException, "user_id">
  ) {
    const response = await fetch("/api/availability/exceptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: exception.date,
        isAvailable: exception.is_available,
        reason: exception.reason,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save exception");
    }
  }

  static async deleteAllExceptions() {
    // This would need a separate API endpoint
    console.log("deleteAllExceptions not implemented yet");
  }
}
