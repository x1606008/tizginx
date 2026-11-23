"use client";

// ============================================================================
// TIZGIN — Module 7: New-Format "SUV ASROVCHISI" Citizen Certificate Component
// - Exclusively awarded to CITIZENS after an Employee finishes repair & grants permission
// - New modern horizontal/diploma design with Official Gold/Emerald Seal,
//   Hydraulic Water Conservation Badge, QR Matrix & Direct PDF File Download (.pdf)
// - Supports all 4 languages (uz, kaa, en, ru)
// ============================================================================

import React, { useState } from "react";
import { TizginLogo } from "./TizginLogo";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { Award, CheckCircle2, Download, Printer, ShieldCheck, Sparkles, Droplets } from "lucide-react";

const CERT_TRANSLATIONS: Record<
  Locale,
  {
    headerBadge: string;
    title: string;
    subtitle: string;
    presentedTo: string;
    contributionText: (reports: number, points: number) => string;
    waterSavedBadge: (reports: number) => string;
    tagline: string;
    certIdLabel: string;
    issueDateLabel: string;
    qrVerifyLabel: string;
    signatureRole: string;
    signatureOrg: string;
    downloadPdfBtn: string;
    printBtn: string;
  }
> = {
  uz: {
    headerBadge: "O‘ZBEKISTON VA QORAQALPOG‘ISTON ICHIMLIK SUVINI ASRASH EKOTIZIMI",
    title: "SUV ASROVCHISI",
    subtitle: "YANGI AVLOD RASMIY EKOLOGIK SERTIFIKATI",
    presentedTo:
      "Ushbu faxriy raqamli sertifikat suv quvuri avariyasi haqida xabar berib, ta'mirlash ishlari xodim tomonidan yakunlangach tasdiqlangan faol fuqaroga taqdim etiladi:",
    contributionText: (reports, points) =>
      `TIZGIN platformasida ${reports} ta tasdiqlangan suv infratuzilmasi murojaati bo‘yicha ta'mirlash yakunlandi. Fuqaro jami ${points} ekologiya balli to‘plab, toza ichimlik suvini asrashga munosib hissa qo‘shdi.`,
    waterSavedBadge: (reports) => `Saqlab qolingan ichimlik suvi: ~${(reports * 14500).toLocaleString()} litr`,
    tagline: "«Har tomchi hisobda — har bir muammo nazoratda!»",
    certIdLabel: "Sertifikat raqami",
    issueDateLabel: "Xodim tasdiqlagan sana",
    qrVerifyLabel: "QR Tekshiruv kodi",
    signatureRole: "Suv Ta'minoti Muhandislik Bo‘limi Ruxsati Bilan",
    signatureOrg: "PDF Yuklab Olishga Tayyor Rasmiy Elektron Hujjat",
    downloadPdfBtn: "PDF Sertifikatni Yuklab Olish (.PDF)",
    printBtn: "Chop etish"
  },
  kaa: {
    headerBadge: "QARAQALPAQSTAN HÁM ÓZBEKSTAN ISHIMLIK SUWIN QORǴAW EKOSISTEMASI",
    title: "SUV ASROVCHISI",
    subtitle: "JAŃA FORMATTAǴI RÁSMIY EKOLOGIYALIQ SERTIFIKAT",
    presentedTo:
      "Bul húrmetli sanlı sertifikat suw quwırı avariyası haqqında xabar berip, ońlaw jumısları xızmetker tárepinen juwmaqlanǵannan soń tastıyıqlanǵan belsendi puqaraǵa tapsırıladı:",
    contributionText: (reports, points) =>
      `TIZGIN platformasında ${reports} tastıyıqlanǵan suw quwırı avariyası boyınsha ońlaw juwmaqlandı. Puqara jámi ${points} ekologiya ballın jıynap, taza ishimlik suwın saqlap qalıwǵa úles qostı.`,
    waterSavedBadge: (reports) => `Saqlap qalınǵan ishimlik suwı: ~${(reports * 14500).toLocaleString()} litr`,
    tagline: "«Hár tamshı esapta — hár bir mashqala qadaǵalawda!»",
    certIdLabel: "Sertifikat nomeri",
    issueDateLabel: "Xızmetker tastıyıqlaǵan sáne",
    qrVerifyLabel: "QR Tekseriw kodı",
    signatureRole: "Suw Támiynatı Injenerlik Bólimi Ruxsatı Menen",
    signatureOrg: "PDF Júklep Alıwǵa Tayar Rásmiy Elektron Hújjet",
    downloadPdfBtn: "PDF Sertifikattı Júklep Alıw (.PDF)",
    printBtn: "Basıp shıǵarıw"
  },
  en: {
    headerBadge: "MUNICIPAL DRINKING WATER CONSERVATION & TRANSPARENCY ECOSYSTEM",
    title: "SUV ASROVCHISI",
    subtitle: "NEXT-GENERATION OFFICIAL ENVIRONMENTAL CERTIFICATE",
    presentedTo:
      "This official digital certificate is proudly awarded exclusively to the reporting Citizen upon repair completion and authorization by the Water Supply Engineer:",
    contributionText: (reports, points) =>
      `Successfully contributed ${reports} engineer-completed water infrastructure reports on the TIZGIN platform, earning ${points} conservation points and preventing clean drinking water loss.`,
    waterSavedBadge: (reports) => `Estimated Clean Water Saved: ~${(reports * 14500).toLocaleString()} Liters`,
    tagline: "“Every Drop Counts — Every Problem Under Control!”",
    certIdLabel: "Certificate ID",
    issueDateLabel: "Engineer Authorization Date",
    qrVerifyLabel: "QR Verification Code",
    signatureRole: "Authorized by Water Supply Engineering Department",
    signatureOrg: "Official PDF-Ready Digitally Verified Certificate",
    downloadPdfBtn: "Download Official Certificate (.PDF)",
    printBtn: "Print Certificate"
  },
  ru: {
    headerBadge: "ЦИФРОВАЯ ЭКОСИСТЕМА СОХРАНЕНИЯ ПИТЬЕВОЙ ВОДЫ И КОНТРОЛЯ СЕТЕЙ",
    title: "SUV ASROVCHISI",
    subtitle: "ОФИЦИАЛЬНЫЙ ЭКОЛОГИЧЕСКИЙ СЕРТИФИКАТ НОВОГО ОБРАЗЦА",
    presentedTo:
      "Настоящий официальный цифровой сертификат вручается исключительно гражданину-заявителю после полного завершения ремонта и разрешения сотрудника водоканала:",
    contributionText: (reports, points) =>
      `За отправку ${reports} успешно устранённых инженерами заявок об утечках воды на платформе TIZGIN, накопление ${points} экологических баллов и вклад в сбережение питьевой воды.`,
    waterSavedBadge: (reports) => `Сохранено чистой питьевой воды: ~${(reports * 14500).toLocaleString()} литров`,
    tagline: "«Каждая капля на счету — каждая проблема под контролем!»",
    certIdLabel: "Номер сертификата",
    issueDateLabel: "Дата подтверждения ремонта",
    qrVerifyLabel: "QR-код верификации",
    signatureRole: "Выдано с разрешения инженерной службы водоканала",
    signatureOrg: "Официальный электронный документ в формате PDF",
    downloadPdfBtn: "Скачать сертификат в формате PDF (.PDF)",
    printBtn: "Печать"
  }
};

