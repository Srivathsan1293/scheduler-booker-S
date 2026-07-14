import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDaysIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  UsersIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { requireAuthenticatedProfile, isSuperAdmin } from "@/lib/auth/roles";
import ShareBookingButton from "@/components/dashboard/ShareBookingButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Dashboard - Manage Your Appointments & Availability",
  description:
    "Access your Digvijaya Yatra Booker dashboard to manage appointments, set availability, and streamline your professional scheduling. Everything you need in one place.",
  keywords: [
    "scheduling dashboard",
    "appointment management",
    "availability settings",
    "professional calendar",
    "booking management",
    "client appointments",
    "schedule overview",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Dashboard - Digvijaya Yatra Booker",
    description:
      "Access your Digvijaya Yatra Booker dashboard to manage appointments, set availability, and streamline your professional scheduling.",
    url: "https://scheduler-booker.vercel.app/dashboard",
  },
  alternates: {
    canonical: "/dashboard",
  },
};

export default async function DashboardPage() {
  const { user, profile } = await requireAuthenticatedProfile();
  const showAdminCard = isSuperAdmin(profile.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="mx-auto max-w-7xl py-10 px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        {/* Hero */}
        <div className="mb-8 rounded-2xl bg-white/70 p-8 backdrop-blur ring-1 ring-gray-200/60 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome to your dashboard
                </span>
              </h1>
              <p className="mt-2 text-gray-700">
                Manage availability, share your booking link, and keep track of
                appointments.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/availability"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <CalendarDaysIcon className="h-5 w-5" /> Manage availability
              </Link>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${showAdminCard ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          <Link
            href="/dashboard/availability"
            className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-600/10 p-3 ring-1 ring-blue-200">
                <CalendarDaysIcon className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Manage Availability
                </h3>
                <p className="mt-1 text-sm text-blue-700/90">
                  Update working hours and time slots.
                </p>
              </div>
            </div>
            <ArrowRightIcon className="absolute right-4 top-4 h-5 w-5 text-blue-600/60 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/dashboard/bookings"
            className="group relative overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-green-600/10 p-3 ring-1 ring-green-200">
                <UsersIcon className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Book Appointments
                </h3>
                <p className="mt-1 text-sm text-green-700/90">
                  Create new bookings and manage appointments.
                </p>
              </div>
            </div>
            <ArrowRightIcon className="absolute right-4 top-4 h-5 w-5 text-green-600/60 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/dashboard/appointments"
            className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-600/10 p-3 ring-1 ring-blue-200">
                <CalendarDaysIcon className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  View Appointments
                </h3>
                <p className="mt-1 text-sm text-blue-700/90">
                  Manage pending, confirmed, and completed appointments.
                </p>
              </div>
            </div>
            <ArrowRightIcon className="absolute right-4 top-4 h-5 w-5 text-blue-600/60 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <ShareBookingButton userId={user.id} />

          {showAdminCard ? (
            <Link
              href="/dashboard/users"
              className="group relative overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-b from-cyan-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-cyan-600/10 p-3 ring-1 ring-cyan-200">
                  <ShieldCheckIcon className="h-6 w-6 text-cyan-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Users
                  </h3>
                  <p className="mt-1 text-sm text-cyan-700/90">
                    Invite volunteers and monitor roles.
                  </p>
                </div>
              </div>
              <ArrowRightIcon className="absolute right-4 top-4 h-5 w-5 text-cyan-600/60 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>

        {/* Next steps */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-amber-700" />
            <h3 className="text-lg font-semibold text-amber-900">Next steps</h3>
          </div>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 text-amber-700" />
              Customize your booking page
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 text-amber-700" />
              Set up payment integration
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 text-amber-700" />
              Configure email notifications
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 text-amber-700" />
              Add team members (if applicable)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
