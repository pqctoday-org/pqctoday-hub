/**
 * Client-side Google Drive service using Google Identity Services (GIS).
 * Uses the `drive.appdata` scope to read/write a single JSON file in the
 * user's hidden appDataFolder — the app sees zero user files.
 *
 * No npm packages needed — GIS is loaded dynamically as a <script> tag.
 * Access token is stored in memory only (never localStorage).
 */

import { UnifiedStorageService } from './UnifiedStorageService'
import type { AppSnapshot } from './snapshotTypes'

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const DRIVE_FILE_NAME = 'pqc-today-progress.json'
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

// In-memory token state (never persisted)
let accessToken: string | null = null
let tokenExpiresAt = 0

// ── GIS script loader ────────────────────────────────────────────────────────

let gisLoaded = false
let gisLoadPromise: Promise<void> | null = null

function loadGIS(): Promise<void> {
  if (gisLoaded) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => {
      gisLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

// ── Token management ─────────────────────────────────────────────────────────

function getClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured')
  }
  return clientId
}

// ── Drive API helpers ────────────────────────────────────────────────────────

async function driveRequest(url: string, options: RequestInit = {}): Promise<Response> {
  if (!accessToken) throw new Error('Not authenticated')

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    accessToken = null
    tokenExpiresAt = 0
    throw new Error('Session expired — please sign in again')
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Drive API error ${response.status}: ${body}`)
  }

  return response
}

/** Find pqc-today-progress.json in appDataFolder. Returns fileId or null. */
async function findFile(): Promise<{ id: string; modifiedTime: string } | null> {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('spaces', 'appDataFolder')
  url.searchParams.set('q', `name='${DRIVE_FILE_NAME}'`)
  url.searchParams.set('fields', 'files(id,modifiedTime)')
  url.searchParams.set('pageSize', '1')

  const response = await driveRequest(url.toString())
  const data = (await response.json()) as { files?: { id: string; modifiedTime: string }[] }
  return data.files?.[0] ?? null
}

// ── Public API ───────────────────────────────────────────────────────────────

export class GoogleDriveService {
  /**
   * Whether the Google client ID is configured (feature is available).
   */
  static isConfigured(): boolean {
    return !!import.meta.env.VITE_GOOGLE_CLIENT_ID
  }

  /**
   * Authenticate via Google Identity Services popup.
   * Returns access token on success.
   */
  static async authenticate(): Promise<string> {
    await loadGIS()
    const clientId = getClientId()

    return new Promise((resolve, reject) => {
      const google = (
        window as unknown as {
          google: {
            accounts: {
              oauth2: {
                initTokenClient: (config: {
                  client_id: string
                  scope: string
                  callback: (response: {
                    access_token?: string
                    error?: string
                    expires_in?: number
                  }) => void
                  error_callback: (error: { type: string; message?: string }) => void
                }) => { requestAccessToken: () => void }
              }
            }
          }
        }
      ).google

      if (!google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services not available'))
        return
      }

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response.error) {
            reject(new Error(`Google auth error: ${response.error}`))
            return
          }
          if (response.access_token) {
            accessToken = response.access_token
            tokenExpiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
            resolve(response.access_token)
          } else {
            reject(new Error('No access token received'))
          }
        },
        error_callback: (error) => {
          reject(new Error(`Google auth failed: ${error.type} ${error.message ?? ''}`))
        },
      })

      tokenClient.requestAccessToken()
    })
  }

  /**
   * Check if we have a valid (non-expired) access token.
   */
  static isAuthenticated(): boolean {
    return !!accessToken && Date.now() < tokenExpiresAt
  }

  /**
   * Save a snapshot to Google Drive appDataFolder.
   */
  static async saveSnapshot(snapshot: AppSnapshot): Promise<void> {
    const json = UnifiedStorageService.serializeSnapshot(snapshot)
    const existing = await findFile()

    if (existing) {
      // Update existing file
      await driveRequest(
        `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: json,
        }
      )
    } else {
      // Create new file via multipart upload
      const metadata = JSON.stringify({
        name: DRIVE_FILE_NAME,
        parents: ['appDataFolder'],
      })

      const boundary = '---pqctoday-boundary'
      const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${json}\r\n` +
        `--${boundary}--`

      await driveRequest('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      })
    }
  }

  /**
   * Load a snapshot from Google Drive appDataFolder.
   * Returns null if no file exists.
   */
  static async loadSnapshot(): Promise<{
    snapshot: AppSnapshot
    modifiedTime: string
  } | null> {
    const existing = await findFile()
    if (!existing) return null

    const response = await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`
    )
    const json = await response.text()
    const snapshot = UnifiedStorageService.parseSnapshot(json)

    return { snapshot, modifiedTime: existing.modifiedTime }
  }

  /**
   * Disconnect: revoke token and clear in-memory state.
   */
  static disconnect(): void {
    if (accessToken) {
      // Best-effort token revocation (fire and forget)
      fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
      }).catch(() => {})
    }
    accessToken = null
    tokenExpiresAt = 0
  }
}
