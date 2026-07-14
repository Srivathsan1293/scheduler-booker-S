import Breadcrumbs from "@/components/ui/Breadcrumbs";
import UserManagementScreen from "@/components/admin/UserManagementScreen";
import { requireSuperAdminPage } from "@/lib/auth/roles";

export default async function UserManagementPage() {
  await requireSuperAdminPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "User Management" },
          ]}
        />

        <div className="mb-8 rounded-2xl bg-white/70 p-8 backdrop-blur ring-1 ring-gray-200/60 shadow-lg">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              User management
            </span>
          </h1>
          <p className="mt-2 text-gray-700">
            Manage volunteers, monitor onboarding status, and send invite links from a single admin surface.
          </p>
        </div>

        <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-gray-200/60 shadow-lg">
          <UserManagementScreen />
        </div>
      </div>
    </div>
  );
}