import PublicBookingForm from "@/components/bookings/PublicBookingForm";

interface PublicBookingPageProps {
  params: Promise<{ userId: string }>;
}

export default async function PublicBookingPage({
  params,
}: PublicBookingPageProps) {
  const { userId } = await params;

  // For now, always show the booking form and let it handle availability checking
  // This avoids RLS issues and provides better UX
  const hasAvailability = true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="mx-auto max-w-4xl py-10 px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white/70 p-8 backdrop-blur ring-1 ring-gray-200/60 shadow-lg text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Book an Appointment
            </span>
          </h1>

          <p className="text-gray-600">
            Select a date and time that works for you, and we&apos;ll confirm
            your appointment.
          </p>
        </div>

        {/* Public Booking Form or Setup Message */}
        <div className="rounded-2xl bg-white/70 p-6 backdrop-blur ring-1 ring-gray-200/60 shadow-lg">
          {hasAvailability ? (
            <PublicBookingForm userId={userId} />
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Availability Not Set Up
              </h3>
              <p className="text-gray-600 mb-4">
                This user hasn&apos;t configured their availability settings
                yet. Please check back later or contact them directly.
              </p>
              <div className="text-sm text-gray-500">
                <p>Powered by Digvijaya Yatra Booker</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
