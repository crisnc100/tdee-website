import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SimplePWA from "@/components/SimplePWA";
import NotificationSchedulerProvider from "@/components/NotificationSchedulerProvider";
import CoachingPrompt from "@/components/coaching/CoachingPrompt";
import VisitTracker from "@/components/VisitTracker";
import DarkModeProvider from "@/components/DarkModeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MyCalorieLog - The Better No BS Calorie Calculator",
  description: "Calculate your daily calorie needs with our straightforward approach. No inflated claims, just accurate TDEE calculations. Created by Certified Personal Trainer Cristian Ortega from OrtegaFit.",
  keywords: "my calorie log, calorie log, calorie calculator, TDEE calculator, daily calories, BMR, metabolism, weight loss, muscle gain",
  authors: [{ name: "Cristian Ortega", url: "https://mycalorielog.com" }],
  openGraph: {
    title: "MyCalorieLog - The Better No BS Calorie Calculator",
    description: "Calculate your daily calorie needs with our straightforward, no-nonsense approach by OrtegaFit.",
    url: "https://mycalorielog.com",
    siteName: "MyCalorieLog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyCalorieLog - The Better No BS Calorie Calculator",
    description: "Calculate your daily calorie needs with our straightforward, no-nonsense approach.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EA580C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyCalorieLog" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-pattern`}>
        <DarkModeProvider />
        <SimplePWA />
        <NotificationSchedulerProvider />
        <VisitTracker />
        <CoachingPrompt />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
