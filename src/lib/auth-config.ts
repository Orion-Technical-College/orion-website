import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/permissions";
import { validateAuthConfig } from "@/lib/config-validation";
import {
  authorizeCredentials,
  jwtCallback,
  sessionCallback,
} from "@/lib/auth-provider";
import { AuthError, AuthErrorType, getUserFriendlyMessage } from "@/lib/auth-errors";

// Debug: Log auth configuration status (only in non-production or when explicitly enabled)
if (process.env.NODE_ENV !== "production" || process.env.ENABLE_AUTH_DEBUG === "true") {
  try {
    console.log("[Auth Config] Environment check:", {
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrlValue: process.env.NEXTAUTH_URL?.substring(0, 30) + "...",
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    // Silently fail if logging causes issues
  }
}

// Validate config on module load (logs warnings, doesn't throw)
validateAuthConfig();

export const authOptions: NextAuthOptions = {
  // Using JWT strategy, so no adapter needed
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Check for missing or empty credentials
        if (!credentials?.email || !credentials?.password || 
            credentials.email.trim() === "" || credentials.password.trim() === "") {
          return null;
        }

        // Normalize email (trim and lowercase)
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        const ip =
          (req?.headers?.["x-forwarded-for"] as string) ||
          (req?.headers?.["x-real-ip"] as string) ||
          "unknown";

        try {
          const result = await authorizeCredentials(
            {
              email,
              password,
              ip,
            },
            prisma
          );
          
          if (result) {
            // Return in format expected by NextAuth
            return {
              id: result.id,
              email: result.email,
              name: result.name,
              role: result.role as Role,
              clientId: result.clientId,
              isInternal: result.isInternal,
              mustChangePassword: result.mustChangePassword,
            };
          }
          
          // No result means invalid credentials (user not found or wrong password)
          return null;
        } catch (error: unknown) {
          // Handle AuthError instances with proper error classification
          if (error instanceof AuthError) {
            // Re-throw rate limit and account inactive errors so NextAuth can handle them
            if (error.type === AuthErrorType.RATE_LIMIT || error.type === AuthErrorType.ACCOUNT_INACTIVE) {
              throw new Error(getUserFriendlyMessage(error.type));
            }
            
            // For database and system errors, log and throw user-friendly message
            if (error.type === AuthErrorType.DATABASE_ERROR || error.type === AuthErrorType.SYSTEM_ERROR) {
              // Log structured error for monitoring
              console.error("[Auth] System error during login:", {
                type: error.type,
                message: error.message,
                email: email,
                originalError: error.originalError?.message,
                metadata: error.metadata,
              });
              
              // Throw user-friendly error message
              throw new Error(getUserFriendlyMessage(error.type));
            }
            
            // For other errors, return null (NextAuth will treat as invalid credentials)
            console.error("[Auth] Login error:", {
              type: error.type,
              message: error.message,
              email: email,
            });
            return null;
          }
          
          // Handle non-AuthError exceptions
          if (error instanceof Error) {
            // Check if it's a rate limit error (legacy format)
            if (error.message.includes("Too many login attempts")) {
              throw error;
            }
            
            // Classify unknown errors
            const errorType = AuthErrorType.SYSTEM_ERROR;
            console.error("[Auth] Unexpected error during login:", {
              type: errorType,
              message: error.message,
              stack: error.stack,
              email: email,
            });
            
            // Return null for unknown errors to maintain security (don't reveal system internals)
            return null;
          }
          
          // Handle non-Error exceptions
          console.error("[Auth] Non-Error exception during login:", {
            error: String(error),
            email: email,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      return jwtCallback({
        token: token as any,
        user: user as any,
        account: account || undefined,
        profile: profile as any,
      }) as any;
    },
    async session({ session, token }) {
      return sessionCallback({ session, token: token as any }) as any;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect to workspace selector
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/workspaces`;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/workspaces`;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
