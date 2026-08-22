// SPDX-License-Identifier: GPL-3.0-only
export interface AlgorithmSecurityData {
  name: string
  type: 'classical' | 'pqc'
  category: 'asymmetric' | 'symmetric' | 'hash'
  classicalBits: number
  quantumBits: number
  quantumAttack: 'shor' | 'grover' | 'bht' | 'none'
  estimatedQubits: number | null
  status: 'broken' | 'weakened' | 'safe'
  notes: string
}

export const ALGORITHM_SECURITY_DATA: AlgorithmSecurityData[] = [
  // Classical asymmetric (broken by Shor's)
  {
    name: 'RSA-2048',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 112,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 1537,
    status: 'broken',
    notes:
      "Shor's algorithm factors N in polynomial time. Current best published estimate: Gidney 2025 (Google Quantum AI, arXiv:2505.15917) — 1,409 logical qubits active at peak, 1,537 including idle patches (“fewer than 1600”), factoring RSA-2048 in under a week on fewer than 1M noisy physical qubits. Supersedes Chevignard–Fouque–Schrottenloher (ePrint 2024/222, published at CRYPTO 2025), which reached 1,730 logical qubits but at 2^36 Toffoli gates, and the older 2016-era ~4,098 (2n+2) estimate — matches CRQC_QUBIT_THRESHOLDS.rsa2048.",
  },
  {
    name: 'RSA-3072',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 2043,
    status: 'broken',
    notes:
      "Larger key does not help — Shor's scales polynomially with key size, and the revised circuits scale as n/2 + o(n). Gidney 2025 estimates 2,043 logical qubits for RSA-3072, as reported by Chevignard et al. (EUROCRYPT 2026) — down from the older 2016-era ~6,146 (2n+2) estimate. Note this is BELOW the 2,124 qubits the best space-optimised attack needs for a 256-bit elliptic curve at comparable classical security.",
  },
  {
    name: 'RSA-4096',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 140,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 8194,
    status: 'broken',
    notes:
      'Even 4096-bit RSA provides zero post-quantum security. Still the older 2016-era (2n+2) estimate — no revised resource estimate has been published for this key size, unlike RSA-2048 and RSA-3072. On the n/2 + o(n) scaling of the revised circuits the real figure would be far lower; treat 8,194 as an upper bound, not a target.',
  },
  {
    name: 'ECDSA P-256',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 1200,
    status: 'broken',
    notes:
      "Revised per Google Quantum AI (Mar 2026): improved Shor's circuits break 256-bit ECC with \u22641,200 logical qubits — roughly half prior estimates. Fewer qubits needed than RSA at equivalent security. Low-end estimate; other published work puts 256-bit ECC at ~2,330+ logical qubits.",
  },
  {
    name: 'ECDSA P-384',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 192,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 3484,
    status: 'broken',
    notes: 'All ECC variants are equally broken by quantum — curve size is irrelevant.',
  },
  {
    name: 'X25519',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 1200,
    status: 'broken',
    notes:
      "Curve25519 ECDH falls to Shor's just like NIST curves. Revised to ~1,200 logical qubits per Google Quantum AI (Mar 2026) circuit efficiency improvements for 256-bit elliptic curves. Low-end estimate; other published work puts 256-bit ECC at ~2,330+ logical qubits.",
  },
  {
    name: 'Ed25519',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 1200,
    status: 'broken',
    notes:
      "EdDSA signatures rely on discrete log — vulnerable to Shor's. Revised to ~1,200 logical qubits per Google Quantum AI (Mar 2026) circuit efficiency improvements for 256-bit elliptic curves. Low-end estimate; other published work puts 256-bit ECC at ~2,330+ logical qubits.",
  },
  {
    name: 'ECDSA secp256k1',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 1200,
    status: 'broken',
    notes:
      'Google Quantum AI & Ethereum Foundation (Mar 2026): \u22641,200 logical qubits + \u226490M Toffoli gates breaks secp256k1 ECDLP via Shor\u2019s algorithm. Used in Bitcoin, Ethereum, and most blockchain protocols. Low-end estimate; other published work puts 256-bit ECC at ~2,330+ logical qubits.',
  },
  // Symmetric (weakened by Grover's)
  {
    name: 'AES-128',
    type: 'classical',
    category: 'symmetric',
    classicalBits: 128,
    quantumBits: 64,
    quantumAttack: 'grover',
    estimatedQubits: 2953,
    status: 'weakened',
    notes: "Grover's provides quadratic speedup: 128-bit → 64-bit. Below security threshold.",
  },
  {
    name: 'AES-192',
    type: 'classical',
    category: 'symmetric',
    classicalBits: 192,
    quantumBits: 96,
    quantumAttack: 'grover',
    estimatedQubits: 4449,
    status: 'weakened',
    notes:
      "Grover's reduces to 96-bit — considered adequate for some legacy systems but below the 128-bit post-quantum threshold.",
  },
  {
    name: 'AES-256',
    type: 'classical',
    category: 'symmetric',
    classicalBits: 256,
    quantumBits: 128,
    quantumAttack: 'grover',
    estimatedQubits: 6681,
    status: 'safe',
    notes: "Grover's reduces to 128-bit. Remains fully secure post-quantum.",
  },
  // Hash functions (weakened by Grover's for preimage, BHT for collision)
  {
    name: 'SHA-256',
    type: 'classical',
    category: 'hash',
    classicalBits: 128,
    quantumBits: 85,
    quantumAttack: 'bht',
    estimatedQubits: null,
    status: 'safe',
    notes:
      'Collision resistance: 128-bit classical → ~85-bit quantum (BHT algorithm). Preimage: 256 → 128-bit.',
  },
  {
    name: 'SHA-384',
    type: 'classical',
    category: 'hash',
    classicalBits: 192,
    quantumBits: 128,
    quantumAttack: 'bht',
    estimatedQubits: null,
    status: 'safe',
    notes: 'Collision resistance: 192-bit classical → ~128-bit quantum. Remains secure.',
  },
  {
    name: 'SHA-512',
    type: 'classical',
    category: 'hash',
    classicalBits: 256,
    quantumBits: 170,
    quantumAttack: 'bht',
    estimatedQubits: null,
    status: 'safe',
    notes: 'Collision resistance: 256-bit classical → ~170-bit quantum. Remains secure.',
  },
  {
    name: 'SHA3-256',
    type: 'classical',
    category: 'hash',
    classicalBits: 128,
    quantumBits: 85,
    quantumAttack: 'bht',
    estimatedQubits: null,
    status: 'safe',
    notes: 'Same quantum impact as SHA-256. Sponge construction provides no quantum advantage.',
  },
  // PQC algorithms (safe)
  {
    name: 'ML-KEM-512',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 128,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 1. Lattice-based KEM resistant to all known quantum attacks.',
  },
  {
    name: 'ML-KEM-768',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 192,
    quantumBits: 192,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 3. Recommended general-purpose parameter set.',
  },
  {
    name: 'ML-KEM-1024',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 256,
    quantumBits: 256,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 5. Highest security parameter set.',
  },
  {
    name: 'ML-DSA-44',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 128,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 2. Lattice-based digital signature.',
  },
  {
    name: 'ML-DSA-65',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 192,
    quantumBits: 192,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 3. Recommended general-purpose signature parameter set.',
  },
  {
    name: 'ML-DSA-87',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 256,
    quantumBits: 256,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 5. Highest security signature parameter set.',
  },
  {
    name: 'SLH-DSA-128s',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 128,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 1. Hash-based, conservative security assumptions. Small signature variant.',
  },
  {
    name: 'SLH-DSA-192s',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 192,
    quantumBits: 192,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 3. Hash-based signature, small variant.',
  },
  {
    name: 'SLH-DSA-256s',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 256,
    quantumBits: 256,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 5. Hash-based signature, small variant.',
  },
  {
    name: 'FN-DSA-512',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 128,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 1. Compact lattice-based signature (NTRU lattice).',
  },
  {
    name: 'HQC-128',
    type: 'pqc',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 128,
    quantumAttack: 'none',
    estimatedQubits: null,
    status: 'safe',
    notes: 'NIST Level 1. Code-based KEM, selected March 2025.',
  },
]

