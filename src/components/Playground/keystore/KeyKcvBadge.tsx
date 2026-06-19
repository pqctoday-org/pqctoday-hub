// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import type { Key } from '../../../types'
import { hash } from '../../../utils/webCrypto'
import { bytesToHex, hexToBytes } from '../../../utils/dataInputUtils'

/**
 * Resolve a stored key to hashable RAW hex bytes, or null when the raw bytes
 * can't be read. Order: raw Uint8Array → a symmetric Web Crypto key (export raw)
 * → a hex `value`. Asymmetric Web Crypto keys only export as SPKI/PKCS#8 DER (not
 * the raw key), so a fingerprint over them wouldn't match the HSM's raw-key KCV —
 * we return null ("—") rather than show a misleading, non-comparable value.
 */
async function keyToHashableHex(key: Key): Promise<string | null> {
  if (key.data instanceof Uint8Array) return bytesToHex(key.data)

  if (
    key.dataType === 'cryptokey' &&
    key.data &&
    typeof key.data === 'object' &&
    'type' in key.data
  ) {
    if (key.type !== 'symmetric') return null
    try {
      const raw = await crypto.subtle.exportKey('raw', key.data as CryptoKey)
      return bytesToHex(new Uint8Array(raw))
    } catch {
      return null // non-extractable — can't fingerprint, and that's a feature
    }
  }

  const v = (key.value ?? '').replace(/\s/g, '')
  if (v && v.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(v)) return v
  return null
}

// Keys are immutable once generated, so cache the (async) KCV by id. The desktop
// table and the mobile card both mount a badge per key, so this computes once.
const kcvCache = new Map<string, Promise<string | null>>()
function resolveKcv(key: Key): Promise<string | null> {
  let p = kcvCache.get(key.id)
  if (!p) {
    p = keyToHashableHex(key).then(async (hex) =>
      hex == null ? null : bytesToHex((await hash('SHA-256', hexToBytes(hex))).slice(0, 3))
    )
    kcvCache.set(key.id, p)
  }
  return p
}

/**
 * Per-key KCV fingerprint for the software KeyStore: the first 3 bytes of
 * SHA-256 over the RAW key bytes, matching the HSM key table for symmetric/raw
 * keys. Shows "—" when the raw bytes can't be read (non-extractable or asymmetric
 * Web Crypto key).
 */
export function KeyKcvBadge({ k }: { k: Key }) {
  // undefined = still resolving; null = unreadable; string = KCV hex
  const [kcv, setKcv] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    void resolveKcv(k).then((v) => {
      if (!cancelled) setKcv(v)
    })
    return () => {
      cancelled = true
    }
  }, [k])

  if (kcv === undefined) return null
  if (kcv === null) {
    return (
      <span
        className="text-[10px] font-mono text-muted-foreground"
        title="Raw key bytes are not readable (non-extractable or asymmetric Web Crypto key) — cannot fingerprint"
      >
        KCV —
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
      title="Key Check Value — first 3 bytes of SHA-256 over the raw key bytes (matches the HSM key table for symmetric/raw keys)."
    >
      KCV: {kcv}
    </span>
  )
}
