// SPDX-License-Identifier: GPL-3.0-only
/**
 * Per-product performance & key-size guidance (Migrate gap-closer row 3, §6.1/6.3
 * p.120–126). Pure derivation over the algorithm-properties registry and the
 * product's declared PQC algorithms — no UI, no network.
 *
 * The guidance is intentionally coarse: a *size class* (how much bigger PQC keys
 * / signatures are than the classical baseline) plus a one-line performance note
 * and a "perf-tested" flag inferred from whether the product is FIPS-validated or
 * carries an interoperability/benchmark signal. Used by the Migrate guidance
 * panel and per-product hints; safe to unit-test in isolation.
 */
import { ALGORITHM_REGISTRY } from '../../data/algorithmProperties'
import type { SoftwareItem } from '../../types/MigrateTypes'

export type SizeClass = 'compact' | 'moderate' | 'large' | 'very-large' | 'unknown'

export interface PerfGuidance {
  /** Coarse size class of the heaviest PQC algorithm the product exposes. */
  sizeClass: SizeClass
  /** Canonical algorithm name that drove the size class (or null). */
  drivingAlgorithm: string | null
  /** Largest public-key + signature/ciphertext footprint in bytes (0 if unknown). */
  maxFootprintBytes: number
  /** Human-readable performance note. */
  note: string
  /** Whether the product carries a validation/interop signal worth surfacing. */
  perfTested: boolean
}

const SIZE_CLASS_LABEL: Record<SizeClass, string> = {
  compact: 'Compact',
  moderate: 'Moderate',
  large: 'Large',
  'very-large': 'Very large',
  unknown: 'Unknown',
}

export function sizeClassLabel(sc: SizeClass): string {
  return SIZE_CLASS_LABEL[sc]
}

/**
 * Map a footprint (public key + signature/ciphertext bytes) to a coarse class.
 * Thresholds chosen against the FIPS 203/204/205 parameter sets:
 *  - ML-KEM-768 ≈ 2.2 KB → moderate
 *  - ML-DSA-65 ≈ 5.3 KB → large
 *  - SLH-DSA ≥ 8 KB sigs → very-large
 */
export function classifyFootprint(bytes: number): SizeClass {
  if (bytes <= 0) return 'unknown'
  if (bytes < 1500) return 'compact'
  if (bytes < 4000) return 'moderate'
  if (bytes < 8000) return 'large'
  return 'very-large'
}

/** Resolve a product's declared PQC algorithms to registry entries. */
function matchedAlgorithms(item: SoftwareItem): { name: string; footprint: number }[] {
  const haystack = `${item.pqcSupport ?? ''} ${item.pqcCapabilityDescription ?? ''}`.toUpperCase()
  const out: { name: string; footprint: number }[] = []
  for (const props of Object.values(ALGORITHM_REGISTRY)) {
    if (haystack.includes(props.name.toUpperCase())) {
      out.push({
        name: props.name,
        footprint: props.publicKeyBytes + props.signatureOrCiphertextBytes,
      })
    }
  }
  return out
}

const PERF_TESTED_SIGNALS = /fips 140|fips 203|fips 204|fips 205|acvp|validated|benchmark|interop/i

export function getPerfGuidance(item: SoftwareItem): PerfGuidance {
  const matched = matchedAlgorithms(item)
  const heaviest = matched.reduce<{ name: string; footprint: number } | null>(
    (acc, a) => (acc === null || a.footprint > acc.footprint ? a : acc),
    null
  )

  const maxFootprintBytes = heaviest?.footprint ?? 0
  const sizeClass = classifyFootprint(maxFootprintBytes)
  const perfTested =
    PERF_TESTED_SIGNALS.test(item.fipsValidated ?? '') ||
    PERF_TESTED_SIGNALS.test(item.pqcCapabilityDescription ?? '') ||
    PERF_TESTED_SIGNALS.test(item.verificationStatus ?? '')

  let note: string
  switch (sizeClass) {
    case 'compact':
      note = 'Small key/ciphertext footprint — minimal impact on packets, TLS records and storage.'
      break
    case 'moderate':
      note =
        'Larger handshakes than classical ECC. Watch MTU / fragmentation on UDP and constrained links.'
      break
    case 'large':
      note =
        'Signatures and keys are several KB. Budget for larger certificates, slower handshakes and more bandwidth.'
      break
    case 'very-large':
      note =
        'Hash-based signatures are very large (≥8 KB). Reserve for code-signing / firmware where size is acceptable.'
      break
    default:
      note =
        'No specific PQC algorithm parameters detected — confirm key/signature sizes against the vendor spec.'
  }

  return {
    sizeClass,
    drivingAlgorithm: heaviest?.name ?? null,
    maxFootprintBytes,
    note,
    perfTested,
  }
}