export interface CRQCEstimate {
  source: string
  yearLow: number
  yearHigh: number
  confidence: string
  notes: string
  /** Link to the primary publication, so the citation on the Threats page can
   *  be hyperlinked instead of standing as unverifiable free text. */
  url: string
  /**
   * ISO date this estimate was last checked against its cited source
   * (`url`) — NOT the source's own publish date. Missing or older than 180
   * days flags this row as stale-refresh in the maintenance pipeline
   * (deferred-items plan Finding E). Stamped by a human re-verifying the
   * claim, never machine-drafted — quantum-capability claims are never
   * judged or drafted by machine (crqc-watch's existing content-truth rule).
   */
  lastReviewed?: string
}

/**
 * Multi-source CRQC arrival estimates backing the Threats-page capability strip.
 * The canonical optimistic/expected/pessimistic planning triple (2030 / 2035 / 2040)
 * lives in `regulatoryTimelines.ts` (`CRQC_ESTIMATES` object); these per-source rows
 * are the detail behind that range and now agree on its bounds. Rows are CRQC
 * *arrival* estimates — not regulatory mandate dates (e.g. CNSA 2.0's 2025 is a
 * migration deadline, kept in the notes, not used as a CRQC-arrival year). The
 * GRI 2025 survey puts the median expert estimate at 2029–2032, so the window
 * floor is ~2029, not 2025.
 */
