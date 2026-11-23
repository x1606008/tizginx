// ============================================================================
// TIZGIN — Authentication & RBAC Quick-Switch API (/api/auth)
// Supports Login, Registration, Logout, Profile Updates & One-Click Demo Switch
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb, hashPassword, verifyPassword } from "@/lib/db";
import { COOKIE_NAME, getCurrentUser, signToken } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const currentUser = await getCurrentUser();
    // Strictly expose 1 Citizen test account and 1 Employee test account (plus optional Admin/Manager if requested, but default primary two)
    const demoAccounts = db
      .prepare(
        `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.preferred_language, u.region_id, r.name_uz as region_name
         FROM Users u
         LEFT JOIN Regions r ON u.region_id = r.id
         WHERE u.email IN ('citizen@tizgin.uz', 'employee@tizgin.uz')
         ORDER BY CASE u.role
           WHEN 'CITIZEN' THEN 1
           WHEN 'EMPLOYEE' THEN 2
         END ASC`
      )
      .all();

    return NextResponse.json({
      user: currentUser,
      demoAccounts
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = getDb();

    // 1. Logout
    if (action === "logout") {
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(COOKIE_NAME);
      return res;
    }

    // 2. Quick-switch role / demo account for seamless judge & developer testing
    if (action === "quick_switch") {
      const { userId, email } = body;
      const user = userId
        ? (db.prepare("SELECT * FROM Users WHERE id = ?").get(Number(userId)) as Record<string, unknown> | undefined)
        : (db.prepare("SELECT * FROM Users WHERE email = ?").get(String(email)) as Record<string, unknown> | undefined);

      if (!user) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      const token = signToken({
        userId: Number(user.id),
        role: String(user.role),
        email: String(user.email)
      });

      db.prepare("INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)").run(
        Number(user.id),
        "AUTH_QUICK_SWITCH",
        "User",
        String(user.id),
        `Switched active session to ${user.email} (${user.role})`
      );

      const res = NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          preferred_language: user.preferred_language,
          region_id: user.region_id
        }
      });

      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60
      });
      return res;
    }

    // 3. Standard Login
    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }
      const user = db
        .prepare("SELECT * FROM Users WHERE LOWER(email) = LOWER(?)")
        .get(String(email).trim()) as Record<string, unknown> | undefined;

      if (!user || !verifyPassword(String(password), String(user.password_hash))) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const token = signToken({
        userId: Number(user.id),
        role: String(user.role),
        email: String(user.email)
      });

      db.prepare("INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)").run(
        Number(user.id),
        "USER_LOGIN",
        "User",
        String(user.id),
        `User logged in (${user.role})`
      );

      const res = NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          preferred_language: user.preferred_language,
          region_id: user.region_id
        }
      });

      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60
      });
      return res;
    }

    // 4. Citizen Registration
    if (action === "register") {
      const { full_name, email, phone, password, preferred_language, region_id } = body;
      if (!full_name || !email || !phone || !password) {
        return NextResponse.json({ error: "All required registration fields must be filled" }, { status: 400 });
      }

      const existing = db.prepare("SELECT id FROM Users WHERE LOWER(email) = LOWER(?)").get(String(email).trim());
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      const pwHash = hashPassword(String(password));
      const lang = preferred_language || "uz";
      const regId = region_id ? Number(region_id) : 1;

      const info = db
        .prepare(
          `INSERT INTO Users (full_name, email, phone, password_hash, role, preferred_language, region_id)
           VALUES (?, ?, ?, ?, 'CITIZEN', ?, ?)`
        )
        .run(String(full_name).trim(), String(email).trim(), String(phone).trim(), pwHash, lang, regId);

      const newUserId = Number(info.lastInsertRowid);

      db.prepare(
        "INSERT INTO Notifications (user_id, title, message, notification_type) VALUES (?, ?, ?, ?)"
      ).run(
        newUserId,
        "TIZGIN platformasiga xush kelibsiz!",
        "Endi siz ichimlik suvi isrofi va quvur avariyalari haqida rasm hamda GPS orqali xabar berib, «SUV ASROVCHISI» ballarini to'plashingiz mumkin.",
        "WELCOME"
      );

      db.prepare("INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)").run(
        newUserId,
        "CITIZEN_REGISTERED",
        "User",
        String(newUserId),
        `Registered citizen account: ${email}`
      );

      const token = signToken({
        userId: newUserId,
        role: "CITIZEN",
        email: String(email).trim()
      });

      const res = NextResponse.json({
        ok: true,
        user: {
          id: newUserId,
          full_name,
          email,
          phone,
          role: "CITIZEN",
          preferred_language: lang,
          region_id: regId
        }
      });

      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60
      });
      return res;
    }

    // 5. Update user language or notification preferences
    if (action === "update_preferences") {
      const currentUser = await getCurrentUser();
      const targetUserId = currentUser?.id || Number(body.userId) || 7;
      const { preferred_language, notify_in_app, notify_email, notify_telegram } = body;

      if (preferred_language) {
        db.prepare("UPDATE Users SET preferred_language = ?, updated_at = datetime('now') WHERE id = ?").run(
          String(preferred_language),
          targetUserId
        );
      }
      if (notify_in_app !== undefined) {
        db.prepare(
          "UPDATE Users SET notify_in_app = ?, notify_email = ?, notify_telegram = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(notify_in_app ? 1 : 0, notify_email ? 1 : 0, notify_telegram ? 1 : 0, targetUserId);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
