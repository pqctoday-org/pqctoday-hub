// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import type { Key } from '../../../types'
import { bytesToHex } from '../../../utils/dataInputUtils'
import { KcvBadge } from '../KcvBadge'

/**
 * Resolve a stored key to hashable hex bytes, or null when its bytes can't be
 * read — e.g. a non-extractable Web Crypto key. Order: raw Uint8Array → an
 * exportable CryptoKey → a hex `value`.
 */
async function keyToHashableHex(key: Key): Promise<string | null> {
  if (key.data instanceof Uint8Array) return bytesToHex(key.data)

  if (
    key.dataType === 'cryptokey' &&
    key.data &&
    typeof key.data === 'object' &&
    'type' in key.data
  ) {
    const fmt: 'raw' | 'spki' | 'pkcs8' =
      key.type === 'symmetric' ? 'raw' : key.type === 'public' ? 'spki' : 'pkcs8'
    try {
      const raw = await crypto.subtle.exportKey(fmt, key.data as CryptoKey)
      return bytesToHex(new Uint8Array(raw))
    } catch {
      return null // non-extractable — can't fingerprint, and that's a feature
    }
  }

  const v = (key.value ?? '').replace(/\s/g, '')
  if (v && v.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(v)) return v
  return null
}

/**
 * Per-key KCV fingerprint for the software KeyStore (parallels the HSM key
 * table's KCV). Shows "—" when the key's bytes can't be read.
 */
export function KeyKcvBadge({ k }: { k: Key }) {
  // undefined = still resolving; null = unreadable; string = hashable hex
  const [hex, setHex] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    void keyToHashableHex(k).then((h) => {
      if (!cancelled) setHex(h)
    })
    return () => {
      cancelled = true
    }
  }, [k])

  if (hex === undefined) return null
  if (hex === null) {
    return (
      <span
        className="text-[10px] font-mono text-muted-foreground"
        title="Key bytes are not readable (non-extractable key) — cannot fingerprint"
      >
        KCV —
      </span>
    )
  }
  return <KcvBadge secretHex={hex} label="KCV" />
}
