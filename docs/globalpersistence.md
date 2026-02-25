# Global Persistence — Technical Design Report

## 1. Context

PQC Today is a static React SPA on GitHub Pages (no backend). All user data lives in 7 Zustand stores persisted to localStorage. Today only learning progress (`useModuleStore`) has an export/import path. Assessment results, TLS simulation history, OpenSSL artifacts, and persona preferences have **no backup mechanism at all**.

This report details two phases:

- **Phase 1** — Unified Export/Import: aggregate all stores into a single downloadable/uploadable JSON snapshot
- **Phase 2** — Google Drive sync: optional cloud persistence using Google's `appDataFolder` scope

---

## 2. Current Persistence Inventory

### 2.1 Persisted Zustand Stores

| #   | Store                | localStorage key         | Version  | Partialize? | Custom serialization         | Typical size |
| --- | -------------------- | ------------------------ | -------- | ----------- | ---------------------------- | ------------ |
| 1   | `useModuleStore`     | `pki-module-storage`     | 3        | No          | No                           | 5-500 KB     |
| 2   | `useAssessmentStore` | `pqc-assessment`         | 2        | Yes         | No                           | 2-5 KB       |
| 3   | `usePersonaStore`    | `pqc-learning-persona`   | 1        | No          | No                           | <1 KB        |
| 4   | `useThemeStore`      | `theme-storage-v1`       | implicit | No          | No                           | <1 KB        |
| 5   | `useVersionStore`    | `pqc-version-storage`    | implicit | Yes         | No                           | <1 KB        |
| 6   | `useTLSStore`        | `tls-learning-storage`   | 1        | Yes         | No                           | 1-50 KB      |
| 7   | `useOpenSSLStore`    | `openssl-studio-storage` | implicit | Yes         | Yes (Uint8Array→Buffer JSON) | 10 KB-5 MB   |

**Combined typical footprint:** 150-800 KB. Power users with many artifacts: up to ~7 MB.

### 2.2 What's Persisted per Store (data fields only, actions excluded)

**useModuleStore** — `src/store/useModuleStore.ts`

```
version, timestamp, modules[id].{status, lastVisited, timeSpent, completedSteps[], quizScores{}},
artifacts.{keys[], certificates[], csrs[]}, ejbcaConnections{}, preferences.{theme, defaultKeyType, autoSave},
notes{}, sessionTracking.{firstVisit, lastVisitDate, totalSessions, currentStreak, longestStreak, visitDates[]}
```

**useAssessmentStore** — `src/store/useAssessmentStore.ts` (partialize excludes actions)

```
currentStep, assessmentMode, isComplete, lastWizardUpdate, industry, country,
currentCrypto[], cryptoUnknown, dataSensitivity[], sensitivityUnknown,
complianceRequirements[], complianceUnknown, migrationStatus, cryptoUseCases[],
useCasesUnknown, dataRetention[], retentionUnknown, credentialLifetime[],
credentialLifetimeUnknown, systemCount, teamSize, cryptoAgility, infrastructure[],
infrastructureUnknown, vendorDependency, vendorUnknown, timelinePressure, lastResult
```

**usePersonaStore** — `src/store/usePersonaStore.ts`

```
selectedPersona, hasSeenPersonaPicker, selectedRegion, selectedIndustry, selectedIndustries[], suppressSuggestion
```

**useThemeStore** — `src/store/useThemeStore.ts`

```
theme, hasSetPreference
```

**useVersionStore** — `src/store/useVersionStore.ts` (partialize: only lastSeenVersion)

```
lastSeenVersion
```

**useTLSStore** — `src/store/tls-learning.store.ts` (partialize excludes results, isSimulating, commands, sessionStatus)

```
clientConfig.{cipherSuites[], groups[], signatureAlgorithms[], certificates{}, rawConfig, mode, verifyClient, clientAuthEnabled},
serverConfig.{...same...}, runHistory[].{id, timestamp, cipher, keyExchange, signature, ...metrics}, clientMessage, serverMessage
```

**useOpenSSLStore** — `src/components/OpenSSLStudio/store.ts` (partialize excludes logs, activeTab, command, isProcessing, isReady, editingFile, viewingFile, lastExecutionTime)

