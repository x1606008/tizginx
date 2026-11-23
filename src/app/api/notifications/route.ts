// ============================================================================
// TIZGIN — Module 8: Notification Center API (/api/notifications)
// Supports In-App, Email, and Telegram Notification Preferences & Read States.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");
    const targetUserId = userIdParam ? Number(userIdParam) : currentUser?.id;

    const notifications = targetUserId
      ? db
          .prepare("SELECT * FROM Notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50")
          .all(targetUserId)
      : db.prepare("SELECT * FROM Notifications ORDER BY id DESC LIMIT 50").all();

    return NextResponse.json({ notifications });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const currentUser = await getCurrentUser();

    if (body.mark_all_read) {
      const uid = currentUser?.id || Number(body.user_id) || 7;
      db.prepare("UPDATE Notifications SET is_read = 1 WHERE user_id = ?").run(uid);
      return NextResponse.json({ ok: true });
    }

    if (body.notification_id) {
      db.prepare("UPDATE Notifications SET is_read = 1 WHERE id = ?").run(Number(body.notification_id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
