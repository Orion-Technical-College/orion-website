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

// Debug: Log auth configuration status
console.log("[Auth Config] Environment check:", {
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  nextAuthUrlValue: process.env.NEXTAUTH_URL?.substring(0, 30) + "...",
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
});

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
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials");
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
          console.log("[Auth] Attempting login for:", email);
          console.log("[Auth] Password length:", password.length);
          console.log("[Auth] IP:", ip);
          
          const result = await authorizeCredentials(
            {
              email,
              password,
              ip,
            },
            prisma
          );
          
          if (result) {
            console.log("[Auth] ✅ Login successful for:", result.email);
            console.log("[Auth] Returning user object:", {
              id: result.id,
              email: result.email,
              name: result.name,
              role: result.role,
            });
            
            // Return in format expected by NextAuth
            const userObject = {
              id: result.id,
              email: result.email,
              name: result.name,
              role: result.role as Role,
              clientId: result.clientId,
              isInternal: result.isInternal,
              mustChangePassword: result.mustChangePassword,
            };
            
            console.log("[Auth] User object to return:", JSON.stringify(userObject, null, 2));
            return userObject;
          } else {
            console.log("[Auth] ❌ Login failed - authorizeCredentials returned null");
            console.log("[Auth] This means: user not found, inactive, or password incorrect");
            return null;
          }
        } catch (error: any) {
          console.error("[Auth] ❌ Exception caught:", error.message);
          console.error("[Auth] Error stack:", error.stack);
          
          // Re-throw rate limit errors so NextAuth can handle them properly
          if (error.message?.includes("Too many login attempts")) {
            console.error("[Auth] Rate limit error - re-throwing");
            throw error;
          }
          
          // For other errors, return null (NextAuth will treat as invalid credentials)
          console.error("[Auth] Returning null due to error");
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