```
files[].{name, type, content (Uint8Array|string), size, timestamp, executionTime?},
structuredLogs[].{id, timestamp, command, operationType, details, fileName?, fileSize?, executionTime}
```

**Special:** Custom storage adapter serializes `Uint8Array` as `{ type: 'Buffer', data: number[] }`.

### 2.3 Cross-Store Dependencies

- `useOpenSSLStore.addFile()` syncs keys/certs/CSRs into `useModuleStore.artifacts` (IDs prefixed `openssl::`)
- `useAssessmentStore.getInput()` reads `usePersonaStore.selectedPersona`

### 2.4 Existing Export/Import Infrastructure

| Component                              | Location                                          | What it does                                                          |
| -------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `ProgressService.exportToFile()`       | `src/services/storage/ProgressService.ts`         | Downloads `useModuleStore` data as JSON via `file-saver`              |
| `ProgressService.importFromFile()`     | same                                              | Reads JSON, validates 20+ rules, migrates, returns `LearningProgress` |
| `ProgressService.checkStorageHealth()` | same                                              | Tests localStorage availability, warns at 80% quota                   |
| `SaveRestorePanel`                     | `src/components/PKILearning/SaveRestorePanel.tsx` | UI: Export/Import/Reset buttons + auto-save status                    |
| `LearningProgress` type                | `src/services/storage/types.ts`                   | TypeScript interface for exported data                                |

**Gap:** Only `useModuleStore` is covered. The other 6 stores have zero export/import support.

---

## 3. Phase 1 — Unified Export/Import

### 3.1 Goal

Create a single "Download All Progress" / "Restore All Progress" mechanism that captures every persisted store in one versioned JSON file. This is the **prerequisite** for Phase 2 (the same snapshot format is what gets saved to Google Drive).

### 3.2 Unified Snapshot Format

```typescript
interface AppSnapshot {
  // Envelope metadata
  _format: 'pqc-today-snapshot'          // Magic string for validation
  _version: 1                             // Snapshot schema version (bump on format changes)
  _appVersion: string                     // e.g. "1.33.0" — build-time injected
  _exportedAt: string                     // ISO 8601 timestamp
  _source: 'manual' | 'google-drive'      // How this snapshot was created

  // Store data — each key maps to the persisted slice of that store
  stores: {
    moduleProgress: <useModuleStore persisted state>    // pki-module-storage
    assessment: <useAssessmentStore persisted state>    // pqc-assessment
    persona: <usePersonaStore persisted state>          // pqc-learning-persona
    theme: <useThemeStore persisted state>              // theme-storage-v1
    version: <useVersionStore persisted state>          // pqc-version-storage
    tlsLearning: <useTLSStore persisted state>          // tls-learning-storage
    opensslStudio: <useOpenSSLStore persisted state>    // openssl-studio-storage
  }
}
```

**Design decisions:**

- **One file, all stores.** Avoids partial restore complexity. Users get everything or nothing.
- **Envelope metadata** (`_format`, `_version`) enables validation and future migration without inspecting store internals.
- **`_source` field** distinguishes manual exports from cloud syncs (useful for conflict resolution in Phase 2).
- **OpenSSL Uint8Array handling:** Reuse the existing `{ type: 'Buffer', data: [...] }` serialization pattern from `useOpenSSLStore`'s custom storage adapter.

### 3.3 New Service: `UnifiedStorageService`

**Location:** `src/services/storage/UnifiedStorageService.ts`

```
exportSnapshot(): AppSnapshot
  → reads getState() from all 7 stores
  → applies each store's partialize logic (if any)
  → wraps in envelope metadata
  → handles Uint8Array serialization for OpenSSL files

downloadSnapshot(): void
  → calls exportSnapshot()
  → JSON.stringify with Uint8Array replacer
  → Blob + file-saver saveAs()
  → filename: pqc-today-backup-{YYYY-MM-DD}.json

importSnapshot(file: File): Promise<AppSnapshot>
  → FileReader → JSON.parse with Uint8Array reviver
  → validate envelope (_format, _version)
  → validate each store slice independently
  → apply per-store migrations if _appVersion is older
  → return validated snapshot

restoreSnapshot(snapshot: AppSnapshot): void
  → hydrates each store via setState()
  → respects cross-store dependencies (restore persona before assessment)
  → toast confirmation

validateSnapshot(data: unknown): { valid: boolean; errors: string[]; warnings: string[] }
  → checks envelope fields
  → delegates to per-store validators
  → warnings for non-critical issues (e.g., unknown extra fields)
```

