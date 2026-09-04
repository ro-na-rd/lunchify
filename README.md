# Lunchify

Daily lunch-attendance for Azul Tech. Employees confirm lunch in one tap, the
kitchen sees exactly how many meals to prepare, and admins get the numbers —
no spreadsheets, no guesswork, no waste.

Sign-in is **single sign-on**: staff use their existing `@azultech.rw` Zoho
account, brokered through Keycloak. There is no separate password.

> **SSO / Keycloak stack:** [`ro-na-rd/azul-sso`](https://github.com/ro-na-rd/azul-sso)
> — deploy that first. Hosting runbook: `azul-sso/docs/HANDOFF-TO-IT.md`.

---

## What's in the box

| Role | What they do |
|---|---|
| **Employee** | Confirm / decline today's lunch; see their history |
| **Admin** (`SUPER_ADMIN`) | Dashboard + charts, manage the team & roles, set the lunch cutoff, pull reports |
| **Restaurant manager** | "Meals to prepare" + the named list of who confirmed |
| **Kitchen display** | Full-screen wall view, PIN-opened, auto-refreshing every 15s |

First person to sign in whose email is in `BOOTSTRAP_ADMIN_EMAILS` becomes the
admin; everyone else is an employee and can be promoted from **Admin → Team**.

---

## Stack

- **Client** — React 18 + Vite + Tailwind, `keycloak-js` for auth, Recharts
- **Server** — Node 20 + Express, `jose` for Keycloak token verification
- **Data** — a single JSON file (`server/data/lunchify.json`), atomic writes,
  survives restarts. Swappable for Postgres later; see [Roadmap](#roadmap).
- **Auth** — Keycloak issues the tokens; the server verifies them against
  Keycloak's JWKS and maps the identity to a Lunchify user.

---

## Local development

Prerequisites: Node 20+, and the [SSO stack](https://github.com/ro-na-rd/azul-sso)
running (`docker compose up -d` → Keycloak on `http://localhost:8081`).

```bash
# server  → http://localhost:3001
cd server
cp .env.example .env          # fill in the values (see below)
npm install
npm run dev

# client  → http://localhost:5173
cd ../client
cp .env.example .env          # if present; otherwise create with the VITE_ vars below
npm install
npm run dev
```

Open `http://localhost:5173` → **Continue with Azul Tech SSO**.

### Environment

`server/.env` (see `server/.env.example`):

| Var | Purpose |
|---|---|
| `KEYCLOAK_ISSUER` | e.g. `http://localhost:8081/realms/azultech` |
| `KEYCLOAK_JWKS_URI` | `<issuer>/protocol/openid-connect/certs` |
| `KEYCLOAK_ALLOWED_AZP` | allowed client id(s), default `lunchify` |
| `ALLOWED_EMAIL_DOMAIN` | `azultech.rw` |
| `BOOTSTRAP_ADMIN_EMAILS` | comma-separated; these become `SUPER_ADMIN` on first login |
| `DATA_FILE` | path to the JSON store |
| `SEED_DEMO` | `true` only for local demos (loads sample data) |
| `JWT_SECRET`, `SESSION_SECRET` | `openssl rand -hex 32` |

`client/.env`:

```
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=azultech
VITE_KEYCLOAK_CLIENT_ID=lunchify
```

---

## Deployment

The client is built into `client/dist` and served by the Express server, so one
container runs the whole app.

```bash
cp .env.docker.example .env.docker      # fill in production values
VITE_KEYCLOAK_URL=https://sso.azultech.rw \
docker compose up -d --build
```

Put nginx + TLS in front of port `3001`. Data persists in the `lunchify_data`
volume. Full step-by-step (both stacks, DNS, TLS, secrets): **`azul-sso/DEPLOYMENT.md`**
and **`azul-sso/docs/HANDOFF-TO-IT.md`**.

### Before go-live

- [ ] Generate fresh `JWT_SECRET` / `SESSION_SECRET`
- [ ] `KEYCLOAK_ISSUER` / `KEYCLOAK_JWKS_URI` → the public HTTPS URL
- [ ] Add `https://lunch.azultech.rw/*` to the `lunchify` client's redirect URIs in Keycloak
- [ ] Build the client with the production `VITE_KEYCLOAK_URL`
- [ ] Schedule a backup of `lunchify.json`

---

## Project layout

```
client/                 React SPA
  src/
    keycloak.js          keycloak-js instance
    context/AuthContext  login / token / apiFetch
    layouts/             Employee | Admin | Restaurant shells
    pages/               dashboards, team, attendance, reports, KitchenView
server/
  src/
    index.js             Express app; serves client/dist
    middleware/
      keycloakAuth.js     RS256 verify via JWKS, identity → Lunchify user
      auth.js             hybrid authenticate (Keycloak or legacy token)
    routes/               auth, employee, admin, restaurant, sso
    db.js                 file-backed store
    seed.js               baseline org + restaurant; demo data behind a flag
  data/lunchify.json      the datastore (git-ignored)
Dockerfile               multi-stage: build client, run server
docker-compose.yml
```

---

## Roadmap

Known gaps a contributor could pick up:

1. **Cutoff-time bug** — the admin's Settings cutoff is not wired to the
   employee confirmation window (`server/src/routes/employee.js` hardcodes it).
2. **Timezone** — date math uses server local time; pin to `Africa/Kigali`.
3. **Weekends / holidays** — the window opens every day.
4. **Real reminders** — "Remind" only writes an audit row today; add email/push.
5. **Default preference** — let employees set a weekly schedule instead of
   confirming daily.
6. **Postgres** — replace the JSON store for multi-process / scale.
7. **Tests + CI** — none yet.
