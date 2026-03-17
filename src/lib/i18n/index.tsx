/**
 * i18n hook and context for Smart-Shelf
 * 
 * Provides language switching and translation access
 */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { en } from "./en";
import { es } from "./es";

type Language = "en" | "es";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof en | typeof es;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = {
  en,
  es,
};

/**
 * Provider component for i18n
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");
  const [mounted, setMounted] = useState(false);

  // Load saved language preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null;
    if (saved && (saved === "en" || saved === "es")) {
      setLanguageState(saved);
    } else {
      // Default to Spanish
      setLanguageState("es");
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const contextValue: I18nContextType = mounted
    ? {
        language,
        setLanguage,
        t: translations[language],
      }
    : {
        language: "es",
        setLanguage,
        t: translations.es,
      };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use translations
 * 
 * @example
 * const { t, language, setLanguage } = useI18n();
 * 
 * <button>{t.actions.save}</button>
 * <select onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}>
 *   <option value="es">Español</option>
 *   <option value="en">English</option>
 * </select>
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

/**
 * Helper to get translation by key path
 * For cases where translation key is dynamic
 * 
 * @example
 * const translation = getNestedTranslation(t, "team.invite");
 */
export function getNestedTranslation(
  obj: Record<string, any>,
  path: string,
): string {
  const result = path.split(".").reduce((current, prop) => current?.[prop], obj); // eslint-disable-line @typescript-eslint/no-unsafe-return
  return typeof result === "string" ? result : path; // eslint-disable-line @typescript-eslint/no-unsafe-return
}
