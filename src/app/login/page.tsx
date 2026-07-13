import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In - Access Your Scheduling Dashboard",
  description:
    "Sign in to your Digvijaya Yatra Booker account to manage your appointments, availability, and client bookings. Secure authentication for professionals.",
  keywords: [
    "login",
    "sign in",
    "scheduling dashboard",
    "appointment management",
    "professional login",
    "booking system access",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Sign In - Digvijaya Yatra Booker",
    description:
      "Sign in to your Digvijaya Yatra Booker account to manage your appointments, availability, and client bookings.",
    url: "https://scheduler-booker.vercel.app/login",
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your account to continue managing your schedule
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
