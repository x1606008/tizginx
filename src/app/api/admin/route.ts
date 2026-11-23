// ============================================================================
// TIZGIN — Super Administrator, RBAC User Management, Backup & Audit API (/api/admin)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createDatabaseBackup, getDb, listDatabaseBackups } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const users = db
      .prepare(
        `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.preferred_language,
                u.region_id, u.created_at, r.name_uz as region_name
         FROM Users u
         LEFT JOIN Regions r ON u.region_id = r.id
         ORDER BY u.id ASC`
      )
      .all();

    const departments = db
      .prepare(
        `SELECT d.*, r.name_uz as region_name
         FROM Departments d
         LEFT JOIN Regions r ON d.region_id = r.id
         ORDER BY d.id ASC`
      )
      .all();

    const repairTeams = db
      .prepare(
        `SELECT rt.*, d.name as department_name, u.full_name as manager_name
         FROM RepairTeams rt
         LEFT JOIN Departments d ON rt.department_id = d.id
         LEFT JOIN Users u ON rt.manager_id = u.id
         ORDER BY rt.id ASC`
      )
      .all();

    const auditLogs = db
      .prepare(
        `SELECT a.*, u.full_name as user_name, u.role as user_role
         FROM AuditLogs a
         LEFT JOIN Users u ON a.user_id = u.id
         ORDER BY a.id DESC
         LIMIT 100`
      )
      .all();

    const backups = listDatabaseBackups();

    return NextResponse.json({
      users,
      departments,
      repairTeams,
      auditLogs,
      backups
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = await getCurrentUser();
    const actorId = currentUser?.id || 1;
    const db = getDb();

    if (body.action === "backup_db") {
      const backup = createDatabaseBackup("admin-panel");
      db.prepare(
        "INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, 'SQLITE_BACKUP_CREATED', 'Database', ?, ?)"
      ).run(actorId, backup.fileName, `Size: ${backup.sizeBytes} bytes`);

      return NextResponse.json({
        ok: true,
        backup,
        backups: listDatabaseBackups()
      });
    }

    if (body.action === "update_user_role") {
      const { user_id, new_role } = body;
      if (!user_id || !["CITIZEN", "EMPLOYEE", "MANAGER", "ADMIN"].includes(String(new_role))) {
        return NextResponse.json({ error: "Invalid user_id or role" }, { status: 400 });
      }
      db.prepare("UPDATE Users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(
        String(new_role),
        Number(user_id)
      );
      db.prepare(
        "INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, 'USER_ROLE_UPDATED', 'User', ?, ?)"
      ).run(actorId, String(user_id), `Updated role to ${new_role}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "create_department") {
      const { name, region_id, contact_information } = body;
      if (!name || !contact_information) {
        return NextResponse.json({ error: "Department name and contact information required" }, { status: 400 });
      }
      const info = db
        .prepare("INSERT INTO Departments (name, region_id, contact_information) VALUES (?, ?, ?)")
        .run(String(name), Number(region_id || 1), String(contact_information));
      db.prepare(
        "INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, 'DEPARTMENT_CREATED', 'Department', ?, ?)"
      ).run(actorId, String(info.lastInsertRowid), String(name));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown admin action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