export const CRQC_ESTIMATES: CRQCEstimate[] = [
  {
    source: 'Google Quantum AI & Ethereum Foundation (2026)',
    yearLow: 2029,
    yearHigh: 2036,
    confidence:
      'Architecture-dependent \u2014 year range is THIS dataset\u2019s derived estimate, not asserted by the source',
    notes:
      'Mar 2026: secp256k1 ECDLP breakable with \u22641,200 logical qubits (1,200\u20131,450 per the two circuit variants) and <500,000 physical qubits \u2014 the most aggressive resource estimate to date, ~20x below prior best estimates. The whitepaper itself makes NO CRQC-arrival-date claim (confirmed 2026-07-16) \u2014 yearLow/yearHigh here are derived by combining its qubit threshold with published hardware roadmaps (e.g. IonQ), not read off the paper. Introduces fast-clock (superconducting/photonic) vs slow-clock (trapped ion/neutral atom) CRQC distinction. Fast-clock CRQCs enable on-spend attacks on public mempools; slow-clock enable at-rest attacks on dormant wallets. 2.3M BTC identified as at-risk.',
    url: 'https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf',
    lastReviewed: '2026-07-30',
  },
  {
    source: 'Global Risk Institute (2025)',
    yearLow: 2030,
    yearHigh: 2041,
    confidence: '28-49% by 2036, 51-70% by 2041',
    notes:
      '26-expert survey (March 2026). Significant acceleration: 28-49% probability within 10 years (up from 19-34% in 2024). Majority consider CRQC by 2035 quite likely.',
    url: 'https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/',
    lastReviewed: '2026-07-30',
  },
  {
    source: 'NIST IR 8547 (IPD, Nov 2024)',
    yearLow: 2030,
    yearHigh: 2035,
    confidence: 'Planning horizon',
    notes:
      'Deprecate RSA/ECC by 2030, disallow by 2035. Assumes CRQC is imminent enough to act now. Re-verified 2026-07-30 directly against csrc.nist.gov: still Initial Public Draft status (comment period closed 2025-01-10, no second draft or final version published) \u2014 a third-party aggregator claimed a "final 2025 version" that does not match the authoritative NIST page.',
    url: 'https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf',
    lastReviewed: '2026-07-30',
  },
  {
    source: 'NSA CNSA 2.0 (2022)',
    yearLow: 2030,
    yearHigh: 2033,
    confidence: 'Mandate',
    notes:
      'Migration MANDATE dates (not a CRQC-arrival prediction): support-and-prefer from 2025 (sw/fw signing) and 2026 (networking); exclusive use 2030 (signing, networking) and 2033 (web/cloud, OS). NSM-10 targets all NSS quantum-resistant by 2035. New NSS acquisitions must be CNSA 2.0-compliant from 2027-01-01.',
    url: 'https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF',
    lastReviewed: '2026-07-30',
  },
  {
    source: 'BSI Germany (2024)',
    yearLow: 2030,
    yearHigh: 2040,
    confidence: 'Recommend migration now',
    notes:
      'Recommends hybrid crypto today. Assumes CRQC within planning horizon. TR-02102-1 (2026-01 edition): very-high-protection systems migrate by end of 2030; classical-only key agreement ends 2031.',
    url: 'https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Migration_to_Post_Quantum_Cryptography.pdf?__blob=publicationFile&v=2',
    lastReviewed: '2026-07-30',
  },
  {
    source: 'ANSSI France (2022, upd. 2023)',
    yearLow: 2030,
    yearHigh: 2035,
    confidence: 'Migration milestone, not a CRQC forecast',
    notes:
      'ANSSI gives no CRQC arrival date; 2030/2035 are transition milestones. Hybrid PQC is required only where quantum-resistance is claimed, not mandated for all government systems. ANSSI is targeting 2027 for PQC obligations to begin applying to security qualifications/certifications.',
    url: 'https://messervices.cyber.gouv.fr/guides/en-anssi-views-post-quantum-cryptography-transition',
    lastReviewed: '2026-07-30',
  },
]

/**
 * Single-sourced CRQC consensus derivation \u2014 the ONE place that reduces
 * `CRQC_ESTIMATES` down to headline numbers. Every Threats-page component that
 * shows a Q-Day figure (`SectorExposureHero`, `CrqcCapabilityStrip`,
 * `CrqcTrajectoryChart`, `ThreatEconomicsHeader`) calls this instead of
 * re-deriving its own value, so the four displayed numbers agree by
 * construction. `zEstimate` is the median of each source's midpoint
 * (yearLow+yearHigh)/2; `qdayLow`/`qdayHigh` are the median of the per-source
 * low/high bounds \u2014 a data-derived consensus window, narrower than the full
 * min/max spread but not a single hardcoded guess.
 */
function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export interface CrqcConsensus {
  /** Earliest yearLow across all sources \u2014 the low end of the full spread. */
  earliest: number
  /** Latest yearHigh across all sources \u2014 the high end of the full spread. */
  latest: number
  /** Median of each source's (yearLow+yearHigh)/2 \u2014 the single headline Z-estimate. */
  zEstimate: number
  /** Median of the per-source yearLow values \u2014 a data-derived consensus window floor. */
  qdayLow: number
  /** Median of the per-source yearHigh values \u2014 a data-derived consensus window ceiling. */
  qdayHigh: number
}

