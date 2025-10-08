import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keshin Shop",
  description: "Welcome to Virtual Barber Shop. Find out which hairstyle suits you before getting a real haircut",
  openGraph: {
    type: "website",
    siteName: "Keshin Shop",
    title: "Keshin Shop",
    description: "Welcome to Virtual Barber Shop. Find out which hairstyle suits you before getting a real haircut",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keshin Shop",
    description: "Welcome to Virtual Barber Shop. Find out which hairstyle suits you before getting a real haircut",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased app-shell`}
      >
        {/* Background Orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb--teal"></div>
          <div className="orb orb--purple"></div>
          <div className="orb orb--blue"></div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
