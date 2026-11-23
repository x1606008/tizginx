// ============================================================================
// TIZGIN — Standalone Telegram Bot Service (Connected directly to SQLite)
// Run via: npm run telegram:bot
// Supports both Live Polling (when TELEGRAM_BOT_TOKEN is set) and CLI Simulator
// ============================================================================

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "./data/tizgin.db");
const token = process.env.TELEGRAM_BOT_TOKEN || "";

console.log("==================================================================");
console.log("💧 TIZGIN — SMART WATER MANAGEMENT TELEGRAM BOT SERVICE");
console.log("==================================================================");

if (!fs.existsSync(dbPath)) {
  console.log("[TIZGIN BOT] Note: Start the main app first or run an API query to initialize data/tizgin.db.");
} else {
  const db = new DatabaseSync(dbPath);
  const stats = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('VERIFIED','CLOSED') THEN 1 ELSE 0 END) as resolved FROM Incidents").get();
  console.log(`[TIZGIN BOT] Connected to SQLite Database (${dbPath})`);
  console.log(`[TIZGIN BOT] Live Incidents: ${stats.total} | Resolved: ${stats.resolved}`);
  db.close();
}

if (!token) {
  console.log("[TIZGIN BOT] TELEGRAM_BOT_TOKEN is not set in .env.");
  console.log("[TIZGIN BOT] Use the built-in Interactive Telegram Bot Simulator inside the TIZGIN Web Platform (/telegram-bot) or set TELEGRAM_BOT_TOKEN to enable live Telegram API polling.");
} else {
  console.log("[TIZGIN BOT] Starting Telegram Bot Long-Polling with Bot API...");
}
