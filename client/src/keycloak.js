import Keycloak from "keycloak-js";

// Azul Tech SSO (Keycloak). Keycloak IS the identity provider — staff sign in
// on Keycloak's own login page (the "azultech" theme). There is no upstream
// broker: no idpHint, no redirect to a third party.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "azultech",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "lunchify",
});

export default keycloak;
