// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { hash } from '@/utils/webCrypto'
import { bytesToHex, hexToBytes } from '@/utils/dataInputUtils'

/**
 * Renders a 3-byte "key check value" (KCV) fingerprint of a hex-encoded secret.
 *
 * The software playground has no PKCS#11 `CKA_CHECK_VALUE`, so this is a
 * SHA-256(secret)[0:3] fingerprint — the same first-3-bytes-of-SHA-256
 * methodology the HSM panels use for asymmetric keys, so the software and HSM
 * values are directly comparable. It is a short fingerprint for confirming two
 * parties derived the same secret, not a spec-compliant PKCS#11 KCV.
 */
export function KcvBadge({ secretHex, label = 'KCV' }: { secretHex: string; label?: string }) {
  const [kcv, setKcv] = useState('')
  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!secretHex) {
        if (!cancelled) setKcv('')
        return
      }
      try {
        const digest = await hash('SHA-256', hexToBytes(secretHex))
        if (!cancelled) setKcv(bytesToHex(digest.slice(0, 3)))
      } catch {
        if (!cancelled) setKcv('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [secretHex])

  if (!kcv) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
      title="Key Check Value — first 3 bytes of SHA-256(secret). A short fingerprint to confirm two parties derived the same secret (software fingerprint, not a PKCS#11 CKA_CHECK_VALUE)."
    >
      {label}: {kcv}
    </span>
  )
}
