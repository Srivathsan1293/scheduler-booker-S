import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getCurrentUserProfile, isSuperAdmin } from "@/lib/auth/roles";
import { listUserManagementData, UserManagementError } from "@/lib/auth/user-management";

export async function GET() {
  try {
    const { user, profile } = await getCurrentUserProfile();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!profile || !isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await listUserManagementData();

    return NextResponse.json(data);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "admin/users/GET", type: "server" },
    });

    if (error instanceof UserManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}