export function getCrqcConsensus(): CrqcConsensus {
  const lows = CRQC_ESTIMATES.map((e) => e.yearLow)
  const highs = CRQC_ESTIMATES.map((e) => e.yearHigh)
  const mids = CRQC_ESTIMATES.map((e) => (e.yearLow + e.yearHigh) / 2)
  return {
    earliest: Math.min(...lows),
    latest: Math.max(...highs),
    zEstimate: Math.round(median(mids)),
    qdayLow: Math.round(median(lows)),
    qdayHigh: Math.round(median(highs)),
  }
}

export const NIST_SECURITY_LEVELS = [
  { level: 1, description: 'At least as hard as AES-128 key recovery', aesEquivalent: 128 },
  { level: 2, description: 'At least as hard as SHA-256 collision', aesEquivalent: 128 },
  { level: 3, description: 'At least as hard as AES-192 key recovery', aesEquivalent: 192 },
  { level: 4, description: 'At least as hard as SHA-384 collision', aesEquivalent: 192 },
  { level: 5, description: 'At least as hard as AES-256 key recovery', aesEquivalent: 256 },
]

export interface QuantumComputerRecord {
  name: string
  vendor: string
  year: number
  physicalQubits: number
  estimatedLogicalQubits: number // approximate, based on published experimental results
  qubitType: string
  notes: string
}

export const CURRENT_QUANTUM_COMPUTERS: QuantumComputerRecord[] = [
  {
    name: 'Condor',
    vendor: 'IBM',
    year: 2023,
    physicalQubits: 1121,
    estimatedLogicalQubits: 0,
    qubitType: 'Superconducting',
    notes:
      'Largest superconducting qubit count to date. NISQ era — no fault-tolerant logical qubits demonstrated (corrected 2026-07-16: a prior value of 5 here was unsupported and contradicted this row’s own note).',
  },
  {
    name: 'Heron r2',
    vendor: 'IBM',
    year: 2024,
    physicalQubits: 156,
    estimatedLogicalQubits: 3,
    qubitType: 'Superconducting',
    notes: 'Highest gate fidelity IBM processor; optimized for quality over quantity.',
  },
  {
    name: 'Willow',
    vendor: 'Google',
    year: 2024,
    physicalQubits: 105,
    estimatedLogicalQubits: 1,
    qubitType: 'Superconducting',
    notes:
      'First below-threshold surface code (Nature, Dec 2024): ONE distance-7 logical qubit at 0.143% error/cycle, error suppression Λ=2.14 per +2 distance, 2.4× beyond break-even. Oct 2025 fidelities: 99.97% 1-qubit, 99.88% 2-qubit, 99.5% readout; "Quantum Echoes" verifiable advantage (~13,000× on an OTOC task).',
  },
  {
    name: 'Atom Computing / Microsoft array',
    vendor: 'Microsoft + Atom Computing',
    year: 2024,
    physicalQubits: 1180,
    estimatedLogicalQubits: 24,
    qubitType: 'Neutral atom',
    notes:
      'Nov 2024: created and entangled 24 logical qubits (ran computations on 28) using Microsoft’s error-correction protocols on Atom Computing’s neutral-atom array — the actual 2024 state of the art (a prior trajectory-chart value of ~10 for 2024 undercounted this). Follow-on "Magne" system targets 50 logical qubits from ~1,200 atoms in late 2026.',
  },
  {
    name: 'H2-1',
    vendor: 'Quantinuum',
    year: 2024,
    physicalQubits: 56,
    estimatedLogicalQubits: 10,
    qubitType: 'Trapped ion',
    notes:
      'Best physical/logical ratio of its day (~99.9% two-qubit gate fidelity). Superseded by Helios (2025).',
  },
  {
    name: 'Nighthawk',
    vendor: 'IBM',
    year: 2025,
    physicalQubits: 120,
    estimatedLogicalQubits: 0,
    qubitType: 'Superconducting',
    notes:
      'Nov 2025 flagship NISQ processor: 120 qubits on a square lattice with 218 tunable couplers (4 nearest neighbours). No fault-tolerant logical qubits yet; roadmap targets 1,080 connected qubits via L-couplers by 2028. Launched alongside the experimental Loon chip, which demonstrated the qLDPC (bivariate-bicycle) fault-tolerant components and real-time decoding under 480 ns, anchoring IBM’s path to Starling (200 logical qubits) by 2029.',
  },
  {
    name: 'Helios',
    vendor: 'Quantinuum',
    year: 2025,
    physicalQubits: 98,
    estimatedLogicalQubits: 48,
    qubitType: 'Trapped ion',
    notes:
      'Nov 2025: 98 fully connected ¹³⁷Ba⁺ qubits at ~99.92% two-qubit gate fidelity; produced 48 fully error-corrected logical qubits (2:1 encoding, concatenated Iceberg codes), logical error rates 10–100× below physical. New trapped-ion benchmark.',
  },
  {
    name: 'Neutral-atom FT processor',
    vendor: 'QuEra / Harvard / MIT',
    year: 2025,
    physicalQubits: 448,
    estimatedLogicalQubits: 96,
    qubitType: 'Neutral atom',
    notes:
      'Nov 2025 (Nature): ran algorithms with up to 96 logical qubits on 448 atoms with below-threshold error suppression (Λ=2.14) — the most verified logical qubits of any platform — plus the first logical magic-state distillation. A separate array was run continuously for over 2 hours; Caltech separately demonstrated a 6,100-atom tweezer array (Sep 2025, 99.98% single-qubit accuracy). Demonstrated logical qubits are lower-distance than the ~1,200 fault-tolerant qubits a Shor attack needs.',
  },
  {
    name: 'Helios (Iceberg codes)',
    vendor: 'Quantinuum',
    year: 2026,
    physicalQubits: 98,
    estimatedLogicalQubits: 94,
    qubitType: 'Trapped ion',
    notes:
      'Mar 2026: same Helios hardware ran a separate demonstration using Iceberg error-DETECTION codes (a different, weaker fault-tolerance class than the Nov 2025 48 error-CORRECTED logical qubits above) to reach 94 logical qubits. A Jun 2026 Nature paper independently validated an 800× logical-error-rate improvement on this hardware.',
  },
  {
    name: 'Helium',
    vendor: 'Alice & Bob',
    year: 2026,
    physicalQubits: 18,
    estimatedLogicalQubits: 1,
    qubitType: 'Cat qubit (bosonic)',
    notes:
      'Jun 2026: first cat-qubit system to encode a working logical qubit, using 18 physical cat qubits — a fifth modality (bosonic/cat-code encoding) pursuing intrinsic bit-flip suppression rather than surface-code-style error correction.',
  },
]

