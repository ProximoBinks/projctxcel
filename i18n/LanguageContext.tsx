"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import en from "./en.json";
import zh from "./zh.json";

type Lang = "en" | "zh";

const dictionaries: Record<Lang, Record<string, unknown>> = { en, zh };

type LanguageContextValue = {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
  tArray: <T = unknown>(key: string) => T[];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "zh" : "en"));
  }, []);

  const t = useCallback(
    (key: string): string => {
      const value = getNestedValue(dictionaries[lang], key);
      if (typeof value === "string") return value;
      // fallback to English
      const fallback = getNestedValue(dictionaries.en, key);
      if (typeof fallback === "string") return fallback;
      return key;
    },
    [lang],
  );

  const tArray = useCallback(
    <T = unknown,>(key: string): T[] => {
      const value = getNestedValue(dictionaries[lang], key);
      if (Array.isArray(value)) return value as T[];
      const fallback = getNestedValue(dictionaries.en, key);
      if (Array.isArray(fallback)) return fallback as T[];
      return [];
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
