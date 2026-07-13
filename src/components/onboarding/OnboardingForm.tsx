"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HydrationSafeInput } from "@/components/common/HydrationSafeElement";
import TimePicker from "../availability/TimePicker";

const userTypeSchema = z.object({
  userType: z.enum(["business", "individual"]),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  timezone: z.string().min(1, "Please select a timezone"),
});

const availabilitySchema = z.object({
  workDays: z.array(z.string()).min(1, "Please select at least one work day"),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  timeSlotDuration: z.union([z.literal(240), z.literal(480)]),
  timeFormat12h: z.boolean(),
});

type UserTypeData = z.infer<typeof userTypeSchema>;
type AvailabilityData = z.infer<typeof availabilitySchema>;

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const workDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export default function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<
    Partial<UserTypeData & AvailabilityData>
  >({});

  const userTypeForm = useForm<UserTypeData>({
    resolver: zodResolver(userTypeSchema),
  });

  const availabilityForm = useForm<AvailabilityData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      timeSlotDuration: 240,
      timeFormat12h: true, // Default to 12-hour format
    },
  });

  const onUserTypeSubmit = async (data: UserTypeData) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  const onAvailabilitySubmit = async (data: AvailabilityData) => {
    setIsLoading(true);
    try {
      // Combine all form data
      const allFormData = { ...formData, ...data };

      // Save onboarding data to database via API
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(allFormData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error saving onboarding data:", result.error);
        // You might want to show an error message to the user here
        return;
      }

      // Redirect to dashboard on success
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkDayToggle = (day: string) => {
    const currentDays = availabilityForm.getValues("workDays");
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    availabilityForm.setValue("workDays", newDays);
  };

  if (step === 1) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 bg-white/70 backdrop-blur ring-1 ring-gray-200/60 rounded-2xl shadow-lg">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to Digvijaya Yatra Booker!
            </span>
          </h2>
          <p className="text-gray-700 text-center">
            Let&apos;s get you set up in just a few steps.
          </p>
        </div>

        <form
          onSubmit={userTypeForm.handleSubmit(onUserTypeSubmit)}
          className="space-y-6"
        >
          <div>
            <label className="block text-lg font-medium text-gray-800 mb-4">
              Are you setting up scheduling for a business or yourself?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => userTypeForm.setValue("userType", "business")}
                className={`p-6 border-2 rounded-xl text-left transition-all duration-200 ease-out cursor-pointer shadow-sm hover:shadow-md ${
                  userTypeForm.watch("userType") === "business"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="font-semibold text-lg text-gray-900 mb-2">
                  🏢 Business
                </div>
                <div className="text-gray-800">
                  I&apos;m setting up scheduling for my business or organization
                </div>
              </button>

              <button
                type="button"
                onClick={() => userTypeForm.setValue("userType", "individual")}
                className={`p-6 border-2 rounded-xl text-left transition-all duration-200 ease-out cursor-pointer shadow-sm hover:shadow-md ${
                  userTypeForm.watch("userType") === "individual"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="font-semibold text-lg text-gray-900 mb-2">
                  👤 Individual
                </div>
                <div className="text-gray-800">
                  I&apos;m setting up scheduling for myself
                </div>
              </button>
            </div>
            {userTypeForm.formState.errors.userType && (
              <p className="mt-2 text-sm text-red-600">
                {userTypeForm.formState.errors.userType.message}
              </p>
            )}
          </div>

          {userTypeForm.watch("userType") === "business" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-800 mb-1"
                >
                  Business Name
                </label>
                <HydrationSafeInput
                  {...userTypeForm.register("businessName")}
                  type="text"
                  id="businessName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label
                  htmlFor="businessType"
                  className="block text-sm font-medium text-gray-800 mb-1"
                >
                  Business Type
                </label>
                <select
                  {...userTypeForm.register("businessType")}
                  id="businessType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm"
                >
                  <option value="">Select business type</option>
                  <option value="consulting">Consulting</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="legal">Legal</option>
                  <option value="beauty">Beauty & Wellness</option>
                  <option value="education">Education</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              {userTypeForm.watch("userType") === "business"
                ? "Your Name"
                : "Full Name"}
            </label>
            <HydrationSafeInput
              {...userTypeForm.register("name")}
              type="text"
              id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm"
              placeholder="Enter your full name"
            />
            {userTypeForm.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {userTypeForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Timezone
            </label>
            <select
              {...userTypeForm.register("timezone")}
              id="timezone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm"
            >
              <option value="">Select your timezone</option>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </option>
              ))}
            </select>
            {userTypeForm.formState.errors.timezone && (
              <p className="mt-1 text-sm text-red-600">
                {userTypeForm.formState.errors.timezone.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-all duration-200 ease-out cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            Continue to Availability Setup
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white/70 backdrop-blur ring-1 ring-gray-200/60 rounded-2xl shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Set Your Availability
          </span>
        </h2>
        <p className="text-gray-700 text-center">
          Configure when you&apos;re available for appointments
        </p>
      </div>

      <form
        onSubmit={availabilityForm.handleSubmit(onAvailabilitySubmit)}
        className="space-y-6"
      >
        <div>
          <label className="block text-lg font-medium text-gray-800 mb-4">
            Which days are you available?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleWorkDayToggle(day.value)}
                className={`p-3 border-2 rounded-xl transition-all duration-200 ease-out cursor-pointer shadow-sm hover:shadow-md ${
                  availabilityForm.watch("workDays").includes(day.value)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          {availabilityForm.formState.errors.workDays && (
            <p className="mt-2 text-sm text-red-600">
              {availabilityForm.formState.errors.workDays.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-3">
            Time Format Preference
          </label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => availabilityForm.setValue("timeFormat12h", true)}
              className={`p-3 border-2 rounded-xl text-left transition-all duration-200 ease-out cursor-pointer shadow-sm hover:shadow-md ${
                availabilityForm.watch("timeFormat12h") === true
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">🕐 12-Hour</div>
              <div className="text-gray-600 text-xs">9:00 AM - 5:00 PM</div>
            </button>

            <button
              type="button"
              onClick={() => availabilityForm.setValue("timeFormat12h", false)}
              className={`p-3 border-2 rounded-xl text-left transition-all duration-200 ease-out cursor-pointer shadow-sm hover:shadow-md ${
                availabilityForm.watch("timeFormat12h") === false
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">🕘 24-Hour</div>
              <div className="text-gray-600 text-xs">09:00 - 17:00</div>
            </button>
          </div>
          {availabilityForm.formState.errors.timeFormat12h && (
            <p className="mt-2 text-sm text-red-600">
              {availabilityForm.formState.errors.timeFormat12h.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Start Time
            </label>
            <Controller
              name="startTime"
              control={availabilityForm.control}
              render={({ field }) => (
                <TimePicker
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select start time"
                  use12HourFormat={availabilityForm.watch("timeFormat12h")}
                />
              )}
            />
            {availabilityForm.formState.errors.startTime && (
              <p className="mt-1 text-sm text-red-600">
                {availabilityForm.formState.errors.startTime.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              End Time
            </label>
            <Controller
              name="endTime"
              control={availabilityForm.control}
              render={({ field }) => (
                <TimePicker
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select end time"
                  use12HourFormat={availabilityForm.watch("timeFormat12h")}
                />
              )}
            />
            {availabilityForm.formState.errors.endTime && (
              <p className="mt-1 text-sm text-red-600">
                {availabilityForm.formState.errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="timeSlotDuration"
            className="block text-sm font-medium text-gray-800 mb-1"
          >
            Appointment Duration (minutes)
          </label>
          <select
            {...availabilityForm.register("timeSlotDuration", {
              valueAsNumber: true,
            })}
            id="timeSlotDuration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm"
          >
            <option value={240}>4 hours</option>
            <option value={480}>8 hours</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-medium transition-all duration-200 ease-out cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 ease-out cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            {isLoading ? "Setting up..." : "Complete Setup"}
          </button>
        </div>
      </form>
    </div>
  );
}
