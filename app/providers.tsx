"use client";

import { useCallback, useMemo } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.warn("NEXT_PUBLIC_CONVEX_URL is not set.");
}

const convex = new ConvexReactClient(convexUrl ?? "");

// Adapts our session (httpOnly cookie, surfaced via AuthContext) to the shape
// Convex's auth integration expects. The Convex token is fetched on demand from
// /api/auth/convex-token, which reads the httpOnly cookie server-side.
function useConvexAuthFromSession() {
  const { session, isLoading } = useAuth();

  const fetchAccessToken = useCallback(
    async (_args: { forceRefreshToken: boolean }): Promise<string | null> => {
      try {
        const res = await fetch("/api/auth/convex-token", { cache: "no-store" });
        if (!res.ok) return null;
        const data = (await res.json()) as { token?: string };
        return data.token ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: session !== null,
      fetchAccessToken,
    }),
    [isLoading, session, fetchAccessToken],
  );
}

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useConvexAuthFromSession}>
        <LanguageProvider>{children}</LanguageProvider>
      </ConvexProviderWithAuth>
    </AuthProvider>
  );
}
