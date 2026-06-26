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
    estimatedQubits: 4098,
    status: 'broken',
    notes: "Shor's algorithm factors N in polynomial time. ~4,098 logical qubits needed.",
  },
  {
    name: 'RSA-3072',
    type: 'classical',
    category: 'asymmetric',
    classicalBits: 128,
    quantumBits: 0,
    quantumAttack: 'shor',
    estimatedQubits: 6146,
    status: 'broken',
    notes: "Larger key does not help — Shor's scales polynomially with key size.",
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
    notes: 'Even 4096-bit RSA provides zero post-quantum security.',
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
    confidence: 'Architecture-dependent',
    notes:
      'Mar 2026: secp256k1 ECDLP breakable with \u22641,200 logical qubits. Introduces fast-clock (superconducting/photonic) vs slow-clock (trapped ion/neutral atom) CRQC distinction. Fast-clock CRQCs enable on-spend attacks on public mempools; slow-clock enable at-rest attacks on dormant wallets. 2.3M BTC identified as at-risk.',
  },
  {
    source: 'Global Risk Institute (2025)',
    yearLow: 2030,
    yearHigh: 2041,
    confidence: '28-49% by 2036, 51-70% by 2041',
    notes:
      '26-expert survey (March 2026). Significant acceleration: 28-49% probability within 10 years (up from 19-34% in 2024). Majority consider CRQC by 2035 quite likely.',
  },
  {
    source: 'NIST IR 8547 (2025)',
    yearLow: 2030,
    yearHigh: 2035,
    confidence: 'Planning horizon',
    notes:
      'Deprecate RSA/ECC by 2030, disallow by 2035. Assumes CRQC is imminent enough to act now.',
  },
  {
    source: 'NSA CNSA 2.0 (2022)',
    yearLow: 2030,
    yearHigh: 2033,
    confidence: 'Mandate',
    notes:
      'Migration MANDATE dates (not a CRQC-arrival prediction): software/firmware PQC by 2025, networking by 2026, all NSS by 2033 — implying a CRQC-relevant horizon of ~2030–2033.',
  },
  {
    source: 'BSI Germany (2024)',
    yearLow: 2030,
    yearHigh: 2040,
    confidence: 'Recommend migration now',
    notes: 'Recommends hybrid crypto today. Assumes CRQC within planning horizon.',
  },
  {
    source: 'ANSSI France (2022, upd. 2023)',
    yearLow: 2030,
    yearHigh: 2035,
    confidence: 'Migration milestone, not a CRQC forecast',
    notes:
      'ANSSI gives no CRQC arrival date; 2030/2035 are transition milestones. Hybrid PQC is required only where quantum-resistance is claimed, not mandated for all government systems.',
  },
]

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
    estimatedLogicalQubits: 5,
    qubitType: 'Superconducting',
    notes:
      'Largest superconducting qubit count to date. NISQ era — no fault-tolerant logical qubits.',
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
    estimatedLogicalQubits: 2,
    qubitType: 'Superconducting',
    notes:
      'First below-threshold surface code (Nature, Dec 2024): distance-7 logical qubit at 0.143% error/cycle, error suppression Λ=2.14 per +2 distance, 2.4× beyond break-even. Oct 2025 fidelities: 99.97% 1-qubit, 99.88% 2-qubit, 99.5% readout; "Quantum Echoes" verifiable advantage (~13,000× on an OTOC task).',
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
      'Nov 2025 (Nature): ran algorithms with up to 96 logical qubits on 448 atoms with below-threshold error suppression (Λ=2.14) — the most verified logical qubits of any platform — plus the first logical magic-state distillation. A separate 3,000-atom array was run continuously for over 2 hours. Demonstrated logical qubits are lower-distance than the ~1,200 fault-tolerant qubits a Shor attack needs.',
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
      'RSA-2048 estimate fell ~20×: ~20M physical qubits (2019) → <1M (Gidney 2025). ECC P-256 logical qubits cut ~44% (EUROCRYPT 2026); Chevignard–Fouque–Schrottenloher ~1,730 logical.',
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
  /** RSA-2048 — Chevignard–Fouque–Schrottenloher, 2024 (~1,730 logical-qubit count). */
  rsa2048: 1700,
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
 * `CURRENT_QUANTUM_COMPUTERS` (2023 ~5 → 2024 ~10 → 2025 96). The forecast band is
 * deliberately wide because vendor roadmaps diverge by orders of magnitude. Read
 * against `CRQC_QUBIT_THRESHOLDS`, the chart shows how close Q-Day is: the band
 * crosses the Bitcoin/ECC line around 2028–2032.
 */
