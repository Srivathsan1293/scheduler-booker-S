import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Create default availability settings
    const defaultSettings = {
      user_id: userId,
      slot_duration_minutes: 240,
      advance_booking_days: 30,
    };

    console.log("📝 Creating default settings for user:", userId);

    // First check if settings already exist
    const { data: existingSettings } = await supabase
      .from("user_availability_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let settingsData;
    if (existingSettings) {
      console.log("📝 Settings already exist, updating them");
      const { data, error } = await supabase
        .from("user_availability_settings")
        .update(defaultSettings)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("📝 Error updating settings:", error);
        return NextResponse.json(
          { message: "Error updating settings", error: error.message },
          { status: 500 }
        );
      }
      settingsData = data;
    } else {
      console.log("📝 Creating new settings");
      const { data, error } = await supabase
        .from("user_availability_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error("📝 Error creating settings:", error);
        return NextResponse.json(
          { message: "Error creating settings", error: error.message },
          { status: 500 }
        );
      }
      settingsData = data;
    }

    // Create default working hours
    const defaultWorkingHours = [
      {
        user_id: userId,
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
        is_working: true,
      }, // Monday
      {
        user_id: userId,
        day_of_week: 2,
        start_time: "09:00",
        end_time: "17:00",
        is_working: true,
      }, // Tuesday
      {
        user_id: userId,
        day_of_week: 3,
        start_time: "09:00",
        end_time: "17:00",
        is_working: true,
      }, // Wednesday
      {
        user_id: userId,
        day_of_week: 4,
        start_time: "09:00",
        end_time: "17:00",
        is_working: true,
      }, // Thursday
      {
        user_id: userId,
        day_of_week: 5,
        start_time: "09:00",
        end_time: "17:00",
        is_working: true,
      }, // Friday
      {
        user_id: userId,
        day_of_week: 6,
        start_time: "10:00",
        end_time: "15:00",
        is_working: false,
      }, // Saturday
      {
        user_id: userId,
        day_of_week: 0,
        start_time: "10:00",
        end_time: "15:00",
        is_working: false,
      }, // Sunday
    ];

    console.log("📝 Creating default working hours for user:", userId);
    const { data: workingHoursData, error: workingHoursError } = await supabase
      .from("user_working_hours")
      .upsert(defaultWorkingHours, { onConflict: "user_id,day_of_week" })
      .select();

    if (workingHoursError) {
      console.error("📝 Error creating working hours:", workingHoursError);
      return NextResponse.json(
        {
          message: "Error creating working hours",
          error: workingHoursError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Successfully created defaults for user:", userId);

    return NextResponse.json({
      message: "Default availability settings created successfully",
      userId,
      settings: settingsData,
      workingHours: workingHoursData,
    });
  } catch (error) {
    console.error("Error in populate defaults:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
