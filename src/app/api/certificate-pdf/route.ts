// ============================================================================
// TIZGIN — Official "SUV ASROVCHISI" PDF Certificate Download Endpoint
// (/api/certificate-pdf)
// Generates a valid, standalone, modern A4 Landscape PDF file (.pdf)
// ready for direct download by the Citizen in all 4 supported languages
// (uz, kaa, en, ru).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

function sanitizePdfText(input: string): string {
  // Convert special apostrophes/quotes & transliterate non-ASCII to clean Latin for standard PDF Type1 Helvetica rendering
  const map: Record<string, string> = {
    "‘": "'",
    "’": "'",
    "ʻ": "'",
    "ʼ": "'",
    "“": '"',
    "”": '"',
    "«": '"',
    "»": '"',
    "—": "-",
    "–": "-",
    "á": "a",
    "Á": "A",
    "ǵ": "g'",
    "Ǵ": "G'",
    "ú": "u",
    "Ú": "U",
    "ó": "o",
    "Ó": "O",
    "ı": "i",
    "Í": "I",
    "ń": "n",
    "Ń": "N",
    "А": "A", "Б": "B", "В": "V", "Г": "G", "Д": "D", "Е": "E", "Ё": "Yo", "Ж": "Zh", "З": "Z", "И": "I", "Й": "Y",
    "К": "K", "Л": "L", "М": "M", "Н": "N", "О": "O", "П": "P", "Р": "R", "С": "S", "Т": "T", "У": "U", "Ф": "F",
    "Х": "Kh", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Shch", "Ъ": "", "Ы": "Y", "Ь": "", "Э": "E", "Ю": "Yu", "Я": "Ya",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i", "й": "y",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "Қ": "Q", "қ": "q", "Ғ": "G'", "ғ": "g'", "Ҳ": "H", "ҳ": "h", "Ў": "O'", "ў": "o'", "Ү": "U", "ү": "u", "Ұ": "U", "ұ": "u"
  };

  return input
    .split("")
    .map((ch) => (ch in map ? map[ch] : ch.charCodeAt(0) < 128 ? ch : ""))
    .join("")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildOfficialCertificatePdf({
  citizenName,
  certificateNumber,
  verificationCode,
  issueDate,
  verifiedReports,
  totalPoints,
  lang
}: {
  citizenName: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: string;
  verifiedReports: number;
  totalPoints: number;
  lang: string;
}): Buffer {
  const copyByLang: Record<
    string,
    {
      govHeader: string;
      badge: string;
      presentedTo: string;
      achievement1: string;
      achievement2: string;
      tagline: string;
      certIdLabel: string;
      dateLabel: string;
      qrLabel: string;
      authorizedBy: string;
    }
  > = {
    uz: {
      govHeader: "TIZGIN - AQLLI SUV BOSHQARUVI VA MONITORINGI PLATFORMASI",
      badge: "YANGI AVLOD RASMIY EKOLOGIK SERTIFIKATI",
      presentedTo: "USHBU FAXRIY SERTIFIKAT TASDIQLANGAN MUROJAAT MUALLIFI:",
      achievement1: `TIZGIN platformasida ${verifiedReports} ta suv quvuri avariyasi bartaraf etilishida faol ishtirok etib,`,
      achievement2: `jami ${totalPoints} ekologiya balli to'pladi va toza ichimlik suvini asrashga munosib hissa qo'shdi.`,
      tagline: "Har tomchi hisobda - har bir muammo nazoratda!",
      certIdLabel: "SERTIFIKAT RAQAMI",
      dateLabel: "TASDIQLANGAN SANA",
      qrLabel: "QR TEKSHIRUV KODI",
      authorizedBy: "Suv Ta'minoti Muhandislik Bo'limi Tomonidan Tasdiqlangan"
    },
    kaa: {
      govHeader: "TIZGIN - AQILLI SUW BASQARIWI HAM MONITORINGI PLATFORMASI",
      badge: "HURMETLI EKOLOGIYALIQ SERTIFIKAT (JANA FORMAT)",
      presentedTo: "BUL RASMIY SANLI SERTIFIKAT TASTIYIQLANGAN MURAJAT IYESI:",
      achievement1: `TIZGIN platformasinda ${verifiedReports} tastiyiqlangan suw quwiri avariyasi boyinsha xabar berip,`,
      achievement2: `jami ${totalPoints} ekologiya ballin jiynadi ham taza ishimlik suwin qorgawga ules qosti.`,
      tagline: "Har tamshi esapta - har bir mashqala qadagalawda!",
      certIdLabel: "SERTIFIKAT NOMERI",
      dateLabel: "BERILGEN SANE",
      qrLabel: "QR TEKSERIW KODI",
      authorizedBy: "Suw Tamiynati Injenerlik Bolimi Tarepinen Tastiyiqlangan"
    },
    en: {
      govHeader: "TIZGIN - SMART WATER MANAGEMENT & INFRASTRUCTURE PLATFORM",
      badge: "OFFICIAL DIGITAL CERTIFICATE OF ENVIRONMENTAL STEWARDSHIP",
      presentedTo: "THIS OFFICIAL CERTIFICATE IS PROUDLY PRESENTED TO CITIZEN:",
      achievement1: `For reporting ${verifiedReports} engineer-verified water pipeline incidents on the TIZGIN platform,`,
      achievement2: `earning ${totalPoints} conservation points and directly preventing clean drinking water loss.`,
      tagline: "Every Drop Counts - Every Problem Under Control!",
      certIdLabel: "CERTIFICATE ID",
      dateLabel: "VERIFIED ISSUE DATE",
      qrLabel: "QR VERIFICATION CODE",
      authorizedBy: "Authorized & Verified by Municipal Water Supply Engineering"
    },
    ru: {
      govHeader: "TIZGIN - PLATFORMA UMNOGO UPRAVLENIYA VODNYMI RESURSAMI",
      badge: "POCHETNYY EKOLOGICHESKIY SERTIFIKAT NOVOGO OBRAZTSA",
      presentedTo: "NASTOYASHCHIY SERTIFIKAT VRUCHAETSYA AKTIVNOMU GRAZHDANINU:",
      achievement1: `Za otpravku ${verifiedReports} podtverzhdennykh zayavok ob avariyakh vodoprovoda na platforme TIZGIN,`,
      achievement2: `nakoplenie ${totalPoints} ekologicheskikh ballov i vklad v sberezhenie chistoy pityevoy vody.`,
      tagline: "Kazhdaya kaplya na schetu - kazhdaya problema pod kontrolem!",
      certIdLabel: "NOMER SERTIFIKATA",
      dateLabel: "DATA VYDACHI",
      qrLabel: "QR-KOD PROVERKI",
      authorizedBy: "Podtverzhdeno Inzhenernoy Sluzhboy Vodokanala"
    }
  };

  const c = copyByLang[lang] || copyByLang.uz;

  const safeName = sanitizePdfText(citizenName.toUpperCase());
  const safeCert = sanitizePdfText(certificateNumber);
  const safeVerify = sanitizePdfText(verificationCode);
  const safeDate = sanitizePdfText(issueDate);

  // Build deterministic QR pattern commands in PDF vector graphics (bottom right corner)
  const qrCommands: string[] = [];
  const qrSize = 9;
  const qrStartX = 685;
  const qrStartY = 85;
  const cellW = 7.5;
  qrCommands.push("0.031 0.168 0.333 rg");
  for (let r = 0; r < qrSize; r++) {
    for (let col = 0; col < qrSize; col++) {
      const isCorner = (r < 2 && col < 2) || (r < 2 && col >= qrSize - 2) || (r >= qrSize - 2 && col < 2);
      const chCode = verificationCode.charCodeAt((r * qrSize + col) % verificationCode.length) || 70;
      if (isCorner || (chCode + r * 5 + col * 11) % 2 === 0) {
        const x = qrStartX + col * (cellW + 1.2);
        const y = qrStartY + r * (cellW + 1.2);
        qrCommands.push(`${x.toFixed(1)} ${y.toFixed(1)} ${cellW} ${cellW} re f`);
      }
    }
  }

  // A4 Landscape: 842 x 595 pt
  const streamLines = [
    // Deep Navy Outer Background (#071A30)
    "0.027 0.102 0.188 rg",
    "0 0 842 595 re f",

    // Inner Certificate Card White Background
    "0.975 0.988 1.000 rg",
    "28 28 786 539 re f",

    // Top Deep Navy Header Ribbon (#082B55)
    "0.031 0.168 0.333 rg",
    "28 492 786 75 re f",

    // Accent Ocean Blue & Fresh Green Top Stripes
    "0.031 0.467 0.788 rg",
    "28 484 520 8 re f",
    "0.208 0.780 0.349 rg",
    "548 484 266 8 re f",

    // Double Ornamental Border Frame
    "2.5 w",
    "0.031 0.467 0.788 RG",
    "42 42 758 511 re S",
    "1 w",
    "0.208 0.780 0.349 RG",
    "48 48 746 499 re S",

    // Citizen Name Highlight Pill Box
    "0.935 0.968 0.995 rg",
    "160 282 522 54 re f",
    "1.8 w",
    "0.031 0.467 0.788 RG",
    "160 282 522 54 re S",

    // Gold/Green Seal Circle on Left
    "0.208 0.780 0.349 rg",
    "70 85 95 95 re f",
    "0.031 0.168 0.333 rg",
    "76 91 83 83 re f",

    // QR Code Matrix on Right
    ...qrCommands,

    // Header Text (White on Navy)
    "BT",
    "/F2 18 Tf",
    "1 1 1 rg",
    `55 535 Td (${sanitizePdfText(c.govHeader)}) Tj`,
    "ET",

    "BT",
    "/F2 11 Tf",
    "0.208 0.780 0.349 rg",
    `55 512 Td (${sanitizePdfText(c.badge)}  |  ID: ${safeCert}) Tj`,
    "ET",

    // Main Title: «SUV ASROVCHISI»
    "BT",
    "/F2 42 Tf",
    "0.031 0.168 0.333 rg",
    `215 420 Td ("SUV ASROVCHISI") Tj`,
    "ET",

    // Subtitle: Presented To
    "BT",
    "/F2 12 Tf",
    "0.031 0.467 0.788 rg",
    `195 362 Td (${sanitizePdfText(c.presentedTo)}) Tj`,
    "ET",

    // Citizen Full Name inside Pill
    "BT",
    "/F2 26 Tf",
    "0.031 0.168 0.333 rg",
    `210 300 Td (${safeName}) Tj`,
    "ET",

    // Contribution & Points Lines
    "BT",
    "/F1 13 Tf",
    "0.15 0.23 0.35 rg",
    `145 242 Td (${sanitizePdfText(c.achievement1)}) Tj`,
    "ET",

    "BT",
    "/F2 13 Tf",
    "0.086 0.639 0.290 rg",
    `145 220 Td (${sanitizePdfText(c.achievement2)}) Tj`,
    "ET",

    // Official Tagline
    "BT",
    "/F2 13 Tf",
    "0.031 0.467 0.788 rg",
    `235 182 Td ("${sanitizePdfText(c.tagline)}") Tj`,
    "ET",

    // Left Seal Text
    "BT",
    "/F2 11 Tf",
    "0.208 0.780 0.349 rg",
    "88 142 Td (TIZGIN) Tj",
    "ET",
    "BT",
    "/F2 9 Tf",
    "1 1 1 rg",
    "84 126 Td (VERIFIED) Tj",
    "ET",
    "BT",
    "/F1 8 Tf",
    "0.75 0.90 1.0 rg",
    `84 110 Td (+${totalPoints} PTS) Tj`,
    "ET",

    // Footer Metadata Columns
    "BT",
    "/F2 10 Tf",
    "0.031 0.168 0.333 rg",
    `200 135 Td (${sanitizePdfText(c.certIdLabel)}: ${safeCert}) Tj`,
    "ET",

    "BT",
    "/F2 10 Tf",
    "0.031 0.168 0.333 rg",
    `200 116 Td (${sanitizePdfText(c.dateLabel)}: ${safeDate}) Tj`,
    "ET",

    "BT",
    "/F2 10 Tf",
    "0.086 0.639 0.290 rg",
    `200 97 Td (${sanitizePdfText(c.qrLabel)}: ${safeVerify}) Tj`,
    "ET",

    "BT",
    "/F1 9 Tf",
    "0.35 0.45 0.55 rg",
    `200 76 Td (${sanitizePdfText(c.authorizedBy)}) Tj`,
    "ET"
  ];

  const streamContent = streamLines.join("\n");
  const streamByteLen = Buffer.byteLength(streamContent, "utf-8");

  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${streamByteLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n"
  ];

  let pdfStr = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdfStr, "utf-8"));
    pdfStr += obj;
  }

  const xrefOffset = Buffer.byteLength(pdfStr, "utf-8");
  pdfStr += `xref\n0 ${objects.length + 1}\n`;
  pdfStr += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdfStr += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdfStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdfStr, "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const citizenName = searchParams.get("name") || "Aysultan Pirnazarova";
    const certificateNumber = searchParams.get("cert") || "SUV-2026-000184";
    const verificationCode = searchParams.get("code") || "TIZGIN-VERIFY-KAA-9941";
    const issueDate = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const verifiedReports = Number(searchParams.get("reports") || 3);
    const totalPoints = Number(searchParams.get("points") || 325);
    const lang = searchParams.get("lang") || "uz";

    const pdfBuffer = buildOfficialCertificatePdf({
      citizenName,
      certificateNumber,
      verificationCode,
      issueDate,
      verifiedReports,
      totalPoints,
      lang
    });

    const cleanFileName = `TIZGIN-SUV-ASROVCHISI-${certificateNumber}-${lang.toUpperCase()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cleanFileName}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store"
      }
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
