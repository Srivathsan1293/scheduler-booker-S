import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load settings for the authenticated user
    const { data, error } = await supabase
      .from("user_availability_settings")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "availability/settings/GET", type: "server" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: "Missing settings data" },
        { status: 400 }
      );
    }

    if (![240, 480].includes(settings.slot_duration_minutes)) {
      return NextResponse.json(
        { error: "Invalid slot duration" },
        { status: 400 }
      );
    }

    // Check if settings already exist for this user
    const { data: existingSettings } = await supabase
      .from("user_availability_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const nextSettings = {
      slot_duration_minutes: settings.slot_duration_minutes,
      advance_booking_days: settings.advance_booking_days,
    };

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from("user_availability_settings")
        .update(nextSettings)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from("user_availability_settings")
        .insert({
          user_id: user.id,
          ...nextSettings,
        });

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "availability/settings/POST", type: "server" },
    });
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
