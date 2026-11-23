// ============================================================================
// TIZGIN — Module 7: "SUV ASROVCHISI" Reward & Certificate System API (/api/rewards)
// Manages citizen points, leaderboard, and official QR-verifiable certificates.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const currentUser = await getCurrentUser();

    const leaderboard = db
      .prepare(
        `SELECT u.id, u.full_name, u.email, u.preferred_language,
                r.name_uz as region_name_uz, r.name_kaa as region_name_kaa,
                r.name_en as region_name_en, r.name_ru as region_name_ru,
                COALESCE(SUM(rw.points), 0) as total_points,
                COUNT(DISTINCT inc.id) as verified_reports
         FROM Users u
         LEFT JOIN Regions r ON u.region_id = r.id
         LEFT JOIN Rewards rw ON rw.user_id = u.id
         LEFT JOIN Incidents inc ON inc.citizen_id = u.id AND inc.status IN ('VERIFIED', 'CLOSED', 'COMPLETED')
         WHERE u.role = 'CITIZEN'
         GROUP BY u.id
         ORDER BY total_points DESC`
      )
      .all();

    const rewardsHistory = db
      .prepare(
        `SELECT rw.*, u.full_name as user_name, i.incident_number
         FROM Rewards rw
         LEFT JOIN Users u ON rw.user_id = u.id
         LEFT JOIN Incidents i ON rw.incident_id = i.id
         ORDER BY rw.id DESC`
      )
      .all();

    const certificates = db
      .prepare(
        `SELECT c.*, u.full_name as user_name, u.preferred_language,
                r.name_uz as region_name_uz,
                (SELECT COALESCE(SUM(points), 0) FROM Rewards WHERE user_id = u.id) as user_points,
                (SELECT COUNT(*) FROM Incidents WHERE citizen_id = u.id AND status IN ('VERIFIED', 'CLOSED', 'COMPLETED')) as verified_count
         FROM Certificates c
         LEFT JOIN Users u ON c.user_id = u.id
         LEFT JOIN Regions r ON u.region_id = r.id
         ORDER BY c.id DESC`
      )
      .all();

    return NextResponse.json({
      currentUser,
      leaderboard,
      rewardsHistory,
      certificates
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = await getCurrentUser();
    const targetUserId = Number(body.user_id) || currentUser?.id || 7;

    const db = getDb();

    // RULE: Certificates are NEVER issued to employees — ONLY to citizens!
    const targetUser = db.prepare("SELECT id, full_name, role FROM Users WHERE id = ?").get(targetUserId) as
      | { id: number; full_name: string; role: string }
      | undefined;

    if (!targetUser || targetUser.role !== "CITIZEN") {
      return NextResponse.json(
        { error: "Sertifikat xodimlarga berilmaydi! «SUV ASROVCHISI» sertifikati faqat murojaat yuborgan fuqarolarga taqdim etiladi." },
        { status: 403 }
      );
    }

    // Prevent reward abuse: Only generate certificate if user has at least 1 verified/completed report or points > 0
    const pointsRow = db
      .prepare("SELECT COALESCE(SUM(points), 0) as pts FROM Rewards WHERE user_id = ?")
      .get(targetUserId) as { pts: number };

    if (!pointsRow || pointsRow.pts <= 0) {
      return NextResponse.json(
        { error: "Sertifikat faqat xodim tomonidan ish bajarilib, ruxsat berilgan murojaat egalariga beriladi." },
        { status: 400 }
      );
    }

    const certNum = `SUV-2026-${Math.floor(100000 + Math.random() * 899999)}`;
    const verifyCode = `TIZGIN-QR-${targetUserId}-${Date.now().toString().slice(-5)}`;
    const issueDate = new Date().toISOString().split("T")[0];

    const info = db
      .prepare(
        `INSERT INTO Certificates (user_id, certificate_number, verification_code, issue_date, file_path)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(targetUserId, certNum, verifyCode, issueDate, `/certificates/${certNum}.pdf`);

    db.prepare(
      "INSERT INTO Notifications (user_id, title, message, notification_type) VALUES (?, ?, ?, 'CERTIFICATE_READY')"
    ).run(
      targetUserId,
      `🏅 Sizga «SUV ASROVCHISI» PDF sertifikati taqdim etildi! (#${certNum})`,
      `Murojaatingiz bo'yicha ta'mirlash ishlari muvaffaqiyatli yakunlandi. Shaxsiy kabinetingizdan yangi formatdagi rasmiy PDF sertifikatni yuklab olishingiz mumkin!`,
      "CERTIFICATE_READY"
    );

    db.prepare(
      "INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, 'CERTIFICATE_ISSUED', 'Certificate', ?, ?)"
    ).run(currentUser?.id || targetUserId, certNum, `Issued SUV ASROVCHISI certificate to citizen ${targetUser.full_name} (${verifyCode})`);

    return NextResponse.json({
      ok: true,
      certificate_id: Number(info.lastInsertRowid),
      certificate_number: certNum,
      verification_code: verifyCode,
      citizen_name: targetUser.full_name
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
