import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { getCurrentUserProfile, isSuperAdmin } from "@/lib/auth/roles";
import {
  createVolunteerInvite,
  resendVolunteerInvite,
  revokeVolunteerInvite,
  UserManagementError,
} from "@/lib/auth/user-management";

const inviteSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

const inviteActionSchema = z.object({
  inviteId: z.string().uuid("Please provide a valid invite id."),
  action: z.enum(["resend", "revoke"]),
});

async function requireAdminRequest() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  if (!profile || !isSuperAdmin(profile.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }

  return { error: null, user };
}

export async function POST(request: Request) {
  try {
    const adminRequest = await requireAdminRequest();

    if (adminRequest.error || !adminRequest.user) {
      return adminRequest.error;
    }

    const parsed = inviteSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }

    const origin =
      new URL(request.url).origin ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";
    const result = await createVolunteerInvite({
      email: parsed.data.email,
      invitedBy: adminRequest.user.id,
      origin,
    });

    return NextResponse.json({
      success: true,
      invite: result.invite,
      invitePath: result.invitePath,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "admin/invites/POST", type: "server" },
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

export async function PATCH(request: Request) {
  try {
    const adminRequest = await requireAdminRequest();

    if (adminRequest.error) {
      return adminRequest.error;
    }

    const parsed = inviteActionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }

    if (parsed.data.action === "revoke") {
      const invite = await revokeVolunteerInvite({
        inviteId: parsed.data.inviteId,
      });

      return NextResponse.json({ success: true, invite });
    }

    const origin =
      new URL(request.url).origin ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";
    const result = await resendVolunteerInvite({
      inviteId: parsed.data.inviteId,
      origin,
    });

    return NextResponse.json({
      success: true,
      invite: result.invite,
      invitePath: result.invitePath,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "admin/invites/PATCH", type: "server" },
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