**Reuse existing code:**

- `ProgressService.validateProgressFormat()` → extract and reuse for `moduleProgress` store validation
- `ProgressService.migrateProgress()` → reuse for `moduleProgress` migration
- OpenSSL store's `JSON.parse` reviver / `JSON.stringify` replacer → reuse for Uint8Array handling
- `file-saver` `saveAs()` → same pattern

### 3.4 Store Restoration Order

Cross-store dependencies dictate order:

1. `theme` (no deps)
2. `version` (no deps)
3. `persona` (no deps — but assessment reads it)
4. `assessment` (reads persona)
5. `moduleProgress` (no deps, but OpenSSL writes to it)
6. `tlsLearning` (no deps)
7. `opensslStudio` (syncs artifacts to moduleProgress — restore last)

### 3.5 UI: Cloud Storage Toggle on Landing Page

**Placement:** Bottom of the `ScoreCard` component (`src/components/Landing/ScoreCard.tsx`), in the footer row that currently shows total minutes / artifact count / session count.

**Current ScoreCard footer layout:**

```
[ X min learned ] [ Y artifacts ] [ Z sessions ]    [ Continue Learning → ]
```

**New layout with toggle:**

```
[ X min learned ] [ Y artifacts ] [ Z sessions ]    [ Cloud Sync: OFF ]  [ Continue Learning → ]
```

**Toggle behavior:**

- **Default: OFF** — no Google integration loaded, no OAuth prompts
- **Toggle ON** → triggers Google OAuth consent flow (Phase 2)
- **Toggle OFF** → disconnects, clears token from memory (does NOT delete Drive data)
- Toggle state persisted in a new `useCloudSyncStore` (localStorage key: `pqc-cloud-sync`)

**Fallback when Phase 2 is not yet built:** Toggle ON triggers the manual export/import flow (download/upload JSON file). This lets Phase 1 ship independently.

### 3.6 Files to Create / Modify

| Action     | File                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Create** | `src/services/storage/UnifiedStorageService.ts`                                                                            |
| **Create** | `src/services/storage/snapshotTypes.ts` (AppSnapshot interface)                                                            |
| **Create** | `src/store/useCloudSyncStore.ts` (toggle state, sync metadata)                                                             |
| **Modify** | `src/components/Landing/ScoreCard.tsx` (add cloud sync toggle)                                                             |
| **Modify** | `src/components/PKILearning/SaveRestorePanel.tsx` (use UnifiedStorageService instead of ProgressService for export/import) |
| Keep       | `src/services/storage/ProgressService.ts` (still used internally for module-only validation)                               |

---

## 4. Phase 2 — Google Drive Integration

### 4.1 Goal

When the user enables the Cloud Sync toggle, the app authenticates with Google and reads/writes the `AppSnapshot` JSON to the user's Google Drive `appDataFolder` (hidden, app-specific, 100 MB limit).

### 4.2 Architecture

```
User enables toggle → Google OAuth popup → access token (1h) → stored in memory
  |
On save: UnifiedStorageService.exportSnapshot() → PUT to Drive appDataFolder
On load: GET from Drive appDataFolder → UnifiedStorageService.restoreSnapshot()
```

**No backend required.** Everything runs client-side:

- Google Identity Services (GIS) handles OAuth 2.0 token acquisition
- Drive API v3 REST endpoints handle file CRUD
- Access token stored in memory only (never localStorage — security)

### 4.3 Google Cloud Setup (one-time)

1. Create Google Cloud project (free)
2. Enable Google Drive API
3. Create OAuth 2.0 Client ID for "Web application"
   - Authorized JavaScript origins: `https://www.pqctoday.com`, `http://localhost:5175`
   - Authorized redirect URIs: same
4. Configure OAuth consent screen:
   - App name: "PQC Today"
   - Scopes: `https://www.googleapis.com/auth/drive.appdata` (only)
   - For >100 users: submit for Google verification (provide homepage + privacy policy)

