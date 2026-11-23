"use client";

// ============================================================================
// TIZGIN — Section 8: Public Landing Page & Live Ecosystem Portal
// Includes all 10 required sections:
// 1. Hero section with TIZGIN logo and tagline in 4 languages
// 2. Main CTA buttons: Report Water Leak & View Live Map
// 3. Real-time platform statistics from SQLite
// 4. How TIZGIN works — 4 transparent steps
// 5. Interactive live map preview with colored incident markers & pipelines
// 6. Environmental impact & water conservation statistics
// 7. Citizen rewards section ("SUV ASROVCHISI" Certificate preview)
// 8. Benefits for water supply organizations & Digital Pipeline Passport
// 9. Frequently Asked Questions (FAQ)
// 10. Footer with contact information, hotline & 4-language selector
// ============================================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { TizginLogo } from "@/components/TizginLogo";
import { InteractiveIncidentMap, MapIncident, MapPipeline } from "@/components/InteractiveIncidentMap";
import { SuvAsrovchisiCertificate } from "@/components/SuvAsrovchisiCertificate";
import { SUPPORTED_LOCALES, useI18n } from "@/lib/i18n";
import {
  Droplets,
  MapPin,
  ShieldCheck,
  Clock,
  Award,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Send,
  Sparkles,
  PhoneCall,
  Building2,
  Users
} from "lucide-react";

