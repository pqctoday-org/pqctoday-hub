// SPDX-License-Identifier: GPL-3.0-only
/**
 * In-browser mock CA helpers.
 *
 * Lazily provisions an ML-DSA-65 self-signed root CA inside the OpenSSL WASM
 * filesystem on first use. The CA key + cert are cached in IndexedDB so the
 * same root persists across workshop steps (and across reloads).
 *
 * The OpenSSL `cmp` subcommand's built-in mock server (`-use_mock_srv`)
 * dispatches requests in-process without any network call. We feed it our
 * generated CA materials via `-srv_cert` / `-srv_key`, and it issues real
 * X.509 certs signed by ML-DSA-65 in response to CMP IR / CR / KUR requests.
 */
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { CA_ROOT_CERT_PATH, CA_ROOT_KEY_PATH } from '../constants'

const DB_NAME = 'pki-enrollment-mock-ca'
const STORE_NAME = 'materials'
const KEY_RECORD_ID = 'ca-key-pem'
const CERT_RECORD_ID = 'ca-cert-pem'

interface CAMaterials {
  keyPem: Uint8Array
  certPem: Uint8Array
}

function openCADb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function readCached(): Promise<CAMaterials | null> {
  const db = await openCADb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const keyReq = store.get(KEY_RECORD_ID)
    const certReq = store.get(CERT_RECORD_ID)
    tx.oncomplete = () => {
      const key = keyReq.result as Uint8Array | undefined
      const cert = certReq.result as Uint8Array | undefined
      if (key && cert) {
        resolve({ keyPem: key, certPem: cert })
      } else {
        resolve(null)
      }
    }
    tx.onerror = () => reject(tx.error)
  })
}

async function writeCached(materials: CAMaterials): Promise<void> {
  const db = await openCADb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(materials.keyPem, KEY_RECORD_ID)
    store.put(materials.certPem, CERT_RECORD_ID)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Generate a fresh ML-DSA-65 self-signed root via the `generate_mock_ca_root`
 * WASM shim (see src/wasm/cmp_simulation.c). Avoids `openssl req -x509`, which
 * fails on ML-DSA keys because apps/req.c forces SHA256 hash-then-sign and
 * ML-DSA refuses non-NULL md ("operation not supported for this keytype").
 * The shim uses the EVP API directly (`EVP_PKEY_Q_keygen` + `X509_sign(NULL md)`)
 * which handles "pure" PQC signatures correctly.
 */
async function generateRoot(): Promise<CAMaterials> {
  const result = await openSSLService.generateCaRoot({
    algorithm: 'ML-DSA-65',
    subjectDn: '/CN=PQC_Workshop_Mock_CA',
    keyOutPath: '/tmp_ca.key.pem',
    certOutPath: '/tmp_ca.cert.pem',
    days: 3650,
  })
  if (!result.ok || !result.keyPem || !result.certPem) {
    throw new Error(`CA root generation failed: ${result.error || 'unknown'}`)
  }
  return { keyPem: result.keyPem, certPem: result.certPem }
}

/**
 * Ensure the mock CA materials exist and are present on the OpenSSL WASM FS
 * at `/ca.key.pem` and `/ca.cert.pem`. Returns the PEM contents.
 */
export async function ensureMockCA(): Promise<CAMaterials> {
  let materials = await readCached()
  if (!materials) {
    materials = await generateRoot()
    await writeCached(materials)
  }
  return materials
}

/** Force-regenerate the CA (drops the cached root). */
export async function resetMockCA(): Promise<CAMaterials> {
  const db = await openCADb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  const fresh = await generateRoot()
  await writeCached(fresh)
  return fresh
}

/** Convenience: returns the input-files array for an `openSSLService.execute` call. */
export function caInputFiles(materials: CAMaterials): { name: string; data: Uint8Array }[] {
  // Strip leading slashes — execute() places files at /<name>
  return [
    { name: CA_ROOT_KEY_PATH.replace(/^\//, ''), data: materials.keyPem },
    { name: CA_ROOT_CERT_PATH.replace(/^\//, ''), data: materials.certPem },
  ]
}
