"use client";

import { useCallback, useMemo } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.warn("NEXT_PUBLIC_CONVEX_URL is not set.");
}

const convex = new ConvexReactClient(convexUrl ?? "");

function useConvexAuthFromSession() {
  const { session, isLoading } = useAuth();

  const fetchAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth/convex-token", {
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { token?: string };
      return data.token ?? null;
    } catch {
      return null;
    }
  }, []);

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: session !== null,
      fetchAccessToken,
    }),
    [isLoading, session, fetchAccessToken],
  );
}

export default function PortalProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useConvexAuthFromSession}>
        {children}
      </ConvexProviderWithAuth>
    </AuthProvider>
  );
}
