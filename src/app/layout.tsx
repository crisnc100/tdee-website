import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SimplePWA from "@/components/SimplePWA";
import NotificationSchedulerProvider from "@/components/NotificationSchedulerProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CalorieScope - Advanced TDEE Calculator | 7-Component Formula",
  description: "Calculate your Total Daily Energy Expenditure with the CalorieScope formula - a comprehensive approach that accounts for muscle mass, daily activity, and recovery needs. Created by Certified Personal Trainer Cristian Ortega.",
  keywords: "TDEE calculator, total daily energy expenditure, calories, BMR, metabolism, weight loss, muscle gain, CalorieScope",
  authors: [{ name: "Cristian Ortega", url: "https://caloriescope.com" }],
  openGraph: {
    title: "CalorieScope - Advanced TDEE Calculator",
    description: "Calculate your calorie needs with the comprehensive CalorieScope formula that goes beyond basic multipliers.",
    url: "https://caloriescope.com",
    siteName: "CalorieScope",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CalorieScope - Advanced TDEE Calculator",
    description: "Calculate your calorie needs with the comprehensive CalorieScope formula.",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CalorieScope" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900`}>
        <SimplePWA />
        <NotificationSchedulerProvider />
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
