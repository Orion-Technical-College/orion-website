import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SessionProvider } from "@/components/providers/session-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { InstallBanner } from "@/components/pwa/install-banner";
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
  viewportFit: "cover", // Enable safe-area-inset support for iOS
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Modern PWA meta tag (in addition to apple-mobile-web-app-capable for iOS) */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <SessionProvider>
          <PWAProvider>
            <NotificationProvider>
              {children}
              <InstallBanner />
            </NotificationProvider>
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

