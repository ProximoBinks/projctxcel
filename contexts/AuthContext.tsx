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
  loginTutor: (id: string, name: string, email: string) => void;
  loginAdmin: (id: string, name: string, email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "simple_tuition_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const loginTutor = useCallback((id: string, name: string, email: string) => {
    const newSession: TutorSession = { type: "tutor", id, name, email };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  }, []);

  const loginAdmin = useCallback((id: string, name: string, email: string) => {
    const newSession: AdminSession = { type: "admin", id, name, email };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, isLoading, loginTutor, loginAdmin, logout }}
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
