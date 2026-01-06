import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist, Poppins } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { env } from "~/env";
import { ThemeProvider } from "~/components/theme-provider";
import { BookingsProvider } from "~/lib/bookings-context";
import { LanguageProvider } from "~/lib/language-context";
import { PhoneProvider } from "~/lib/phone-context";
import { TopBar } from "~/components/top-bar";
import { PwaRegister } from "~/components/pwa-register";
import { Toaster } from "sonner";
import { PHProvider } from "./providers";

// Use runtime-configured base URL when available, otherwise fall back.
const siteUrl = env.NEXT_PUBLIC_BASE_URL;
const description =
  "Pitch Perfect Turf - Aruppukottai's premier 5-a-side football and box cricket destination. Book your slots online for a premium playing experience with professional turf and floodlights.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pitch Perfect Turf | Aruppukottai's Best Football & Cricket Turf",
    template: "%s • Pitch Perfect Turf",
  },
  description,
  keywords: [
    "Pitch Perfect Turf",
    "Aruppukottai turf",
    "turf booking Aruppukottai",
    "football turf Aruppukottai",
    "cricket turf Aruppukottai",
    "box cricket Aruppukottai",
    "5-a-side football Aruppukottai",
    "sports ground Aruppukottai",
    "turf near me",
    "online turf booking",
    "Pitch Perfect",
    "football turf",
    "cricket practice",
  ],
  authors: [{ name: "Pitch Perfect" }],
  creator: "Pitch Perfect",
  publisher: "Pitch Perfect",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      //{ url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    //apple: [{ url: "/icon-192.png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Pitch Perfect Turf",
    description,
    url: siteUrl,
    siteName: "Pitch Perfect Turf",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/highlights/highlight-aerial.jpg",
        width: 1200,
        height: 630,
        alt: "Pitch Perfect Turf Aruppukottai — Aerial View",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitch Perfect Turf",
    description,
    // Prefer absolute URL so validators reliably pick up the image
    images: [`${siteUrl.replace(/\/$/, "")}/highlights/highlight-aerial.jpg`],
    // Optional: set a creator/site identifier. Replace with your Twitter handle if available.
    creator: "Pitch Perfect",
    site: "@pitchperfect",
  },
  appleWebApp: {
    capable: true,
    title: "Pitch Perfect",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#25ff00" },
    { media: "(prefers-color-scheme: dark)", color: "#25ff00" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const poppins = Poppins({
  weight: "800",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="canonical" href={siteUrl.replace(/\/$/, "")} />
      </head>
      <body className="bg-background text-foreground min-h-screen font-sans">
        <PHProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LanguageProvider>
              <PhoneProvider>
                <BookingsProvider>
                  <TRPCReactProvider>
                    <div className="bg-background mx-auto flex min-h-screen w-full max-w-md flex-col">
                      <PwaRegister />
                      <TopBar />
                      <div className="flex-1 overflow-hidden">{children}</div>
                    </div>
                    <Toaster position="top-center" />
                  </TRPCReactProvider>
                </BookingsProvider>
              </PhoneProvider>
            </LanguageProvider>
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  );
}
