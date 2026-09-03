import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/ui/Toast";
import App from "./App.jsx";
import keycloak from "./keycloak.js";
import "./index.css";

const root = createRoot(document.getElementById("root"));

function render(authenticated) {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider keycloak={keycloak} authenticated={authenticated}>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

keycloak
  .init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    pkceMethod: "S256",
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    // Keep the access token fresh while the app is open.
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.logout());
    };
    render(authenticated);
  })
  .catch((error) => {
    // Keycloak unreachable — fall back to unauthenticated (demo login still works in dev).
    console.error("Keycloak initialization failed:", error);
    render(false);
  });
