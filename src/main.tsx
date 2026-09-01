import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import { LanguageProvider } from "./i18n/LanguageContext";
import { initializeBuildStorePersistence } from "./store/buildPersistence";
import "./styles.css";

initializeBuildStorePersistence();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
