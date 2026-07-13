"use client";

import { useState } from "react";
import type {
  AvailabilitySettings as AvailabilitySettingsType,
  WorkingHours,
} from "@/lib/types/availability";
import TimePicker from "./TimePicker";
import TimeFormatToggle from "../settings/TimeFormatToggle";
import { useTimeFormatPreference } from "@/lib/utils/clientTimeFormat";

export interface AvailabilitySettingsProps {
  workingHours: WorkingHours[];
  settings: AvailabilitySettingsType;
  updateWorkingHours: (
    index: number,
    field: keyof WorkingHours,
    value: string | boolean
  ) => void;
  updateSettings: (updates: Partial<AvailabilitySettingsType>) => void;
  saveAvailability: () => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
}

export default function AvailabilitySettings({
  workingHours,
  settings,
  updateWorkingHours,
  updateSettings,
  saveAvailability,
  isLoading,
}: AvailabilitySettingsProps) {

  // Get the current time format preference directly
  const { is24Hour } = useTimeFormatPreference();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const selectedSlotDuration =
    settings.slotDuration === 240 || settings.slotDuration === 480
      ? settings.slotDuration
      : 240;

  const toggleWorkingDay = (index: number) => {
    updateWorkingHours(index, "isWorking", !workingHours[index].isWorking);

    // Auto-save when working hours change (only if not loading)
    if (!isLoading) {
      setTimeout(() => {
        saveAvailability();
      }, 100);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await saveAvailability();
      if (result.success) {
        setSaveMessage({
          type: "success",
          text: "Settings saved successfully!",
        });
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({
          type: "error",
          text: `Failed to save settings: ${result.message || "Unknown error"}`,
        });
      }
    } catch {
      setSaveMessage({
        type: "error",
        text: "An unexpected error occurred while saving settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-800 text-sm">
              Loading availability settings...
            </span>
          </div>
        </div>
      )}

      {/* Default Working Hours */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Default Working Hours
        </h3>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
          {workingHours.map((hours, index) => (
            <div
              key={hours.day}
              className={`p-3 rounded-lg border transition-all ${
                hours.isWorking
                  ? "bg-white border-green-200 shadow-sm"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
              <div className="block sm:flex sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-20 sm:w-24">
                    <span
                      className={`text-sm font-medium ${
                        hours.isWorking ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {hours.day}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleWorkingDay(index)}
                    disabled={isLoading}
                    className={`relative w-10 h-6 rounded-full transition-all duration-300 focus:outline-none  ${
                      hours.isWorking ? "bg-green-500" : "bg-gray-300"
                    } ${
                      isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:shadow-md"
                    }`}
                    title={
                      isLoading
                        ? "Loading..."
                        : hours.isWorking
                        ? "Working day"
                        : "Non-working day"
                    }
                  >
                    {/* Toggle indicator */}
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                        hours.isWorking ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {hours.isWorking && (
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-2">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-none">
                        <TimePicker
                          value={hours.startTime}
                          onChange={(time) =>
                            updateWorkingHours(index, "startTime", time)
                          }
                          placeholder="Start time"
                          disabled={isLoading}
                          use12HourFormat={!is24Hour}
                        />
                      </div>
                      <span className="text-gray-500 text-sm font-medium flex-shrink-0">
                        to
                      </span>
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <TimePicker
                        value={hours.endTime}
                        onChange={(time) =>
                          updateWorkingHours(index, "endTime", time)
                        }
                        placeholder="End time"
                        disabled={isLoading}
                        use12HourFormat={!is24Hour}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Slot Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Time Slot Settings
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slot Duration
            </label>
            <select
              value={selectedSlotDuration}
              onChange={(e) =>
                updateSettings({ slotDuration: Number(e.target.value) })
              }
              disabled={isLoading}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Display Settings
        </h3>
        <TimeFormatToggle />
      </div>

      {/* Booking Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Booking Settings
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Advance Booking (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.advanceBookingDays}
            onChange={(e) =>
              updateSettings({ advanceBookingDays: Number(e.target.value) })
            }
            disabled={isLoading}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            How many days in advance clients can book appointments
          </p>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`p-3 rounded-md ${
            saveMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving || isLoading}
          className={`w-full py-2 px-4 rounded-md focus:ring-2 focus:ring-offset-2 transition-colors ${
            isSaving || isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          } text-white`}
        >
          {isSaving ? "Saving..." : isLoading ? "Loading..." : "Save Settings"}
        </button>
        {isLoading && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Please wait while we load your settings...
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors bg-white border border-gray-200">
            Copy this week&apos;s schedule to next week
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors bg-white border border-gray-200">
            Set as default for all future weeks
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors bg-white border border-gray-200">
            Import schedule from calendar
          </button>
        </div>
      </div>
    </div>
  );
}