export const CRQC_TRAJECTORY: CrqcTrajectoryPoint[] = [
  { year: 2020, demonstrated: 1 },
  { year: 2021, demonstrated: 1 },
  { year: 2022, demonstrated: 2 },
  { year: 2023, demonstrated: 5 },
  { year: 2024, demonstrated: 10 },
  { year: 2025, demonstrated: 96 },
  { year: 2026, demonstrated: 100, forecast: [100, 100] },
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
    short: 'CFS ~1,730 LQ',
    label: 'Chevignard–Fouque–Schrottenloher — ~1,730 logical for RSA-2048',
  },
  {
    axis: 'Algorithms',
    year: 2025,
    short: 'Gidney <1M qubits',
    label: 'Gidney — RSA-2048 in <1M physical qubits (~20× cut)',
  },
  {
    axis: 'Algorithms',
    year: 2026,
    short: 'EUROCRYPT P-256 −44%',
    label: 'EUROCRYPT — ECC P-256 logical qubits −44%',
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
    bestPhysical: 3000,
    note: 'Optical-tweezer arrays with reconfigurable any-to-any connectivity; most demonstrated logical qubits to date and arrays past 3,000 atoms; atoms operate near room temperature. Slower gate clock than superconducting.',
    recentProgress:
      'Just ran the most error-corrected qubits of any machine yet (96 “logical” qubits) and kept a 3,000-atom system running for hours instead of seconds.',
    scaleChallenge:
      'Operations are slow and atoms keep drifting out of their laser traps — both have to improve a lot to reach the millions of qubits an attack needs.',
  },
  {
    technology: 'Trapped ion',
    vendors: 'Quantinuum, IonQ',
    bestLogical: 48,
    bestPhysical: 98,
    note: 'Highest gate fidelities (>99.9%) and all-to-all connectivity via ion shuttling (QCCD). Fewer physical qubits and slower clock speeds, but very clean operations — Quantinuum Helios reached 48 logical qubits.',
    recentProgress:
      'Quantinuum’s new Helios machine hit record accuracy and turned its 98 atoms into 48 dependable “logical” qubits.',
    scaleChallenge:
      'Growing far beyond ~100 ions — and speeding each step up — is the open problem; today’s machines are small and slow.',
  },
  {
    technology: 'Superconducting',
    vendors: 'IBM, Google',
    bestLogical: 5,
    bestPhysical: 1121,
    note: 'Fastest gates and the largest physical-qubit chips; Google Willow showed the first below-threshold error correction; IBM’s modular + qLDPC roadmap targets 200 logical qubits (Starling) by 2029. Requires deep cryogenics.',
    recentProgress:
      'Google proved that making the chip bigger actually lowers errors; IBM shipped new 120-qubit processors and a test chip with the parts for error correction.',
    scaleChallenge:
      'Every qubit needs deep refrigeration and heavy wiring; the hard part is linking many chips into one big machine without adding errors.',
  },
  {
    technology: 'Photonic',
    vendors: 'PsiQuantum, Xanadu',
    bestLogical: 0,
    bestPhysical: 0,
    note: 'Room-temperature operation and chips manufacturable in a standard fab (PsiQuantum at GlobalFoundries); fusion-based measurement architecture. Furthest from a demonstrated logical qubit, but a strong manufacturability story.',
    recentProgress:
      'PsiQuantum started making its light-based chips in an ordinary semiconductor factory, betting on mass production.',
    scaleChallenge:
      'Particles of light are easily lost, and they still have to show even one working error-corrected qubit.',
  },
]
