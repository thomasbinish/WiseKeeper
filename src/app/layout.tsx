import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WiseKeeper - Household Expense Tracker",
  description: "Smart, family-focused expense tracking for the modern home.",
};

import { ThemeProvider } from "@/components/theme-provider";
import { GlobalHeaderActions } from "@/components/GlobalHeaderActions";
import { GlobalTutorialWrapper } from "@/components/GlobalTutorialWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background font-sans antialiased">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between px-4">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <img src="/logo.png" alt="WiseKeeper Logo" className="w-full h-full object-contain dark:invert" />
                  </div>
                  <span className="font-serif font-bold text-xl text-primary hidden sm:inline-block">WiseKeeper</span>
                </div>

                {/* Actions */}
                <GlobalHeaderActions />
              </div>
            </header>
            <main className="container py-6">
              {children}
            </main>
            <GlobalTutorialWrapper />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
