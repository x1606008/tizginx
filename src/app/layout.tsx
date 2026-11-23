import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "TIZGIN — Smart Water Management & Infrastructure Monitoring Platform",
  description:
    "Har tomchi hisobda — har bir muammo nazoratda! Hár tamshı esapta — hár bir mashqala qadaǵalawda! Every Drop Counts — Every Problem Under Control!"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[#F4F8FC] dark:bg-[#071A30] text-slate-900 dark:text-slate-100 transition-colors">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
