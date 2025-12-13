import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Role, ROLES } from "@/lib/permissions";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to change-password page
    if (path.startsWith("/change-password")) {
      return NextResponse.next();
    }

    // If user must change password, redirect to change-password page
    if (token?.mustChangePassword && path !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    // Admin routes require PLATFORM_ADMIN
    if (path.startsWith("/admin")) {
      if (token?.role !== ROLES.PLATFORM_ADMIN) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Client routes require CLIENT_ADMIN or CLIENT_USER
    if (path.startsWith("/client")) {
      if (
        token?.role !== ROLES.CLIENT_ADMIN &&
        token?.role !== ROLES.CLIENT_USER
      ) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Candidate routes require CANDIDATE
    if (path.startsWith("/candidate")) {
      if (token?.role !== ROLES.CANDIDATE) {
        return NextResponse.redirect(new URL("/", req.url));
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
          path.startsWith("/favicon.ico")
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
    "/((?!api/auth|login|signup|change-password|_next/static|_next/image|favicon.ico).*)",
  ],
};