**Environment variables to add:**

```
VITE_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
```

Added to `.env`, `.env.example`, and `.github/workflows/deploy.yml` secrets.

### 4.4 OAuth Flow Details

**Library:** Google Identity Services (`https://accounts.google.com/gsi/client`) — no npm package needed, loaded as `<script>` tag or dynamically.

**Token acquisition:**

```javascript
google.accounts.oauth2.initTokenClient({
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.appdata',
  callback: (tokenResponse) => {
    /* store in memory */
  },
})
```

**Token lifetime:** ~1 hour. No refresh tokens without a backend.

**Silent re-auth:** If user previously consented and is signed into Google, GIS can silently re-acquire a token via `prompt: 'none'`. The app attempts this on page load when cloud sync is enabled; if it fails, the user sees a "Sign in again" button.

### 4.5 Drive API Operations

All operations target the `appDataFolder` special folder. The app creates/updates a single file: `pqc-today-progress.json`.

**Save (create or update):**

```
// Find existing file
GET https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='pqc-today-progress.json'

// If exists: update content
PATCH https://www.googleapis.com/upload/drive/v3/files/{fileId}?uploadType=media
Body: JSON snapshot

// If not exists: create
POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
Metadata: { name: 'pqc-today-progress.json', parents: ['appDataFolder'] }
Body: JSON snapshot
```

**Load:**

```
// Find file
GET https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='pqc-today-progress.json'&fields=files(id,modifiedTime)

// Download content
GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media
```

**No npm packages required** — plain `fetch()` with `Authorization: Bearer <token>` header.

### 4.6 Sync Strategy

**Manual sync (recommended for v1):**

- "Save to Drive" button (visible when toggle is ON and authenticated)
- "Load from Drive" button
- Toast notifications: "Saved to Google Drive", "Loaded from Google Drive"
- Last sync timestamp displayed next to toggle

**Why not auto-sync:**

- Token expires after 1 hour — auto-sync would silently fail
- Debounced auto-sync adds complexity (offline queue, retry, conflict detection)
- Manual sync is explicit and predictable — users know exactly when data moves
- Can add auto-sync in a future iteration once manual sync is proven

### 4.7 Conflict Resolution

When user clicks "Load from Drive" and local data differs:

```
Drive file modifiedTime vs local snapshot _exportedAt

If Drive is newer: prompt "Cloud version is newer (saved Feb 24). Replace local data?"
If local is newer: prompt "Local version is newer. Replace with older cloud version?"
If no Drive file: prompt "No cloud backup found. Save current progress to Drive?"
```

**Simple timestamp-based comparison.** No field-level merging — the snapshot is small enough that full replacement is acceptable.

### 4.8 COOP Header Analysis

**Production (GitHub Pages):** GitHub Pages does **not** serve custom HTTP headers. The COOP/COEP headers in `vite.config.ts` only apply to dev/preview servers. **No COOP conflict in production.**

**Dev/Preview servers:** `Cross-Origin-Opener-Policy: same-origin` (line 132) blocks Google's OAuth popup. Two options:

1. Change to `same-origin-allow-popups` — still enables SharedArrayBuffer in Chrome/Firefox/Safari. **Needs WASM testing.**
2. Use Google's redirect-based flow instead of popup — worse UX but avoids the header issue entirely.

**Recommendation:** Change to `same-origin-allow-popups` and test WASM. If WASM breaks, fall back to redirect flow.

### 4.9 CSP Updates (dev/preview only)

Add to `connect-src`:

```
https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com
```

Add `frame-src`:

```
https://accounts.google.com
```

Add to `script-src`:

```
https://accounts.google.com
```

### 4.10 New Service: `GoogleDriveService`

**Location:** `src/services/storage/GoogleDriveService.ts`

