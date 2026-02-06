"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type TutorSession = {
  type: "tutor";
  id: string;
  name: string;
  email: string;
};

type AdminSession = {
  type: "admin";
  id: string;
  name: string;
  email: string;
};

type Session = TutorSession | AdminSession | null;

type AuthContextValue = {
  session: Session;
  isLoading: boolean;
  loginTutor: (session: TutorSession) => void;
  loginAdmin: (session: AdminSession) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) {
        setSession(null);
        return;
      }
      const data = (await res.json()) as Session;
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const loginTutor = useCallback((newSession: TutorSession) => {
    setSession(newSession);
  }, []);

  const loginAdmin = useCallback((newSession: AdminSession) => {
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, isLoading, loginTutor, loginAdmin, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
