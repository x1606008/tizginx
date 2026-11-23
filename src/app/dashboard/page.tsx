"use client";

// ============================================================================
// TIZGIN — Unified Multi-Role RBAC Command & Control Dashboard (/dashboard)
// Supports all 4 Roles (CITIZEN, EMPLOYEE, MANAGER, ADMIN) and all 10 Modules:
// - Module 1: Citizen Reporting System (Photo upload, AI vision, GPS auto/manual pin, duplicate alert)
// - Module 2: Live Incident & Pipeline GIS Map with filters
// - Module 3: Incident Lifecycle & Immutable Audit Trail (REPORTED -> ... -> VERIFIED -> CLOSED)
// - Module 4: Deadline & Accountability System (SLA timers, overdue escalation, delay reasons)
// - Module 5: AI-Powered Image Analysis (Marked as suggestion requiring engineer verification)
// - Module 6: Water Conservation Statistics & Recharts Analytics
// - Module 7: "SUV ASROVCHISI" Reward & Printable 4-Language Certificate System
// - Module 8: Notification Center & User Channel Preferences
// - Module 9: Interactive Telegram Bot Console (Connected live to SQLite)
// - Module 10: Digital Pipeline Passport Registry (Manual engineering DB, NO IoT sensors)
// ============================================================================

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { InteractiveIncidentMap, MapIncident, MapPipeline } from "@/components/InteractiveIncidentMap";
import { SuvAsrovchisiCertificate } from "@/components/SuvAsrovchisiCertificate";
import { useI18n } from "@/lib/i18n";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from "recharts";
import {
  Droplets,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  BarChart3,
  Bell,
  Send,
  ShieldCheck,
  Database,
  Sparkles,
  Download,
  Printer,
  PlusCircle,
  Search,
  History,
  Star,
  HardDriveDownload,
  Users,
  Building2,
  FileText
} from "lucide-react";

interface FullIncident extends MapIncident {
  citizen_id: number;
  citizen_name?: string;
  citizen_phone?: string;
  assigned_employee_id?: number | null;
  department_id?: number | null;
  region_id?: number;
  region_name_uz?: string;
  estimated_repair_start?: string | null;
  actual_completion?: string | null;
  delay_reason?: string | null;
  hours_remaining?: number | null;
  citizen_rating?: number | null;
  citizen_feedback?: string | null;
  is_demo?: number;
  created_at: string;
  ai_analysis?: {
    isSuggestedOnly: boolean;
    confidence: number;
    detectedIssue: string;
    suggestedCategory: string;
    suggestedPriority: string;
    estimatedLossLitersPerHour: number;
  } | null;
  media: Array<{ id: number; file_path: string; media_type: string; uploaded_at: string }>;
  history: Array<{
    id: number;
    previous_status: string;
    new_status: string;
    notes: string;
    changed_by_name?: string;
    changed_by_role?: string;
    created_at: string;
  }>;
}

function DashboardContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    preferred_language: string;
    region_id: number | null;
  }>({
    id: 7,
    full_name: "Aysultan Pirnazarova",
    email: "citizen@tizgin.uz",
    phone: "+998 90 592 14 77",
    role: "CITIZEN",
    preferred_language: "kaa",
    region_id: 1
  });

  const [demoAccounts, setDemoAccounts] = useState<
    Array<{ id: number; full_name: string; email: string; role: string; region_name?: string }>
  >([]);
  const [incidents, setIncidents] = useState<FullIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<FullIncident | null>(null);
  const [regions, setRegions] = useState<Array<{ id: number; name_uz: string; name_kaa: string; name_en: string; name_ru: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; full_name: string; role: string }>>([]);
  const [pipelines, setPipelines] = useState<
    Array<
      MapPipeline & {
        length_m: number;
        maintenance_history: string;
        region_name_uz?: string;
      }
    >
  >([]);

  // Analytics & Stats
  const [statsData, setStatsData] = useState<{
    summary: {
      totalReports: number;
      confirmedIncidents: number;
      resolvedIncidents: number;
      pendingIncidents: number;
      overdueIncidents: number;
      avgRepairTimeHours: number;
      estimatedWaterLitersPrevented: number;
      activeCitizensCount: number;
      registeredPipelinesCount: number;
    };
    regionalDistribution: Array<{ shortName: string; total: number; resolved: number; active: number }>;
    monthlyTrends: Array<{ month: string; reported: number; resolved: number; estimatedSavedM3: number }>;
    departmentPerformance: Array<{ id: number; name: string; totalAssigned: number; resolvedCount: number; efficiencyPercent: number }>;
    topCitizens: Array<{ id: number; full_name: string; region_name: string; total_points: number; reports_count: number }>;
  } | null>(null);

  // Rewards & Certificates
  const [rewardsData, setRewardsData] = useState<{
    leaderboard: Array<{ id: number; full_name: string; region_name_uz: string; total_points: number; verified_reports: number }>;
    certificates: Array<{
      id: number;
      user_name: string;
      certificate_number: string;
      verification_code: string;
      issue_date: string;
      user_points: number;
      verified_count: number;
    }>;
  } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<
    Array<{ id: number; title: string; message: string; notification_type: string; is_read: number; created_at: string }>
  >([]);

  // Admin Data
  const [adminData, setAdminData] = useState<{
    users: Array<{ id: number; full_name: string; email: string; phone: string; role: string; region_name: string }>;
    departments: Array<{ id: number; name: string; region_name: string; contact_information: string }>;
    repairTeams: Array<{ id: number; name: string; department_name: string; manager_name: string; specialization: string }>;
    auditLogs: Array<{ id: number; user_name: string; user_role: string; action: string; entity_type: string; entity_id: string; details: string; created_at: string }>;
    backups: Array<{ fileName: string; sizeBytes: number; createdAt: string }>;
  } | null>(null);

  // Map Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRegion, setFilterRegion] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPipelinesOnMap, setShowPipelinesOnMap] = useState(true);

  // Module 1: Report Form State
  const [reportCategory, setReportCategory] = useState("BROKEN_PIPE");
  const [reportPriority, setReportPriority] = useState("HIGH");
  const [reportRegionId, setReportRegionId] = useState(1);
  const [reportAddress, setReportAddress] = useState("Nukus sh., A. Dosnazarov ko'chasi, 64-uy oldi");
  const [reportLat, setReportLat] = useState(42.4612);
  const [reportLng, setReportLng] = useState(59.6168);
  const [reportDescription, setReportDescription] = useState("");
  const [reportPhotoUrl, setReportPhotoUrl] = useState("/uploads/demo/leak-before-1.svg");
  const [aiResult, setAiResult] = useState<{
    isSuggestedOnly: boolean;
    aiProvider?: string;
    disclaimer: string;
    confidence: number;
    detectedIssue: string;
    suggestedCategory: string;
    suggestedPriority: string;
    estimatedLossLitersPerHour: number;
    engineeringRecommendation?: string;
    isDuplicatePhoto: boolean;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [submittedIncidentAlert, setSubmittedIncidentAlert] = useState<{
    incident_number: string;
    duplicate_warning: string | null;
  } | null>(null);

  // Module 3 & 4: Lifecycle Update State
  const [updateStatusVal, setUpdateStatusVal] = useState("ASSIGNED");
  const [updateEmployeeVal, setUpdateEmployeeVal] = useState<number>(4);
  const [updateDeadlineVal, setUpdateDeadlineVal] = useState("2026-11-25T16:00");
  const [updateDelayReasonVal, setUpdateDelayReasonVal] = useState("");
  const [updateNotesVal, setUpdateNotesVal] = useState("");
  const [updateAfterPhoto, setUpdateAfterPhoto] = useState("");
  const [citizenRatingVal, setCitizenRatingVal] = useState(5);
  const [citizenFeedbackVal, setCitizenFeedbackVal] = useState("Muammo tez va sifatli bartaraf etildi!");
  const [statusMessage, setStatusMessage] = useState("");

  // Module 9: Interactive Telegram Bot Console State
  const [tgMessages, setTgMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "💧 TIZGIN Official Telegram Bot (@TizginWaterBot) ishga tushdi!\nSQLite bazasi bilan bevosita bog'langan. Buyruqlarni bosing yoki yozing: /start, /report, /status TZG-2026-1002, /myreports, /overdue, /summary",
      time: "14:00"
    }
  ]);
  const [tgInput, setTgInput] = useState("/status TZG-2026-1002");

  // Module 10: New Pipeline Passport Form State
  const [newPipeCode, setNewPipeCode] = useState("PIPE-NUK-009");
  const [newPipeRegion, setNewPipeRegion] = useState(1);
  const [newPipeAddress, setNewPipeAddress] = useState("Nukus sh., Amir Temur ko'chasi, 45-uy");
  const [newPipeType, setNewPipeType] = useState("HDPE PE-100 (Polietilen SDR-11)");
  const [newPipeDiameter, setNewPipeDiameter] = useState(350);
  const [newPipeLength, setNewPipeLength] = useState(2400);
  const [newPipeYear, setNewPipeYear] = useState(2020);
  const [newPipeCondition, setNewPipeCondition] = useState("OPTIMAL");
  const [newPipeHistory, setNewPipeHistory] = useState("2026-11: Yillik gidravlik bosim sinovidan o'tgan.");

  const loadAllData = async () => {
    try {
      const [authRes, incRes, statRes, pipeRes, rewRes, notifRes, admRes] = await Promise.all([
        fetch("/api/auth"),
        fetch("/api/incidents"),
        fetch("/api/stats"),
        fetch("/api/pipelines"),
        fetch("/api/rewards"),
        fetch("/api/notifications"),
        fetch("/api/admin")
      ]);

      if (authRes.ok) {
        const d = await authRes.json();
        if (d.user) setCurrentUser(d.user);
        if (d.demoAccounts) setDemoAccounts(d.demoAccounts);
      }
      if (incRes.ok) {
        const d = await incRes.json();
        setIncidents(d.incidents || []);
        setRegions(d.regions || []);
        setEmployees(d.employees || []);
        if (d.incidents && d.incidents.length > 0 && !selectedIncident) {
          setSelectedIncident(d.incidents[0]);
          setUpdateStatusVal(d.incidents[0].status);
        }
      }
      if (statRes.ok) {
        setStatsData(await statRes.json());
      }
      if (pipeRes.ok) {
        const d = await pipeRes.json();
        setPipelines(d.pipelines || []);
      }
      if (rewRes.ok) {
        setRewardsData(await rewRes.json());
      }
      if (notifRes.ok) {
        const d = await notifRes.json();
        setNotifications(d.notifications || []);
      }
      if (admRes.ok) {
        setAdminData(await admRes.json());
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
    const roleParam = searchParams.get("role");
    if (roleParam && ["CITIZEN", "EMPLOYEE", "MANAGER", "ADMIN"].includes(roleParam)) {
      const emailMap: Record<string, string> = {
        CITIZEN: "citizen@tizgin.uz",
        EMPLOYEE: "employee@tizgin.uz",
        MANAGER: "manager@tizgin.uz",
        ADMIN: "admin@tizgin.uz"
      };
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quick_switch", email: emailMap[roleParam] })
      }).then(() => loadAllData());
    }
  }, [searchParams]);

  // Quick Role Switcher Handler
  const handleQuickRoleSwitch = async (userId: number) => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quick_switch", userId })
    });
    await loadAllData();
    setStatusMessage("Faol profil muvaffaqiyatli almashtirildi!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // Auto-detect GPS Location
  const handleDetectGps = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setReportLat(Math.round(pos.coords.latitude * 100000) / 100000);
          setReportLng(Math.round(pos.coords.longitude * 100000) / 100000);
          setStatusMessage("GPS koordinatalar qurilmangizdan aniqlandi!");
        },
        () => {
          // Fallback to Nukus coordinates if browser blocks permission
          setReportLat(42.4609);
          setReportLng(59.6151);
          setStatusMessage("GPS koordinatalar (Nukus markazi: 42.4609, 59.6151) o'rnatildi.");
        }
      );
    }
  };

  // Module 5: AI Image Upload & Analysis Handler
  const handleFileUploadAndAi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", reportDescription || file.name);

      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiResult(data.analysis);
        setReportPhotoUrl(data.analysis.uploadedFileUrl);
        setReportCategory(data.analysis.suggestedCategory);
        setReportPriority(data.analysis.suggestedPriority);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunHeuristicAi = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "water-pipe-leak.jpg",
          description: reportDescription || "Broken drinking water pipe leaking on street",
          photo_url: reportPhotoUrl
        })
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiResult(data.analysis);
        setReportCategory(data.analysis.suggestedCategory);
        setReportPriority(data.analysis.suggestedPriority);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Module 1: Submit New Citizen Incident Report
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    setSubmittedIncidentAlert(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizen_id: currentUser.id,
          category: reportCategory,
          priority: reportPriority,
          region_id: reportRegionId,
          address: reportAddress,
          latitude: reportLat,
          longitude: reportLng,
          description: reportDescription || "Ichimlik suvi quvuridan kuchli suv oqishi aniqlandi.",
          photo_url: reportPhotoUrl,
          ai_analysis: aiResult
        })
      });
      const data = await res.json();
      if (res.ok && data.incident) {
        setSubmittedIncidentAlert(data.incident);
        setReportDescription("");
        await loadAllData();
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  // Module 3 & 4: Update Incident Status, Assignment, Deadline & Authorize Citizen Certificate
  const handleUpdateIncidentLifecycle = async (overrideStatus?: string, authorizeCert = false) => {
    if (!selectedIncident) return;
    const targetSt = overrideStatus || updateStatusVal;
    const res = await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_id: selectedIncident.id,
        actor_id: currentUser.id,
        new_status: targetSt,
        authorize_certificate: authorizeCert,
        assigned_employee_id: updateEmployeeVal,
        estimated_completion: updateDeadlineVal ? new Date(updateDeadlineVal).toISOString() : undefined,
        delay_reason: updateDelayReasonVal || undefined,
        notes:
          updateNotesVal ||
          (authorizeCert
            ? `Ta'mirlash ishlari xodim (${currentUser.full_name}) tomonidan to'liq yakunlandi. Fuqaro (${selectedIncident.citizen_name}) ga ish bajarilganligi haqida xabar yuborildi va «SUV ASROVCHISI» PDF sertifikatini olishga ruxsat berildi!`
            : `Holat ${currentUser.full_name} (${currentUser.role}) tomonidan ${targetSt} ga o'zgartirildi.`),
        after_photo_url: updateAfterPhoto || (authorizeCert ? "/uploads/demo/leak-after-1.svg" : undefined)
      })
    });
    if (res.ok) {
      setStatusMessage(
        authorizeCert
          ? `✅ #${selectedIncident.incident_number}: Ta'mir yakunlandi! Murojaat egasi (${selectedIncident.citizen_name}) ga xabar va PDF sertifikat olish ruxsati berildi!`
          : `#${selectedIncident.incident_number} holati ${targetSt} ga muvaffaqiyatli yangilandi!`
      );
      setUpdateNotesVal("");
      await loadAllData();
      const updatedRes = await fetch("/api/incidents");
      const updatedJson = await updatedRes.json();
      const found = (updatedJson.incidents || []).find((i: FullIncident) => i.id === selectedIncident.id);
      if (found) setSelectedIncident(found);
      setTimeout(() => setStatusMessage(""), 5000);
    }
  };

  // Citizen Service Rating Handler
  const handleRateIncident = async () => {
    if (!selectedIncident) return;
    const res = await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_id: selectedIncident.id,
        actor_id: currentUser.id,
        citizen_rating: citizenRatingVal,
        citizen_feedback: citizenFeedbackVal
      })
    });
    if (res.ok) {
      setStatusMessage("Bahoyingiz va fikringiz saqlandi! Rahmat!");
      await loadAllData();
    }
  };

  // Export Incidents to Excel-Compatible CSV
  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Incident_Number",
      "Status",
      "Priority",
      "Category",
      "Address",
      "Latitude",
      "Longitude",
      "Department",
      "Assigned_Engineer",
      "Estimated_Deadline",
      "Overdue",
      "Created_At"
    ];
    const rows = incidents.map((i) => [
      i.id,
      i.incident_number,
      i.status,
      i.priority,
      i.category,
      `"${String(i.address).replace(/"/g, '""')}"`,
      i.latitude,
      i.longitude,
      `"${String(i.department_name || "").replace(/"/g, '""')}"`,
      `"${String(i.employee_name || "").replace(/"/g, '""')}"`,
      i.estimated_completion || "",
      i.is_overdue ? "OVERDUE" : "ON_TIME",
      i.created_at
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tizgin-incidents-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Module 9: Send Telegram Bot Command
  const handleSendTelegramCommand = async (cmdOverride?: string) => {
    const cmd = cmdOverride || tgInput;
    if (!cmd.trim()) return;
    const nowTime = new Date().toTimeString().slice(0, 5);
    setTgMessages((prev) => [...prev, { sender: "user", text: cmd, time: nowTime }]);
    if (!cmdOverride) setTgInput("");

    const res = await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd, lang: currentUser.preferred_language })
    });
    const data = await res.json();
    if (data.botReply) {
      setTgMessages((prev) => [...prev, { sender: "bot", text: data.botReply, time: nowTime }]);
    }
    if (cmd.startsWith("/report")) {
      await loadAllData();
    }
  };

  // Module 10: Create Digital Pipeline Passport
  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipeline_code: newPipeCode,
        region_id: newPipeRegion,
        address: newPipeAddress,
        pipeline_type: newPipeType,
        diameter_mm: newPipeDiameter,
        length_m: newPipeLength,
        installation_year: newPipeYear,
        technical_condition: newPipeCondition,
        maintenance_history: newPipeHistory
      })
    });
    if (res.ok) {
      setStatusMessage(`Quvur pasporti (${newPipeCode}) SQLite bazasiga qo'shildi!`);
      setNewPipeCode(`PIPE-NUK-0${pipelines.length + 10}`);
      await loadAllData();
    }
  };

  // Admin SQLite Backup Trigger
  const handleTriggerSqliteBackup = async () => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "backup_db" })
    });
    const data = await res.json();
    if (res.ok && data.backup) {
      setStatusMessage(`SQLite zaxira nusxasi yaratildi: ${data.backup.fileName}`);
      await loadAllData();
    }
  };

  const isEmployeeCabinet = currentUser.role !== "CITIZEN";

  // Filtered incidents for Live Map & List
  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus !== "ALL") {
      if (filterStatus === "OVERDUE" && !inc.is_overdue) return false;
      if (filterStatus !== "OVERDUE" && inc.status !== filterStatus) return false;
    }
    if (filterRegion !== "ALL" && String(inc.region_id) !== String(filterRegion)) return false;
    if (filterCategory !== "ALL" && inc.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        inc.incident_number.toLowerCase().includes(q) ||
        inc.address.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FC] dark:bg-[#071A30]">
      <Navbar currentUser={currentUser} onSelectSection={(sec) => setActiveTab(sec)} />

      {/* Top Role Switcher & Active RBAC Context Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#082B55] to-[#0877C9] text-white flex items-center justify-center font-black text-sm shadow">
              {currentUser.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#082B55] dark:text-white">
                  {t("dashboard.welcome")}, {currentUser.full_name}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                    currentUser.role === "ADMIN"
                      ? "bg-rose-500 text-white"
                      : currentUser.role === "MANAGER"
                      ? "bg-amber-500 text-white"
                      : currentUser.role === "EMPLOYEE"
                      ? "bg-[#0877C9] text-white"
                      : "bg-[#35C759] text-[#071A30]"
                  }`}
                >
                  {t(`roles.${currentUser.role}`)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser.email} • {currentUser.phone}
              </div>
            </div>
          </div>

          {/* Instant 2-Cabinet Switcher: 1 Citizen Test Account & 1 Employee Test Account */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
              Kabinetni tanlash (2 ta Test Akkaunt):
            </span>
            {demoAccounts.map((acc) => {
              const isEmp = acc.role !== "CITIZEN";
              const isActive = currentUser.id === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    handleQuickRoleSwitch(acc.id);
                    if (!isEmp && ["pipelines", "admin", "analytics"].includes(activeTab)) {
                      setActiveTab("overview");
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${
                    isActive
                      ? isEmp
                        ? "bg-[#0877C9] text-white border-[#0877C9] shadow-md ring-2 ring-[#0877C9]/30"
                        : "bg-[#35C759] text-[#071A30] border-[#35C759] shadow-md ring-2 ring-[#35C759]/40"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{isEmp ? "🛠️ XODIM KABINETI" : "👤 FUQARO KABINETI"}</span>
                  <span className="opacity-80 font-normal">({acc.email})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Toast Feedback */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div className="p-3.5 rounded-2xl bg-[#16A34A] text-white text-xs sm:text-sm font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
            <button type="button" onClick={() => setStatusMessage("")} className="text-xs underline">
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout: Navigation Tabs + Active Module Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* Module Navigation Pill Tabs — Strict Separation between Citizen Cabinet & Employee Cabinet */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
          {(isEmployeeCabinet
            ? [
                // EMPLOYEE CABINET: Employee does NOT receive certificates; Employee completes work & grants Citizen permission
                { id: "overview", label: "🛠️ Xodim Paneli (Umumiy)", icon: BarChart3 },
                { id: "incidents", label: "🛠️ Avariyalar, Ta'mir va Sertifikat Ruxsati", icon: Clock },
                { id: "pipelines", label: "🛠️ Quvurlar Raqamli Pasporti", icon: Database },
                { id: "analytics", label: "🛠️ Analitika va Suv Tejash", icon: Droplets },
                { id: "admin", label: "🛠️ Brigada, Bo'limlar va Audit", icon: ShieldCheck },
                { id: "report", label: "👤 Fuqaro Funksiyasi: Yangi Xabar Yuborish", icon: PlusCircle },
                { id: "map", label: "🌍 Jonli Xarita", icon: MapPin },
                { id: "rewards", label: "📜 Fuqarolarga Berilgan Sertifikatlar Reestri", icon: Award },
                { id: "telegram", label: "✈️ Telegram Bot", icon: Send },
                { id: "notifications", label: `${t("dashboard.tabNotifications")} (${unreadCount})`, icon: Bell }
              ]
            : [
                // CITIZEN CABINET: Strictly Citizen functions + Personal PDF Certificate Download
                { id: "overview", label: "👤 Fuqaro Kabineti", icon: BarChart3 },
                { id: "report", label: "💧 Suv Oqishini Xabar Qilish", icon: PlusCircle },
                { id: "incidents", label: "📋 Mening Murojaatlarim va Kuzatuv", icon: Clock },
                { id: "map", label: "🗺️ Yaqin Atrofdagi Avariyalar Xaritasi", icon: MapPin },
                { id: "rewards", label: "🏅 Mening «SUV ASROVCHISI» PDF Sertifikatim", icon: Award },
                { id: "telegram", label: "✈️ Telegram Bot", icon: Send },
                { id: "notifications", label: `${t("dashboard.tabNotifications")} (${unreadCount})`, icon: Bell }
              ]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#082B55] to-[#0877C9] text-white shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =====================================================================
            TAB 1: OVERVIEW (Role-Tailored Executive Summary + Recent Incidents)
        ===================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">{t("stats.totalReports")}</div>
                <div className="text-2xl font-black text-[#082B55] dark:text-white mt-1">
                  {statsData?.summary.totalReports ?? incidents.length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">{t("stats.resolvedIncidents")}</div>
                <div className="text-2xl font-black text-[#16A34A] mt-1">
                  {statsData?.summary.resolvedIncidents ?? 3}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">{t("stats.pendingIncidents")}</div>
                <div className="text-2xl font-black text-[#0877C9] mt-1">
                  {statsData?.summary.pendingIncidents ?? 4}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xs">
                <div className="text-xs text-rose-600 font-bold">{t("stats.overdueIncidents")}</div>
                <div className="text-2xl font-black text-[#EF4444] mt-1">
                  {statsData?.summary.overdueIncidents ?? 1}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">{t("stats.avgRepairTime")}</div>
                <div className="text-2xl font-black text-[#082B55] dark:text-sky-300 mt-1">
                  {statsData?.summary.avgRepairTimeHours ?? 6.8} {t("stats.hoursUnit")}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                <div className="text-xs text-emerald-600 font-bold">{t("stats.estimatedWaterSaved")}</div>
                <div className="text-2xl font-black text-[#35C759] mt-1">
                  {(statsData?.summary.estimatedWaterLitersPrevented ?? 65500).toLocaleString()} L
                </div>
              </div>
            </div>

            {/* Cabinet Mode Banner & Role-Specific Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#082B55] dark:text-white">
                <ShieldCheck className={`w-5 h-5 ${isEmployeeCabinet ? "text-[#0877C9]" : "text-[#35C759]"}`} />
                {isEmployeeCabinet ? (
                  <span>
                    🛠️ <strong>XODIM KABINETI ({currentUser.full_name}):</strong> Xodimning barcha ta&apos;mir, muddat, quvur pasporti va tasdiqlash funksiyalari + Fuqaro murojaat yuborish funksiyasi biriktirilgan.
                  </span>
                ) : (
                  <span>
                    👤 <strong>FUQARO KABINETI ({currentUser.full_name}):</strong> Faqat fuqarolar uchun (Suv oqishini xabar qilish, Xarita, Mening murojaatlarim va «SUV ASROVCHISI» sertifikati). Xodim funksiyalari yopiq!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("report")}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#35C759] text-[#071A30] hover:opacity-95 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t("nav.reportLeak")}</span>
                </button>

                {/* Employee-ONLY Export & Database Backup Buttons (Hidden in Citizen Cabinet) */}
                {isEmployeeCabinet && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0877C9] text-white hover:opacity-95 flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t("dashboard.exportCsvBtn")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{t("dashboard.exportPdfBtn")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerSqliteBackup}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#082B55] text-white hover:opacity-95 flex items-center gap-1.5"
                    >
                      <HardDriveDownload className="w-4 h-4 text-[#35C759]" />
                      <span>{t("dashboard.backupDbBtn")}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Split Grid: Interactive Map + Incident Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-base font-extrabold text-[#082B55] dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#EF4444]" />
                  <span>{t("map.title")}</span>
                </h3>
                <InteractiveIncidentMap
                  incidents={incidents}
                  pipelines={pipelines}
                  showPipelines={true}
                  onSelectIncident={(inc) => {
                    const full = incidents.find((i) => i.id === inc.id);
                    if (full) {
                      setSelectedIncident(full);
                      setActiveTab("incidents");
                    }
                  }}
                  height="430px"
                />
              </div>

              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#082B55] dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0877C9]" />
                    <span>So‘nggi Murojaatlar va SLA Muddatlari</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("incidents")}
                    className="text-xs font-bold text-[#0877C9] hover:underline"
                  >
                    Barchasini boshqarish →
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => {
                        setSelectedIncident(inc);
                        setUpdateStatusVal(inc.status);
                        setActiveTab("incidents");
                      }}
                      className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0877C9] transition-all shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs text-[#082B55] dark:text-sky-300">
                            #{inc.incident_number}
                          </span>
                          {inc.is_demo ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                              DEMO
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600">
                              LIVE
                            </span>
                          )}
                          {inc.is_overdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EF4444] text-white animate-pulse">
                              ⚠️ {t("dashboard.overdueAlert")}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            ["VERIFIED", "COMPLETED"].includes(inc.status)
                              ? "bg-[#16A34A]/15 text-[#16A34A]"
                              : inc.status === "REPAIRING"
                              ? "bg-[#0877C9]/15 text-[#0877C9]"
                              : inc.status === "REPORTED"
                              ? "bg-[#EF4444]/15 text-[#EF4444]"
                              : "bg-[#F59E0B]/15 text-[#F59E0B]"
                          }`}
                        >
                          {t(`statuses.${inc.status}`)}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{inc.address}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {inc.description}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                        <span>{t(`categories.${inc.category}`)}</span>
                        <span>Mas&apos;ul: {inc.employee_name || "Navbatchi dispetcher"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: MODULE 1 & MODULE 5 — CITIZEN REPORTING + AI VISION ANALYSIS
        ===================================================================== */}
        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#35C759]/15 text-[#16A34A]">
                  MODULE 1 &amp; MODULE 5 • GPS + AI VISION
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#082B55] dark:text-white mt-2">
                  {t("reportForm.title")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("reportForm.subtitle")}</p>
              </div>

              {submittedIncidentAlert && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-[#16A34A] space-y-2">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-[#16A34A]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t("reportForm.successTitle")}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    {t("reportForm.incidentIdLabel")}{" "}
                    <span className="font-mono text-base text-[#0877C9]">
                      #{submittedIncidentAlert.incident_number}
                    </span>
                  </div>
                  {submittedIncidentAlert.duplicate_warning && (
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      ⚠️ {t("reportForm.duplicateWarning")} #{submittedIncidentAlert.duplicate_warning}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmitIncident} className="space-y-4">
                {/* Step 1: Upload Photo & AI Image Analysis */}
                <div className="p-4 rounded-2xl bg-[#F4F8FC] dark:bg-slate-800/70 border border-dashed border-[#0877C9]/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-[#082B55] dark:text-white">
                      1. {t("reportForm.uploadLabel")}
                    </label>
                    <button
                      type="button"
                      onClick={handleRunHeuristicAi}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#082B55] text-white hover:bg-[#0877C9] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#35C759]" />
                      <span>{aiLoading ? "AI tahlil qilmoqda..." : t("reportForm.aiAnalyzeBtn")}</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUploadAndAi}
                    className="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0877C9] file:text-white hover:file:bg-[#082B55]"
                  />
                  <p className="text-[11px] text-slate-500">{t("reportForm.uploadHint")}</p>

                  {/* AI Analysis Output Box */}
                  {aiResult && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0877C9]">
                          <Sparkles className="w-3.5 h-3.5" />
                          {t("reportForm.aiBadge")}
                          {aiResult.aiProvider ? ` • ${aiResult.aiProvider}` : ""}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600">
                          Ishonchlilik: {Math.round(aiResult.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Aniqlangan holat: {aiResult.detectedIssue}
                      </div>
                      {aiResult.engineeringRecommendation && (
                        <div className="text-xs text-[#0877C9] dark:text-sky-300 font-semibold">
                          🔧 Brigada uchun AI tavsiyasi: {aiResult.engineeringRecommendation}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        • Tavsiya etilgan toifa: <strong>{t(`categories.${aiResult.suggestedCategory}`)}</strong> |
                        Muhimlik: <strong>{t(`priorities.${aiResult.suggestedPriority}`)}</strong> | Taxminiy suv
                        yo‘qotilishi: ~<strong>{aiResult.estimatedLossLitersPerHour} L/soat</strong>
                      </div>
                      <div className="text-[10px] italic text-amber-600 dark:text-amber-400">
                        ⚠️ {aiResult.disclaimer}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Region & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      2. {t("reportForm.regionLabel")}
                    </label>
                    <select
                      value={reportRegionId}
                      onChange={(e) => setReportRegionId(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold"
                    >
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name_uz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      3. {t("reportForm.categoryLabel")}
                    </label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold"
                    >
                      <option value="BROKEN_PIPE">{t("categories.BROKEN_PIPE")}</option>
                      <option value="WATER_LEAKAGE">{t("categories.WATER_LEAKAGE")}</option>
                      <option value="DAMAGED_INFRASTRUCTURE">{t("categories.DAMAGED_INFRASTRUCTURE")}</option>
                      <option value="CONTINUOUS_FLOW">{t("categories.CONTINUOUS_FLOW")}</option>
                      <option value="DAMAGED_VALVE">{t("categories.DAMAGED_VALVE")}</option>
                      <option value="OTHER">{t("categories.OTHER")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      4. {t("reportForm.addressLabel")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={reportAddress}
                      onChange={(e) => setReportAddress(e.target.value)}
                      placeholder={t("reportForm.addressPlaceholder")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      5. {t("reportForm.priorityLabel")}
                    </label>
                    <select
                      value={reportPriority}
                      onChange={(e) => setReportPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold"
                    >
                      <option value="LOW">{t("priorities.LOW")}</option>
                      <option value="MEDIUM">{t("priorities.MEDIUM")}</option>
                      <option value="HIGH">{t("priorities.HIGH")}</option>
                      <option value="CRITICAL">{t("priorities.CRITICAL")}</option>
                    </select>
                  </div>
                </div>

                {/* Step 3: GPS Coordinates */}
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      6. {t("reportForm.gpsLabel")}
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0877C9] text-white hover:bg-[#082B55]"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{t("reportForm.detectGpsBtn")}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500">Latitude (Kenglik):</span>
                      <input
                        type="number"
                        step="0.00001"
                        value={reportLat}
                        onChange={(e) => setReportLat(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Longitude (Uzunlik):</span>
                      <input
                        type="number"
                        step="0.00001"
                        value={reportLng}
                        onChange={(e) => setReportLng(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#0877C9] dark:text-sky-400 font-medium">
                    💡 {t("reportForm.gpsClickHint")}
                  </p>
                </div>

                {/* Step 4: Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    7. {t("reportForm.descriptionLabel")} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder={t("reportForm.descriptionPlaceholder")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-[#071A30] bg-[#35C759] hover:bg-[#2eb850] shadow-lg transition-all"
                >
                  {reportSubmitting ? t("reportForm.submitting") : t("reportForm.submitBtn")}
                </button>
              </form>
            </div>

            {/* Right Column: Interactive Map Pin Picker */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#35C759]" />
                  <span>GPS Nuqtani Xaritada Belgilash (Click to Adjust Pin)</span>
                </h3>
                <InteractiveIncidentMap
                  incidents={incidents}
                  selectedPin={{ lat: reportLat, lng: reportLng }}
                  onPickLocation={(lat, lng) => {
                    setReportLat(lat);
                    setReportLng(lng);
                  }}
                  height="420px"
                />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: MODULE 3 & MODULE 4 — INCIDENT LIFECYCLE, SLA DEADLINES & AUDIT TRAIL
        ===================================================================== */}
        {activeTab === "incidents" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left List of Incidents */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#082B55] dark:text-white">
                  Murojaatlar Reestri ({filteredIncidents.length})
                </h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="ALL">{t("map.filterStatus")}</option>
                  <option value="OVERDUE">⚠️ {t("dashboard.overdueAlert")}</option>
                  <option value="REPORTED">{t("statuses.REPORTED")}</option>
                  <option value="ASSIGNED">{t("statuses.ASSIGNED")}</option>
                  <option value="INSPECTION">{t("statuses.INSPECTION")}</option>
                  <option value="REPAIRING">{t("statuses.REPAIRING")}</option>
                  <option value="COMPLETED">{t("statuses.COMPLETED")}</option>
                  <option value="VERIFIED">{t("statuses.VERIFIED")}</option>
                  <option value="CLOSED">{t("statuses.CLOSED")}</option>
                </select>
              </div>

              <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                {filteredIncidents.map((inc) => {
                  const isSel = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => {
                        setSelectedIncident(inc);
                        setUpdateStatusVal(inc.status);
                        setUpdateEmployeeVal(Number(inc.assigned_employee_id) || 4);
                        setUpdateDelayReasonVal(inc.delay_reason || "");
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSel
                          ? "bg-[#0877C9]/10 border-[#0877C9] shadow-sm"
                          : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-black text-xs text-[#082B55] dark:text-sky-300">
                          #{inc.incident_number}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {inc.is_overdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EF4444] text-white">
                              OVERDUE
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#082B55] text-white">
                            {t(`statuses.${inc.status}`)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">{inc.address}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {inc.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Inspector, Lifecycle Controls, Before/After Photos & Immutable Audit Trail */}
            <div className="lg:col-span-7 space-y-5">
              {selectedIncident ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  {/* Top Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black font-mono text-[#082B55] dark:text-sky-300">
                          #{selectedIncident.incident_number}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#0877C9] text-white">
                          {t(`statuses.${selectedIncident.status}`)}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t(`priorities.${selectedIncident.priority}`)}
                        </span>
                        {selectedIncident.is_overdue && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#EF4444] text-white">
                            🚨 {t("dashboard.overdueAlert")}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                        {selectedIncident.address}
                      </h3>
                      <p className="text-xs text-slate-500">
                        GPS: {selectedIncident.latitude}, {selectedIncident.longitude} • Yuborilgan vaqt:{" "}
                        {selectedIncident.created_at}
                      </p>
                    </div>
                  </div>

                  {/* Lifecycle Pipeline Stepper */}
                  <div>
                    <div className="text-xs font-extrabold uppercase text-slate-500 mb-2">
                      To‘liq Avariya Hayotiy Sikli (Incident Lifecycle):
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        "REPORTED",
                        "RECEIVED",
                        "ASSIGNED",
                        "INSPECTION",
                        "REPAIRING",
                        "COMPLETED",
                        "VERIFIED",
                        "CLOSED"
                      ].map((st) => {
                        const isCurrent = selectedIncident.status === st;
                        return (
                          <span
                            key={st}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                              isCurrent
                                ? "bg-[#35C759] text-[#071A30] ring-2 ring-[#082B55]"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {t(`statuses.${st}`)}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details & SLA Deadline Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F4F8FC] dark:bg-slate-800/70 text-xs">
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-slate-500">Toifa:</span>{" "}
                        <strong>{t(`categories.${selectedIncident.category}`)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Murojaatchi:</span>{" "}
                        <strong>{selectedIncident.citizen_name}</strong> ({selectedIncident.citizen_phone})
                      </div>
                      <div>
                        <span className="text-slate-500">Mas&apos;ul bo‘lim:</span>{" "}
                        <strong>{selectedIncident.department_name}</strong>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-slate-500">Mas&apos;ul muhandis:</span>{" "}
                        <strong>{selectedIncident.employee_name || "Biriktirilmagan"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Ta&apos;mir muddati (Deadline):</span>{" "}
                        <strong className={selectedIncident.is_overdue ? "text-[#EF4444]" : "text-[#16A34A]"}>
                          {selectedIncident.estimated_completion
                            ? selectedIncident.estimated_completion.slice(0, 16).replace("T", " ")
                            : "Belgilanmagan"}
                        </strong>
                      </div>
                      {selectedIncident.delay_reason && (
                        <div className="text-rose-600 dark:text-rose-400 font-bold">
                          Kechikish sababi: {selectedIncident.delay_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photographs (Before & After Evidence) */}
                  <div>
                    <div className="text-xs font-extrabold text-[#082B55] dark:text-white mb-2">
                      Foto-dalillar (Ta&apos;mirdan Oldin va Keyin):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedIncident.media.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950"
                        >
                          <img
                            src={m.file_path}
                            alt={m.media_type}
                            className="w-full h-44 object-cover"
                          />
                          <div className="p-2 text-[11px] font-bold text-white flex items-center justify-between bg-[#082B55]">
                            <span>{m.media_type}</span>
                            <span className="text-sky-200">{m.uploaded_at.slice(0, 16)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Employee-ONLY Lifecycle & Deadline Update Panel (Strictly Hidden in Citizen Cabinet) */}
                  {isEmployeeCabinet ? (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-[#0877C9]/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#082B55] dark:text-white">
                            🛠️ XODIM FUNKSIYASI: Ta&apos;mirni Boshqarish va Fuqaroga Sertifikat Ruxsatini Berish
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Eslatma: Xodimga sertifikat berilmaydi. Ish yakunlangach murojaat yuborgan fuqaroga ({selectedIncident.citizen_name}) xabar va PDF sertifikat olish ruxsati yuboriladi.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateIncidentLifecycle("VERIFIED", true)}
                          className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#35C759] text-[#071A30] hover:bg-[#2eb850] shadow-md flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Ish Bajarildi: Fuqaroga ({selectedIncident.citizen_name}) Xabar va PDF Sertifikat Ruxsatini Berish
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block font-bold mb-1">Yangi holat (Status):</label>
                          <select
                            value={updateStatusVal}
                            onChange={(e) => setUpdateStatusVal(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                          >
                            <option value="REPORTED">{t("statuses.REPORTED")}</option>
                            <option value="RECEIVED">{t("statuses.RECEIVED")}</option>
                            <option value="ASSIGNED">{t("statuses.ASSIGNED")}</option>
                            <option value="INSPECTION">{t("statuses.INSPECTION")}</option>
                            <option value="REPAIRING">{t("statuses.REPAIRING")}</option>
                            <option value="COMPLETED">{t("statuses.COMPLETED")}</option>
                            <option value="VERIFIED">{t("statuses.VERIFIED")}</option>
                            <option value="CLOSED">{t("statuses.CLOSED")}</option>
                            <option value="REJECTED">{t("statuses.REJECTED")}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold mb-1">{t("dashboard.assignEmployee")}:</label>
                          <select
                            value={updateEmployeeVal}
                            onChange={(e) => setUpdateEmployeeVal(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                          >
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.full_name} ({emp.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold mb-1">{t("dashboard.estimatedCompletion")}:</label>
                          <input
                            type="datetime-local"
                            value={updateDeadlineVal}
                            onChange={(e) => setUpdateDeadlineVal(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold mb-1">{t("dashboard.delayReason")}:</label>
                          <input
                            type="text"
                            value={updateDelayReasonVal}
                            onChange={(e) => setUpdateDelayReasonVal(e.target.value)}
                            placeholder="Agar muddat kechiksa sababini kiriting..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">{t("dashboard.uploadAfterPhoto")}:</label>
                          <select
                            value={updateAfterPhoto}
                            onChange={(e) => setUpdateAfterPhoto(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          >
                            <option value="">-- Ta&apos;mirdan keyingi rasm tanlash --</option>
                            <option value="/uploads/demo/leak-after-1.svg">
                              Ta&apos;mirlandi foto-isboti (Yangi po&apos;lat mufta)
                            </option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">{t("dashboard.repairNotes")}:</label>
                        <input
                          type="text"
                          value={updateNotesVal}
                          onChange={(e) => setUpdateNotesVal(e.target.value)}
                          placeholder="Masalan: 300mm quvur payvandlandi va bosim sinovidan o'tkazildi..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateIncidentLifecycle()}
                        className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#082B55] hover:bg-[#0877C9] text-white transition-colors"
                      >
                        {t("dashboard.saveUpdateBtn")}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-3">
                      <div>
                        🔒 <strong>Fuqaro kuzatuv rejimi:</strong> Murojaat holati va ta&apos;mir muddati faqat mas&apos;ul suv ta&apos;minoti xodimi tomonidan yangilanadi. Siz jarayonni jonli kuzatishingiz va yakunlangach sifatni baholashingiz mumkin.
                      </div>
                    </div>
                  )}

                  {/* Citizen Rating Box */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                    <div className="text-xs font-extrabold text-[#082B55] dark:text-white flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Fuqaro sifat bahosi (Citizen Repair Rating):</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={citizenRatingVal}
                        onChange={(e) => setCitizenRatingVal(Number(e.target.value))}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5 - A&apos;lo)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5 - Yaxshi)</option>
                        <option value={3}>⭐⭐⭐ (3/5 - Qoniqarli)</option>
                      </select>
                      <input
                        type="text"
                        value={citizenFeedbackVal}
                        onChange={(e) => setCitizenFeedbackVal(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleRateIncident}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white"
                      >
                        Baholash
                      </button>
                    </div>
                  </div>

                  {/* Immutable Audit Trail */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1.5 mb-3">
                      <History className="w-4 h-4 text-[#0877C9]" />
                      <span>{t("dashboard.auditTrailTitle")}</span>
                    </h4>
                    <div className="space-y-2.5 border-l-2 border-[#0877C9] pl-4">
                      {selectedIncident.history.map((h) => (
                        <div key={h.id} className="text-xs space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-[#082B55] dark:text-sky-300">
                              {h.previous_status} → {h.new_status}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              • {h.changed_by_name || "Tizim"} ({h.changed_by_role || "SYSTEM"})
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{h.created_at}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{h.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: MODULE 2 — LIVE INTERACTIVE INCIDENT & PIPELINE MAP
        ===================================================================== */}
        {activeTab === "map" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("map.searchPlaceholder")}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="ALL">{t("map.filterStatus")}</option>
                  <option value="REPORTED">{t("statuses.REPORTED")}</option>
                  <option value="ASSIGNED">{t("statuses.ASSIGNED")}</option>
                  <option value="INSPECTION">{t("statuses.INSPECTION")}</option>
                  <option value="REPAIRING">{t("statuses.REPAIRING")}</option>
                  <option value="COMPLETED">{t("statuses.COMPLETED")}</option>
                  <option value="VERIFIED">{t("statuses.VERIFIED")}</option>
                  <option value="CLOSED">{t("statuses.CLOSED")}</option>
                </select>

                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="ALL">{t("map.filterRegion")}</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name_uz}
                    </option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="ALL">{t("map.filterCategory")}</option>
                  <option value="BROKEN_PIPE">{t("categories.BROKEN_PIPE")}</option>
                  <option value="WATER_LEAKAGE">{t("categories.WATER_LEAKAGE")}</option>
                  <option value="DAMAGED_VALVE">{t("categories.DAMAGED_VALVE")}</option>
                  <option value="CONTINUOUS_FLOW">{t("categories.CONTINUOUS_FLOW")}</option>
                </select>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPipelinesOnMap}
                  onChange={(e) => setShowPipelinesOnMap(e.target.checked)}
                  className="rounded text-[#0877C9]"
                />
                <span>{t("map.showPipelines")}</span>
              </label>
            </div>

            <InteractiveIncidentMap
              incidents={filteredIncidents}
              pipelines={pipelines}
              showPipelines={showPipelinesOnMap}
              onSelectIncident={(inc) => {
                const full = incidents.find((i) => i.id === inc.id);
                if (full) {
                  setSelectedIncident(full);
                  setActiveTab("incidents");
                }
              }}
              height="560px"
            />
          </div>
        )}

        {/* =====================================================================
            TAB 5: MODULE 6 — WATER CONSERVATION STATISTICS & RECHARTS ANALYTICS (EMPLOYEE CABINET ONLY)
        ===================================================================== */}
        {isEmployeeCabinet && activeTab === "analytics" && statsData && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h2 className="text-xl font-black text-[#082B55] dark:text-white">
                {t("nav.analytics")} — Recharts Analitik Paneli
              </h2>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                {t("stats.estimationDisclaimer")}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Monthly Incident & Resolution Trends */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white mb-4">
                  Oylik Murojaatlar va Hal Etilgan Avariyalar Dinamikasi
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="reported" name="Kelib tushgan" fill="#0877C9" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="resolved" name="Hal etilgan" fill="#35C759" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Estimated Water Losses Prevented (m3) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white mb-4">
                  Saqlab Qolingan Ichimlik Suvi Hajmi (Taxminiy m³)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="estimatedSavedM3"
                        name="Tejalgan suv (m³ - Taxminiy)"
                        stroke="#16A34A"
                        fill="#35C759"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Regional Distribution & Department Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white mb-4">
                  Hududlar Kesimida Murojaatlar Taqsimoti
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.regionalDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="shortName" type="category" width={140} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="total" name="Jami" fill="#082B55" radius={[0, 6, 6, 0]} />
                      <Bar dataKey="resolved" name="Hal etildi" fill="#35C759" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white">
                  Suv Ta&apos;minoti Bo‘limlari Samaradorligi (SLA)
                </h3>
                {statsData.departmentPerformance.map((d) => (
                  <div key={d.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{d.name}</span>
                      <span className="text-[#16A34A]">{d.efficiencyPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0877C9] to-[#35C759]"
                        style={{ width: `${d.efficiencyPercent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Jami: {d.totalAssigned} ta • Hal etilgan: {d.resolvedCount} ta
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 6: MODULE 7 — "SUV ASROVCHISI" REWARDS & PDF CERTIFICATES
            RULE: Employees do NOT get certificates! Employees authorize & view
            citizen certificates; Citizens view & download their own PDF certificate.
        ===================================================================== */}
        {activeTab === "rewards" && (
          <div className="space-y-8">
            {isEmployeeCabinet ? (
              <div className="p-5 rounded-3xl bg-[#082B55] text-white border border-sky-700/60 space-y-4 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#35C759] text-[#071A30] uppercase">
                      🛠️ XODIM NAZORAT REESTRI (XODIMGA SERTIFIKAT BERILMAYDI)
                    </span>
                    <h3 className="text-lg sm:text-xl font-black mt-2">
                      Ish Bajarilgach Fuqarolarga Ruxsat Berilgan «SUV ASROVCHISI» PDF Sertifikatlari
                    </h3>
                    <p className="text-xs text-sky-200 mt-1">
                      Qoida: Xodimga sertifikat berilmaydi. Xodim avariyani bartaraf etgach, murojaat yuborgan fuqaroga ish bajarilganligi haqida xabar va PDF sertifikat yuklab olish ruxsati taqdim etiladi.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {(rewardsData?.certificates || []).map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-white/10 border border-white/15 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs text-sky-300 font-bold">Murojaatchi Fuqaro:</div>
                        <div className="text-base font-black text-white">{c.user_name}</div>
                        <div className="text-xs font-mono text-[#35C759] mt-0.5">
                          Sertifikat: #{c.certificate_number} • Sana: {c.issue_date}
                        </div>
                      </div>
                      <a
                        href={`/api/certificate-pdf?name=${encodeURIComponent(c.user_name)}&cert=${encodeURIComponent(
                          c.certificate_number
                        )}&code=${encodeURIComponent(c.verification_code)}&date=${encodeURIComponent(
                          c.issue_date
                        )}&reports=${c.verified_count || 3}&points=${c.user_points || 325}&lang=uz`}
                        download={`TIZGIN-SUV-ASROVCHISI-${c.certificate_number}.pdf`}
                        className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#35C759] text-[#071A30] hover:bg-[#2eb850] flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Fuqaro PDF Sertifikati</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#082B55] dark:text-white">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                    <span>
                      Tabriklaymiz, <strong>{currentUser.full_name}</strong>! Suv ta&apos;minoti xodimi murojaatingiz bo‘yicha ta&apos;mirlash ishlarini yakunladi va sizga yangi formatdagi rasmiy PDF sertifikatni yuklab olishga ruxsat berdi!
                    </span>
                  </div>
                </div>

                <SuvAsrovchisiCertificate
                  citizenName={currentUser.full_name}
                  certificateNumber={rewardsData?.certificates?.[0]?.certificate_number || "SUV-2026-000184"}
                  verificationCode={rewardsData?.certificates?.[0]?.verification_code || "TIZGIN-VERIFY-KAA-9941"}
                  issueDate={rewardsData?.certificates?.[0]?.issue_date || "2026-11-23"}
                  verifiedReports={rewardsData?.certificates?.[0]?.verified_count || 3}
                  totalPoints={rewardsData?.certificates?.[0]?.user_points || 325}
                />
              </>
            )}

            {/* Citizen Activity Leaderboard */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-lg font-black text-[#082B55] dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#35C759]" />
                <span>{t("rewards.leaderboardTitle")} (Faqat Fuqarolar)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(rewardsData?.leaderboard || []).map((cit, idx) => (
                  <div
                    key={cit.id}
                    className="p-4 rounded-2xl bg-[#F4F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-full bg-[#082B55] text-white text-xs font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#35C759]/20 text-[#16A34A]">
                        {cit.total_points} ball
                      </span>
                    </div>
                    <div className="font-extrabold text-sm text-[#082B55] dark:text-white">{cit.full_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{cit.region_name_uz}</div>
                    <div className="text-[11px] font-bold text-[#0877C9] mt-2">
                      ✓ Bajarilgan murojaatlar: {cit.verified_reports} ta
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 7: MODULE 10 — DIGITAL PIPELINE PASSPORT REGISTRY (EMPLOYEE CABINET ONLY)
        ===================================================================== */}
        {isEmployeeCabinet && activeTab === "pipelines" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600">
                  MODULE 10 • MANUAL MUNICIPAL INFRASTRUCTURE DATABASE (NO IoT SENSORS)
                </span>
                <h2 className="text-xl font-black text-[#082B55] dark:text-white mt-1">
                  {t("pipelines.title")}
                </h2>
                <p className="text-xs text-slate-500">{t("pipelines.subtitle")}</p>
              </div>

              <div className="space-y-3">
                {pipelines.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#0877C9]">{p.pipeline_code}</span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          • Ø{p.diameter_mm} mm • {p.length_m} m • {p.installation_year}-yil
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          p.technical_condition === "OPTIMAL"
                            ? "bg-emerald-500/20 text-emerald-600"
                            : p.technical_condition === "SATISFACTORY"
                            ? "bg-sky-500/20 text-sky-600"
                            : p.technical_condition === "NEEDS_REPAIR"
                            ? "bg-amber-500/20 text-amber-600"
                            : "bg-rose-500/20 text-rose-600"
                        }`}
                      >
                        {p.technical_condition}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#082B55] dark:text-white">{p.address}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Material: {p.pipeline_type}</div>
                    <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong>Texnik tarix:</strong> {p.maintenance_history}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Form: Register New Digital Pipeline Passport */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-extrabold text-[#082B55] dark:text-white">
                + {t("pipelines.addPipeline")}
              </h3>
              <form onSubmit={handleCreatePipeline} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">{t("pipelines.code")} *</label>
                    <input
                      type="text"
                      required
                      value={newPipeCode}
                      onChange={(e) => setNewPipeCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Hudud</label>
                    <select
                      value={newPipeRegion}
                      onChange={(e) => setNewPipeRegion(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name_uz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Manzil / Uchastka *</label>
                  <input
                    type="text"
                    required
                    value={newPipeAddress}
                    onChange={(e) => setNewPipeAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">{t("pipelines.type")} *</label>
                  <input
                    type="text"
                    required
                    value={newPipeType}
                    onChange={(e) => setNewPipeType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold mb-1">{t("pipelines.diameter")}</label>
                    <input
                      type="number"
                      value={newPipeDiameter}
                      onChange={(e) => setNewPipeDiameter(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{t("pipelines.length")}</label>
                    <input
                      type="number"
                      value={newPipeLength}
                      onChange={(e) => setNewPipeLength(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{t("pipelines.year")}</label>
                    <input
                      type="number"
                      value={newPipeYear}
                      onChange={(e) => setNewPipeYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">{t("pipelines.condition")}</label>
                  <select
                    value={newPipeCondition}
                    onChange={(e) => setNewPipeCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="OPTIMAL">{t("pipelines.condOptimal")}</option>
                    <option value="SATISFACTORY">{t("pipelines.condSatisfactory")}</option>
                    <option value="NEEDS_REPAIR">{t("pipelines.condNeedsRepair")}</option>
                    <option value="CRITICAL">{t("pipelines.condCritical")}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">{t("pipelines.history")}</label>
                  <textarea
                    rows={2}
                    value={newPipeHistory}
                    onChange={(e) => setNewPipeHistory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-extrabold text-white bg-[#082B55] hover:bg-[#0877C9] transition-colors"
                >
                  Pasportni SQLite Bazasiga Saqlash
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 8: MODULE 9 — TELEGRAM BOT INTERACTIVE CONSOLE (SAME SQLITE DB)
        ===================================================================== */}
        {activeTab === "telegram" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#071A30] text-white rounded-3xl p-6 border border-sky-800/60 shadow-xl flex flex-col justify-between min-h-[520px]">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0877C9] flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">@TizginWaterBot — Official Telegram Bot</div>
                    <div className="text-[11px] text-[#35C759]">Connected to data/tizgin.db (SQLite)</div>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 font-mono">Webhook Active</span>
              </div>

              {/* Chat History */}
              <div className="my-4 space-y-3 max-h-[340px] overflow-y-auto pr-2">
                {tgMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs whitespace-pre-line leading-relaxed ${
                        m.sender === "user"
                          ? "bg-[#0877C9] text-white rounded-br-none"
                          : "bg-white/10 text-sky-100 border border-white/15 rounded-bl-none"
                      }`}
                    >
                      <div>{m.text}</div>
                      <div className="text-[10px] text-sky-300/70 text-right mt-1">{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Command Buttons & Input */}
              <div className="space-y-2 pt-2 border-t border-white/15">
                <div className="flex flex-wrap gap-1.5">
                  {(isEmployeeCabinet
                    ? [
                        { cmd: "/start", label: "/start" },
                        { cmd: "/report", label: "📸 /report (Yangi avariya yuborish)" },
                        { cmd: "/status TZG-2026-1002", label: "🔍 /status TZG-2026-1002" },
                        { cmd: "/myreports", label: "🏅 /myreports" },
                        { cmd: "/overdue", label: "🚨 /overdue (Xodim: Muddati o'tganlar)" },
                        { cmd: "/summary", label: "📊 /summary (Xodim: Kunlik svodka)" }
                      ]
                    : [
                        { cmd: "/start", label: "/start" },
                        { cmd: "/report", label: "📸 /report (Suv oqishini yuborish)" },
                        { cmd: "/status TZG-2026-1002", label: "🔍 /status TZG-2026-1002" },
                        { cmd: "/myreports", label: "🏅 /myreports (Mening ballarim)" }
                      ]
                  ).map((b) => (
                    <button
                      key={b.cmd}
                      type="button"
                      onClick={() => handleSendTelegramCommand(b.cmd)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-[#35C759] hover:text-[#071A30] transition-colors"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tgInput}
                    onChange={(e) => setTgInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTelegramCommand()}
                    placeholder="Buyruq yozing (/status TZG-2026-1001)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendTelegramCommand()}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#35C759] text-[#071A30]"
                  >
                    Yuborish
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="text-base font-extrabold text-[#082B55] dark:text-white">
                Module 9: Telegram Bot Arxitekturasi
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                TIZGIN Telegram boti asosiy veb-ilova bilan aynan bitta SQLite ma&apos;lumotlar bazasi (<code>data/tizgin.db</code>) va RBAC ruxsatlar tizimidan foydalanadi.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
                <div className="font-bold text-[#082B55] dark:text-white">Fuqarolar imkoniyatlari:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Fotosurat va GPS joylashuv orqali yangi suv oqishini yuborish (<code>/report</code>)</li>
                  <li>Murojaat ID raqami orqali ta&apos;mir holatini tekshirish (<code>/status</code>)</li>
                  <li>To‘plangan «SUV ASROVCHISI» ballarini ko‘rish (<code>/myreports</code>)</li>
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
                <div className="font-bold text-[#082B55] dark:text-white">Administrator va Brigada Rahbari:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Muddati o‘tgan ta&apos;mirlar haqida tezkor ogohlantirish (<code>/overdue</code>)</li>
                  <li>Kunlik tizim svodkasi va suv tejash hisoboti (<code>/summary</code>)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 9: MODULE 8 — NOTIFICATION CENTER & CHANNEL PREFERENCES
        ===================================================================== */}
        {activeTab === "notifications" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-[#082B55] dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#0877C9]" />
                <span>{t("dashboard.tabNotifications")} (In-App • Email • Telegram)</span>
              </h2>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mark_all_read: true, user_id: currentUser.id })
                  });
                  await loadAllData();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0877C9] text-white"
              >
                Barchasini o‘qilgan deb belgilash
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    n.is_read
                      ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      : "bg-sky-50/70 dark:bg-sky-950/30 border-[#0877C9]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-[#082B55] dark:text-white">{n.title}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                    <div className="text-[10px] text-slate-400 mt-1">{n.created_at}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#082B55] text-white">
                    {n.notification_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 10: EMPLOYEE / ADMIN MANAGEMENT, RBAC USERS, DEPARTMENTS, BACKUPS & AUDIT LOGS (EMPLOYEE CABINET ONLY)
        ===================================================================== */}
        {isEmployeeCabinet && activeTab === "admin" && adminData && (
          <div className="space-y-6">
            {/* Users & RBAC Role Assignment */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-black text-[#082B55] dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0877C9]" />
                  <span>Foydalanuvchilar va RBAC Rollarni Boshqarish ({adminData.users.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={handleTriggerSqliteBackup}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#35C759] text-[#071A30] flex items-center gap-1.5"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  <span>{t("dashboard.backupDbBtn")}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2 px-3">ID</th>
                      <th className="py-2 px-3">F.I.Sh.</th>
                      <th className="py-2 px-3">Email / Telefon</th>
                      <th className="py-2 px-3">Hudud</th>
                      <th className="py-2 px-3">RBAC Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2.5 px-3 font-mono font-bold">#{u.id}</td>
                        <td className="py-2.5 px-3 font-bold text-[#082B55] dark:text-white">{u.full_name}</td>
                        <td className="py-2.5 px-3">
                          {u.email} • {u.phone}
                        </td>
                        <td className="py-2.5 px-3">{u.region_name}</td>
                        <td className="py-2.5 px-3">
                          <select
                            value={u.role}
                            onChange={async (e) => {
                              await fetch("/api/admin", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "update_user_role",
                                  user_id: u.id,
                                  new_role: e.target.value
                                })
                              });
                              await loadAllData();
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                          >
                            <option value="CITIZEN">CITIZEN ({t("roles.CITIZEN")})</option>
                            <option value="EMPLOYEE">EMPLOYEE ({t("roles.EMPLOYEE")})</option>
                            <option value="MANAGER">MANAGER ({t("roles.MANAGER")})</option>
                            <option value="ADMIN">ADMIN ({t("roles.ADMIN")})</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Departments & Repair Teams */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0877C9]" />
                  <span>Hududiy Suv Ta&apos;minoti Bo‘limlari ({adminData.departments.length})</span>
                </h3>
                {adminData.departments.map((d) => (
                  <div key={d.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                    <div className="font-extrabold text-[#082B55] dark:text-white">{d.name}</div>
                    <div className="text-slate-500">{d.contact_information}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#35C759]" />
                  <span>SQLite Zaxira Nusxalari (Database Backups) &amp; Ta&apos;mir Brigadalari</span>
                </h3>
                <div className="space-y-2">
                  {adminData.repairTeams.map((rt) => (
                    <div key={rt.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs">
                      <div className="font-bold text-[#082B55] dark:text-white">{rt.name}</div>
                      <div className="text-slate-500">
                        Rahbar: {rt.manager_name} • {rt.specialization}
                      </div>
                    </div>
                  ))}
                </div>
                {adminData.backups.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-[#16A34A]">Yaratilgan SQLite Backuplar:</div>
                    {adminData.backups.slice(0, 3).map((b) => (
                      <div key={b.fileName} className="text-[11px] font-mono text-slate-500">
                        • {b.fileName} ({Math.round(b.sizeBytes / 1024)} KB)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Audit Logs */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-extrabold text-[#082B55] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#35C759]" />
                <span>Tizim Audit Jurnali (Immutable AuditLogs Table)</span>
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                {adminData.auditLogs.map((al) => (
                  <div
                    key={al.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#0877C9] mr-2">[{al.action}]</span>
                      <span className="font-bold">{al.entity_type}#{al.entity_id}</span> —{" "}
                      <span className="text-slate-600 dark:text-slate-300">{al.details}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {al.user_name || "System"} • {al.created_at}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">TIZGIN yuklanmoqda...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
