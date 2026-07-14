"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

interface NavbarProps {
  isAuthed: boolean;
  isSuperAdmin: boolean;
}

export default function Navbar({ isAuthed, isSuperAdmin }: NavbarProps) {
  const pathname = usePathname();

  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/onboarding");

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link
              href={isAuthed ? "/dashboard" : "/"}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-400/40">
                <CalendarDaysIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
                Digvijaya Yatra Booker
              </span>
            </Link>
            {!isAuthRoute && isAuthed && (
              <div className="ml-8 hidden md:flex items-center space-x-1">
                <Link
                  href="/dashboard"
                  className={`text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
                    pathname === "/dashboard"
                      ? "bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 ring-1 ring-transparent hover:ring-gray-200"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/availability"
                  className={`text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
                    pathname === "/dashboard/availability"
                      ? "bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 ring-1 ring-transparent hover:ring-gray-200"
                  }`}
                >
                  Availability
                </Link>
                {isSuperAdmin ? (
                  <Link
                    href="/dashboard/users"
                    className={`text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
                      pathname === "/dashboard/users"
                        ? "bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 ring-1 ring-transparent hover:ring-gray-200"
                    }`}
                  >
                    Users
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthed ? (
              !isAuthRoute ? (
                <>
                  <LogoutButton />
                </>
              ) : null
            ) : (
              !isAuthRoute && (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
