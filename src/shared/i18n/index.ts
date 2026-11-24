import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ptBR from "@/shared/i18n/locales/pt-BR";

// Recursos de tradução
const resources = {
  "pt-BR": { translation: ptBR },
};

// Configuração do i18next
i18n
  .use(initReactI18next) // Integração com React
  .init({
    resources,
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React já faz escape
    },

    // Configurações de namespace
    ns: ["translation"],
    defaultNS: "translation",
  });

export default i18n;

// Idioma da interface
export const getBrowserLanguage = (): string => {
  return "pt-BR";
};

// Restaura o idioma da interface
export const syncWithBrowserLanguage = async () => {
  if (i18n.language !== "pt-BR") {
    await i18n.changeLanguage("pt-BR");
  }
};

// Idiomas disponíveis (para referência/UI)
export const availableLanguages = [
  { code: "pt-BR", name: "Português (Brasil)", flag: "" },
];

// Tipo para idiomas
export type Language = "pt-BR";
