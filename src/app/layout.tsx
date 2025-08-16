import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
      <body className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900`}>
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
