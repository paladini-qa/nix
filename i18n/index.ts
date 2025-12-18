import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en";
import ptBR from "./locales/pt-BR";

// Recursos de tradução
const resources = {
  en: { translation: en },
  "pt-BR": { translation: ptBR },
};

// Configuração do i18next
i18n
  .use(LanguageDetector) // Detecta idioma do navegador
  .use(initReactI18next) // Integração com React
  .init({
    resources,
    fallbackLng: "en", // Idioma padrão
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React já faz escape
    },

    detection: {
      // Ordem de detecção de idioma
      order: ["localStorage", "navigator", "htmlTag"],
      // Chave para salvar no localStorage
      lookupLocalStorage: "nix_language",
      // Cache no localStorage
      caches: ["localStorage"],
    },

    // Configurações de namespace
    ns: ["translation"],
    defaultNS: "translation",
  });

export default i18n;

// Helper para trocar idioma
export const changeLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
  // Salva no localStorage
  localStorage.setItem("nix_language", language);
};

// Idiomas disponíveis
export const availableLanguages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
];

// Tipo para idiomas
export type Language = "en" | "pt-BR";




