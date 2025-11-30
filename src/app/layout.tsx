import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";
import { BookingsProvider } from "~/lib/bookings-context";
import { LanguageProvider } from "~/lib/language-context";
import { TopBar } from "~/components/top-bar";
import { PwaRegister } from "~/components/pwa-register";

export const metadata: Metadata = {
  title: "Pitch Perfect Turf",
  description: "Mobile-first turf booking experience",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.webmanifest",
  themeColor: "#25ff00",
  appleWebApp: {
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
