// ============================================================================
// TIZGIN — Database Backup Script
// Run via: npm run db:backup
// ============================================================================

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "./data/tizgin.db");
const backupDir = path.resolve(process.cwd(), process.env.BACKUP_DIRECTORY || "./data/backups");

if (!fs.existsSync(dbPath)) {
  console.error(`[TIZGIN BACKUP] Database file not found at ${dbPath}`);
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

try {
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA wal_checkpoint(FULL);");
  db.close();
} catch (e) {
  console.warn("[TIZGIN BACKUP] Proceeding with file copy...", e.message);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const targetFile = path.join(backupDir, `tizgin-backup-cli-${timestamp}.db`);
fs.copyFileSync(dbPath, targetFile);

console.log(`[TIZGIN BACKUP] Successfully created SQLite backup: ${targetFile}`);
