// SPDX-License-Identifier: GPL-3.0-only
/**
 * Printability heuristic for deciding whether a hex-encoded byte payload's
 * default Inspect view should be hex or decoded text — generalized out of
 * KeyDetails.tsx's local, Key-domain-coupled `formatValue` so the pipeline
 * builders' Inspect views (StepInspectPanel, WireTreeView) can reuse it.
 * Never authoritative: the caller always keeps a manual hex/text toggle,
 * this only picks where that toggle starts.
 */
import { hexToBytes } from '../../utils/dataInputUtils'

/** Same printable-ASCII range KeyDetails.tsx's formatValue already used. */
export function isLikelyText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false
  let printable = 0
  for (const b of bytes) if (b >= 32 && b <= 126) printable++
  return printable / bytes.length > 0.85
}

export function guessDefaultMode(hex: string): 'hex' | 'text' {
  if (!hex || hex.length % 2 !== 0) return 'hex'
  return isLikelyText(hexToBytes(hex)) ? 'text' : 'hex'
}

/** Non-printable bytes render as '.', matching KeyDetails.tsx's own ASCII
 *  fallback — legible enough to spot a real string, never mistaken for a
 *  precise decode. */
export function hexToPrintableText(hex: string): string {
  return Array.from(hexToBytes(hex))
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('')
}
