// SPDX-License-Identifier: GPL-3.0-only

export interface AlgoCtas {
  /** Route to a playground tool that demonstrates this algorithm. */
  try?: string
  /** Internal library route highlighting the algorithm's NIST/IETF specification. */
  spec?: string
  /** Internal learn module route explaining why this algorithm matters. */
  why: string
}

/** Ordered prefix lookup table — first match wins. */
const PREFIX_CTA_MAP: Array<[prefix: string, ctas: AlgoCtas]> = [
  [
    'ML-KEM',
    {
      try: '/playground/hybrid-encrypt',
      spec: '/library?highlight=FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'ML-DSA',
    {
      try: '/playground/token-migration',
      spec: '/library?highlight=FIPS 204',
      why: '/learn/pqc-101',
    },
  ],
  [
    'SLH-DSA',
    {
      try: '/playground/slh-dsa',
      spec: '/library?highlight=FIPS 205',
      why: '/learn/slh-dsa',
    },
  ],
  [
    'FN-DSA',
    {
      spec: '/library?highlight=FIPS 206',
      why: '/learn/pqc-101',
    },
  ],
  [
    'LMS',
    {
      try: '/playground/lms-hss',
      spec: '/library?highlight=NIST SP 800-208',
      why: '/learn/stateful-signatures',
    },
  ],
  [
    'XMSS',
    {
      try: '/playground/lms-hss',
      spec: '/library?highlight=NIST SP 800-208',
      why: '/learn/stateful-signatures',
    },
  ],
  [
    'HQC',
    {
      spec: '/library?highlight=HQC Specification',
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
      spec: '/library?highlight=FIPS 203',
      why: '/learn/hybrid-crypto',
    },
  ],
  [
    'SecP',
    {
      try: '/playground/hybrid-encrypt',
      spec: '/library?highlight=FIPS 203',
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