```
loadGIS(): Promise<void>
  → dynamically loads GIS script if not already loaded

authenticate(): Promise<string>
  → initTokenClient + requestAccessToken
  → returns access token
  → stores token + expiry in memory

silentAuth(): Promise<string | null>
  → attempts prompt:'none' re-auth
  → returns token or null if user must re-consent

saveSnapshot(snapshot: AppSnapshot, token: string): Promise<void>
  → find or create pqc-today-progress.json in appDataFolder
  → upload JSON content

loadSnapshot(token: string): Promise<{ snapshot: AppSnapshot; modifiedTime: string } | null>
  → find file in appDataFolder
  → download + parse + validate via UnifiedStorageService
  → return snapshot + Drive modifiedTime

isAuthenticated(): boolean
  → checks if token exists and is not expired

disconnect(): void
  → revokes token
  → clears in-memory state
```

### 4.11 `useCloudSyncStore`

**Location:** `src/store/useCloudSyncStore.ts`
**localStorage key:** `pqc-cloud-sync`

```typescript
interface CloudSyncState {
  enabled: boolean // Toggle state (default: false)
  lastSyncedAt: string | null // ISO timestamp of last successful sync
  lastSyncDirection: 'upload' | 'download' | null
  provider: 'google-drive' | null // Future-proof for Dropbox etc.
}
```

**No access token stored here** — tokens live in memory only.

### 4.12 Files to Create / Modify

| Action     | File                                                                |
| ---------- | ------------------------------------------------------------------- |
| **Create** | `src/services/storage/GoogleDriveService.ts`                        |
| **Modify** | `src/store/useCloudSyncStore.ts` (already created in Phase 1)       |
| **Modify** | `src/components/Landing/ScoreCard.tsx` (wire toggle to Google auth) |
| **Modify** | `vite.config.ts` lines 131-134, 139-142 (COOP + CSP headers)        |
| **Modify** | `.env.example` (add `VITE_GOOGLE_CLIENT_ID`)                        |
| **Modify** | `.github/workflows/deploy.yml` (add secret to build env)            |

---

## 5. UI Design — Cloud Sync Toggle

### 5.1 Landing Page Placement

The toggle lives in the **ScoreCard footer** (`src/components/Landing/ScoreCard.tsx`), at the bottom of the learning journey progress card on the home page.

**Current footer (active user):**

```
+-----------------------------------------------------------------+
|  T 42 min   P 3 artifacts   R 12 sessions    [Continue ->]     |
+-----------------------------------------------------------------+
```

**New footer with cloud sync:**

```
+-----------------------------------------------------------------+
|  T 42 min   P 3 artifacts   R 12 sessions                      |
|                                                                  |
|  Cloud Sync  [ OFF ]     Saved to browser only                  |
|                                                                  |
|                                              [Continue ->]       |
+-----------------------------------------------------------------+
```

**When enabled and synced:**

```
+-----------------------------------------------------------------+
|  T 42 min   P 3 artifacts   R 12 sessions                      |
|                                                                  |
|  Cloud Sync  [ ON ]      Last synced: 2 min ago                 |
|  [Save to Drive]  [Load from Drive]                             |
|                                                                  |
|                                              [Continue ->]       |
+-----------------------------------------------------------------+
```

### 5.2 Toggle States

| State                      | Toggle | Status text               | Buttons visible                    |
| -------------------------- | ------ | ------------------------- | ---------------------------------- |
| Disabled (default)         | OFF    | "Saved to browser only"   | None                               |
| Enabled, not authenticated | ON     | "Sign in to sync"         | "Sign in with Google"              |
| Enabled, authenticated     | ON     | "Last synced: {timeAgo}"  | "Save to Drive", "Load from Drive" |
| Syncing                    | ON     | "Syncing..."              | Disabled with spinner              |
| Error                      | ON     | "Sync failed — try again" | "Retry"                            |
| Token expired              | ON     | "Session expired"         | "Sign in again"                    |

### 5.3 First-time UX Flow

1. User scrolls to ScoreCard on landing page
2. Sees "Cloud Sync: OFF — Saved to browser only"
3. Toggles ON
4. Google OAuth consent popup appears
5. User authorizes "PQC Today" to access app-specific Drive folder
6. Toggle shows ON, status: "Connected — no cloud backup yet"
7. User clicks "Save to Drive"
8. Toast: "Progress saved to Google Drive"
9. Status updates: "Last synced: just now"

---

## 6. Security & Privacy

