import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { TimeSlotUtils } from "@/lib/utils/timeSlotUtils";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    console.log("🔍 Debug data for user:", userId);

    // Get current month data
    const currentDate = new Date();
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const startDateKey = TimeSlotUtils.formatDateKey(monthStart);
    const endDateKey = TimeSlotUtils.formatDateKey(monthEnd);

    console.log("🔍 Date range:", { startDateKey, endDateKey });

    // Get all data for the current month
    const [settings, workingHours, exceptions, timeSlots] = await Promise.all([
      supabase
        .from("user_availability_settings")
        .select("*")
        .eq("user_id", userId),
      supabase
        .from("user_working_hours")
        .select("*")
        .eq("user_id", userId)
        .order("day_of_week"),
      supabase
        .from("user_availability_exceptions")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDateKey)
        .lte("date", endDateKey),
      supabase
        .from("user_time_slots")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDateKey)
        .lte("date", endDateKey)
        .order("date, start_time"),
    ]);

    // Check for errors
    if (settings.error) console.error("Settings error:", settings.error);
    if (workingHours.error)
      console.error("Working hours error:", workingHours.error);
    if (exceptions.error) console.error("Exceptions error:", exceptions.error);
    if (timeSlots.error) console.error("Time slots error:", timeSlots.error);

    return NextResponse.json({
      success: true,
      userId,
      dateRange: { startDateKey, endDateKey },
      data: {
        settings: {
          count: settings.data?.length || 0,
          data: settings.data || [],
          error: settings.error?.message || null,
        },
        workingHours: {
          count: workingHours.data?.length || 0,
          data: workingHours.data || [],
          error: workingHours.error?.message || null,
        },
        exceptions: {
          count: exceptions.data?.length || 0,
          data: exceptions.data || [],
          error: exceptions.error?.message || null,
        },
        timeSlots: {
          count: timeSlots.data?.length || 0,
          data: timeSlots.data || [],
          error: timeSlots.error?.message || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug data error:", error);
    return NextResponse.json(
      { error: "Failed to get debug data", details: error },
      { status: 500 }
    );
  }
}