export interface CrqcDriver {
  /** Short driver label shown as the row heading. */
  category: string
  /** Plain, jargon-free one-liner shown visibly under each factor. */
  layman: string
  /** One-sentence description of how this driver pulls the timeline in (hover detail). */
  summary: string
  /** Concrete, sourced evidence (figures + who/when) backing the summary. */
  evidence: string
}

/**
 * The forces accelerating progress toward a cryptographically relevant quantum
 * computer (CRQC). The threat moves on TWO axes: hardware scaling *up* (more,
 * better qubits) and the resource target shrinking *down* (fewer qubits needed
 * to run the attack). Crucially, the biggest qubit-count reductions to date came
 * from algorithms and error-correction math — not AI, which so far accelerates
 * the supporting work. Figures are drawn from the 2024–2026 sources tracked in
 * `CRQC_ESTIMATES` / `CURRENT_QUANTUM_COMPUTERS` and the Threats research pack.
 */
export const CRQC_DRIVERS: CrqcDriver[] = [
  {
    category: 'Algorithms',
    layman:
      'Smarter math means a code-breaking quantum computer needs far fewer qubits than we once thought.',
    summary:
      'Smarter factoring and discrete-log algorithms keep cutting the qubits an attack needs.',
    evidence:
      'RSA-2048 physical-qubit cost fell ~20×: ~20M (Gidney+Ekerå 2019) → <1M (Gidney 2025). Logical-qubit counts fell alongside it: RSA-2048 from ~4,098 (2n+2, 2016-era) to 1,730 (Chevignard et al., CRYPTO 2025) to 1,537 (Gidney 2025). For 256-bit ECDLP, 1,200 logical qubits at 90M Toffoli gates (Google Quantum AI + Ethereum Foundation, Mar 2026), or 1,193 at the cost of 2^38.98 Toffolis per run across 22 runs (Chevignard et al., EUROCRYPT 2026) — the space-optimal end of the same trade-off.',
  },
  {
    category: 'Error correction',
    layman:
      'Clever ways to combine many shaky qubits into one dependable “logical” qubit — with much less waste.',
    summary: 'New codes pack more reliable logical qubits into far fewer physical ones.',
    evidence:
      'qLDPC / bivariate-bicycle codes ~10× less overhead (IBM gross code: 12 logical in 288 physical); magic-state cultivation and yoked surface codes; Pinnacle projects RSA-2048 <100k physical qubits (2026).',
  },
  {
    category: 'AI / ML',
    layman:
      'Machine learning helps tune the hardware, catch errors faster, and design better circuits — a helper, not the main driver yet.',
    summary:
      'AI speeds the supporting work — decoding, calibration, circuit design — but is not yet the headline driver.',
    evidence:
      'AlphaQubit neural decoder (Nature 2024); reinforcement-learning control on Willow (3.5× logical stability, 2025); AlphaTensor-Quantum cut T-gate counts 37–47%.',
  },
  {
    category: 'Hardware',
    layman:
      'Bigger chips with more qubits, plus ways to wire many chips together into one larger machine.',
    summary: 'Modular chips and interconnects push qubit counts toward fault-tolerant scale.',
    evidence:
      'IBM Nighthawk + L-couplers (roadmap 1,080 connected qubits 2028; Starling 200 logical qubits 2029); neutral-atom arrays past 3,000 atoms; IonQ roadmap to millions of physical qubits.',
  },
  {
    category: 'Noise reduction',
    layman:
      'Making each qubit quieter and each step more accurate, so small mistakes don’t pile up into failure.',
    summary:
      'Higher gate fidelity and below-threshold operation make every added qubit actually help.',
    evidence:
      'Two-qubit gate fidelity now exceeds 99.9% (Helios 99.92%, IonQ 99.99%); Willow demonstrated below-threshold error correction (Λ=2.14); neutral-atom erasure conversion.',
  },
  {
    category: 'HPC / architecture',
    layman:
      'Several rival qubit technologies are improving at once, now paired with classical supercomputers to run them.',
    summary:
      'Several qubit technologies are maturing in parallel, now tightly coupled to classical AI/HPC.',
    evidence:
      'Superconducting, trapped-ion, neutral-atom and photonic platforms all advancing; NVIDIA NVQLink couples GPUs to QPUs (<4 µs) for real-time decoding; Google now pursuing two modalities.',
  },
]

