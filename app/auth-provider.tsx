"use client";

import { AuthProvider } from "../contexts/AuthContext";

export default function AuthOnlyProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}
