import { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import React from "react";

export const metadata: Metadata = {
  title: "Booking Details - View & Manage Appointment",
  description:
    "View detailed information about your appointment booking including client details, time slots, and notes. Manage and edit booking information.",
  keywords: [
    "booking details",
    "appointment management",
    "client information",
    "booking view",
    "appointment details",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Booking Details - Digvijaya Yatra Booker",
    description:
      "View detailed information about your appointment booking including client details, time slots, and notes.",
    url: "https://scheduler-booker.vercel.app/bookings",
  },
  alternates: {
    canonical: "/bookings",
  },
};

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createSupabaseServerClient();
  // Get user on server side
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="mx-auto max-w-4xl py-10 px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Bookings", href: "/dashboard/bookings" },
              { label: "Booking Details" },
            ]}
          />
          <div className="rounded-2xl bg-white/70 p-8 backdrop-blur ring-1 ring-gray-200/60 shadow-lg text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Not Found
            </h1>
            <p className="text-gray-600">
              The booking you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to view it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (bookingError) {
    console.error("Booking fetch error:", bookingError);
    redirect("/dashboard/bookings");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="mx-auto max-w-4xl py-10 px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Bookings", href: "/dashboard/bookings" },
            { label: "Booking Details" },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white/70 p-8 backdrop-blur ring-1 ring-gray-200/60 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Booking Details
            </span>
          </h1>
          <p className="mt-2 text-gray-700">
            View and manage appointment information for your client.
          </p>
        </div>

        {/* Booking Information */}
        <div className="mb-8 rounded-2xl bg-white/70 p-6 backdrop-blur ring-1 ring-gray-200/60 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            Appointment Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-lg text-gray-900">{booking.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-lg text-gray-900">
                    {booking.start_time} - {booking.end_time}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Client Name
                  </p>
                  <p className="text-lg text-gray-900">{booking.client_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg text-gray-900">
                    {booking.client_email}
                  </p>
                </div>
              </div>

              {booking.client_phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-lg text-gray-900">
                      {booking.client_phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Notes
                  </p>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {booking.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Booking Form */}
        <div className="rounded-2xl bg-white/70 p-6 backdrop-blur ring-1 ring-gray-200/60 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            Edit Booking Information
          </h2>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="client_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Client Name
                </label>
                <input
                  id="client_name"
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Enter client name"
                  defaultValue={booking.client_name || ""}
                />
              </div>

              <div>
                <label
                  htmlFor="client_email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Client Email
                </label>
                <input
                  id="client_email"
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Enter client email"
                  defaultValue={booking.client_email || ""}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder-gray-500"
                placeholder="Add any additional notes..."
                defaultValue={booking.notes || ""}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
