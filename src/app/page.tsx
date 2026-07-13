import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Intelligent Appointment Scheduling & Booking Platform",
  description:
    "Streamline your appointment booking with our intelligent scheduling platform. Manage availability, automate bookings, and focus on what matters most. Perfect for professionals, consultants, and service providers.",
  keywords: [
    "appointment scheduling",
    "online booking",
    "calendar management",
    "availability management",
    "time slot booking",
    "professional scheduling",
    "consultant calendar",
    "service provider booking",
    "automated scheduling",
    "client booking system",
    "business scheduling",
    "meeting scheduler",
  ],
  openGraph: {
    title:
      "Digvijaya Yatra Booker - Intelligent Appointment Scheduling & Booking Platform",
    description:
      "Streamline your appointment booking with our intelligent scheduling platform. Manage availability, automate bookings, and focus on what matters most.",
    url: "https://scheduler-booker.vercel.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Digvijaya Yatra Booker - Professional Appointment Scheduling Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Digvijaya Yatra Booker - Intelligent Appointment Scheduling & Booking Platform",
    description:
      "Streamline your appointment booking with our intelligent scheduling platform. Manage availability, automate bookings, and focus on what matters most.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  // Check authentication on server side for better performance
  // Handle auth errors gracefully (invalid/expired tokens)
  try {
    const supabase = await createSupabaseServerClient();

    // First check if there's a valid session (fast, local check)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    // Only proceed if we have a valid session without errors
    if (sessionData.session && !sessionError) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // User is authenticated, check if they need onboarding
        const onboarded = Boolean(user.user_metadata?.onboarded);

        if (onboarded) {
          // User is fully set up, redirect to dashboard
          redirect("/dashboard");
        } else {
          // User needs to complete onboarding
          redirect("/onboarding");
        }
      }
    }
  } catch {
    // Invalid tokens - continue to render landing page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Simplify Your
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}
              Scheduling
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto px-4">
            Streamline your appointment booking with our intelligent scheduling
            platform. Manage availability, automate bookings, and focus on what
            matters most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto sm:max-w-none">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base sm:text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl active:scale-95"
            >
              Get Started
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 sm:py-3 border-2 border-gray-300 text-gray-700 text-base sm:text-lg font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center">
              <CalendarDaysIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Digvijaya Yatra Booker
            </span>
          </div>
          <p className="text-sm mb-4">
            © {new Date().getFullYear()} Digvijaya Yatra Booker. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a
              href="mailto:luizavalos40@gmail.com"
              className="hover:text-white transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