/**
 * Logical qubits required to break a named target with Shor's algorithm — the
 * current LOWEST credible estimates (the threshold has itself fallen ~20× since
 * 2019 as algorithms improved). These set the y-axis scale for the trajectory
 * chart: the threat arrives when demonstrated logical qubits reach these lines.
 */
export const CRQC_QUBIT_THRESHOLDS = {
  /** secp256k1 / Bitcoin ECC-256 — Google Quantum AI + Ethereum Foundation, 2026 (≤1,200 logical). */
  bitcoinEcc256: 1200,
  /** RSA-2048 — Gidney 2025, arXiv:2505.15917 (1,537 logical qubits incl. idle patches). */
  rsa2048: 1537,
} as const

/**
 * Primary sources for every qubit-count figure in this file.
 *
 * These numbers are the module's most consequential claims and they move often,
 * so each one is pinned to the paper it came from. Two of the four are already
 * library rows (`ref-gidney-factor-rsa`, `Google-QuantumAI-EC-Crypto-Quantum-2026`);
 * the two Chevignard et al. papers are cited here directly because a reader who
 * hits the author name in the UI otherwise has nowhere to go.
 *
 * Note there are TWO distinct Chevignard–Fouque–Schrottenloher papers and they
 * solve different problems — conflating them is what this block exists to prevent.
 * ePrint 2024/222 (published at CRYPTO 2025) is about RSA *factoring*;
 * ePrint 2026/280 (published at EUROCRYPT 2026) is about elliptic-curve
 * *discrete logarithms*. Cite the ePrint number AND the venue: the ePrint year is
 * when the preprint was first posted, the venue year is when it was published, and
 * they differ by a year in both cases.
 */
export const QUBIT_ESTIMATE_SOURCES = {
  /** RSA-2048, current best: 1,409 active / 1,537 incl. idle; <1M noisy physical qubits. */
  gidney2025: 'https://arxiv.org/abs/2505.15917',
  /** RSA-2048 factoring, 1,730 logical qubits at 2^36 Toffoli gates. CRYPTO 2025. */
  cfs2024Factoring: 'https://eprint.iacr.org/2024/222',
  /** 256-bit ECDLP, 1,193 logical qubits (3.12n + o(n)), 2^38.98 Toffolis x22. EUROCRYPT 2026. */
  cfs2026EllipticCurves: 'https://eprint.iacr.org/2026/280',
  /** 256-bit ECDLP: 1,200 logical qubits @ 90M Toffoli, or 1,450 @ 70M. */
  googleQuantumAiEcc2026:
    'https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf',
} as const

export interface CrqcTrajectoryPoint {
  year: number
  /** Best DEMONSTRATED logical qubits that year (real hardware; historical). */
  demonstrated?: number
  /**
   * Forecast band [conservative, aggressive] in logical qubits, spanning published
   * vendor roadmaps (e.g. IBM Starling 200 logical by 2029 at the low end; IonQ's
   * 40k–80k-by-2030 at the high end). A projection of the spread, NOT a prediction.
   */
  forecast?: [number, number]
}

/**
 * Logical-qubit trajectory: 5 years of demonstrated progress + a 10-year forecast
 * band. Demonstrated points track the best per-year result from
 * `CURRENT_QUANTUM_COMPUTERS` (2023 ~5 → 2024 ~24 → 2025 96; 2026 unchanged at 96 as
 * of 2026-07-16, no verified record beyond QuEra's 96 yet). The forecast band is
 * deliberately wide because vendor roadmaps diverge by orders of magnitude. Read
 * against `CRQC_QUBIT_THRESHOLDS`, the chart shows how close Q-Day is: the band
 * crosses the Bitcoin/ECC line around 2028–2032.
 */
export const CRQC_TRAJECTORY: CrqcTrajectoryPoint[] = [
  { year: 2020, demonstrated: 1 },
  { year: 2021, demonstrated: 1 },
  { year: 2022, demonstrated: 2 },
  { year: 2023, demonstrated: 5 },
  { year: 2024, demonstrated: 24 },
  { year: 2025, demonstrated: 96 },
  { year: 2026, demonstrated: 96, forecast: [96, 96] },
  { year: 2027, forecast: [130, 800] },
  { year: 2028, forecast: [170, 4000] },
  { year: 2029, forecast: [220, 20000] },
  { year: 2030, forecast: [400, 80000] },
  { year: 2031, forecast: [800, 120000] },
  { year: 2032, forecast: [1600, 180000] },
  { year: 2033, forecast: [3200, 240000] },
  { year: 2034, forecast: [6000, 300000] },
  { year: 2035, forecast: [12000, 360000] },
]

