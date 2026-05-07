import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "../i18n/en.json";
import es from "../i18n/es.json";

const LANG_STORAGE_KEY = "lang";
const dictionaries = { ES: es, EN: en };
const locales = { ES: "es-ES", EN: "en-US" };

const I18nContext = createContext(null);

function getByPath(object, path) {
  return path.split(".").reduce((value, key) => (value && value[key] != null ? value[key] : undefined), object);
}

function interpolate(template, values = {}) {
  if (typeof template !== "string") {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => (values[key] != null ? String(values[key]) : `{${key}}`));
}

function readInitialLanguage() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return stored === "EN" ? "EN" : "ES";
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => readInitialLanguage());

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
    document.documentElement.lang = language === "EN" ? "en" : "es";
  }, [language]);

  const value = useMemo(() => {
    function t(path, vars) {
      const currentDictionary = dictionaries[language] || dictionaries.ES;
      const fallback = dictionaries.ES;
      const phrase = getByPath(currentDictionary, path) ?? getByPath(fallback, path) ?? path;
      return interpolate(phrase, vars);
    }

    return {
      language,
      setLanguage,
      locale: locales[language] || locales.ES,
      t,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n debe usarse dentro de I18nProvider");
  }

  return context;
}
