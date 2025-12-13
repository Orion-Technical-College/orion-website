import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SessionProvider } from "@/components/providers/session-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMC Workspace",
  description: "Recruiter workflow automation platform for EMC Support",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EMC Workspace",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00d4ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <SessionProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

