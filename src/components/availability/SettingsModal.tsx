"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel } from "@headlessui/react";
import AvailabilitySettings, {
  type AvailabilitySettingsProps,
} from "./AvailabilitySettings";

interface SettingsModalProps extends AvailabilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  ...availabilitySettingsProps
}: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header - Mobile responsive */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 bg-white rounded-t-xl sm:rounded-t-2xl">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Availability Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content - Mobile responsive padding with scroll */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <AvailabilitySettings {...availabilitySettingsProps} />
          </div>

          {/* Footer - Mobile responsive */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-6 border-t border-gray-200 bg-white rounded-b-xl sm:rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
