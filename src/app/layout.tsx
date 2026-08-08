import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Amiri, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const amiri = Amiri({
  variable: "--font-heading",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "أكاديمية الإمام البخاري — منصة تعليمية لخدمة السنة النبوية",
  description:
    "منصة تعليمية إلكترونية متكاملة لإحياء الاهتمام بالسنة النبوية عبر مسارات علمية متدرجة تربط الحديث بمختلف العلوم الشرعية والحياتية",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${ibmPlexArabic.variable} ${amiri.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>{children}</QueryProvider>
            <Toaster position="top-center" dir="rtl" />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
