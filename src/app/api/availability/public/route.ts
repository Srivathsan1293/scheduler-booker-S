import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  buildPublicDayAvailability,
  createPublicAvailabilityContext,
} from "@/lib/services/publicAvailability";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");

  try {
    if (!date || !userId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const context = await createPublicAvailabilityContext(
      supabase,
      userId,
      date,
      date
    );

    return NextResponse.json(
      buildPublicDayAvailability(date, userId, context)
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "availability/public/GET", type: "server" },
    });
    console.error("Error in public availability:", error);
    console.error("Request params:", { date, userId });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
