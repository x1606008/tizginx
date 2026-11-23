// ============================================================================
// TIZGIN — Database Restore Script
// Run via: npm run db:restore -- <backup-filename.db>
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "./data/tizgin.db");
const backupDir = path.resolve(process.cwd(), process.env.BACKUP_DIRECTORY || "./data/backups");

const argFile = process.argv[2];
if (!fs.existsSync(backupDir)) {
  console.error("[TIZGIN RESTORE] No backup directory exists.");
  process.exit(1);
}

const backups = fs.readdirSync(backupDir).filter((f) => f.endsWith(".db")).sort().reverse();
if (backups.length === 0) {
  console.error("[TIZGIN RESTORE] No backup files found in data/backups.");
  process.exit(1);
}

const chosenFile = argFile || backups[0];
const sourcePath = path.isAbsolute(chosenFile) ? chosenFile : path.join(backupDir, chosenFile);

if (!fs.existsSync(sourcePath)) {
  console.error(`[TIZGIN RESTORE] Backup file not found: ${sourcePath}`);
  process.exit(1);
}

fs.copyFileSync(sourcePath, dbPath);
console.log(`[TIZGIN RESTORE] Restored SQLite database from: ${sourcePath} -> ${dbPath}`);
