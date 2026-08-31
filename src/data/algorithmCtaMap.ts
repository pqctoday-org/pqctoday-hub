// SPDX-License-Identifier: GPL-3.0-only

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
      try: '/playground/hybrid-encrypt',
      specRef: 'FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'ML-DSA',
    {
      try: '/playground/token-migration',
      specRef: 'FIPS 204',
      why: '/learn/pqc-101',
    },
  ],
  [
    'SLH-DSA',
    {
      try: '/playground/slh-dsa',
      specRef: 'FIPS 205',
      why: '/learn/slh-dsa',
    },
  ],
  [
    'FN-DSA',
    {
      try: '/playground/interactive?algo=FN-DSA-512&tab=sign_verify',
      why: '/learn/pqc-101',
    },
  ],
  [
    'LMS',
    {
      try: '/playground/lms-hss',
      specRef: 'NIST SP 800-208',
      why: '/learn/stateful-signatures',
    },
  ],
  [
    'XMSS',
    {
      try: '/playground/lms-hss',
      specRef: 'NIST SP 800-208',
      why: '/learn/stateful-signatures',
    },
  ],
  [
    'HQC',
    {
      try: '/playground/interactive?algo=HQC-128&tab=keystore',
      specRef: 'HQC Specification',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'FrodoKEM',
    {
      try: '/playground/interactive?algo=FrodoKEM-640&tab=keystore',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'MAYO',
    {
      try: '/playground/interactive?algo=MAYO-1&tab=sign_verify',
      why: '/learn/pqc-101',
    },
  ],
  [
    'CROSS',
    {
      try: '/playground/interactive?algo=CROSS-RSDP-128-balanced&tab=sign_verify',
      why: '/learn/pqc-101',
    },
  ],
  [
    'UOV',
    {
      try: '/playground/interactive?algo=OV-Ip&tab=sign_verify',
      why: '/learn/pqc-101',
    },
  ],
  [
    'OV-',
    {
      try: '/playground/interactive?algo=OV-Ip&tab=sign_verify',
      why: '/learn/pqc-101',
    },
  ],
  [
    'SNOVA',
    {
      try: '/playground/interactive?algo=SNOVA-24-5-4&tab=sign_verify',
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
      try: '/playground/hybrid-encrypt',
      specRef: 'FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'SecP',
    {
      try: '/playground/hybrid-encrypt',
      specRef: 'FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
]

const FALLBACK_WHY = '/learn/pqc-101'

export function getAlgoCtas(algoName: string): AlgoCtas | null {
  for (const [prefix, ctas] of PREFIX_CTA_MAP) {
    if (algoName.startsWith(prefix)) return ctas
  }
  return null
}

export function getAlgoCtasWithFallback(algoName: string): AlgoCtas {
  return getAlgoCtas(algoName) ?? { why: FALLBACK_WHY }
}
