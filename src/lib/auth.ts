// ============================================================================
// TIZGIN — Authentication, JWT Session Management & Role-Based Access Control
// ============================================================================

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

const SECRET = process.env.JWT_SECRET || "tizgin-super-secret-municipal-water-platform-key-2026";
export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "tizgin_session";

export type UserRole = "CITIZEN" | "EMPLOYEE" | "MANAGER" | "ADMIN";

export interface SessionUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  preferred_language: string;
  region_id: number | null;
  notify_in_app?: number;
  notify_email?: number;
  notify_telegram?: number;
}

export function signToken(payload: { userId: number; role: string; email: string }): string {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken(token: string): { userId: number; role: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
    if (signature !== expectedSig) return null;
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(COOKIE_NAME);
    const db = getDb();

    if (tokenCookie?.value) {
      const verified = verifyToken(tokenCookie.value);
      if (verified) {
        const user = db
          .prepare(
            "SELECT id, full_name, email, phone, role, preferred_language, region_id, notify_in_app, notify_email, notify_telegram FROM Users WHERE id = ?"
          )
          .get(verified.userId) as SessionUser | undefined;
        if (user) return user;
      }
    }
    return null;
  } catch {
    return null;
  }
}
