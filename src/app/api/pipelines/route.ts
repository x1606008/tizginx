// ============================================================================
// TIZGIN — Module 10: Digital Pipeline Passport API (/api/pipelines)
// Manual municipal pipeline database (NO IoT sensors or physical hardware).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get("region_id");
    const condition = searchParams.get("condition");

    let pipelines = db
      .prepare(
        `SELECT p.*, r.name_uz as region_name_uz, r.name_kaa as region_name_kaa,
                r.name_en as region_name_en, r.name_ru as region_name_ru,
                d.name as department_name
         FROM Pipelines p
         LEFT JOIN Regions r ON p.region_id = r.id
         LEFT JOIN Departments d ON p.department_id = d.id
         ORDER BY p.id DESC`
      )
      .all() as Array<Record<string, unknown>>;

    if (regionId && regionId !== "ALL") {
      pipelines = pipelines.filter((p) => String(p.region_id) === String(regionId));
    }
    if (condition && condition !== "ALL") {
      pipelines = pipelines.filter((p) => String(p.technical_condition) === String(condition));
    }

    return NextResponse.json({ pipelines });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = await getCurrentUser();
    const actorId = currentUser?.id || 1;

    const {
      pipeline_code,
      region_id,
      department_id,
      address,
      latitude,
      longitude,
      pipeline_type,
      diameter_mm,
      length_m,
      installation_year,
      technical_condition,
      maintenance_history
    } = body;

    if (!pipeline_code || !address || !pipeline_type || !installation_year) {
      return NextResponse.json({ error: "Missing required pipeline passport fields" }, { status: 400 });
    }

    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO Pipelines (
          pipeline_code, region_id, department_id, address,
          latitude, longitude, pipeline_type, diameter_mm, length_m,
          installation_year, technical_condition, maintenance_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(pipeline_code).trim().toUpperCase(),
        Number(region_id || 1),
        Number(department_id || 1),
        String(address).trim(),
        Number(latitude || 42.4605),
        Number(longitude || 59.6152),
        String(pipeline_type).trim(),
        Number(diameter_mm || 300),
        Number(length_m || 1500),
        Number(installation_year),
        String(technical_condition || "SATISFACTORY"),
        String(maintenance_history || "Registered in TIZGIN Digital Pipeline Passport registry.")
      );

    db.prepare(
      "INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details) VALUES (?, 'PIPELINE_CREATED', 'Pipeline', ?, ?)"
    ).run(actorId, String(pipeline_code), `Registered pipeline at ${address}`);

    return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
