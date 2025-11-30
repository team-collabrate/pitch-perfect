import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";
import { BookingsProvider } from "~/lib/bookings-context";
import { LanguageProvider } from "~/lib/language-context";
import { TopBar } from "~/components/top-bar";
import { PwaRegister } from "~/components/pwa-register";

const siteUrl = "https://pitchperfect.turf";
const description = "Mobile-first turf booking experience for Aruppukottai players.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pitch Perfect Turf",
    template: "%s • Pitch Perfect Turf",
  },
  description,
  keywords: [
    "turf booking",
    "football turf",
    "cricket practice",
    "Aruppukottai",
    "Pitch Perfect",
  ],
  authors: [{ name: "Pitch Perfect" }],
  creator: "Pitch Perfect",
  publisher: "Pitch Perfect",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icon-192.png" }],
  },
  manifest: "/manifest.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#25ff00" },
    { media: "(prefers-color-scheme: dark)", color: "#25ff00" },
  ],
  openGraph: {
    title: "Pitch Perfect Turf",
    description,
    url: siteUrl,
    siteName: "Pitch Perfect Turf",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pitch Perfect Turf booking hero",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitch Perfect Turf",
    description,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Pitch Perfect",
    statusBarStyle: "black-translucent",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <BookingsProvider>
              <TRPCReactProvider>
                <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
                  <PwaRegister />
                  <TopBar />
                  <div className="flex-1 overflow-hidden">{children}</div>
                </div>
              </TRPCReactProvider>
            </BookingsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
