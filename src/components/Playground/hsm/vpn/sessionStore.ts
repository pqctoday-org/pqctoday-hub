// SPDX-License-Identifier: GPL-3.0-only
/**
 * IndexedDB-backed VPN session history.
 *
 * Scope note: this does NOT persist softhsmv3 private-key state across page
 * reloads — the WASM HSM's in-memory token dies with the page. What we persist
 * is the user's *configuration and generated-cert bundle* per run, so a user
 * returning to the panel can:
 *   - see their recent runs (mode / auth / algorithms)
 *   - redownload a prior config .zip
 *   - copy CKA_ID handles for external deployment
 *
 * True on-HSM persistence would require mounting Emscripten IDBFS inside the
 * softhsmv3 WASM build or intercepting C_* at the serialization boundary — out
 * of scope for this helper.
 */
import type { IKEv2Mode } from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'

export interface VpnSessionRecord {
  id: string
  createdAt: number
  mode: IKEv2Mode
  authMode: 'psk' | 'dual'
  clientVariant: string
  serverVariant: string
  mtu: number
  allowFragmentation: boolean
  strongswanConfInit: string
  strongswanConfResp: string
  ipsecConfInit: string
  ipsecConfResp: string
  clientPsk: string
  serverPsk: string
  initiatorCertPem?: string
  responderCertPem?: string
  initiatorCkaId?: string
  responderCkaId?: string
  notes?: string
}

const DB_NAME = 'pqctoday-vpn-sessions'
const DB_VERSION = 1
const STORE = 'sessions'
const MAX_RECORDS = 20

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' })
        os.createIndex('by-created', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSession(rec: VpnSessionRecord): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(rec)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  // Trim to MAX_RECORDS (oldest first)
  await trim(db)
  db.close()
}

async function trim(db: IDBDatabase): Promise<void> {
  const all = await listAll(db)
  if (all.length <= MAX_RECORDS) return
  const excess = all.slice(0, all.length - MAX_RECORDS) // oldest first
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const os = tx.objectStore(STORE)
    for (const r of excess) os.delete(r.id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function listAll(db: IDBDatabase): Promise<VpnSessionRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).index('by-created').getAll()
    req.onsuccess = () => resolve((req.result ?? []) as VpnSessionRecord[])
    req.onerror = () => reject(req.error)
  })
}

export async function listSessions(limit = MAX_RECORDS): Promise<VpnSessionRecord[]> {
  const db = await openDb()
  const all = await listAll(db)
  db.close()
  return all.slice(-limit).reverse() // newest first
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function clearSessions(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export function newSessionId(): string {
  return `vpn-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
}
