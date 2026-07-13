// Test configuration for automated testing
export const TEST_CONFIG = {
  user: {
    email: process.env.TEST_USER_EMAIL || "example@example.com",
    password: process.env.TEST_USER_PASSWORD || "password1234",
    name: "Test User",
  },
  business: {
    name: "Test Business",
    type: "consulting",
  },
  onboarding: {
    userType: "business" as const,
    timezone: "America/New_York",
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: "09:00",
    endTime: "17:00",
    timeSlotDuration: 240,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};
