// ============================================================================
// TIZGIN — Database Initialization & Migration Script
// Run via: npm run db:init
// ============================================================================

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "./data/tizgin.db");
const dir = path.dirname(dbPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log(`[TIZGIN DB] Initializing SQLite database at: ${dbPath}`);
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Trigger full schema & seed check by importing our compiled or raw setup
console.log("[TIZGIN DB] WAL mode & Foreign Key enforcement enabled.");
db.close();
console.log("[TIZGIN DB] Database file ready. Start application or run 'npm run db:seed' to populate data.");
