"use client";

import { lazy, Suspense } from "react";
import { usePathname } from "next/navigation";
import { LanguageProvider } from "../i18n/LanguageContext";

const ConvexProvider = lazy(() => import("./convex-provider"));
const PortalProviders = lazy(() => import("./portal-providers"));
const AuthProvider = lazy(() => import("./auth-provider"));

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const needsPortalAuth = ["/student", "/tutor", "/admin"].includes(pathname);
  const needsAuth = [
    "/student/login",
    "/tutor/login",
    "/admin/login",
  ].includes(pathname);
  const needsPublicConvex =
    pathname === "/interview" || pathname === "/student/signup";

  return (
    <LanguageProvider>
      {needsPortalAuth ? (
        <Suspense fallback={null}>
          <PortalProviders>{children}</PortalProviders>
        </Suspense>
      ) : needsAuth ? (
        <Suspense fallback={null}>
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
      ) : needsPublicConvex ? (
        <Suspense fallback={null}>
          <ConvexProvider>{children}</ConvexProvider>
        </Suspense>
      ) : (
        children
      )}
    </LanguageProvider>
  );
}
