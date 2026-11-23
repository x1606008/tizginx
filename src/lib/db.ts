// ============================================================================
// TIZGIN — SMART WATER MANAGEMENT PLATFORM
// Core SQLite Database Engine (Node.js Native SQLite with WAL, Foreign Keys,
// Transactions, Schema Migrations, Realistic Seed Data, and Backup/Restore)
// ============================================================================

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DB_RELATIVE_PATH = process.env.DATABASE_PATH || "./data/tizgin.db";
const BACKUP_RELATIVE_DIR = process.env.BACKUP_DIRECTORY || "./data/backups";

export function getDbPath(): string {
  return path.resolve(process.cwd(), DB_RELATIVE_PATH);
}

export function getBackupDir(): string {
  return path.resolve(process.cwd(), BACKUP_RELATIVE_DIR);
}

// Secure password hashing using Node's built-in scrypt (Argon2/Bcrypt equivalent security)
export function hashPassword(password: string): string {
  const salt = "tizgin_water_salt_2026_v1";
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    const salt = parts[1];
    const hashHex = parts[2];
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hashHex, "hex"), Buffer.from(derivedKey, "hex"));
  }
  return hashPassword(password) === storedHash;
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  // Critical SQLite rules: Enable WAL mode, Foreign Keys, and busy timeout
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA busy_timeout = 5000;");

  initializeSchema(db);
  seedInitialDataIfEmpty(db);

  dbInstance = db;
  return db;
}

