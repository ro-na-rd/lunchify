import Keycloak from "keycloak-js";

// Azul Tech SSO (Keycloak). Keycloak brokers authentication upstream to Zoho,
// so employees sign in with their existing Zoho Mail credentials — no new password.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "azul-tech",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "lunchify",
});

// Alias of the upstream identity provider configured in Keycloak. Passing this
// as an idpHint sends the user straight to Zoho instead of the Keycloak login form.
export const IDP_HINT = import.meta.env.VITE_KEYCLOAK_IDP_HINT || "zoho";

export default keycloak;
