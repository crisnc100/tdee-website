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
  title: "My Calorie Needs - The Better No BS Calorie Calculator",
  description: "Calculate your daily calorie needs with our straightforward approach. No inflated claims, just accurate TDEE calculations. Created by Certified Personal Trainer Cristian Ortega from OrtegaFit.",
  keywords: "my calorie needs, your calorie needs, calorie calculator, TDEE calculator, daily calories, BMR, metabolism, weight loss, muscle gain",
  authors: [{ name: "Cristian Ortega", url: "https://mycalorieneeds.com" }],
  openGraph: {
    title: "My Calorie Needs - The Better No BS Calorie Calculator",
    description: "Calculate your daily calorie needs with our straightforward, no-nonsense approach by OrtegaFit.",
    url: "https://mycalorieneeds.com",
    siteName: "My Calorie Needs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Calorie Needs - The Better No BS Calorie Calculator",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My Calorie Needs" />
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
