# ---- Stage 1: build the React client ----
FROM node:20-alpine AS client
WORKDIR /client

# Build-time SSO config (baked into the static bundle).
ARG VITE_KEYCLOAK_URL=http://localhost:8081
ARG VITE_KEYCLOAK_REALM=azultech
ARG VITE_KEYCLOAK_CLIENT_ID=lunchify
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: server (serves the API + the built client) ----
FROM node:20-alpine AS server
WORKDIR /app
ENV NODE_ENV=production

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
COPY --from=client /client/dist ./client/dist

# Persisted data lives here — mount a volume.
ENV DATA_FILE=/app/server/data/lunchify.json
RUN mkdir -p /app/server/data
VOLUME ["/app/server/data"]

WORKDIR /app/server
EXPOSE 3001
CMD ["node", "src/index.js"]
