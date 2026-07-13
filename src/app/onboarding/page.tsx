import { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Complete Your Profile - Set Up Your Scheduling Business",
  description:
    "Finish setting up your Digvijaya Yatra Booker account. Configure your business details, working hours, and preferences to start accepting client bookings.",
  keywords: [
    "onboarding",
    "profile setup",
    "business configuration",
    "scheduling setup",
    "account completion",
    "business preferences",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Complete Your Profile - Digvijaya Yatra Booker",
    description:
      "Finish setting up your Digvijaya Yatra Booker account. Configure your business details, working hours, and preferences to start accepting client bookings.",
    url: "https://scheduler-booker.vercel.app/onboarding",
  },
  alternates: {
    canonical: "/onboarding",
  },
};

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();

  // Get user on server side
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Check if user is already onboarded
  const onboarded = Boolean(user?.user_metadata?.onboarded);

  if (onboarded) {
    console.log(
      "🔍 Onboarding: User already onboarded, redirecting to dashboard"
    );
    redirect("/dashboard");
  }

  console.log("🔍 Onboarding: User not onboarded, showing onboarding form");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="mx-auto max-w-7xl py-10 px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[80vh]">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
