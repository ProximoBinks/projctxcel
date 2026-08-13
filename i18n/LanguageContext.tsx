"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./en.json";

type Lang = "en" | "zh";

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
  const [zh, setZh] = useState<Record<string, unknown> | null>(null);

  const dictionaries = useMemo(
    () => ({ en, zh: zh ?? en }),
    [zh],
  );

  const toggleLang = useCallback(() => {
    if (lang === "zh") {
      setLang("en");
      return;
    }
    if (zh) {
      setLang("zh");
      return;
    }
    void import("./zh.json").then((module) => {
      setZh(module.default);
      setLang("zh");
    });
  }, [lang, zh]);

  const t = useCallback(
    (key: string): string => {
      const value = getNestedValue(dictionaries[lang], key);
      if (typeof value === "string") return value;
      // fallback to English
      const fallback = getNestedValue(dictionaries.en, key);
      if (typeof fallback === "string") return fallback;
      return key;
    },
    [dictionaries, lang],
  );

  const tArray = useCallback(
    <T = unknown,>(key: string): T[] => {
      const value = getNestedValue(dictionaries[lang], key);
      if (Array.isArray(value)) return value as T[];
      const fallback = getNestedValue(dictionaries.en, key);
      if (Array.isArray(fallback)) return fallback as T[];
      return [];
    },
    [dictionaries, lang],
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