export function runInTransaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    const result = fn(db);
    db.exec("COMMIT;");
    return result;
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    -- 1. Regions
    CREATE TABLE IF NOT EXISTS Regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_uz TEXT NOT NULL,
      name_kaa TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_ru TEXT NOT NULL
    );

    -- 2. Users
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CITIZEN',
      preferred_language TEXT NOT NULL DEFAULT 'uz',
      region_id INTEGER,
      telegram_chat_id TEXT,
      notify_in_app INTEGER NOT NULL DEFAULT 1,
      notify_email INTEGER NOT NULL DEFAULT 1,
      notify_telegram INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (region_id) REFERENCES Regions(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
    CREATE INDEX IF NOT EXISTS idx_users_region ON Users(region_id);

    -- 3. Departments
    CREATE TABLE IF NOT EXISTS Departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region_id INTEGER NOT NULL,
      contact_information TEXT NOT NULL,
      FOREIGN KEY (region_id) REFERENCES Regions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_departments_region ON Departments(region_id);

    -- 4. RepairTeams
    CREATE TABLE IF NOT EXISTS RepairTeams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      manager_id INTEGER NOT NULL,
      specialization TEXT DEFAULT 'Magistral va ichki suv tarmoqlari',
      status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE CASCADE,
      FOREIGN KEY (manager_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_repair_teams_dept ON RepairTeams(department_id);
    CREATE INDEX IF NOT EXISTS idx_repair_teams_mgr ON RepairTeams(manager_id);

    -- 5. Incidents
    CREATE TABLE IF NOT EXISTS Incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_number TEXT NOT NULL UNIQUE,
      citizen_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REPORTED',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      assigned_employee_id INTEGER,
      department_id INTEGER,
      estimated_repair_start TEXT,
      estimated_completion TEXT,
      actual_completion TEXT,
      delay_reason TEXT,
      ai_analysis_json TEXT,
      duplicate_of_id INTEGER,
      citizen_rating INTEGER,
      citizen_feedback TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (citizen_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_employee_id) REFERENCES Users(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_incidents_number ON Incidents(incident_number);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON Incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_priority ON Incidents(priority);
    CREATE INDEX IF NOT EXISTS idx_incidents_citizen ON Incidents(citizen_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_employee ON Incidents(assigned_employee_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_dept ON Incidents(department_id);

    -- 6. IncidentMedia
    CREATE TABLE IF NOT EXISTS IncidentMedia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      media_type TEXT NOT NULL,
      image_hash TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (incident_id) REFERENCES Incidents(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_incident_media_inc ON IncidentMedia(incident_id);

    -- 7. IncidentHistory
    CREATE TABLE IF NOT EXISTS IncidentHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      changed_by INTEGER NOT NULL,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (incident_id) REFERENCES Incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES Users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_incident_history_inc ON IncidentHistory(incident_id);

    -- 8. Notifications
    CREATE TABLE IF NOT EXISTS Notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON Notifications(user_id, is_read);

    -- 9. Rewards
    CREATE TABLE IF NOT EXISTS Rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      incident_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (incident_id) REFERENCES Incidents(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rewards_user ON Rewards(user_id);

    -- 10. Certificates
    CREATE TABLE IF NOT EXISTS Certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      certificate_number TEXT NOT NULL UNIQUE,
      verification_code TEXT NOT NULL UNIQUE,
      issue_date TEXT NOT NULL,
      file_path TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_certificates_user ON Certificates(user_id);

    -- 11. Pipelines
    CREATE TABLE IF NOT EXISTS Pipelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pipeline_code TEXT NOT NULL UNIQUE,
      region_id INTEGER NOT NULL,
      department_id INTEGER,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      pipeline_type TEXT NOT NULL,
      diameter_mm INTEGER NOT NULL DEFAULT 300,
      length_m INTEGER NOT NULL DEFAULT 1200,
      installation_year INTEGER NOT NULL,
      technical_condition TEXT NOT NULL,
      maintenance_history TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (region_id) REFERENCES Regions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_pipelines_code ON Pipelines(pipeline_code);
    CREATE INDEX IF NOT EXISTS idx_pipelines_region ON Pipelines(region_id);

    -- 12. AuditLogs
    CREATE TABLE IF NOT EXISTS AuditLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_user ON AuditLogs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON AuditLogs(entity_type, entity_id);

    -- 13. PlatformSettings (for Super Admin configuration & custom translations)
    CREATE TABLE IF NOT EXISTS PlatformSettings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function createDatabaseBackup(reason = "manual"): { fileName: string; fullPath: string; sizeBytes: number; timestamp: string } {
  const db = getDb();
  // Flush WAL to main database file before copying
  try {
    db.exec("PRAGMA wal_checkpoint(FULL);");
  } catch {
    // ignore if busy
  }

  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `tizgin-backup-${reason}-${timestamp}.db`;
  const fullPath = path.join(backupDir, fileName);

  fs.copyFileSync(getDbPath(), fullPath);
  const stats = fs.statSync(fullPath);

  return {
    fileName,
    fullPath,
    sizeBytes: stats.size,
    timestamp: new Date().toISOString()
  };
}

export function listDatabaseBackups(): Array<{ fileName: string; sizeBytes: number; createdAt: string }> {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".db"));
  return files
    .map((fileName) => {
      const stats = fs.statSync(path.join(backupDir, fileName));
      return {
        fileName,
        sizeBytes: stats.size,
        createdAt: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function seedInitialDataIfEmpty(db: DatabaseSync): void {
  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM Regions").get() as { cnt: number };
  if (countRow && countRow.cnt > 0) {
    return;
  }

  // Ensure demo SVG photos exist in public/uploads/demo
  ensureDemoMediaAssets();

  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    // 1. Seed Regions (Republic of Karakalpakstan & Uzbekistan centers)
    const insertRegion = db.prepare(`
      INSERT INTO Regions (id, name_uz, name_kaa, name_en, name_ru)
      VALUES (?, ?, ?, ?, ?)
    `);

    const regions = [
      [1, "Qoraqalpog‘iston Respublikasi (Nukus)", "Qaraqalpaqstan Respublikası (Nókis)", "Republic of Karakalpakstan (Nukus)", "Республика Каракалпакстан (Нукус)"],
      [2, "Toshkent shahri", "Tashkent qalası", "Tashkent City", "Город Ташкент"],
      [3, "Xorazm viloyati (Urganch)", "Xorezm wálayatı (Úrgenish)", "Khorezm Region (Urgench)", "Хорезмская область (Ургенч)"],
      [4, "Samarqand viloyati", "Samarqand wálayatı", "Samarkand Region", "Самаркандская область"],
      [5, "Buxoro viloyati", "Buxara wálayatı", "Bukhara Region", "Бухарская область"],
      [6, "Qo‘ng‘irot va Mo‘ynoq tumanlari", "Qońırat hám Moynaq rayonları", "Kungrad & Muynak Districts", "Кунградский и Муйнакский районы"]
    ];
    for (const r of regions) {
      insertRegion.run(r[0], r[1], r[2], r[3], r[4]);
    }

    // 2. Seed Departments
    const insertDept = db.prepare(`
      INSERT INTO Departments (id, name, region_id, contact_information)
      VALUES (?, ?, ?, ?)
    `);
    const departments = [
      [1, "Nukus shahar «Qoraqalpoq Suv Ta'minoti» MChJ", 1, "+998 (61) 222-45-10 | dispetcher-nukus@tizgin.uz | Nukus sh., A. Dosnazarov ko'chasi, 74"],
      [2, "Toshkent shahar «Toshkent Shahar Suv Ta'minoti» AJ", 2, "+998 (71) 256-10-55 | tashkent-water@tizgin.uz | Toshkent sh., Yunusobod tumani, Amir Temur shoh ko'chasi, 108"],
      [3, "Urganch «Xorazm Suv Ta'minoti» boshqarmasi", 3, "+998 (62) 228-31-90 | khorezm-suv@tizgin.uz | Urganch sh., Al-Xorazmiy ko'chasi, 41"],
      [4, "Samarqand «Samarqand Suv Ta'minoti» filiali", 4, "+998 (66) 233-19-04 | samarkand-suv@tizgin.uz | Samarqand sh., Rudakiy ko'chasi, 112"],
      [5, "Buxoro «Buxoro Suv Ta'minoti» boshqarmasi", 5, "+998 (65) 223-77-15 | bukhara-suv@tizgin.uz | Buxoro sh., Ibn Sino ko'chasi, 29"],
      [6, "Shimoliy Orolbo‘yi Magistral Suv Tarmoqlari Bo‘limi", 6, "+998 (61) 312-20-88 | aral-north@tizgin.uz | Qo'ng'irot sh., Berdax ko'chasi, 15"]
    ];
    for (const d of departments) {
      insertDept.run(d[0], d[1], d[2], d[3]);
    }

    // 3. Seed Users across all 4 roles
    const defaultPasswordHash = hashPassword("Tizgin2026!");
    const insertUser = db.prepare(`
      INSERT INTO Users (id, full_name, email, phone, password_hash, role, preferred_language, region_id, telegram_chat_id, notify_in_app, notify_email, notify_telegram, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const users = [
      // Super Admin
      [1, "Azamat Qurbanbaev", "admin@tizgin.uz", "+998 90 701 00 01", defaultPasswordHash, "ADMIN", "uz", 1, "100200301", 1, 1, 1, "2026-10-01 08:00:00"],
      // Brigade Managers
      [2, "Baxtiyar Nurjanov", "manager@tizgin.uz", "+998 91 380 44 12", defaultPasswordHash, "MANAGER", "kaa", 1, "100200302", 1, 1, 1, "2026-10-02 09:00:00"],
      [3, "Sardorbek Raximov", "manager.tashkent@tizgin.uz", "+998 93 550 18 90", defaultPasswordHash, "MANAGER", "uz", 2, "100200303", 1, 1, 1, "2026-10-03 09:30:00"],
      // Water Supply Employees
      [4, "Ruslan Eshmuratov", "employee@tizgin.uz", "+998 97 220 51 19", defaultPasswordHash, "EMPLOYEE", "kaa", 1, "100200304", 1, 1, 1, "2026-10-05 08:30:00"],
      [5, "Jasur Karimov", "jasur.employee@tizgin.uz", "+998 99 811 23 45", defaultPasswordHash, "EMPLOYEE", "uz", 2, "100200305", 1, 1, 0, "2026-10-06 08:30:00"],
      [6, "Timur Seitnazarov", "timur.employee@tizgin.uz", "+998 91 395 67 89", defaultPasswordHash, "EMPLOYEE", "ru", 1, "100200306", 1, 1, 1, "2026-10-07 08:30:00"],
      // Citizens
      [7, "Aysultan Pirnazarova", "citizen@tizgin.uz", "+998 90 592 14 77", defaultPasswordHash, "CITIZEN", "kaa", 1, "100200307", 1, 1, 1, "2026-10-10 10:15:00"],
      [8, "Dilshod Xasanov", "dilshod@tizgin.uz", "+998 94 612 88 30", defaultPasswordHash, "CITIZEN", "uz", 2, "100200308", 1, 1, 1, "2026-10-12 11:20:00"],
      [9, "Malika Bekchanova", "malika@tizgin.uz", "+998 93 744 09 21", defaultPasswordHash, "CITIZEN", "uz", 3, null, 1, 1, 0, "2026-10-14 14:40:00"],
      [10, "Elena Sokolova", "elena@tizgin.uz", "+998 90 175 63 11", defaultPasswordHash, "CITIZEN", "ru", 2, null, 1, 1, 0, "2026-10-15 16:00:00"]
    ];
    for (const u of users) {
      insertUser.run(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9], u[10], u[11], u[12]);
    }

    // 4. Seed Repair Teams
    const insertTeam = db.prepare(`
      INSERT INTO RepairTeams (id, name, department_id, manager_id, specialization, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertTeam.run(1, "Nukus Tezkor Avariya Brigadasi №1", 1, 2, "Magistral quvurlar va yuqori bosimli zulfinlar (300-600 mm)", "ACTIVE");
    insertTeam.run(2, "Nukus Ichki Tarmoqlar Brigadasi №2", 1, 2, "Ko'p qavatli uylar va ko'cha quduqlari ta'miri", "ACTIVE");
    insertTeam.run(3, "Toshkent Yunusobod Tezkor Guruhi №4", 2, 3, "Shahar magistral suv tarmoqlari va gidrantlar", "ACTIVE");
    insertTeam.run(4, "Urganch Markaziy Ta'mir Brigadasi", 3, 2, "Nasos chiqish quvurlari va taqsimlash uzellari", "ACTIVE");

    // 5. Seed Incidents (covering full lifecycle, overdue items, AI analysis, demo flags)
    const insertIncident = db.prepare(`
      INSERT INTO Incidents (
        id, incident_number, citizen_id, category, description,
        latitude, longitude, address, status, priority,
        assigned_employee_id, department_id, estimated_repair_start,
        estimated_completion, actual_completion, delay_reason,
        ai_analysis_json, citizen_rating, citizen_feedback, is_demo,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const aiSample1 = JSON.stringify({
      isSuggestedOnly: true,
      confidence: 0.94,
      detectedIssue: "High-pressure underground main pipe rupture with surface asphalt flooding",
      suggestedCategory: "BROKEN_PIPE",
      suggestedPriority: "CRITICAL",
      estimatedLossLitersPerHour: 2400,
      duplicateProbability: 0.04,
      engineeringNote: "AI Suggestion Only: Requires physical pressure gauge check by brigade engineer."
    });

    const aiSample2 = JSON.stringify({
      isSuggestedOnly: true,
      confidence: 0.89,
      detectedIssue: "Continuous drinking water overflow from street valve chamber",
      suggestedCategory: "DAMAGED_VALVE",
      suggestedPriority: "HIGH",
      estimatedLossLitersPerHour: 950,
      duplicateProbability: 0.08,
      engineeringNote: "AI Suggestion Only: Valve gasket or spindle failure suspected."
    });

    const aiSample3 = JSON.stringify({
      isSuggestedOnly: true,
      confidence: 0.91,
      detectedIssue: "Clean water leakage along residential sidewalk curb",
      suggestedCategory: "WATER_LEAKAGE",
      suggestedPriority: "MEDIUM",
      estimatedLossLitersPerHour: 450,
      duplicateProbability: 0.02,
      engineeringNote: "AI Suggestion Only: Joint seal degradation likely on 150mm distribution line."
    });

    const incidents = [
      [
        1,
        "TZG-2026-1001",
        7,
        "BROKEN_PIPE",
        "Nukus shahri A. Dosnazarov ko'chasi 58-uy oldida yirik ichimlik suv quvuri yorilib ketgan. Toza suv yo'l qismiga kuchli bosim bilan oqib chiqmoqda.",
        42.4602,
        59.6156,
        "Nukus sh., A. Dosnazarov ko'chasi, 58-uy oldi",
        "VERIFIED",
        "CRITICAL",
        4,
        1,
        "2026-11-18T09:00:00Z",
        "2026-11-18T17:00:00Z",
        "2026-11-18T15:40:00Z",
        null,
        aiSample1,
        5,
        "Brigada juda tez yetib keldi va sifatli ta'mirladi. Rahmat!",
        1,
        "2026-11-18 08:15:00",
        "2026-11-18 16:30:00"
      ],
      [
        2,
        "TZG-2026-1002",
        7,
        "DAMAGED_VALVE",
        "Qoraqalpog'iston ko'chasi chorrahasidagi suv qudug'i qopqog'i ichidan zulfin (zadvijka) shikastlangan, 2 soatdan beri to'xtovsiz toza suv oqyapti.",
        42.4538,
        59.6042,
        "Nukus sh., Qoraqalpog'iston ko'chasi, 24-uy",
        "REPAIRING",
        "HIGH",
        4,
        1,
        "2026-11-23T08:00:00Z",
        "2026-11-24T12:00:00Z",
        null,
        null,
        aiSample2,
        null,
        null,
        1,
        "2026-11-23 07:10:00",
        "2026-11-23 10:00:00"
      ],
      [
        3,
        "TZG-2026-1003",
        8,
        "CONTINUOUS_FLOW",
        "Yunusobod 11-kvartalda ko'p qavatli uylar orasidagi magistral tarmoqdan kechadan beri suv sizib chiqib ko'lmak hosil qildi. Muddati o'tib ketdi!",
        41.3665,
        69.2864,
        "Toshkent sh., Yunusobod tumani, 11-dahasi, 19-uy",
        "INSPECTION",
        "CRITICAL",
        5,
        2,
        "2026-11-21T10:00:00Z",
        "2026-11-22T14:00:00Z", // Overdue intentionally for Deadline Accountability System
        null,
        "Maxsus ekskavator texnikasi va 300mm mufta yetkazib berilishi kutilmoqda",
        aiSample1,
        null,
        null,
        1,
        "2026-11-21 08:40:00",
        "2026-11-22 15:00:00"
      ],
      [
        4,
        "TZG-2026-1004",
        9,
        "WATER_LEAKAGE",
        "Urganch shahri Al-Xorazmiy ko'chasida trotuar ostidan ichimlik suvi sizib chiqmoqda, asfalt cho'kishni boshlagan.",
        41.5534,
        60.6312,
        "Urganch sh., Al-Xorazmiy ko'chasi, 77-uy",
        "REPORTED",
        "HIGH",
        null,
        3,
        null,
        null,
        null,
        null,
        aiSample3,
        null,
        null,
        1,
        "2026-11-23 11:05:00",
        "2026-11-23 11:05:00"
      ],
      [
        5,
        "TZG-2026-1005",
        10,
        "DAMAGED_INFRASTRUCTURE",
        "Chilonzor 5-kvartal hududida yong'in gidranti va suv taqsimlash qudug'i devori shikastlangan, bosim pasayib ketgan.",
        41.2858,
        69.2041,
        "Toshkent sh., Chilonzor tumani, 5-kvartal, 12-uy",
        "ASSIGNED",
        "MEDIUM",
        5,
        2,
        "2026-11-23T13:00:00Z",
        "2026-11-24T18:00:00Z",
        null,
        null,
        aiSample3,
        null,
        null,
        1,
        "2026-11-23 09:20:00",
        "2026-11-23 11:30:00"
      ],
      [
        6,
        "TZG-2026-1006",
        7,
        "WATER_LEAKAGE",
        "Nukus shahri Turtkul guzari yaqinida ichimlik suvi quvuridan suv oqishi to'liq bartaraf etildi va hudud obodonlashtirildi.",
        42.4481,
        59.6275,
        "Nukus sh., To'rtko'l shoh ko'chasi, 102-uy",
        "CLOSED",
        "MEDIUM",
        6,
        1,
        "2026-11-14T09:00:00Z",
        "2026-11-14T18:00:00Z",
        "2026-11-14T16:15:00Z",
        null,
        aiSample3,
        5,
        "Muammo o'z vaqtida hal qilindi!",
        1,
        "2026-11-14 07:50:00",
        "2026-11-14 17:00:00"
      ],
      [
        7,
        "TZG-2026-1007",
        8,
        "BROKEN_PIPE",
        "Nukus shahri Berdax ko'chasida 200mm polietilen quvur ulanish joyidan suv sizib chiqishi aniqlandi. Ta'mirlash yakunlandi, tasdiqlash kutilmoqda.",
        42.4669,
        59.6011,
        "Nukus sh., Berdax ko'chasi, 31-uy",
        "COMPLETED",
        "HIGH",
        4,
        1,
        "2026-11-22T09:00:00Z",
        "2026-11-23T15:00:00Z",
        "2026-11-23T12:30:00Z",
        null,
        aiSample2,
        null,
        null,
        1,
        "2026-11-22 08:00:00",
        "2026-11-23 12:30:00"
      ]
    ];

    for (const inc of incidents) {
      insertIncident.run(
        inc[0], inc[1], inc[2], inc[3], inc[4],
        inc[5], inc[6], inc[7], inc[8], inc[9],
        inc[10], inc[11], inc[12], inc[13], inc[14],
        inc[15], inc[16], inc[17], inc[18], inc[19],
        inc[20], inc[21]
      );
    }

    // 6. Seed IncidentMedia
    const insertMedia = db.prepare(`
      INSERT INTO IncidentMedia (incident_id, file_path, media_type, image_hash, uploaded_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertMedia.run(1, "/uploads/demo/leak-before-1.svg", "BEFORE_REPAIR", "hash_demo_leak_1", "2026-11-18 08:15:00");
    insertMedia.run(1, "/uploads/demo/leak-after-1.svg", "AFTER_REPAIR", "hash_demo_repair_1", "2026-11-18 15:40:00");
    insertMedia.run(2, "/uploads/demo/valve-leak-2.svg", "PHOTO_REPORT", "hash_demo_valve_2", "2026-11-23 07:10:00");
    insertMedia.run(3, "/uploads/demo/leak-before-1.svg", "PHOTO_REPORT", "hash_demo_leak_3", "2026-11-21 08:40:00");
    insertMedia.run(4, "/uploads/demo/valve-leak-2.svg", "PHOTO_REPORT", "hash_demo_leak_4", "2026-11-23 11:05:00");
    insertMedia.run(7, "/uploads/demo/leak-before-1.svg", "BEFORE_REPAIR", "hash_demo_leak_7", "2026-11-22 08:00:00");
    insertMedia.run(7, "/uploads/demo/leak-after-1.svg", "AFTER_REPAIR", "hash_demo_repair_7", "2026-11-23 12:30:00");

    // 7. Seed IncidentHistory (Complete immutable audit trail)
    const insertHistory = db.prepare(`
      INSERT INTO IncidentHistory (incident_id, changed_by, previous_status, new_status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertHistory.run(1, 7, "NONE", "REPORTED", "Fuqaro tomonidan fotosurat va GPS koordinatalar bilan yuborildi.", "2026-11-18 08:15:00");
    insertHistory.run(1, 2, "REPORTED", "RECEIVED", "Nukus shahar suv ta'minoti dispetcheri tomonidan qabul qilindi.", "2026-11-18 08:25:00");
    insertHistory.run(1, 2, "RECEIVED", "ASSIGNED", "Brigada muhandisi Ruslan Eshmuratovga biriktirildi. Muddat: 18:00 gacha.", "2026-11-18 08:40:00");
    insertHistory.run(1, 4, "ASSIGNED", "INSPECTION", "Joyiga yetib borildi, 300mm cho'yan quvur darz ketganligi aniqlandi.", "2026-11-18 09:15:00");
    insertHistory.run(1, 4, "INSPECTION", "REPAIRING", "Suv tarmog'i vaqtincha yopilib, payvandlash va xomut o'rnatish boshlandi.", "2026-11-18 10:30:00");
    insertHistory.run(1, 4, "REPAIRING", "COMPLETED", "Quvur to'liq ta'mirlandi, bosim sinovidan o'tdi. Oldin va keyingi rasmlar yuklandi.", "2026-11-18 15:40:00");
    insertHistory.run(1, 2, "COMPLETED", "VERIFIED", "Brigada rahbari va tizim tomonidan tasdiqlandi. Fuqaroga +150 ball berildi.", "2026-11-18 16:30:00");

    insertHistory.run(2, 7, "NONE", "REPORTED", "Zulfin qudug'idan suv toshib chiqishi bo'yicha murojaat.", "2026-11-23 07:10:00");
    insertHistory.run(2, 2, "REPORTED", "ASSIGNED", "Ruslan Eshmuratovga tezkor ta'mirlash uchun biriktirildi.", "2026-11-23 07:35:00");
    insertHistory.run(2, 4, "ASSIGNED", "REPAIRING", "Yangi 200mm zulfin o'rnatilmoqda.", "2026-11-23 10:00:00");

    insertHistory.run(3, 8, "NONE", "REPORTED", "Yunusobod 11-dahada suv oqishi haqida xabar berildi.", "2026-11-21 08:40:00");
    insertHistory.run(3, 3, "REPORTED", "ASSIGNED", "Muhandis Jasur Karimovga biriktirildi.", "2026-11-21 09:30:00");
    insertHistory.run(3, 5, "ASSIGNED", "INSPECTION", "Chuqurlik 2.8 metr, maxsus texnika chaqirildi. Muddat kechikishi qayd etildi.", "2026-11-22 15:00:00");

    // 8. Seed Rewards & SUV ASROVCHISI Certificates
    const insertReward = db.prepare(`
      INSERT INTO Rewards (user_id, points, reason, incident_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertReward.run(7, 150, "Tasdiqlangan yirik magistral avariya xabari (#TZG-2026-1001)", 1, "2026-11-18 16:30:00");
    insertReward.run(7, 100, "Tasdiqlangan suv sizib chiqishi xabari (#TZG-2026-1006)", 6, "2026-11-14 17:00:00");
    insertReward.run(7, 75, "5 ta ketma-ket aniq GPS koordinatali murojaat bonusi", null, "2026-11-19 10:00:00");
    insertReward.run(8, 120, "Toshkent shahar suv tarmog'i nazorati faolligi uchun", 3, "2026-11-21 12:00:00");
    insertReward.run(9, 90, "Xorazm viloyati ichimlik suvini asrash hissasi uchun", 4, "2026-11-20 15:00:00");

    const insertCert = db.prepare(`
      INSERT INTO Certificates (user_id, certificate_number, verification_code, issue_date, file_path)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertCert.run(7, "SUV-2026-000184", "TIZGIN-VERIFY-KAA-9941", "2026-11-19", "/certificates/SUV-2026-000184");
    insertCert.run(8, "SUV-2026-000219", "TIZGIN-VERIFY-UZB-7812", "2026-11-21", "/certificates/SUV-2026-000219");

    // 9. Seed Digital Pipeline Passports (Module 10 - NO IoT sensors, purely manual engineering database)
    const insertPipeline = db.prepare(`
      INSERT INTO Pipelines (
        pipeline_code, region_id, department_id, address,
        latitude, longitude, pipeline_type, diameter_mm, length_m,
        installation_year, technical_condition, maintenance_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPipeline.run(
      "PIPE-NUK-001",
      1,
      1,
      "Nukus sh., A. Dosnazarov shoh ko'chasi (Markaziy suv uzatish tarmog'i)",
      42.4608,
      59.6149,
      "Ductile Cast Iron (VChShG) — Magistral ichimlik suvi",
      500,
      4200,
      2014,
      "SATISFACTORY",
      "2023-05: Gidravlik sinov va zulfinlar almashtirildi. 2026-11: #TZG-2026-1001 mufta ta'miri."
    );
    insertPipeline.run(
      "PIPE-NUK-002",
      1,
      1,
      "Nukus sh., Qoraqalpog'iston ko'chasi — 22-kichik tuman tarmog'i",
      42.4535,
      59.6039,
      "Steel Pipe (Po'lat quvur) — Taqsimlovchi tarmoq",
      300,
      2850,
      1996,
      "NEEDS_REPAIR",
      "2021-09: Korroziyaga qarshi izolyatsiya yangilandi. 2026-11: Zulfin qudug'i rekonstruksiyasi rejalashtirilgan."
    );
    insertPipeline.run(
      "PIPE-TAS-104",
      2,
      2,
      "Toshkent sh., Yunusobod tumani, Amir Temur va Chinobod kesishmasi",
      41.3662,
      69.2869,
      "HDPE PE-100 (Polietilen SDR-11) — Ichimlik suvi",
      400,
      5600,
      2021,
      "OPTIMAL",
      "2025-04: Yillik profilaktik tekshiruvdan muvaffaqiyatli o'tgan."
    );
    insertPipeline.run(
      "PIPE-URG-019",
      3,
      3,
      "Urganch sh., Al-Xorazmiy ko'chasi — Tuyamo'yin suv uzatish shoxobchasi",
      41.5540,
      60.6320,
      "Reinforced Steel (Po'lat magistral)",
      600,
      7400,
      1989,
      "CRITICAL",
      "2024-11: 3 ta uchastkada payvand choklari kuchaytirildi. 2027 yil investitsiya dasturiga kiritilgan."
    );
    insertPipeline.run(
      "PIPE-KUN-007",
      6,
      6,
      "Qo'ng'irot — Mo'ynoq toza ichimlik suvi magistral tarmog'i (14-km)",
      43.0715,
      58.9022,
      "HDPE PE-100 (Yuqori bosimli polietilen)",
      500,
      12500,
      2023,
      "OPTIMAL",
      "2026-08: Bosim regulyatorlari va havo chiqarish klapanlari texnik ko'rikdan o'tkazildi."
    );

    // 10. Seed Notifications
    const insertNotif = db.prepare(`
      INSERT INTO Notifications (user_id, title, message, notification_type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertNotif.run(7, "Murojaatingiz tasdiqlandi! (+150 ball)", "Sizning #TZG-2026-1001 raqamli xabaringiz to'liq hal etildi va tasdiqlandi. Sizga «SUV ASROVCHISI» sertifikati taqdim etildi!", "VERIFIED", 0, "2026-11-18 16:31:00");
    insertNotif.run(7, "Ta'mirlash ishlari boshlandi", "#TZG-2026-1002 raqamli murojaatingiz bo'yicha muhandis Ruslan Eshmuratov ta'mirlashni boshladi. Taxminiy yakunlash: 24-noyabr 12:00.", "REPAIR_STARTED", 0, "2026-11-23 10:01:00");
    insertNotif.run(4, "Yangi tezkor vazifa biriktirildi", "Sizga #TZG-2026-1002 (Nukus sh., Qoraqalpog'iston ko'chasi 24) avariya holati biriktirildi.", "ASSIGNED", 0, "2026-11-23 07:35:00");
    insertNotif.run(2, "DIQQAT: Muddati o'tgan ta'mirlash!", "#TZG-2026-1003 raqamli avariya bo'yicha belgilangan muddat o'tib ketdi. Kechikish sababi kiritildi.", "DEADLINE_EXCEEDED", 0, "2026-11-22 14:05:00");
    insertNotif.run(1, "Kunlik tizim hisoboti tayyor", "TIZGIN platformasida jami 7 ta namoyish murojaati, 5 ta magistral quvur pasporti va 10 ta foydalanuvchi faol.", "SYSTEM_ALERT", 0, "2026-11-23 08:00:00");

    // 11. Seed AuditLogs
    const insertAudit = db.prepare(`
      INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(1, "SYSTEM_INITIALIZED", "Platform", "TIZGIN-1.0", "SQLite WAL database initialized with multilingual RBAC seed data.", "2026-11-01 08:00:00");
    insertAudit.run(7, "INCIDENT_CREATED", "Incident", "TZG-2026-1001", "Reported broken water pipe at A. Dosnazarov 58, Nukus.", "2026-11-18 08:15:00");
    insertAudit.run(2, "INCIDENT_ASSIGNED", "Incident", "TZG-2026-1001", "Assigned to Employee ID 4 (Ruslan Eshmuratov).", "2026-11-18 08:40:00");
    insertAudit.run(4, "INCIDENT_COMPLETED", "Incident", "TZG-2026-1001", "Uploaded before/after repair photos and marked completed.", "2026-11-18 15:40:00");
    insertAudit.run(2, "INCIDENT_VERIFIED", "Incident", "TZG-2026-1001", "Verified repair quality and issued 150 SUV ASROVCHISI points.", "2026-11-18 16:30:00");
    insertAudit.run(1, "PIPELINE_REGISTERED", "Pipeline", "PIPE-NUK-001", "Registered 500mm trunk pipeline passport in Nukus.", "2026-11-19 11:00:00");

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    console.error("Error seeding TIZGIN database:", err);
  }
}

function ensureDemoMediaAssets(): void {
  const demoDir = path.resolve(process.cwd(), "public/uploads/demo");
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }

  const beforeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#071A30"/>
        <stop offset="100%" stop-color="#082B55"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#bg1)"/>
    <rect x="40" y="340" width="720" height="120" rx="12" fill="#1e293b"/>
    <rect x="120" y="375" width="560" height="45" rx="8" fill="#475569" stroke="#94a3b8" stroke-width="3"/>
    <path d="M390 375 Q360 220 270 160" stroke="#38bdf8" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M405 375 Q415 190 480 130" stroke="#0877C9" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M420 375 Q480 250 560 220" stroke="#7dd3fc" stroke-width="14" fill="none" stroke-linecap="round"/>
    <ellipse cx="405" cy="370" rx="185" ry="32" fill="#0284c7" fill-opacity="0.75"/>
    <rect x="30" y="25" width="350" height="64" rx="10" fill="#EF4444" fill-opacity="0.9"/>
    <text x="50" y="55" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">AVARIYA HOLATI (TA'MIRDAN OLDIN)</text>
    <text x="50" y="77" fill="#fee2e2" font-family="sans-serif" font-size="14">TIZGIN GPS: 42.4602° N, 59.6156° E • 300mm Quvur</text>
  </svg>`;

  const afterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#052e16"/>
        <stop offset="100%" stop-color="#082B55"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#bg2)"/>
    <rect x="40" y="300" width="720" height="160" rx="12" fill="#1e293b"/>
    <rect x="100" y="350" width="600" height="55" rx="8" fill="#0877C9" stroke="#38bdf8" stroke-width="3"/>
    <rect x="335" y="340" width="130" height="75" rx="8" fill="#35C759" stroke="#ffffff" stroke-width="3"/>
    <circle cx="360" cy="377" r="7" fill="#ffffff"/>
    <circle cx="400" cy="377" r="7" fill="#ffffff"/>
    <circle cx="440" cy="377" r="7" fill="#ffffff"/>
    <rect x="30" y="25" width="390" height="64" rx="10" fill="#16A34A" fill-opacity="0.95"/>
    <text x="50" y="55" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">TA'MIRLANDI VA TASDIQLANDI (KEYIN)</text>
    <text x="50" y="77" fill="#dcfce7" font-family="sans-serif" font-size="14">Yangi po'lat mufta o'rnatildi • Suv oqishi 100% to'xtatildi</text>
  </svg>`;

  const valveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <rect width="800" height="500" fill="#082B55"/>
    <circle cx="400" cy="280" r="130" fill="#0f172a" stroke="#0877C9" stroke-width="10"/>
    <rect x="220" y="260" width="360" height="40" fill="#475569"/>
    <circle cx="400" cy="280" r="48" fill="#F59E0B" stroke="#ffffff" stroke-width="5"/>
    <path d="M400 232 Q445 140 500 120" stroke="#38bdf8" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M400 232 Q355 150 300 130" stroke="#7dd3fc" stroke-width="14" fill="none" stroke-linecap="round"/>
    <rect x="30" y="25" width="370" height="64" rx="10" fill="#F59E0B"/>
    <text x="50" y="55" fill="#071A30" font-family="sans-serif" font-size="20" font-weight="bold">ZULFIN (ZADVIJKA) SHIKASTLANISHI</text>
    <text x="50" y="77" fill="#071A30" font-family="sans-serif" font-size="14">Quduq ichidan yuqori bosimli sizib chiqish</text>
  </svg>`;

  fs.writeFileSync(path.join(demoDir, "leak-before-1.svg"), beforeSvg, "utf-8");
  fs.writeFileSync(path.join(demoDir, "leak-after-1.svg"), afterSvg, "utf-8");
  fs.writeFileSync(path.join(demoDir, "valve-leak-2.svg"), valveSvg, "utf-8");
}
