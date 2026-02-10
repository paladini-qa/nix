import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./contexts";
import { initializeCapacitor, hideSplashScreen } from "./services/capacitorService";
import "./i18n"; // Initialize i18n
import "@radix-ui/themes/styles.css";
import "./index.css";
import "./radix-theme.css";

// Inicializa o Capacitor (só executa em plataformas nativas)
initializeCapacitor();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Esconde o splash screen após o app ser montado
hideSplashScreen();
