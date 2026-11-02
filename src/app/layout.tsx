import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import NotificationSchedulerProvider from "@/components/NotificationSchedulerProvider"; // Disabled for MVP
import CoachingPrompt from "@/components/coaching/CoachingPrompt";
import VisitTracker from "@/components/VisitTracker";

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

// Runs before first paint so the page never flashes the wrong theme: the
// saved choice wins, otherwise the OS preference.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyCalorieLog" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="font-sans antialiased">
        {/* <NotificationSchedulerProvider /> */} {/* Disabled for MVP */}
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
