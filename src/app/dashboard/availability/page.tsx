import { Metadata } from "next";
import { redirect } from "next/navigation";
import AvailabilityCalendar from "@/components/availability/AvailabilityCalendar";
import { AvailabilityManager } from "@/lib/managers/availabilityManager";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Manage Availability - Set Your Working Hours & Time Slots",
  description:
    "Configure your working hours, set availability, and manage time slots for client bookings. Customize your schedule to match your business needs.",
  keywords: [
    "availability management",
    "working hours",
    "time slots",
    "schedule configuration",
    "business hours",
    "appointment availability",
    "calendar settings",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Manage Availability - Digvijaya Yatra Booker",
    description:
      "Configure your working hours, set availability, and manage time slots for client bookings. Customize your schedule to match your business needs.",
    url: "https://scheduler-booker.vercel.app/dashboard/availability",
  },
  alternates: {
    canonical: "/dashboard/availability",
  },
};

export default async function AvailabilityPage() {
  const supabase = await createSupabaseServerClient();

  // Get user on server side
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("🔍 Availability: User check:", {
    hasUser: !!user,
    userId: user?.id,
    hasError: !!userError,
    timestamp: new Date().toISOString(),
    path: "/dashboard/availability",
  });

  if (userError || !user) {
    console.log("🔍 Availability: No user, redirecting to login");
    redirect("/login");
  }

  console.log("🔍 Availability: User authenticated, loading availability data");
  console.log("🔍 Availability: Loading data for current month:", {
    currentDate: new Date().toISOString(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
  });

  // Load availability data on the server
  const availabilityResult = await AvailabilityManager.loadAvailabilityData(
    user.id,
    true
  );

  console.log("🔍 Availability: AvailabilityManager result:", {
    success: availabilityResult.success,
    hasData: "data" in availabilityResult,
    error: "error" in availabilityResult ? availabilityResult.error : null,
    dataKeys:
      availabilityResult.success && "data" in availabilityResult
        ? Object.keys(availabilityResult.data)
        : null,
  });

  if (!availabilityResult.success) {
    const errorMessage =
      "error" in availabilityResult
        ? availabilityResult.error
        : "Unknown error";
    console.error("🔍 Availability: AvailabilityManager failed:", errorMessage);
    throw new Error(`Failed to load availability data: ${errorMessage}`);
  }

  if (!("data" in availabilityResult) || !availabilityResult.data) {
    console.error("🔍 Availability: No data in result:", availabilityResult);
    throw new Error("Availability data is missing from result");
  }

  const { workingHours, settings, availability } = availabilityResult.data;

  console.log("🔍 Availability: Data being passed to calendar:", {
    workingHoursLength: workingHours?.length,
    settings: settings,
    availabilityKeys: Object.keys(availability || {}).length,
    userId: user.id,
    sampleWorkingHours: workingHours?.slice(0, 2),
    sampleAvailability: Object.entries(availability || {}).slice(0, 2),
    workingHoursData: workingHours,
    availabilityData: availability,
  });

  // Validate that we have the required data
  if (!workingHours || workingHours.length === 0) {
    console.error("🔍 Availability: No working hours data");
    throw new Error("Working hours data is missing");
  }

  if (!settings) {
    console.error("🔍 Availability: No settings data");
    throw new Error("Settings data is missing");
  }

  if (!availability || Object.keys(availability).length === 0) {
    console.warn(
      "🔍 Availability: No availability data - calendar will be empty initially"
    );
  } else {
    console.log("🔍 Availability: Found availability data:", {
      totalDays: Object.keys(availability).length,
      workingDays: Object.values(availability).filter((day) => day.isWorkingDay)
        .length,
      daysWithSlots: Object.values(availability).filter(
        (day) => day.timeSlots.length > 0
      ).length,
      sampleDay: Object.values(availability).find(
        (day) => day.timeSlots.length > 0
      ),
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="mx-auto max-w-7xl py-10 px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Availability" },
          ]}
        />
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Manage your availability
            </h1>
            <p className="mt-1 text-gray-700">
              Set working hours and time slots clients can book.
            </p>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="rounded-2xl bg-white/70 p-6 shadow-lg ring-1 ring-gray-200/60 backdrop-blur">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Calendar</h2>
          <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
            <AvailabilityCalendar />
          </div>
        </div>
      </div>
    </div>
  );
}
