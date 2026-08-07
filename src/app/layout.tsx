import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Amiri, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
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
      dir="ltr"
      className={`${ibmPlexArabic.variable} ${amiri.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header>
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
