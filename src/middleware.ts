import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Role, ROLES } from "@/lib/permissions";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes require PLATFORM_ADMIN
    if (path.startsWith("/admin")) {
      if (token?.role !== ROLES.PLATFORM_ADMIN) {
        return NextResponse.redirect(new URL("/workspaces", req.url));
      }
    }

    // ELITE workspace routes require a tenant (clientId)
    // Full ELITE context resolution happens in page/API routes
    if (path.startsWith("/elite") || path.startsWith("/api/elite")) {
      // User must have a tenant to access ELITE workspace
      if (!token?.clientId) {
        // Internal users (PLATFORM_ADMIN, RECRUITER) don't have clientId
        // They cannot access ELITE workspace
        return NextResponse.redirect(new URL("/workspaces", req.url));
      }
      // Note: Full permission check via EliteContext happens in the route handlers
      // This middleware only does the basic tenant gate
    }

    // Client routes require CLIENT_ADMIN or CLIENT_USER
    if (path.startsWith("/client")) {
      if (
        token?.role !== ROLES.CLIENT_ADMIN &&
        token?.role !== ROLES.CLIENT_USER
      ) {
        return NextResponse.redirect(new URL("/workspaces", req.url));
      }
    }

    // Candidate routes require CANDIDATE
    if (path.startsWith("/candidate")) {
      if (token?.role !== ROLES.CANDIDATE) {
        return NextResponse.redirect(new URL("/workspaces", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login and public routes
        const path = req.nextUrl.pathname;
        if (
          path.startsWith("/login") ||
          path.startsWith("/change-password") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/_next") ||
          path.startsWith("/favicon.ico") ||
          // PWA static files
          path === "/sw.js" ||
          path === "/manifest.json" ||
          path === "/offline.html" ||
          path === "/clear-cache.html" ||
          path.startsWith("/icons/")
        ) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Exclude auth routes, static files, and PWA assets from middleware
    "/((?!api/auth|login|signup|change-password|_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html|clear-cache.html|icons/).*)",
  ],
};

