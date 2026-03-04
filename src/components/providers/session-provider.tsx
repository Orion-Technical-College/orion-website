"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * SessionProvider with refetchOnWindowFocus disabled.
 * When users leave the app to send SMS (e.g. guided send → native Messages),
 * refetching on return can fail on mobile (cookie/network) and trigger
 * "unauthenticated" → redirect to login. Disabling refetch on focus avoids
 * that while keeping initial session and explicit refetches intact.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider refetchOnWindowFocus={false}>
      {children}
    </NextAuthSessionProvider>
  );
}