export interface CrqcDriverMilestone {
  /** Driver axis this milestone belongs to (one row per axis in the timeline). */
  axis: string
  year: number
  /** Short, cited description of the advance. */
  label: string
  /** Very short chip label (year is shown separately). */
  short: string
  /** True for roadmap/projected milestones (rendered hollow/dashed). */
  forecast?: boolean
}

/**
 * Dated milestones per contributing factor, sharing the trajectory chart's
 * 2020–2035 x-axis. Each shows WHICH axis delivered a step-change toward more
 * capable quantum computers and WHEN — so the logical-qubit curve can be read
 * against the forces driving it. Past milestones are demonstrated/published;
 * `forecast: true` marks vendor-roadmap targets.
 */
export const CRQC_DRIVER_MILESTONES: CrqcDriverMilestone[] = [
  {
    axis: 'Hardware',
    year: 2023,
    short: 'IBM Condor 1,121q',
    label: 'IBM Condor — 1,121 physical qubits',
  },
  {
    axis: 'Hardware',
    year: 2025,
    short: 'Nighthawk + Helios',
    label: 'IBM Nighthawk (120q) + Loon; Quantinuum Helios (98q, 48 logical)',
  },
  {
    axis: 'Hardware',
    year: 2029,
    short: 'IBM Starling 200 LQ',
    label: 'IBM Starling — 200 logical qubits',
    forecast: true,
  },
  {
    axis: 'Algorithms',
    year: 2024,
    short: 'CFS 1,730 LQ',
    label: 'Chevignard–Fouque–Schrottenloher (CRYPTO 2025) — 1,730 logical for RSA-2048',
  },
  {
    axis: 'Algorithms',
    year: 2025,
    short: 'Gidney 1,537 LQ',
    label: 'Gidney — RSA-2048 in 1,537 logical / <1M physical qubits (~20× cut)',
  },
  {
    axis: 'Algorithms',
    year: 2026,
    short: 'ECC 1,193-1,200 LQ',
    label:
      'Google Quantum AI + Ethereum Foundation (1,200 LQ) and CFS at EUROCRYPT 2026 (1,193) — 256-bit ECDLP',
  },
  {
    axis: 'Error correction',
    year: 2024,
    short: 'qLDPC gross code ~10×',
    label: 'IBM qLDPC gross code — ~10× less overhead',
  },
  {
    axis: 'Error correction',
    year: 2025,
    short: 'logical magic-state distillation',
    label: 'QuEra — first logical magic-state distillation',
  },
  {
    axis: 'Noise reduction',
    year: 2024,
    short: 'Willow below-threshold',
    label: 'Google Willow — below-threshold QEC (Λ=2.14)',
  },
  {
    axis: 'Noise reduction',
    year: 2025,
    short: '2-qubit fidelity >99.9%',
    label: 'Two-qubit fidelity >99.9% (Helios 99.92%, IonQ 99.99%)',
  },
  {
    axis: 'AI / ML',
    year: 2024,
    short: 'AlphaQubit decoder',
    label: 'AlphaQubit neural decoder (Nature)',
  },
  {
    axis: 'AI / ML',
    year: 2025,
    short: 'RL control; AlphaTensor-Q',
    label: 'RL control on Willow (3.5×); AlphaTensor-Quantum (−37–47% T-gates)',
  },
  {
    axis: 'HPC / architecture',
    year: 2025,
    short: 'NVIDIA NVQLink',
    label: 'NVIDIA NVQLink — GPU↔QPU real-time decoding (<4 µs)',
  },
  {
    axis: 'HPC / architecture',
    year: 2026,
    short: 'Google 2nd modality; HPC co-location',
    label: 'Google adds neutral-atom modality; quantum-HPC-AI co-location',
  },
]

export interface CrqcModalityTrack {
  /** Qubit technology / modality. */
  technology: string
  /** Main vendor examples pursuing this technology. */
  vendors: string
  /** Best demonstrated logical qubits to date (0 = none demonstrated yet / NISQ). */
  bestLogical: number
  /** Largest physical-qubit count demonstrated on this modality. */
  bestPhysical: number
  /** Tooltip-ready explanation of the approach and its trade-offs. */
  note: string
  /** Plain-English, one-line recent advance on this technology. */
  recentProgress: string
  /** Plain-English, one-line difficulty this approach must overcome to scale. */
  scaleChallenge: string
}

/**
 * The competing quantum-technology tracks toward a CRQC, with their main vendor
 * examples and current best demonstrated figures. Different modalities scale
 * differently — neutral atoms and trapped ions lead on demonstrated logical
 * qubits, superconducting on physical-qubit count and gate speed, photonics on
 * manufacturability. Figures reflect the 2024–2026 state of the art.
 */
