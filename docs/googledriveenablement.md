# Google Drive Sync — Enablement Guide

## Overview

Google Drive sync is fully implemented but **opt-in at deploy time**. When the `VITE_GOOGLE_CLIENT_ID` environment variable is not set, the app falls back to manual Export/Import (JSON file). When it is set, users see a Cloud Sync toggle that authenticates via a standard Google OAuth popup — no setup required on the user's side.

## What Is Already Built

| File                                            | Role                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/services/storage/GoogleDriveService.ts`    | OAuth2 popup flow (GIS), Drive API read/write/delete, token lifecycle           |
| `src/services/storage/UnifiedStorageService.ts` | Snapshot serialization, export, import, restore across all Zustand stores       |
| `src/services/storage/snapshotTypes.ts`         | `AppSnapshot` envelope type — all store slices including `migrate`              |
| `src/store/useCloudSyncStore.ts`                | Persisted enabled/provider/lastSyncedAt state                                   |
| `src/components/Landing/ScoreCard.tsx`          | `CloudSyncSection` UI — toggle, Save/Load Drive buttons, Export/Import fallback |

**Drive behavior:**

- Writes a single file `pqc-today-progress.json` to the user's hidden `appDataFolder` — the app cannot read any user files.
- Access token is held **in memory only** (never localStorage). After a page reload the user re-authorizes via the popup (one click, no password re-entry if the Google session is still active).
- Scope: `https://www.googleapis.com/auth/drive.appdata` — minimal, no access to user's Drive files.

## Enabling Google Drive — Developer Setup

### 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)

### 2. Enable the Google Drive API

APIs & Services → Library → search **"Google Drive API"** → Enable

### 3. Configure the OAuth Consent Screen

APIs & Services → OAuth consent screen:

- User Type: **External**
- App name: `PQC Today`
- Scopes: add `https://www.googleapis.com/auth/drive.appdata`
- Test users: add your own email during development

> For production with a public app, you will need to submit for Google verification before the consent screen removes the "unverified app" warning. For internal or small-audience use, test mode is sufficient.

### 4. Create an OAuth Client ID

APIs & Services → Credentials → **Create Credentials** → **OAuth Client ID**:

- Application type: **Web application**
- Name: `PQC Today Web`
- Authorized JavaScript origins:
  - `http://localhost:5175` (dev)
  - `https://your-production-domain.com` (prod)
- No redirect URIs needed — the app uses the implicit/popup flow via GIS

Copy the generated **Client ID** (format: `xxxxxxxx.apps.googleusercontent.com`).

### 5. Set the Environment Variable

**Development** — create `.env` from `.env.example`:

```
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

Restart the dev server (`npm run dev`) — Vite bakes env vars at startup.

**Production (GitHub Actions)** — add a repository secret:

```
Settings → Secrets and variables → Actions → New repository secret
Name:  VITE_GOOGLE_CLIENT_ID
Value: your_client_id_here.apps.googleusercontent.com
```

Then expose it in `.github/workflows/deploy.yml`:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
```

### 6. Verify

Once the env var is set, the ScoreCard on the landing page will show the **Cloud Sync** toggle instead of the static Export/Import section. Clicking it opens the Google OAuth popup. After consent, "Save to Drive" / "Load from Drive" buttons appear.

## UX Flow (End User)

```
Toggle ON  →  Google OAuth popup opens
             └─ User picks Google account + clicks Allow
                └─ "Connected to Google Drive" toast
                   └─ Save to Drive / Load from Drive buttons appear

Save to Drive  →  Uploads pqc-today-progress.json to user's appDataFolder
Load from Drive →  Downloads and restores all store state

Toggle OFF  →  Token revoked, state cleared
```

## What Is Synced

All Zustand store slices are included in the snapshot (defined in `snapshotTypes.ts`):

| Store key        | Content                                                     |
| ---------------- | ----------------------------------------------------------- |
| `moduleProgress` | Learning module completion, quiz scores, artifacts          |
| `assessment`     | Full 13-step wizard answers + last result                   |
| `persona`        | Selected persona, region, industry                          |
| `theme`          | Dark/light preference                                       |
| `version`        | Last seen app version (what's new tracking)                 |
| `tlsLearning`    | TLS simulator config + run history                          |
| `opensslStudio`  | Virtual filesystem + structured log history                 |
| `migrate`        | Hidden products, active infrastructure layer + sub-category |

## Token Lifetime & Re-auth

GIS tokens expire after ~1 hour. After expiry, the UI shows **"Session expired"** and a **"Sign in again"** button. One click re-authenticates without a new consent screen (if the browser Google session is still valid).

After a full page reload the in-memory token is gone and the same "Sign in again" prompt appears. This is intentional — no tokens are ever written to localStorage.

## Known Limitations / Future Work

- **Auto-sync on change**: Currently sync is manual (explicit Save/Load). A future enhancement could watch store changes and auto-save every N minutes when authenticated.
- **Conflict resolution**: If the user has two devices both saving to Drive, the last-write-wins. A future enhancement could compare `_exportedAt` timestamps and warn on conflict.
- **Offline support**: No offline queue; save/load fails gracefully with an error toast when Drive is unreachable.
- **Token persistence**: Re-auth on every page reload is the current behavior. GIS supports a `prompt: 'none'` silent re-auth path that could be added to restore the session automatically.
- **Google verification**: For public production with >100 users, submit the OAuth consent screen for Google review to remove the "unverified app" interstitial.
