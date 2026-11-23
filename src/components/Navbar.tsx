"use client";

// ============================================================================
// TIZGIN — Main Multilingual Navigation Header
// Includes Language Selector (uz, kaa, en, ru), Dark/Light Theme Toggle,
// Quick Page Switcher, and Active User Role Badge.
// ============================================================================

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TizginLogo } from "./TizginLogo";
import { SUPPORTED_LOCALES, Locale, useI18n } from "@/lib/i18n";
import {
  Droplets,
  MapPin,
  LayoutDashboard,
  Award,
  BarChart3,
  Send,
  Sun,
  Moon,
  Globe,
  LogIn,
  ShieldCheck,
  Database
} from "lucide-react";

export function Navbar({
  currentUser,
  onSelectSection
}: {
  currentUser?: { id: number; full_name: string; role: string; email: string } | null;
  onSelectSection?: (sec: string) => void;
}) {
  const { locale, setLocale, t, darkMode, toggleDarkMode } = useI18n();
  const pathname = usePathname();

  const handleLanguageChange = async (newLoc: Locale) => {
    setLocale(newLoc);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_preferences", preferred_language: newLoc })
      });
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-[#071A30]/95 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      {/* Top Gov / Tagline Banner */}
      <div className="bg-[#082B55] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-[#35C759] animate-pulse" />
            <span>{t("brand.tagline")}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-sky-200">
            <span className="hidden md:inline">{t("brand.demoNotice")}</span>
            <span className="font-semibold text-[#35C759]">SQLite WAL • 4-Til (UZ / KAA / EN / RU)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <TizginLogo size={42} />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === "/"
                ? "bg-[#0877C9]/10 text-[#0877C9] dark:text-sky-400"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {t("nav.home")}
          </Link>

          <Link
            href="/dashboard?tab=report"
            onClick={() => onSelectSection?.("report")}
            className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Droplets className="w-4 h-4 text-[#0877C9]" />
            {t("nav.reportLeak")}
          </Link>

          <Link
            href="/dashboard?tab=map"
            onClick={() => onSelectSection?.("map")}
            className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-[#EF4444]" />
            {t("nav.liveMap")}
          </Link>

          {currentUser && currentUser.role !== "CITIZEN" && (
            <>
              <Link
                href="/dashboard?tab=analytics"
                onClick={() => onSelectSection?.("analytics")}
                className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4 text-[#35C759]" />
                {t("nav.analytics")}
              </Link>

              <Link
                href="/dashboard?tab=pipelines"
                onClick={() => onSelectSection?.("pipelines")}
                className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Database className="w-4 h-4 text-amber-500" />
                {t("nav.pipelines")}
              </Link>
            </>
          )}

          <Link
            href="/dashboard?tab=rewards"
            onClick={() => onSelectSection?.("rewards")}
            className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            {t("nav.rewards")}
          </Link>

          <Link
            href="/dashboard?tab=telegram"
            onClick={() => onSelectSection?.("telegram")}
            className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4 text-sky-500" />
            {t("nav.telegramBot")}
          </Link>
        </nav>

        {/* Right Controls: Language Selector, Theme Toggle, Auth / Dashboard CTA */}
        <div className="flex items-center gap-2">
          {/* 4-Language Selector (uz, kaa, en, ru) */}
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <Globe className="w-3.5 h-3.5 text-[#0877C9] ml-1.5 mr-1 hidden sm:inline" />
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => handleLanguageChange(loc.code)}
                title={loc.nativeLabel}
                className={`px-2 py-1 text-xs font-bold uppercase rounded-md transition-all ${
                  locale === loc.code
                    ? "bg-[#082B55] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-[#0877C9]"
                }`}
              >
                {loc.code.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#082B55]" />}
          </button>

          {/* Dashboard / Login Links */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#082B55] to-[#0877C9] hover:opacity-95 shadow-sm transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t("nav.dashboard")}</span>
          </Link>

          {currentUser ? (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#35C759]/15 text-[#16A34A] dark:text-[#35C759] border border-[#35C759]/30"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t(`roles.${currentUser.role}`)}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#082B55] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">{t("nav.login")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
