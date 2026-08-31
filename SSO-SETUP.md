# Lunchify SSO Setup Guide — azul.rw Domain

## Google Cloud Console Configuration

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: `Lunchify SSO`
4. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. Go to APIs & Services → OAuth consent screen
2. Select "Internal" (for Google Workspace domain restriction)
3. Fill in:
   - App name: `Lunchify`
   - User support email: `admin@azul.rw`
   - Developer contact: `admin@azul.rw`
4. Click "Save and Continue"
5. On Scopes page, add:
   - `openid`
   - `email`
   - `profile`
6. Click "Save and Continue"
7. On Test Users page, add test users (your @azul.rw emails)
8. Click "Save and Continue"

### Step 3: Create OAuth 2.0 Credentials

1. Go to APIs & Services → Credentials
2. Click "+ Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `Lunchify Web Client`
5. Authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback`
   - `https://your-production-domain.com/auth/google/callback`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

### Step 4: Update .env File

Edit `server/.env` and replace:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Step 5: Configure Domain Restriction (Optional but Recommended)

In the OAuth consent screen settings:
1. Go to "Domain verification" in Google Cloud Console
2. Add and verify `azul.rw`
3. This ensures only @azul.rw accounts can authenticate

The app already enforces this in the backend:
```javascript
const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'azul.rw';
```

## How the SSO Flow Works

```
1. User clicks "Continue with Google"
   ↓
2. Browser redirects to Google OAuth
   ↓
3. User signs in with @azul.rw email
   ↓
4. Google redirects back to /auth/google/callback
   ↓
5. Backend verifies:
   - Email domain is @azul.rw
   - User exists or is created
   - JWT token is generated
   ↓
6. Frontend receives token via URL param
   ↓
7. User is redirected to their dashboard
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-...` |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:3001/auth/google/callback` |
| `SESSION_SECRET` | Session encryption key | Any random string |
| `ALLOWED_EMAIL_DOMAIN` | Restrict to company domain | `azul.rw` |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing key | Any random string |
| `PORT` | Server port | `3001` |

## Testing

1. Start the server: `cd server && npm start`
2. Start the client: `cd client && npm run dev`
3. Open http://localhost:5173
4. Click "Continue with Google"
5. Sign in with any @azul.rw email
6. You should be redirected to the correct dashboard

## Production Deployment

For production, update these in `.env`:
```
NODE_ENV=production
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
FRONTEND_URL=https://your-domain.com
SESSION_SECRET=use-a-strong-random-secret
JWT_SECRET=use-a-strong-random-secret
```

And ensure HTTPS is enabled on your server.
