// SPDX-License-Identifier: AGPL-3.0-only

import { algorithmLaunchHref, canonicalAlgorithmName } from './algorithmLaunch'
import { algorithmCatalogue } from './algorithmCatalogue'

export interface AlgoCtas {
  /** Route to a playground tool that demonstrates this algorithm. */
  try?: string
  /**
   * Library `reference_id` of this algorithm's NIST/IETF specification — a bare
   * id (e.g. `FIPS 203`), never a URL. The Spec CTA opens it in place via
   * `?spec=<id>` (SpecDrawerHost); `librarySpecHref` builds the /library
   * fallback from the same id, so there is one source of truth.
   */
  specRef?: string
  /** Internal learn module route explaining why this algorithm matters. */
  why: string
  specUrl?: string
  unavailableReason?: string
}

/** Full-page fallback for a spec, used when the in-place drawer can't resolve it. */
export function librarySpecHref(specRef: string): string {
  return `/library?ref=${encodeURIComponent(specRef)}`
}

/**
 * Ordered prefix lookup table — first match wins.
 *
 * Each `specRef` must still exist as a `reference_id` in the wired library CSV
 * — algorithmCtaMap.test.ts enforces that, so a renamed document fails the
 * suite instead of silently opening nothing.
 */
export const PREFIX_CTA_MAP: Array<[prefix: string, ctas: AlgoCtas]> = [
  [
    'ML-KEM',
    {
      specRef: 'FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'ML-DSA',
    {
      specRef: 'FIPS 204',
      why: '/learn/pqc-101',
    },
  ],
  [
    'SLH-DSA',
    {
      specRef: 'FIPS 205',
      why: '/learn/slh-dsa',
    },
  ],
  [
    'FN-DSA',
    {
      why: '/learn/pqc-101',
    },
  ],
  [
    'LMS',
    {
      specRef: 'NIST SP 800-208',
      why: '/learn/stateful-signatures',
    },
  ],
  [
    'XMSS',
    {
      specRef: 'NIST SP 800-208',
      why: '/learn/stateful-signatures',
    },
  ],
  [
    'HQC',
    {
      specRef: 'HQC Specification',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'FrodoKEM',
    {
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'MAYO',
    {
      why: '/learn/pqc-101',
    },
  ],
  [
    'CROSS',
    {
      why: '/learn/pqc-101',
    },
  ],
  [
    'UOV',
    {
      why: '/learn/pqc-101',
    },
  ],
  [
    'OV-',
    {
      why: '/learn/pqc-101',
    },
  ],
  [
    'SNOVA',
    {
      why: '/learn/pqc-101',
    },
  ],
  [
    'BIKE',
    {
      why: '/learn/quantum-threats',
    },
  ],
  [
    'Classic-McEliece',
    {
      why: '/learn/quantum-threats',
    },
  ],
  // Hybrid KEM composites
  [
    'X25519MLKEM',
    {
      specRef: 'FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'SecP',
    {
      specRef: 'FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
]

const FALLBACK_WHY = '/learn/pqc-101'

// Publication links come from the same latest catalogue as the Algorithms page.
// Prefixes supply educational context only; executable selection is exact.
const specificationUrls = new Map(algorithmCatalogue.map((row) => [row.algorithm, row.status_url]))

export function getAlgoCtas(requestedName: string): AlgoCtas | null {
  const algoName = canonicalAlgorithmName(requestedName)
  const context = PREFIX_CTA_MAP.find(([prefix]) => algoName.startsWith(prefix))?.[1]
  const tryHref = algorithmLaunchHref(algoName)
  // Transition rows also name families/choices. They may link to background
  // sources but must never silently choose a parameter set for execution.
  const familyNames = new Set([
    'ML-KEM',
    'ML-DSA',
    'SLH-DSA',
    'FN-DSA',
    'FrodoKEM',
    'MAYO',
    'HAWK',
    'Classic-McEliece',
    'AIMer',
    'Aigis-enc',
    'Aigis-sig',
    'HAETAE',
    'SMAUG-T',
    'NTRU+',
    'LMS-SHA256',
  ])
  const familySource = familyNames.has(algoName)
    ? algorithmCatalogue.find(
        (row) =>
          row.algorithm.startsWith(`${algoName}-`) || row.algorithm.startsWith(`${algoName} `)
      )?.status_url
    : undefined
  const choiceSource = algoName.includes('/')
    ? 'https://csrc.nist.gov/projects/post-quantum-cryptography'
    : undefined
  const url = specificationUrls.get(algoName) ?? familySource ?? choiceSource
  if (!context && !tryHref && !url) return null
  const standardSlh = /^SLH-DSA-(SHA2|SHAKE)-(128|192|256)[sf]$/.test(algoName)
  const component =
    (algoName.startsWith('ML-KEM-') && !/^ML-KEM-(512|768|1024)$/.test(algoName)) ||
    (algoName.startsWith('ML-DSA') && !/^ML-DSA-(44|65|87)$/.test(algoName))
  const tls = /^(X25519MLKEM|SecP)/.test(algoName)
  const specRef =
    component || tls || (algoName.startsWith('SLH-DSA') && !standardSlh)
      ? undefined
      : context?.specRef
  return {
    why:
      algoName === 'X-Wing' || algoName === 'HPKE-PQ'
        ? '/learn/hybrid-crypto'
        : (context?.why ?? FALLBACK_WHY),
    try: tryHref,
    specRef,
    specUrl: specRef ? undefined : url,
    unavailableReason: tryHref
      ? undefined
      : algoName.startsWith('SLH-DSA')
        ? 'No exact implementation of this draft parameter set.'
        : algoName.startsWith('LMS') || algoName.startsWith('XMSS')
          ? 'The workshop uses smaller trees; no exact H20 demonstration is available.'
          : algoName === 'DH (Diffie-Hellman)'
            ? 'Choose a DH group before running an exact demonstration.'
            : algoName.startsWith('sntrup')
              ? 'The sntrup761 KEM is not bundled in the served SSH build.'
              : 'Reference only: no exact executable launch is available.',
  }
}
export function getAlgoCtasWithFallback(algoName: string): AlgoCtas {
  return (
    getAlgoCtas(algoName) ?? {
      why: FALLBACK_WHY,
      unavailableReason: 'No exact executable launch is available.',
    }
  )
}