export const CRQC_MODALITY_TRACKS: CrqcModalityTrack[] = [
  {
    technology: 'Neutral atom',
    vendors: 'QuEra, Atom Computing, Pasqal',
    bestLogical: 96,
    bestPhysical: 6100,
    note: 'Optical-tweezer arrays with reconfigurable any-to-any connectivity; most demonstrated logical qubits to date, and Caltech has run an array past 6,100 atoms (Sep 2025); atoms operate near room temperature. Slower gate clock than superconducting. QuEra’s Jun 2026 "gigaquop" roadmap targets over 1,000 logical qubits.',
    recentProgress:
      'Just ran the most error-corrected qubits of any machine yet (96 “logical” qubits) and separately packed over 6,000 atoms into one array — not yet the same machine, but both records on the same technology.',
    scaleChallenge:
      'Operations are slow and atoms keep drifting out of their laser traps — both have to improve a lot to reach the millions of qubits an attack needs.',
  },
  {
    technology: 'Trapped ion',
    vendors: 'Quantinuum, IonQ',
    bestLogical: 48,
    bestPhysical: 98,
    note: 'Highest gate fidelities (>99.9%) and all-to-all connectivity via ion shuttling (QCCD). Fewer physical qubits and slower clock speeds, but very clean operations — Quantinuum Helios reached 48 error-corrected logical qubits (Nov 2025), then 94 error-detected logical qubits using Iceberg codes (Mar 2026) — a different, weaker fault-tolerance class, not a straight replacement of the 48 figure. A Jun 2026 Nature paper independently validated an 800x logical-error-rate improvement on the same hardware.',
    recentProgress:
      'Quantinuum’s new Helios machine hit record accuracy and turned its 98 atoms into 48 dependable “logical” qubits, then months later ran a separate 94-qubit error-detected demonstration.',
    scaleChallenge:
      'Growing far beyond ~100 ions — and speeding each step up — is the open problem; today’s machines are small and slow.',
  },
  {
    technology: 'Superconducting',
    vendors: 'IBM, Google',
    bestLogical: 1,
    bestPhysical: 1121,
    note: 'Fastest gates and the largest physical-qubit chips (IBM Condor, 1,121 physical qubits — but Condor demonstrated zero logical qubits); Google Willow showed the first below-threshold error correction, a single distance-7 logical qubit; IBM’s modular + qLDPC roadmap targets 200 logical qubits (Starling) by 2029, with 1,080 connected qubits via l-couplers planned for 2027. Requires deep cryogenics.',
    recentProgress:
      'Google proved that making the chip bigger actually lowers errors; IBM shipped new 120-qubit processors and a test chip with the parts for error correction.',
    scaleChallenge:
      'Every qubit needs deep refrigeration and heavy wiring; the hard part is linking many chips into one big machine without adding errors.',
  },
  {
    technology: 'Photonic',
    vendors: 'PsiQuantum, Xanadu',
    bestLogical: 12,
    bestPhysical: 12,
    note: 'Room-temperature operation and chips manufacturable in a standard fab (PsiQuantum at GlobalFoundries); fusion-based measurement architecture. Xanadu’s Aurora (Jan 2025) demonstrated 12 real-time error-corrected GKP logical qubits on a 12-qubit modular/networkable chip (roadmap: up to 500 logical qubits by 2029-30) — PsiQuantum specifically has not yet shown a working logical qubit on its own architecture.',
    recentProgress:
      'Xanadu ran 12 error-corrected “logical” qubits on a small modular chip designed to be networked into bigger machines; PsiQuantum, on a different architecture, is still making its light-based chips in an ordinary semiconductor factory, betting on mass production.',
    scaleChallenge:
      'Particles of light are easily lost; Xanadu has to scale its module count by orders of magnitude, and PsiQuantum still has to show its first working error-corrected qubit at all.',
  },
  {
    technology: 'Topological',
    vendors: 'Microsoft, Alice & Bob',
    bestLogical: 0,
    bestPhysical: 8,
    note: 'Majorana-based qubits are designed to be intrinsically error-resistant, needing far fewer physical qubits per logical qubit than other modalities if the physics holds up. Microsoft’s Majorana 2 (Build, Jun 2026) claims an accelerated path to fault tolerance by 2029 — a contested claim following a disputed 2025 topological-qubit announcement from the same team; treat the 2029 date skeptically pending independent replication. Alice & Bob’s Helium (Jun 2026) took a different cat-qubit approach to the same error-resistance goal, encoding one logical qubit across 18 cat qubits.',
    recentProgress:
      'Microsoft says its second-generation Majorana chip is progressing toward fault tolerance faster than expected; a French startup, Alice & Bob, separately built a small working logical qubit from a different “naturally error-resistant” qubit design.',
    scaleChallenge:
      'The core physics claim (that Majorana quasiparticles behave as predicted) is still disputed by parts of the research community — this modality has to first settle that debate before its qubit-efficiency advantage can be trusted at scale.',
  },
]