- **Scope:** `drive.appdata` only — app cannot see, list, or modify any user files
- **Token storage:** In-memory only (never localStorage). Lost on page refresh — by design.
- **No PII collected:** App does not read user's Google profile, email, or name
- **Data stays in user's Drive:** No intermediary server. PQC Today never sees the data in transit (HTTPS to Google's APIs).
- **Revocation:** User can revoke access at any time via Google Account > Security > Third-party apps
- **OWASP compliance:** No `eval()`, no `innerHTML`, client ID is a public identifier (not a secret), API key restricted to Drive API only

---

## 7. Cost & Quotas

| Resource                          | Limit         | Our usage                              |
| --------------------------------- | ------------- | -------------------------------------- |
| Google Drive API queries          | 1 billion/day | ~2-4 per sync (find + upload/download) |
| `appDataFolder` storage per user  | 100 MB        | ~1 MB max per user                     |
| Google Cloud project              | Free tier     | No billing needed                      |
| OAuth consent screen (unverified) | 100 users     | Sufficient for beta                    |
| OAuth consent screen (verified)   | Unlimited     | Submit privacy policy + homepage       |

---

## 8. Implementation Phases & Effort

| Phase     | What                                                           | Effort        | Dependencies   |
| --------- | -------------------------------------------------------------- | ------------- | -------------- |
| **1a**    | `UnifiedStorageService` + `AppSnapshot` type                   | 1 day         | None           |
| **1b**    | Cloud sync toggle UI in ScoreCard (OFF = manual export/import) | 1 day         | 1a             |
| **1c**    | Update `SaveRestorePanel` to use unified service               | 0.5 day       | 1a             |
| **2a**    | Google Cloud project setup + OAuth config                      | 0.5 day       | Google account |
| **2b**    | `GoogleDriveService` + `useCloudSyncStore`                     | 1.5 days      | 2a             |
| **2c**    | Wire toggle to Google auth + save/load buttons                 | 1 day         | 1b, 2b         |
| **2d**    | COOP header change + WASM testing                              | 0.5 day       | 2b             |
| **2e**    | Deploy workflow + env var updates                              | 0.5 day       | 2a             |
| **Total** |                                                                | **~6.5 days** |                |

---

## 9. Risks & Mitigations

| Risk                                        | Impact   | Mitigation                                                                   |
| ------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| COOP `same-origin-allow-popups` breaks WASM | High     | Test early (Phase 2d). Fallback: redirect-based OAuth flow.                  |
| Google rejects OAuth verification           | Medium   | Submit early. App requests minimal scope (`drive.appdata`).                  |
| Token expires mid-session                   | Low      | Detect 401 > show "Sign in again" button. No data loss.                      |
| User has >100 MB in appDataFolder           | Very low | Snapshot is ~1 MB max. 100 MB limit is per-app, not per-file.                |
| OpenSSL store Uint8Array corruption         | Low      | Reuse proven serialization from existing store adapter. Add round-trip test. |
| localStorage and Drive data diverge         | Medium   | Manual sync = explicit user action. Show timestamps for both sources.        |

---

## 10. Verification Plan

### Phase 1 checks

- [ ] Export snapshot > verify JSON contains all 7 store sections + envelope metadata
- [ ] Import snapshot into a fresh browser > verify all stores hydrated correctly
- [ ] Import a snapshot with missing stores (e.g., no `tlsLearning`) > verify graceful degradation
- [ ] Import a snapshot from older app version > verify migration logic runs
- [ ] OpenSSL artifacts round-trip: export with Uint8Array files > import > verify binary content matches
- [ ] `npm run build && npm run test` pass
- [ ] Toggle defaults to OFF on fresh visit

### Phase 2 checks

- [ ] Toggle ON > Google consent popup appears > token acquired
- [ ] "Save to Drive" > file created in appDataFolder > verify via Google Drive API explorer
- [ ] "Load from Drive" > snapshot downloaded > stores hydrated > toast shown
- [ ] Close tab > reopen > toggle still ON > silent re-auth attempted
- [ ] Token expired > 401 > "Sign in again" shown (no crash)
- [ ] Disconnect (toggle OFF) > token revoked > no Drive calls made
- [ ] WASM features (OpenSSL, liboqs) still work after COOP header change
- [ ] E2E test: full cycle on `http://localhost:5175` with dev headers
