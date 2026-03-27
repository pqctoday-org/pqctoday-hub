// SPDX-License-Identifier: GPL-3.0-only
/**
 * CloudSyncService — Google Drive appDataFolder integration
 *
 * Stores a single JSON file (`pqc-sync-data.json`) in the user's hidden
 * Google Drive appDataFolder. No access to the user's regular Drive files.
 *
 * Scope required: https://www.googleapis.com/auth/drive.appdata
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const SYNC_FILENAME = 'pqc-sync-data.json'

export interface SyncDocument {
  syncedAt: string
  appVersion: string
  deviceId?: string
  stores: Record<string, unknown>
}

async function driveRequest(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Drive API error ${response.status}: ${text}`)
  }
  return response
}

/**
 * Find the sync file in appDataFolder. Returns file info or null if not found.
 */
async function findSyncFile(
  accessToken: string
): Promise<{ id: string; modifiedTime: string } | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${SYNC_FILENAME}'`,
    fields: 'files(id, modifiedTime)',
  })
  const response = await driveRequest(`${DRIVE_API}/files?${params}`, accessToken)
  const data = (await response.json()) as { files: { id: string; modifiedTime: string }[] }
  return data.files?.[0] ?? null
}

/**
 * Fetch minimal metadata for conflict detection.
 */
export async function fetchFileMetadata(
  accessToken: string,
  fileId: string
): Promise<{ modifiedTime: string } | null> {
  try {
    const response = await driveRequest(
      `${DRIVE_API}/files/${fileId}?fields=modifiedTime`,
      accessToken
    )
    return (await response.json()) as { modifiedTime: string }
  } catch {
    return null
  }
}

/**
 * Download the SyncDocument from Drive. Returns null if no file exists yet.
 */
export async function fetchFromDrive(
  accessToken: string
): Promise<{ data: SyncDocument; fileId: string; modifiedTime: string } | null> {
  const file = await findSyncFile(accessToken)
  if (!file) return null

  const response = await driveRequest(`${DRIVE_API}/files/${file.id}?alt=media`, accessToken)
  const data = (await response.json()) as SyncDocument
  return { data, fileId: file.id, modifiedTime: file.modifiedTime }
}

/**
 * Write (create or update) the SyncDocument to Drive.
 * Returns the fileId for future updates.
 */
export async function writeToDrive(
  accessToken: string,
  data: SyncDocument,
  existingFileId?: string | null
): Promise<string> {
  const body = JSON.stringify(data)

  if (existingFileId) {
    // Update existing file: update the media content directly
    const response = await driveRequest(
      `${DRIVE_UPLOAD_API}/files/${existingFileId}?uploadType=media`,
      accessToken,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      }
    )
    const result = (await response.json()) as { id: string }
    return result.id
  } else {
    // Create new file: requires multipart/related
    const metadata = {
      name: SYNC_FILENAME,
      parents: ['appDataFolder'],
    }

    const boundary = '-------314159265358979323846'
    const openDelim = `--${boundary}\r\n`
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelim = `\r\n--${boundary}--`

    const multipartRequestBody =
      openDelim +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      body +
      closeDelim

    const response = await driveRequest(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart`,
      accessToken,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartRequestBody,
      }
    )
    const result = (await response.json()) as { id: string }
    return result.id
  }
}
