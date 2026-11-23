"use client";

// ============================================================================
// TIZGIN — Login & Citizen Registration Page (/login)
// Includes 4-Language Selector, Login & Registration Forms, and One-Click
// Development Test Account Switcher for all 4 RBAC roles.
// ============================================================================

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TizginLogo } from "@/components/TizginLogo";
import { SUPPORTED_LOCALES, Locale, useI18n } from "@/lib/i18n";
import { ShieldCheck, LogIn, UserPlus, Globe, ArrowRight, CheckCircle2 } from "lucide-react";

interface DemoAccount {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  preferred_language: string;
  region_name?: string;
}

export default function LoginPage() {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("citizen@tizgin.uz");
  const [password, setPassword] = useState("Tizgin2026!");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 90 ");
  const [regionId, setRegionId] = useState(1);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.demoAccounts) setDemoAccounts(data.demoAccounts);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload =
        mode === "login"
          ? { action: "login", email, password }
          : {
              action: "register",
              full_name: fullName,
              email,
              phone,
              password,
              preferred_language: locale,
              region_id: regionId
            };

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }
      if (data.user?.preferred_language) {
        setLocale(data.user.preferred_language as Locale);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc: DemoAccount) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quick_switch", userId: acc.id })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Switch failed");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A30] via-[#082B55] to-[#0877C9] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar with Logo & Required Language Selector on Login/Registration Page */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link href="/">
          <TizginLogo size={44} className="text-white" />
        </Link>

        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
          <Globe className="w-4 h-4 text-[#35C759] ml-1.5 mr-1" />
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => setLocale(loc.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                locale === loc.code
                  ? "bg-[#35C759] text-[#071A30] shadow"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {loc.flag} {loc.nativeLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Auth Form */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                mode === "login"
                  ? "bg-[#082B55] text-white shadow"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{t("nav.login")}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                mode === "register"
                  ? "bg-[#082B55] text-white shadow"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("nav.register")}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#082B55] dark:text-white mb-1">
            {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t("brand.tagline")}</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("auth.fullName")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Quwatbay Jumaniyazov"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("auth.phone")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("auth.region")}
                    </label>
                    <select
                      value={regionId}
                      onChange={(e) => setRegionId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                      <option value={1}>Qoraqalpog‘iston Respublikasi (Nukus)</option>
                      <option value={2}>Toshkent shahri</option>
                      <option value={3}>Xorazm viloyati (Urganch)</option>
                      <option value={4}>Samarqand viloyati</option>
                      <option value={5}>Buxoro viloyati</option>
                      <option value={6}>Qo‘ng‘irot va Mo‘ynoq tumanlari</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("auth.email")} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("auth.password")} *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[#082B55] to-[#0877C9] hover:opacity-95 shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>{mode === "login" ? t("auth.loginBtn") : t("auth.registerBtn")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: One-Click Test Accounts for all 4 Required Roles */}
        <div className="lg:col-span-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 text-white space-y-4">
          <div className="flex items-center gap-2 text-[#35C759] text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>RBAC DEVELOPMENT &amp; EVALUATION ACCOUNTS</span>
          </div>

          <h2 className="text-xl font-black">{t("auth.demoAccountsTitle")}</h2>
          <p className="text-xs text-sky-200">{t("auth.passwordHint")}</p>

          <div className="space-y-3 pt-2">
            {demoAccounts.map((acc) => {
              const isEmployee = acc.role !== "CITIZEN";
              return (
                <div
                  key={acc.id}
                  className="p-5 rounded-2xl bg-[#071A30]/85 hover:bg-[#071A30] border-2 border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                          isEmployee
                            ? "bg-[#0877C9] text-white"
                            : "bg-[#35C759] text-[#071A30]"
                        }`}
                      >
                        {isEmployee ? "🛠️ XODIM KABINETI" : "👤 FUQARO KABINETI"}
                      </span>
                      <span className="font-extrabold text-base text-white">{acc.full_name}</span>
                    </div>
                    <div className="text-xs text-sky-300 font-mono">
                      Login: <strong>{acc.email}</strong> • Parol: <strong>Tizgin2026!</strong>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {isEmployee
                        ? "✓ Xodim funksiyalari (Ta'mir, Muddat, Quvur pasporti, Analitika, Tasdiqlash) + Fuqaro funksiyalari biriktirilgan"
                        : "✓ Faqat Fuqaro funksiyalari (Suv oqishini xabar qilish, Xarita, Mening murojaatlarim, Sertifikatlar). Xodim funksiyalari yopiq!"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    disabled={loading}
                    className={`px-5 py-3 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
                      isEmployee
                        ? "bg-[#0877C9] hover:bg-sky-500 text-white"
                        : "bg-[#35C759] hover:bg-[#2eb850] text-[#071A30]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEmployee ? "Xodim kabinetiga kirish" : "Fuqaro kabinetiga kirish"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto text-center text-xs text-sky-200/80">
        {t("footer.rights")}
      </div>
    </div>
  );
}
