import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getPublicAvailableDatesInRange } from "@/lib/services/publicAvailability";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const availableDates = await getPublicAvailableDatesInRange(
      supabase,
      userId,
      startDate,
      endDate
    );

    return NextResponse.json({ availableDates });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "availability/public-dates/GET", type: "server" },
    });
    console.error("Error in public available dates:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}