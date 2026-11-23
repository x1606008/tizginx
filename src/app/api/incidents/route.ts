// ============================================================================
// TIZGIN — Incidents & Repair Lifecycle Management API (/api/incidents)
// Modules 1, 2, 3, 4: Citizen Reporting, Duplicate Detection, Live Map Privacy,
// Full Lifecycle (REPORTED -> RECEIVED -> ASSIGNED -> INSPECTION -> REPAIRING -> COMPLETED -> VERIFIED -> CLOSED),
// Deadline Accountability & Overdue Escalation, Immutable Audit Trail.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb, runInTransaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Haversine formula to detect duplicate reports within 150 meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const categoryFilter = searchParams.get("category");
    const regionFilter = searchParams.get("region_id");
    const search = searchParams.get("q");

    const isStaff = currentUser && ["EMPLOYEE", "MANAGER", "ADMIN"].includes(currentUser.role);

    const rows = db
      .prepare(
        `SELECT
          i.*,
          u.full_name as citizen_name,
          u.phone as citizen_phone,
          u.email as citizen_email,
          e.full_name as employee_name,
          e.phone as employee_phone,
          d.name as department_name,
          d.region_id as region_id,
          r.name_uz as region_name_uz,
          r.name_kaa as region_name_kaa,
          r.name_en as region_name_en,
          r.name_ru as region_name_ru
        FROM Incidents i
        LEFT JOIN Users u ON i.citizen_id = u.id
        LEFT JOIN Users e ON i.assigned_employee_id = e.id
        LEFT JOIN Departments d ON i.department_id = d.id
        LEFT JOIN Regions r ON d.region_id = r.id
        ORDER BY i.id DESC`
      )
      .all() as Array<Record<string, unknown>>;

    const allMedia = db.prepare("SELECT * FROM IncidentMedia ORDER BY id ASC").all() as Array<Record<string, unknown>>;
    const allHistory = db
      .prepare(
        `SELECT h.*, u.full_name as changed_by_name, u.role as changed_by_role
         FROM IncidentHistory h
         LEFT JOIN Users u ON h.changed_by = u.id
         ORDER BY h.id ASC`
      )
      .all() as Array<Record<string, unknown>>;

    const nowMs = Date.now();

    let enriched = rows.map((row) => {
      const incId = Number(row.id);
      const media = allMedia.filter((m) => Number(m.incident_id) === incId);
      const history = allHistory.filter((h) => Number(h.incident_id) === incId);

      const isResolved = ["COMPLETED", "VERIFIED", "CLOSED", "REJECTED"].includes(String(row.status));
      let isOverdue = false;
      let hoursRemaining: number | null = null;

      if (row.estimated_completion && !isResolved) {
        const deadlineMs = new Date(String(row.estimated_completion)).getTime();
        if (!isNaN(deadlineMs)) {
          hoursRemaining = Math.round(((deadlineMs - nowMs) / (1000 * 60 * 60)) * 10) / 10;
          if (deadlineMs < nowMs) {
            isOverdue = true;
          }
        }
      }

      // Privacy Protection (Module 2 & Section 10):
      // Never expose citizen phone/email publicly unless user is staff or the reporter themselves
      const canSeePrivateContact = isStaff || (currentUser && currentUser.id === Number(row.citizen_id));

      return {
        ...row,
        citizen_phone: canSeePrivateContact ? row.citizen_phone : "Maxfiy (Protected)",
        citizen_email: canSeePrivateContact ? row.citizen_email : "protected@tizgin.uz",
        is_overdue: isOverdue,
        hours_remaining: hoursRemaining,
        ai_analysis: row.ai_analysis_json ? JSON.parse(String(row.ai_analysis_json)) : null,
        media,
        history
      };
    });

    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "OVERDUE") {
        enriched = enriched.filter((i) => i.is_overdue);
      } else {
        enriched = enriched.filter((i) => i.status === statusFilter);
      }
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      enriched = enriched.filter((i) => i.category === categoryFilter);
    }

    if (regionFilter && regionFilter !== "ALL") {
      enriched = enriched.filter((i) => String(i.region_id) === String(regionFilter));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(
        (i) =>
          String(i.incident_number).toLowerCase().includes(q) ||
          String(i.address).toLowerCase().includes(q) ||
          String(i.description).toLowerCase().includes(q)
      );
    }

    const regions = db.prepare("SELECT * FROM Regions ORDER BY id ASC").all();
    const departments = db.prepare("SELECT * FROM Departments ORDER BY id ASC").all();
    const employees = db
      .prepare("SELECT id, full_name, email, phone, role, region_id FROM Users WHERE role IN ('EMPLOYEE', 'MANAGER') ORDER BY id ASC")
      .all();

    return NextResponse.json({
      incidents: enriched,
      regions,
      departments,
      employees
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = await getCurrentUser();
    const citizenId = currentUser?.id || Number(body.citizen_id) || 7;

    const {
      category,
      description,
      latitude,
      longitude,
      address,
      region_id,
      priority,
      photo_url,
      ai_analysis
    } = body;

    if (!category || !description || latitude === undefined || longitude === undefined || !address) {
      return NextResponse.json({ error: "Missing required incident fields (category, description, GPS, address)" }, { status: 400 });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    const db = getDb();

    // Check for duplicate active reports within 150 meters
    const activeIncidents = db
      .prepare("SELECT id, incident_number, latitude, longitude, address, category FROM Incidents WHERE status NOT IN ('CLOSED', 'REJECTED', 'VERIFIED')")
      .all() as Array<Record<string, unknown>>;

    let duplicateOfId: number | null = null;
    let duplicateNumber: string | null = null;

    for (const act of activeIncidents) {
      const dist = getDistanceMeters(latNum, lngNum, Number(act.latitude), Number(act.longitude));
      if (dist <= 150) {
        duplicateOfId = Number(act.id);
        duplicateNumber = String(act.incident_number);
        break;
      }
    }

    // Automatically match responsible regional department
    const regId = Number(region_id) || 1;
    const deptRow = db.prepare("SELECT id, name FROM Departments WHERE region_id = ? LIMIT 1").get(regId) as
      | { id: number; name: string }
      | undefined;
    const departmentId = deptRow ? deptRow.id : 1;

    const result = runInTransaction((txDb) => {
      const countRow = txDb.prepare("SELECT COUNT(*) as cnt FROM Incidents").get() as { cnt: number };
      const nextNum = 1001 + (countRow?.cnt || 0);
      const incidentNumber = `TZG-2026-${nextNum}`;

      const insertInfo = txDb
        .prepare(
          `INSERT INTO Incidents (
            incident_number, citizen_id, category, description,
            latitude, longitude, address, status, priority,
            department_id, ai_analysis_json, duplicate_of_id, is_demo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'REPORTED', ?, ?, ?, ?, 0)`
        )
        .run(
          incidentNumber,
          citizenId,
          String(category),
          String(description).trim(),
          latNum,
          lngNum,
          String(address).trim(),
          String(priority || "HIGH"),
          departmentId,
          ai_analysis ? JSON.stringify(ai_analysis) : null,
          duplicateOfId
        );

      const newIncidentId = Number(insertInfo.lastInsertRowid);

      // Save uploaded photo or default illustration
      const mediaPath = photo_url || "/uploads/demo/leak-before-1.svg";
      txDb
        .prepare("INSERT INTO IncidentMedia (incident_id, file_path, media_type, image_hash) VALUES (?, ?, 'PHOTO_REPORT', ?)")
        .run(newIncidentId, mediaPath, `sha256_${Date.now()}`);

      // Create immutable initial history entry
      txDb
        .prepare(
          "INSERT INTO IncidentHistory (incident_id, changed_by, previous_status, new_status, notes) VALUES (?, ?, 'NONE', 'REPORTED', ?)"
        )
        .run(
          newIncidentId,
          citizenId,
          duplicateNumber
            ? `Fuqaro murojaati qabul qilindi. (Eslatma: #${duplicateNumber} yaqinida joylashgan)`
            : "Fuqaro tomonidan rasm va GPS koordinatalar bilan yuborildi. Mas'ul bo'limga yo'naltirildi."
        );

      // Notify Citizen
      txDb
        .prepare("INSERT INTO Notifications (user_id, title, message, notification_type) VALUES (?, ?, ?, 'REPORT_SUBMITTED')")
        .run(
          citizenId,
          `Murojaat qabul qilindi: #${incidentNumber}`,
          `Sizning ${address} manzilidagi xabaringiz mas'ul suv ta'minoti bo'limiga yuborildi.`,
          "REPORT_SUBMITTED"
        );

      // Audit Log
      txDb
        .prepare("INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, 'INCIDENT_REPORTED', 'Incident', ?, ?)")
        .run(citizenId, incidentNumber, `Category: ${category}, GPS: ${latNum},${lngNum}`);

      return {
        id: newIncidentId,
        incident_number: incidentNumber,
        duplicate_warning: duplicateNumber
      };
    });

    return NextResponse.json({
      ok: true,
      incident: result
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = await getCurrentUser();
    const actorId = currentUser?.id || Number(body.actor_id) || 2;

    const {
      incident_id,
      new_status,
      assigned_employee_id,
      priority,
      estimated_repair_start,
      estimated_completion,
      delay_reason,
      notes,
      after_photo_url,
      citizen_rating,
      citizen_feedback
    } = body;

    if (!incident_id) {
      return NextResponse.json({ error: "incident_id is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT * FROM Incidents WHERE id = ?").get(Number(incident_id)) as
      | Record<string, unknown>
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const actorUser = db.prepare("SELECT id, role FROM Users WHERE id = ?").get(actorId) as
      | { id: number; role: string }
      | undefined;
    const isCitizenOnly = !actorUser || actorUser.role === "CITIZEN";

    // Strict RBAC Enforcement: Citizens can ONLY submit ratings/feedback, NEVER change status, assign employees, or edit deadlines
    if (
      isCitizenOnly &&
      (new_status !== undefined ||
        assigned_employee_id !== undefined ||
        estimated_completion !== undefined ||
        delay_reason !== undefined ||
        after_photo_url !== undefined)
    ) {
      return NextResponse.json(
        { error: "Ruxsat yo'q: Fuqaro kabinetida xodim funksiyalari (holatni o'zgartirish yoki ta'mirni boshqarish) taqiqlangan!" },
        { status: 403 }
      );
    }

    runInTransaction((txDb) => {
      const prevStatus = String(existing.status);
      const targetStatus = new_status ? String(new_status) : prevStatus;
      const targetEmployee =
        assigned_employee_id !== undefined
          ? assigned_employee_id
            ? Number(assigned_employee_id)
            : null
          : existing.assigned_employee_id
          ? Number(existing.assigned_employee_id)
          : null;

      const targetPriority = priority ? String(priority) : String(existing.priority);
      const estStart =
        estimated_repair_start !== undefined ? estimated_repair_start : existing.estimated_repair_start;
      const estComp =
        estimated_completion !== undefined ? estimated_completion : existing.estimated_completion;
      const delReason = delay_reason !== undefined ? delay_reason : existing.delay_reason;

      let actualComp = existing.actual_completion ? String(existing.actual_completion) : null;
      if (["COMPLETED", "VERIFIED"].includes(targetStatus) && !actualComp) {
        actualComp = new Date().toISOString();
      }

      txDb
        .prepare(
          `UPDATE Incidents SET
            status = ?,
            priority = ?,
            assigned_employee_id = ?,
            estimated_repair_start = ?,
            estimated_completion = ?,
            actual_completion = ?,
            delay_reason = ?,
            citizen_rating = COALESCE(?, citizen_rating),
            citizen_feedback = COALESCE(?, citizen_feedback),
            updated_at = datetime('now')
           WHERE id = ?`
        )
        .run(
          targetStatus,
          targetPriority,
          targetEmployee,
          estStart ? String(estStart) : null,
          estComp ? String(estComp) : null,
          actualComp,
          delReason ? String(delReason) : null,
          citizen_rating !== undefined ? Number(citizen_rating) : null,
          citizen_feedback !== undefined ? String(citizen_feedback) : null,
          Number(incident_id)
        );

      if (after_photo_url) {
        txDb
          .prepare("INSERT INTO IncidentMedia (incident_id, file_path, media_type, image_hash) VALUES (?, ?, 'AFTER_REPAIR', ?)")
          .run(Number(incident_id), String(after_photo_url), `after_${Date.now()}`);
      }

      // Append immutable history entry
      const historyNote =
        notes ||
        (citizen_rating
          ? `Fuqaro ta'mirlash sifatini ${citizen_rating}/5 yulduz bilan baholadi: ${citizen_feedback || ""}`
          : `Holat ${prevStatus} → ${targetStatus} ga yangilandi.`);

      txDb
        .prepare(
          "INSERT INTO IncidentHistory (incident_id, changed_by, previous_status, new_status, notes) VALUES (?, ?, ?, ?, ?)"
        )
        .run(Number(incident_id), actorId, prevStatus, targetStatus, String(historyNote));

      // Notify Citizen of lifecycle update
      const isJobDoneAndAuthorized = ["VERIFIED", "COMPLETED"].includes(targetStatus) && body.authorize_certificate;

      txDb
        .prepare("INSERT INTO Notifications (user_id, title, message, notification_type) VALUES (?, ?, ?, ?)")
        .run(
          Number(existing.citizen_id),
          isJobDoneAndAuthorized
            ? `✅ #${existing.incident_number}: Ish bajarildi va «SUV ASROVCHISI» PDF sertifikatiga ruxsat berildi!`
            : `#${existing.incident_number}: Holat yangilandi (${targetStatus})`,
          isJobDoneAndAuthorized
            ? `Xodim ta'mirlash ishlarini to'liq yakunladi (${historyNote}). Sizga +100 ball va yangi formatdagi rasmiy PDF sertifikatni yuklab olish huquqi taqdim etildi!`
            : String(historyNote),
          targetStatus
        );

      // Module 7: When Employee finishes repair and authorizes Citizen certificate (or status is VERIFIED)
      if ((targetStatus === "VERIFIED" || isJobDoneAndAuthorized) && prevStatus !== "VERIFIED") {
        const citizenId = Number(existing.citizen_id);
        // Verify reporter is a CITIZEN (employees never get certificates)
        const reporterRow = txDb.prepare("SELECT id, role, full_name FROM Users WHERE id = ?").get(citizenId) as
          | { id: number; role: string; full_name: string }
          | undefined;

        if (reporterRow && reporterRow.role === "CITIZEN") {
          const alreadyRewarded = txDb
            .prepare("SELECT id FROM Rewards WHERE incident_id = ?")
            .get(Number(incident_id));

          if (!alreadyRewarded) {
            const pts = targetPriority === "CRITICAL" ? 150 : 100;
            txDb
              .prepare("INSERT INTO Rewards (user_id, points, reason, incident_id) VALUES (?, ?, ?, ?)")
              .run(
                citizenId,
                pts,
                `Xodim tomonidan ta'mir yakunlandi va tasdiqlandi (#${existing.incident_number})`,
                Number(incident_id)
              );
          }

          // Issue new or updated SUV ASROVCHISI certificate for the citizen
          const certNum = `SUV-2026-${String(100000 + citizenId * 37 + Number(incident_id) * 19).slice(0, 6)}`;
          const verifyCode = `TIZGIN-VERIFY-${citizenId}-${Number(incident_id)}-${Date.now().toString().slice(-4)}`;
          const today = new Date().toISOString().split("T")[0];

          const existingCert = txDb
            .prepare("SELECT id FROM Certificates WHERE user_id = ? AND certificate_number = ?")
            .get(citizenId, certNum);

          if (!existingCert) {
            txDb
              .prepare(
                "INSERT INTO Certificates (user_id, certificate_number, verification_code, issue_date, file_path) VALUES (?, ?, ?, ?, ?)"
              )
              .run(citizenId, certNum, verifyCode, today, `/certificates/${certNum}.pdf`);
          }
        }
      }

      // Audit Log
      txDb
        .prepare("INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, 'INCIDENT_STATUS_CHANGED', 'Incident', ?, ?)")
        .run(actorId, String(existing.incident_number), `${prevStatus} -> ${targetStatus} | ${historyNote}`);
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