function QrCodeSvg({ code }: { code: string }) {
  const size = 11;
  const cells: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      const isTopLeft = r < 3 && c < 3;
      const isTopRight = r < 3 && c >= size - 3;
      const isBottomLeft = r >= size - 3 && c < 3;
      if (isTopLeft || isTopRight || isBottomLeft) {
        cells[r][c] = true;
      } else {
        const charCode = code.charCodeAt((r * size + c) % code.length) || 65;
        cells[r][c] = (charCode + r * 7 + c * 13) % 2 === 0;
      }
    }
  }

  return (
    <svg viewBox="0 0 110 110" width="96" height="96" className="rounded-xl border-2 border-[#082B55] bg-white p-1.5 shadow-md">
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * 10}
              y={rIdx * 10}
              width="8.8"
              height="8.8"
              rx="1.5"
              fill="#082B55"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export function SuvAsrovchisiCertificate({
  citizenName = "Aysultan Pirnazarova",
  certificateNumber = "SUV-2026-000184",
  verificationCode = "TIZGIN-VERIFY-KAA-9941",
  issueDate = "2026-11-23",
  verifiedReports = 3,
  totalPoints = 325
}: {
  citizenName?: string;
  certificateNumber?: string;
  verificationCode?: string;
  issueDate?: string;
  verifiedReports?: number;
  totalPoints?: number;
}) {
  const [certLang, setCertLang] = useState<Locale>("uz");
  const copy = CERT_TRANSLATIONS[certLang] || CERT_TRANSLATIONS.uz;

  const pdfDownloadUrl = `/api/certificate-pdf?name=${encodeURIComponent(
    citizenName
  )}&cert=${encodeURIComponent(certificateNumber)}&code=${encodeURIComponent(
    verificationCode
  )}&date=${encodeURIComponent(issueDate)}&reports=${verifiedReports}&points=${totalPoints}&lang=${certLang}`;

  return (
    <div className="space-y-5">
      {/* Top Bar: Language Switcher + Direct PDF Download Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-[#082B55] dark:text-sky-300 uppercase">
            Sertifikat tili (4-Til):
          </span>
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => setCertLang(loc.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                certLang === loc.code
                  ? "bg-[#082B55] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {loc.flag} {loc.nativeLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Ready-to-Download .PDF File Link */}
          <a
            href={pdfDownloadUrl}
            download={`TIZGIN-SUV-ASROVCHISI-${certificateNumber}-${certLang.toUpperCase()}.pdf`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-[#071A30] bg-[#35C759] hover:bg-[#2eb850] transition-all shadow-md shadow-[#35C759]/20"
          >
            <Download className="w-4 h-4" />
            <span>{copy.downloadPdfBtn}</span>
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#082B55] hover:bg-[#0877C9] transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{copy.printBtn}</span>
          </button>
        </div>
      </div>

      {/* NEW MODERN DIPLOMA FORMAT CERTIFICATE */}
      <div className="relative rounded-[28px] p-2 bg-gradient-to-r from-[#071A30] via-[#0877C9] to-[#35C759] shadow-2xl">
        <div className="relative rounded-[22px] bg-white dark:bg-[#071A30] overflow-hidden border-2 border-white/40">
          {/* Top Navy & Emerald Geometric Banner */}
          <div className="bg-gradient-to-r from-[#071A30] via-[#082B55] to-[#0877C9] text-white px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#35C759]">
            <TizginLogo size={46} className="text-white" />

            <div className="text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#35C759] text-[#071A30] text-[10px] sm:text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{copy.headerBadge}</span>
              </div>
              <div className="text-xs text-sky-200 font-mono">
                OFFICIAL PDF SERIAL: <strong>{certificateNumber}</strong>
              </div>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-6 sm:p-10 relative">
            {/* Subtle Background Emblem */}
            <div className="pointer-events-none absolute right-8 top-8 opacity-5">
              <Droplets className="w-72 h-72 text-[#0877C9]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left 9 Columns: Main Award Content */}
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#0877C9]/10 text-[#0877C9] dark:text-sky-300 text-xs font-extrabold tracking-widest uppercase border border-[#0877C9]/30">
                  <Award className="w-4 h-4 text-[#35C759]" />
                  <span>{copy.subtitle}</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#082B55] dark:text-white">
                  «{copy.title}»
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {copy.presentedTo}
                </p>

                {/* Recipient Citizen Name Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#F4F8FC] via-sky-50 to-emerald-50/60 dark:from-slate-800 dark:to-slate-800/80 border-l-8 border-[#0877C9] shadow-inner flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      TASDIQLANGAN FUQARO (CITIZEN RECIPIENT)
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#082B55] dark:text-white tracking-wide mt-0.5">
                      {citizenName}
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-[#35C759]/20 border border-[#35C759]/40 text-right">
                    <div className="text-[10px] font-bold uppercase text-[#16A34A] dark:text-[#35C759]">
                      EKOLOGIYA BALLARI
                    </div>
                    <div className="text-xl font-black text-[#082B55] dark:text-white">+{totalPoints} BALL</div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {copy.contributionText(verifiedReports, totalPoints)}
                </p>

                {/* Water Saved Pill */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500/15 text-[#0877C9] dark:text-sky-300 text-xs font-extrabold border border-sky-400/30">
                    <Droplets className="w-4 h-4" />
                    <span>{copy.waterSavedBadge(verifiedReports)}</span>
                  </span>
                  <span className="text-xs font-bold italic text-[#16A34A] dark:text-[#35C759]">
                    {copy.tagline}
                  </span>
                </div>
              </div>

              {/* Right 4 Columns: Official Verification Seal, QR Code & Metadata Card */}
              <div className="lg:col-span-4">
                <div className="rounded-2xl bg-[#F4F8FC] dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center space-y-4 shadow-md">
                  {/* Gold/Emerald Verification Seal */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#082B55] via-[#0877C9] to-[#35C759] p-1 shadow-lg">
                    <div className="w-full h-full rounded-full bg-[#071A30] flex flex-col items-center justify-center text-white">
                      <CheckCircle2 className="w-6 h-6 text-[#35C759]" />
                      <span className="text-[9px] font-black tracking-wider uppercase mt-0.5">VERIFIED</span>
                      <span className="text-[8px] text-sky-300 font-bold">TIZGIN SEAL</span>
                    </div>
                  </div>

                  <QrCodeSvg code={verificationCode} />

                  <div className="w-full space-y-1.5 text-left text-xs border-t border-slate-200 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{copy.certIdLabel}:</span>
                      <strong className="font-mono text-[#082B55] dark:text-white">{certificateNumber}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{copy.issueDateLabel}:</span>
                      <strong className="text-[#082B55] dark:text-white">{issueDate}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{copy.qrVerifyLabel}:</span>
                      <strong className="font-mono text-[11px] text-[#16A34A] dark:text-[#35C759]">
                        {verificationCode}
                      </strong>
                    </div>
                  </div>

                  <div className="w-full pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                    <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#082B55] dark:text-sky-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#35C759]" />
                      <span>{copy.signatureRole}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{copy.signatureOrg}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
