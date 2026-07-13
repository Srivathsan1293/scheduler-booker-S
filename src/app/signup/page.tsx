import { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";
import { UserPlusIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Create Account - Start Your Professional Scheduling Journey",
  description:
    "Join thousands of professionals using Digvijaya Yatra Booker to streamline their appointment scheduling. Create your account and start managing availability in minutes.",
  keywords: [
    "sign up",
    "create account",
    "professional scheduling",
    "appointment booking system",
    "consultant calendar",
    "service provider registration",
    "business scheduling tool",
  ],
  openGraph: {
    title: "Create Account - Digvijaya Yatra Booker",
    description:
      "Join thousands of professionals using Digvijaya Yatra Booker to streamline their appointment scheduling. Create your account and start managing availability in minutes.",
    url: "https://scheduler-booker.vercel.app/signup",
  },
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <UserPlusIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join thousands of professionals managing their schedules efficiently
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <SignupForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
