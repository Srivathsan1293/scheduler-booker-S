import { supabase } from "@/lib/supabase";

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

export class AvailabilityService {
  // Settings operations
  static async loadSettings(userId: string) {
    const { data, error } = await supabase
      .from("user_availability_settings")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  }

  static async createDefaultSettings(userId: string) {
    const defaultSettings = {
      user_id: userId,
      slot_duration_minutes: 240,
      advance_booking_days: 30,
    };

    try {
      console.log("📝 Creating default settings for user:", userId);

      // Try to insert directly first
      const { data, error } = await supabase
        .from("user_availability_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        // If insert fails due to RLS, try to get existing settings
        console.log(
          "📝 Insert failed, checking for existing settings:",
          error.message
        );
        const { data: existingData, error: selectError } = await supabase
          .from("user_availability_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (selectError) {
          console.error("📝 Error checking existing settings:", selectError);
          // Return default settings object as fallback
          return defaultSettings;
        }

        if (existingData) {
          console.log("📝 Found existing settings, using them");
          return existingData;
        }

        // If no existing data and insert failed, return default settings as fallback
        console.log(
          "📝 Insert failed but no existing data, returning defaults as fallback"
        );
        return defaultSettings;
      }

      console.log("📝 Default settings created successfully:", data);
      return data || defaultSettings;
    } catch (error) {
      console.error("📝 Error in createDefaultSettings:", error);
      // Return default settings object as fallback
      return defaultSettings;
    }
  }

  static async saveSettings(settings: UserAvailabilitySettings) {
    const { data, error } = await supabase
      .from("user_availability_settings")
      .upsert(settings)
      .select();

    if (error) throw error;
    return data;
  }

  // Working hours operations
  static async loadWorkingHours(userId: string) {
    const { data, error } = await supabase
      .from("user_working_hours")
      .select("*")
      .eq("user_id", userId)
      .order("day_of_week");

    if (error) throw error;
    return data;
  }

  static async createDefaultWorkingHours(userId: string) {
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

    try {
      console.log("📝 Creating default working hours for user:", userId);

      // Try to insert directly first
      const { data, error } = await supabase
        .from("user_working_hours")
        .insert(defaultHours.map((h) => ({ ...h, user_id: userId })))
        .select();

      if (error) {
        console.log(
          "📝 Working hours insert failed, checking for existing:",
          error.message
        );

        // If insert fails due to RLS or other issues, try to get existing working hours
        const { data: existingData, error: selectError } = await supabase
          .from("user_working_hours")
          .select("*")
          .eq("user_id", userId)
          .order("day_of_week");

        if (selectError) {
          console.error(
            "📝 Error checking existing working hours:",
            selectError
          );
          // Return default hours as fallback
          return defaultHours.map((h) => ({ ...h, user_id: userId }));
        }

        if (existingData && existingData.length > 0) {
          console.log("📝 Found existing working hours, using them");
          return existingData;
        }

        // If no existing data and insert failed, return default hours as fallback
        console.log(
          "📝 Insert failed but no existing data, returning defaults as fallback"
        );
        return defaultHours.map((h) => ({ ...h, user_id: userId }));
      }

      console.log("📝 Default working hours created successfully:", data);
      return data || defaultHours.map((h) => ({ ...h, user_id: userId }));
    } catch (error) {
      console.error("📝 Error in createDefaultWorkingHours:", error);
      // Return default hours as fallback
      return defaultHours.map((h) => ({ ...h, user_id: userId }));
    }
  }

  static async saveWorkingHours(workingHoursData: UserWorkingHour[]) {
    const { error } = await supabase
      .from("user_working_hours")
      .upsert(workingHoursData, { onConflict: "user_id,day_of_week" });

    if (error) throw error;
  }

  // Time slots operations
  static async loadTimeSlotsForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ) {
    console.log("🔍 AvailabilityService.loadTimeSlotsForDateRange called:", {
      userId,
      startDate,
      endDate,
    });

    const { data, error } = await supabase
      .from("user_time_slots")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date, start_time");

    if (error) {
      console.error("🔍 Error loading time slots:", error);
      throw error;
    }

    console.log("🔍 Time slots loaded from database:", {
      count: data?.length || 0,
      sampleSlots: data?.slice(0, 3) || [],
    });

    return data;
  }

  static async loadTimeSlotsForDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from("user_time_slots")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("start_time");

    if (error) throw error;
    return data;
  }

  static async saveTimeSlots(slotsData: UserTimeSlot[]) {
    const { error } = await supabase.from("user_time_slots").upsert(slotsData, {
      onConflict: "user_id,date,start_time,end_time",
    });

    if (error) throw error;
  }

  static async updateTimeSlot(slotData: UserTimeSlot) {
    const { error } = await supabase
      .from("user_time_slots")
      .upsert(slotData, { onConflict: "user_id,date,start_time,end_time" });

    if (error) throw error;
  }

  static async deleteTimeSlotsForDate(userId: string, date: string) {
    const { error } = await supabase
      .from("user_time_slots")
      .delete()
      .eq("user_id", userId)
      .eq("date", date);

    if (error) throw error;
  }

  static async deleteAllTimeSlots(userId: string) {
    const { error } = await supabase
      .from("user_time_slots")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  }

  // Availability exceptions operations
  static async loadExceptionsForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ) {
    console.log("🔍 AvailabilityService.loadExceptionsForDateRange called:", {
      userId,
      startDate,
      endDate,
    });

    const { data, error } = await supabase
      .from("user_availability_exceptions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("🔍 Error loading exceptions:", error);
      throw error;
    }

    console.log("🔍 Exceptions loaded from database:", {
      count: data?.length || 0,
      sampleExceptions: data?.slice(0, 3) || [],
    });

    return data;
  }

  static async loadAllExceptions(userId: string) {
    const { data, error } = await supabase
      .from("user_availability_exceptions")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  }

  static async loadExceptionForDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from("user_availability_exceptions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
    return data;
  }

  static async saveException(exception: AvailabilityException) {
    const { error } = await supabase
      .from("user_availability_exceptions")
      .upsert(exception, { onConflict: "user_id,date" });

    if (error) throw error;
  }

  static async deleteAllExceptions(userId: string) {
    const { error } = await supabase
      .from("user_availability_exceptions")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  }
}
