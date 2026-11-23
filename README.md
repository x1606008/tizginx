# 💧 TIZGIN — Smart Water Management Platform

**Official Taglines:**
- **Uzbek (`uz` — Default):** *Har tomchi hisobda — har bir muammo nazoratda!*
- **Karakalpak (`kaa`):** *Hár tamshı esapta — hár bir mashqala qadaǵalawda!*
- **English (`en`):** *Every Drop Counts — Every Problem Under Control!*
- **Russian (`ru`):** *Каждая капля на счету — каждая проблема под контролем!*

---

## 1. Platform Overview & Core Principle

**TIZGIN** is a production-ready digital water conservation and municipal infrastructure monitoring ecosystem connecting **Citizens**, **Water Supply Employees**, **Brigade Managers**, and **Super Administrators**.

> **Core Principle:**
> `Citizen Report → Digital Verification → Responsible Team Assignment → Repair Deadline → Repair Confirmation → Public Transparency`

*Note: Physical IoT sensors and hardware integrations are intentionally excluded. All infrastructure monitoring is powered by GPS/photo citizen reporting, engineering verification workflows, and the manual Digital Pipeline Passport registry.*

---

## 2. Technology Stack & SQLite Architecture

- **Frontend & Full-Stack Framework:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Maps & GIS:** Interactive Leaflet + OpenStreetMap (`src/components/InteractiveIncidentMap.tsx`)
- **Analytics:** Recharts (`BarChart`, `AreaChart`, regional & SLA efficiency breakdowns)
- **Multilingual (i18n):** Complete 4-language dictionary engine (`messages/uz.json`, `messages/kaa.json`, `messages/en.json`, `messages/ru.json`)
- **Database:** **SQLite** (`data/tizgin.db`) with **WAL Mode** (`PRAGMA journal_mode = WAL;`), **Foreign Key enforcement** (`PRAGMA foreign_keys = ON;`), atomic transactions, automatic backups (`data/backups/`), and Prisma SQLite schema reference (`prisma/schema.prisma`).

### 12 SQLite Database Tables
1. `Users` (RBAC: `CITIZEN`, `EMPLOYEE`, `MANAGER`, `ADMIN`, scrypt password hashes, language & notification preferences)
2. `Regions` (Multilingual region names in `uz`, `kaa`, `en`, `ru`)
3. `Departments` (Regional water utility dispatch centers)
4. `Incidents` (Full lifecycle tracking, GPS coordinates, SLA repair deadlines, delay reasons, AI suggestions)
5. `IncidentMedia` (Citizen report photos/videos, perceptual hashes, Before & After repair evidence)
6. `IncidentHistory` (Append-only immutable audit trail of all lifecycle transitions)
7. `RepairTeams` (Brigades linked to departments and brigade managers)
8. `Notifications` (In-app, email, and Telegram notification logs)
9. `Rewards` (Points awarded strictly upon `VERIFIED` incident status)
10. `Certificates` (Official `SUV ASROVCHISI` certificates with QR verification codes)
11. `Pipelines` (Digital Pipeline Passport registry: material, diameter, installation year, condition, maintenance history)
12. `AuditLogs` (System-wide security and administrative audit log)

---

## 3. Test Accounts for Development & Evaluation

All test accounts are pre-seeded in SQLite (`data/tizgin.db`) with password **`Tizgin2026!`** (and can also be switched with a single click on `/login` or in the top bar of `/dashboard`):

| Role | Full Name | Email | Password | Default Language |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | Aysultan Pirnazarova | `citizen@tizgin.uz` | `Tizgin2026!` | Karakalpak (`kaa`) |
| **Water Supply Employee** | Ruslan Eshmuratov | `employee@tizgin.uz` | `Tizgin2026!` | Karakalpak (`kaa`) |
| **Brigade Manager** | Baxtiyar Nurjanov | `manager@tizgin.uz` | `Tizgin2026!` | Karakalpak (`kaa`) |
| **Super Administrator** | Azamat Qurbanbaev | `admin@tizgin.uz` | `Tizgin2026!` | Uzbek (`uz`) |

---

## 4. REST API Documentation

| Endpoint | Methods | Description |
| :--- | :--- | :--- |
| `/api/auth` | `GET, POST` | User authentication (`login`, `register`, `logout`, `quick_switch`, `update_preferences`) |
| `/api/incidents` | `GET, POST, PATCH` | Create citizen reports (with 150m GPS duplicate detection), filter incidents, update lifecycle (`REPORTED → RECEIVED → ASSIGNED → INSPECTION → REPAIRING → COMPLETED → VERIFIED → CLOSED`), enforce SLA deadlines, and award points |
| `/api/ai-analyze` | `POST` | Upload incident photos/videos and run AI leak classification & duplicate image hash check (clearly marked as engineering suggestions) |
| `/api/pipelines` | `GET, POST` | View and register Digital Pipeline Passports (`PIPE-NUK-001`, etc.) |
| `/api/stats` | `GET` | Real-time SQLite metrics, regional distribution, monthly trends, and estimated water savings |
| `/api/rewards` | `GET, POST` | Citizen leaderboard, points history, and `SUV ASROVCHISI` certificate generation |
| `/api/notifications` | `GET, PATCH` | User notification center and read-status updates |
| `/api/telegram` | `POST` | Telegram Bot webhook & interactive simulator (`/start`, `/report`, `/status`, `/myreports`, `/overdue`, `/summary`) sharing the same SQLite database |
| `/api/admin` | `GET, POST` | Manage users & RBAC roles, departments, repair teams, audit logs, and trigger one-click SQLite database backups |

---

## 5. Installation, Database Commands & Running Locally

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Initialize SQLite database (WAL mode & Foreign Keys)
npm run db:init

# 3. Run automated verification tests
npm test

# 4. Start the development server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

### Backup & Restore SQLite Database
```bash
# Create a timestamped hot backup in ./data/backups/
npm run db:backup

# Restore the latest (or specified) backup
npm run db:restore
```

---

## 6. Production Deployment Instructions

1. **Persistent Disk for SQLite:** Mount a persistent volume at `/app/data` (on Render, Railway, Fly.io, or VPS) and set `DATABASE_PATH="/app/data/tizgin.db"` and `BACKUP_DIRECTORY="/app/data/backups"`.
2. **Environment Variables:** Copy `.env.example` to `.env` and configure a strong `JWT_SECRET` and optional `TELEGRAM_BOT_TOKEN`.
3. **Build & Start:**
   ```bash
   npm run build
   npm start
   ```
