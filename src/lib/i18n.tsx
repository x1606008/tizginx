"use client";

// ============================================================================
// TIZGIN — Multilingual Internationalization Engine (uz, kaa, en, ru)
// Default language: Uzbek (uz). Saves in localStorage, Cookie, and User Profile.
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from "react";
import uzMessages from "../../messages/uz.json";
import kaaMessages from "../../messages/kaa.json";
import enMessages from "../../messages/en.json";
import ruMessages from "../../messages/ru.json";

export type Locale = "uz" | "kaa" | "en" | "ru";

export const SUPPORTED_LOCALES: Array<{ code: Locale; label: string; nativeLabel: string; flag: string }> = [
  { code: "uz", label: "Uzbek", nativeLabel: "O‘zbekcha", flag: "🇺🇿" },
  { code: "kaa", label: "Karakalpak", nativeLabel: "Qaraqalpaqsha (Қарақалпақ)", flag: "🇰🇿" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "ru", label: "Russian", nativeLabel: "Русский", flag: "🇷🇺" }
];

const dictionaries: Record<Locale, typeof uzMessages> = {
  uz: uzMessages,
  kaa: kaaMessages,
  en: enMessages,
  ru: ruMessages
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (keyPath: string) => string;
  dict: typeof uzMessages;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "uz",
  setLocale: () => {},
  t: (k) => k,
  dict: uzMessages,
  darkMode: false,
  toggleDarkMode: () => {}
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uz");
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem("tizgin_locale") as Locale | null;
      if (savedLocale && ["uz", "kaa", "en", "ru"].includes(savedLocale)) {
        setLocaleState(savedLocale);
      }
      const savedTheme = localStorage.getItem("tizgin_theme");
      if (savedTheme === "dark") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("tizgin_locale", newLocale);
      document.cookie = `tizgin_locale=${newLocale}; path=/; max-age=31536000`;
    } catch {
      // ignore
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tizgin_theme", next ? "dark" : "light");
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

  const dict = dictionaries[locale] || uzMessages;

  const t = (keyPath: string): string => {
    const parts = keyPath.split(".");
    let cur: unknown = dict;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        // Fallback to Uzbek dictionary if key missing
        let fb: unknown = uzMessages;
        for (const fp of parts) {
          if (fb && typeof fb === "object" && fp in (fb as Record<string, unknown>)) {
            fb = (fb as Record<string, unknown>)[fp];
          } else {
            return keyPath;
          }
        }
        return typeof fb === "string" ? fb : keyPath;
      }
    }
    return typeof cur === "string" ? cur : keyPath;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dict, darkMode, toggleDarkMode }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