export default function LandingPage() {
  const { locale, setLocale, t } = useI18n();
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [pipelines, setPipelines] = useState<MapPipeline[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; full_name: string; role: string; email: string } | null>(null);
  const [stats, setStats] = useState({
    totalReports: 7,
    confirmedIncidents: 7,
    resolvedIncidents: 3,
    pendingIncidents: 4,
    overdueIncidents: 1,
    avgRepairTimeHours: 6.8,
    estimatedWaterLitersPrevented: 65500,
    activeCitizensCount: 4,
    registeredPipelinesCount: 5
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [incRes, pipeRes, statRes, authRes] = await Promise.all([
          fetch("/api/incidents"),
          fetch("/api/pipelines"),
          fetch("/api/stats"),
          fetch("/api/auth")
        ]);
        if (incRes.ok) {
          const data = await incRes.json();
          setIncidents(data.incidents || []);
        }
        if (pipeRes.ok) {
          const data = await pipeRes.json();
          setPipelines(data.pipelines || []);
        }
        if (statRes.ok) {
          const data = await statRes.json();
          if (data.summary) setStats(data.summary);
        }
        if (authRes.ok) {
          const data = await authRes.json();
          if (data.user) setCurrentUser(data.user);
        }
      } catch {
        // ignore fetch errors during first paint
      }
    }
    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FC] dark:bg-[#071A30]">
      <Navbar currentUser={currentUser} />

      {/* 1 & 2. HERO SECTION WITH TIZGIN LOGO, TAGLINE & MAIN CTAs */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071A30] via-[#082B55] to-[#0877C9] text-white py-16 sm:py-24 px-4">
        {/* Decorative Water Wave Background SVG */}
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <svg className="w-full h-full" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 320C240 420 480 220 720 320C960 420 1200 220 1440 320V600H0V320Z"
              fill="url(#heroWave)"
            />
            <defs>
              <linearGradient id="heroWave" x1="0" y1="220" x2="1440" y2="600" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#35C759" />
                <stop offset="100%" stopColor="#0877C9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wider uppercase text-[#35C759]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("hero.badge")}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
              {t("hero.title")}
            </h1>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-[#35C759]/40 inline-block">
              <p className="text-base sm:text-lg font-extrabold text-[#35C759]">
                💧 “{t("brand.tagline")}”
              </p>
            </div>

            <p className="text-sm sm:text-base text-sky-100/90 max-w-2xl leading-relaxed">
              {t("hero.description")}
            </p>

            {/* Main CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard?tab=report"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl font-extrabold text-sm sm:text-base text-[#071A30] bg-[#35C759] hover:bg-[#2eb850] shadow-lg shadow-[#35C759]/25 transition-all transform hover:-translate-y-0.5"
              >
                <Droplets className="w-5 h-5" />
                <span>{t("hero.ctaReport")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard?tab=map"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm sm:text-base text-white bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 transition-all"
              >
                <MapPin className="w-5 h-5 text-sky-300" />
                <span>{t("hero.ctaMap")}</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm text-sky-200 hover:text-white underline underline-offset-4"
              >
                <span>{t("hero.ctaDashboard")} →</span>
              </Link>
            </div>

            {/* Core Principle Pipeline Pill */}
            <div className="pt-3 border-t border-white/15 text-xs text-sky-200">
              <strong className="text-white uppercase tracking-wider mr-2">{t("hero.principleTitle")}</strong>
              <span>{t("hero.principleFlow")}</span>
            </div>
          </div>

          {/* Right Hero Card: Live System Telemetry & Quick Role Access */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#35C759]/20 border border-[#35C759] flex items-center justify-center text-[#35C759] font-black">
                    24/7
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white">TIZGIN LIVE MONITOR</div>
                    <div className="text-xs text-sky-200">SQLite WAL • RBAC • Geo-Tracking</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#35C759] text-[#071A30]">
                  ONLINE
                </span>
              </div>

              {/* Mini Incident Feed inside Hero */}
              <div className="space-y-2.5">
                {incidents.slice(0, 3).map((inc) => (
                  <Link
                    key={inc.id}
                    href={`/dashboard?tab=incidents&id=${inc.id}`}
                    className="block p-3.5 rounded-2xl bg-[#071A30]/70 hover:bg-[#071A30]/90 border border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-sky-300">#{inc.incident_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          inc.status === "VERIFIED" || inc.status === "COMPLETED"
                            ? "bg-[#16A34A] text-white"
                            : inc.status === "REPAIRING"
                            ? "bg-[#0877C9] text-white"
                            : inc.is_overdue
                            ? "bg-[#EF4444] text-white"
                            : "bg-[#F59E0B] text-[#071A30]"
                        }`}
                      >
                        {t(`statuses.${inc.status}`)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{inc.address}</div>
                    <div className="text-[11px] text-sky-200/80 truncate mt-0.5">{inc.description}</div>
                  </Link>
                ))}
              </div>

              {/* 2 Dedicated Cabinets Quick Entry: Citizen Cabinet vs Employee Cabinet */}
              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-sky-200 mb-2">
                  2 ta Maxsus Kabinet (1 ta Fuqaro va 1 ta Xodim Test Akkaunti):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold">
                  <Link
                    href="/dashboard?role=CITIZEN"
                    className="p-3 rounded-xl bg-[#35C759]/20 hover:bg-[#35C759]/30 border border-[#35C759]/50 flex items-center gap-2.5 text-white"
                  >
                    <Users className="w-5 h-5 text-[#35C759] shrink-0" />
                    <div>
                      <div className="font-extrabold">👤 Fuqaro Kabineti</div>
                      <div className="text-[10px] text-sky-200 font-normal">citizen@tizgin.uz (Faqat fuqaro funksiyalari)</div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard?role=EMPLOYEE"
                    className="p-3 rounded-xl bg-[#0877C9]/30 hover:bg-[#0877C9]/45 border border-sky-400/50 flex items-center gap-2.5 text-white"
                  >
                    <ShieldCheck className="w-5 h-5 text-sky-300 shrink-0" />
                    <div>
                      <div className="font-extrabold">🛠️ Xodim Kabineti</div>
                      <div className="text-[10px] text-sky-200 font-normal">employee@tizgin.uz (Xodim + Fuqaro funksiyalari)</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. REAL-TIME PLATFORM STATISTICS BAR */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("stats.totalReports")}</div>
            <div className="text-2xl sm:text-3xl font-black text-[#082B55] dark:text-white mt-1">
              {stats.totalReports}
            </div>
            <div className="text-[11px] font-semibold text-[#0877C9] mt-1">SQLite Real-Time</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("stats.resolvedIncidents")}</div>
            <div className="text-2xl sm:text-3xl font-black text-[#16A34A] mt-1">{stats.resolvedIncidents}</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">Foto-isbot bilan</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("stats.overdueIncidents")}</div>
            <div className="text-2xl sm:text-3xl font-black text-[#EF4444] mt-1">{stats.overdueIncidents}</div>
            <div className="text-[11px] font-semibold text-rose-500 mt-1">Avto-eskalatsiya</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("stats.avgRepairTime")}</div>
            <div className="text-2xl sm:text-3xl font-black text-[#0877C9] mt-1">
              {stats.avgRepairTimeHours} <span className="text-sm font-bold">{t("stats.hoursUnit")}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">SLA Monitoring</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("stats.estimatedWaterSaved")}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#35C759] mt-1">
              {stats.estimatedWaterLitersPrevented.toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">{t("stats.litersUnit")} (Taxminiy*)</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("stats.registeredPipelines")}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#082B55] dark:text-sky-400 mt-1">
              {stats.registeredPipelinesCount}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">Raqamli Pasport</div>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
          {t("stats.estimationDisclaimer")}
        </p>
      </section>

      {/* 4. HOW TIZGIN WORKS — 4 STEPS */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#0877C9]/10 text-[#0877C9] dark:text-sky-400">
            TRANSPARENT WORKFLOW
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#082B55] dark:text-white mt-2">
            {t("howItWorks.title")}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#0877C9]/10 text-[#0877C9] flex items-center justify-center mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#082B55] dark:text-white mb-2">
              {t("howItWorks.step1Title")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("howItWorks.step1Desc")}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#082B55] dark:text-white mb-2">
              {t("howItWorks.step2Title")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("howItWorks.step2Desc")}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#082B55] dark:text-white mb-2">
              {t("howItWorks.step3Title")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("howItWorks.step3Desc")}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#35C759]/15 text-[#16A34A] flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#082B55] dark:text-white mb-2">
              {t("howItWorks.step4Title")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("howItWorks.step4Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE LIVE MAP PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 pb-16 w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400">
              LIVE GIS TELEMETRY
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#082B55] dark:text-white mt-2">
              {t("map.title")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {t("map.subtitle")}
            </p>
          </div>
          <Link
            href="/dashboard?tab=map"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#082B55] hover:bg-[#0877C9] transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>To‘liq xarita va filtrlar →</span>
          </Link>
        </div>

        <InteractiveIncidentMap incidents={incidents} pipelines={pipelines} showPipelines={true} height="480px" />
      </section>

      {/* 6 & 8. BENEFITS FOR WATER SUPPLY ORGANIZATIONS & DIGITAL PIPELINE PASSPORT */}
      <section className="bg-[#082B55] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#35C759]/20 text-[#35C759] border border-[#35C759]/40">
              MUNICIPAL UTILITY GOVERNANCE (NO IoT REQUIRED)
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight">
              Suv ta&apos;minoti korxonalari uchun zamonaviy raqamli dispetcherlik va Quvurlar Pasporti
            </h2>
            <p className="text-sm text-sky-100/90 leading-relaxed">
              TIZGIN qimmat IoT sensorlar va murakkab apparat qurilmalarini talab qilmaydi. Barcha ma&apos;lumotlar fuqarolar murojaati, muhandislarning foto-hisobotlari va ma&apos;muriyat tomonidan yuritiladigan Raqamli Quvur Pasporti (Digital Pipeline Passport) orqali ishlaydi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <CheckCircle2 className="w-5 h-5 text-[#35C759] mb-2" />
                <div className="font-bold text-sm">SLA va Muddat Nazorati</div>
                <p className="text-xs text-sky-200 mt-1">
                  Har bir ta&apos;mir uchun aniq yakunlash muddati belgilanadi va kechikishlar avtomatik eskalatsiya qilinadi.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <Database className="w-5 h-5 text-sky-300 mb-2" />
                <div className="font-bold text-sm">Raqamli Quvur Pasporti</div>
                <p className="text-xs text-sky-200 mt-1">
                  Quvur kodi, diametri, yotqizilgan yili va avariyalar tarixi yagona SQLite bazasida saqlanadi.
                </p>
              </div>
            </div>
          </div>

          {/* Pipeline Passport Preview Table */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-[#071A30] border border-sky-800/60 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#35C759]" />
                  <span>{t("pipelines.title")}</span>
                </div>
                <Link
                  href="/dashboard?tab=pipelines"
                  className="text-xs font-bold text-[#35C759] hover:underline"
                >
                  Reestrni ochish →
                </Link>
              </div>

              <div className="space-y-2.5">
                {pipelines.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-sky-300">{p.pipeline_code}</span>
                        <span className="text-xs text-slate-300">• {p.diameter_mm} mm ({p.installation_year}-yil)</span>
                      </div>
                      <div className="text-xs font-semibold text-white mt-0.5">{p.address}</div>
                      <div className="text-[11px] text-sky-200/70">{p.pipeline_type}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        p.technical_condition === "OPTIMAL"
                          ? "bg-[#16A34A]/20 text-[#35C759] border border-[#35C759]/40"
                          : p.technical_condition === "SATISFACTORY"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-400/40"
                          : p.technical_condition === "NEEDS_REPAIR"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                      }`}
                    >
                      {p.technical_condition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CITIZEN REWARDS & "SUV ASROVCHISI" CERTIFICATE PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#35C759]/15 text-[#16A34A]">
            GAMIFIED CIVIC ENGAGEMENT
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#082B55] dark:text-white mt-2">
            {t("rewards.title")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            {t("rewards.subtitle")}
          </p>
        </div>

        <SuvAsrovchisiCertificate />
      </section>

      {/* 9. FAQ SECTION */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl sm:text-3xl font-black text-center text-[#082B55] dark:text-white mb-8">
          Ko‘p beriladigan savollar (FAQ)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-[#082B55] dark:text-white">
              1. TIZGIN platformasi IoT datchiklaridan foydalanadimi?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Yo‘q. TIZGIN dasturiy ekotizimi qimmatbaho IoT apparat qurilmalarisiz ishlaydi — barcha ma&apos;lumotlar fuqarolarning GPS/foto murojaatlari, muhandislarning dala tekshiruvlari va Raqamli Quvur Pasporti orqali boshqariladi.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-[#082B55] dark:text-white">
              2. «SUV ASROVCHISI» ballari va sertifikati qachon beriladi?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Soxta murojaatlarning oldini olish maqsadida ballar faqat suv ta&apos;minoti muhandisi yoki brigada rahbari avariyani joyida bartaraf etib, VERIFIED (Tasdiqlandi) holatiga o‘tkazganidan so‘ng avtomatik yoziladi.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-[#082B55] dark:text-white">
              3. Xodimlar kechikkan murojaatlar tarixini o‘chirib tashlay oladimi?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Mutlaqo yo‘q. IncidentHistory va AuditLogs jadvallari faqat qo‘shish (append-only) rejimida ishlaydi. Har bir status o‘zgarishi va muddat kechikishi sababi o‘zgarmas iz qoldiradi.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-[#082B55] dark:text-white">
              4. Qaysi tillar va ma&apos;lumotlar bazasi qo‘llab-quvvatlanadi?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Platforma to‘liq 4 tilda — O‘zbek (standart), Qoraqalpoq (Qaraqalpaqsha), Ingliz va Rus tillarida ishlaydi hamda tashqi server talab qilmaydigan mahalliy SQLite (WAL) bazasidan foydalanadi.
            </p>
          </div>
        </div>
      </section>

      {/* 10. FOOTER WITH CONTACT INFORMATION & LANGUAGE SELECTOR */}
      <footer className="mt-auto bg-[#071A30] text-slate-300 border-t border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <TizginLogo size={38} />
            <p className="text-xs text-sky-300 font-semibold">{t("brand.tagline")}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#35C759]" />
              <span>{t("footer.hotline")}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => setLocale(loc.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  locale === loc.code
                    ? "bg-[#0877C9] text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {loc.flag} {loc.nativeLabel}
              </button>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <span>{t("footer.rights")}</span>
          <span>SQLite Database Engine • Prisma Schema Compatible • RBAC Security</span>
        </div>
      </footer>
    </div>
  );
}
