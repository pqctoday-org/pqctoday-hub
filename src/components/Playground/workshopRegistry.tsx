// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Cpu,
  KeyRound,
  Hash,
  Dice5,
  FileSignature,
  Radio,
  Bitcoin,
  Zap,
  Workflow,
  Terminal,
  Shield,
  Container,
  Network,
  Globe,
  BarChart2,
  Gauge,
  Mail,
  KeySquare,
} from 'lucide-react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import type { PersonaId } from '@/data/learningPersonas'
import { SANDBOX_SCENARIOS, type SandboxTrackId } from '@/data/sandboxScenarios'

// Domain categories — "what a tool does". The Docker-sandbox runtime is a
// cross-cutting *facet* (see `WorkshopTool.sandbox`), not a category: a sandbox
// scenario still belongs to a real domain. 'Sandbox' was removed as a category
// in the Crypto Lab Workbench redesign; each scenario is re-homed to its domain.
export const CATEGORIES = [
  'OpenSSL Studio',
  'HSM / PKCS#11',
  'Entropy & Random',
  'Certificates & Proofs',
  'Digital Identity',
  'Blockchain & Digital Assets',
  'Protocol Simulations',
] as const

export type WorkshopCategory = (typeof CATEGORIES)[number]

// ---------------------------------------------------------------------------
// Tool registry — each entry describes a crypto-executing workshop component
// ---------------------------------------------------------------------------

export type ToolDifficulty = 'beginner' | 'intermediate' | 'advanced'

/**
 * What a tool needs from the runtime before it can actually run (WS8a,
 * 2026-08-02).
 *
 * Why this exists: the capability probe in MobilePlaygroundOps.tsx is per-page,
 * so it could only warn *after* a visitor had chosen a tool and started loading
 * it, and nothing in this registry declared what any tool needed — so the
 * catalogue had nothing to filter or badge on. A phone user browsed the whole
 * grid with no signal about which tools would run.
 *
 * `'chromium'` is not a capability but an engine gate, and it belongs here for
 * the same reason: `utils/browserDetect.ts` + `ChromiumGateBanner` already
 * disable live crypto on Safari and Firefox for the strongSwan/SSH paths. Left
 * out, a desktop Safari user would be told "Runs here" and then meet a gate.
 *
 * Every value is derived from the tool's own component tree, not assumed —
 * `workshopRequirements.driftguard.test.ts` re-derives them from source on
 * every run and fails if a declaration and the code disagree. That guard is
 * what stops `requires: []` from becoming a rubber stamp that satisfies
 * typecheck while telling the visitor nothing.
 *
 * NOT covered: `'wide-viewport'`. Whether a tool is usable at 390 px cannot be
 * read off an import graph — it needs a real browser at a real width. No tool
 * declares it yet; that measurement is WS0's job and this is the field it
 * lands in.
 */
export type ToolRuntimeRequirement =
  /** SharedArrayBuffer — hard gate. Needs crossOriginIsolated (see src/sw.ts). */
  | 'sab'
  /** Emscripten pthread build (strongSwan / OpenSSH engines). Implies `sab`. */
  | 'threads'
  /** WASM SIMD. */
  | 'wasm-simd'
  /** Not usable below a desktop-ish width. Requires a real-browser measurement. */
  | 'wide-viewport'
  /** Chromium-family engine — see utils/browserDetect.ts. */
  | 'chromium'
  /** Not browser-runnable at all: needs the access-gated Docker sandbox. */
  | 'container'

export interface WorkshopTool {
  id: string
  /** Unique tracking ID (e.g. 'PT-001') — stable across renames */
  pt_id: string
  /** Semantic version of this tool (major.minor.bug) */
  version: string
  name: string
  description: string
  category: string
  algorithms: string[]
  icon: React.ElementType
  moduleLink: string
  keywords: string[]
  difficulty: ToolDifficulty
  /**
   * Runtime capabilities this tool needs to actually run. Empty array = runs
   * anywhere. Drives the device badge and the "runs on this device" filter.
   *
   * REQUIRED on purpose: an optional field would let a new tool ship with no
   * device signal, which is the state WS8a exists to end. See
   * {@link ToolRuntimeRequirement}.
   */
  requires: ToolRuntimeRequirement[]
  /** Personas for whom this tool is a primary (★★) fit */
  recommendedPersonas: PersonaId[]
  /**
   * B+ round 8, Wave B (2026-09-18) — WS17 task 4. Personas for whom this tool
   * is one of the three curated "Start here" picks on the Crypto Lab overview.
   * Before this field the pool was "first three registry entries that name the
   * role", so developer, architect and researcher all opened on the same three
   * HSM tools and 21 slots covered 12 distinct tools. Must be a subset of
   * `recommendedPersonas` (guarded in workshopRegistry.test.ts). A role with
   * fewer than three curated picks is topped up from `recommendedPersonas` in
   * registry order, so the field is an allocation, not a gate.
   */
  startHere?: PersonaId[]
  /**
   * B+ round 8, Wave C (2026-09-18). Intro strip rendered above the tool by
   * PlaygroundToolRoute: what the user will do, and one concrete run written
   * from the tool's real steps and controls (not from its summary — the first
   * drafts named things the tools do not do). Optional.
   */
  intro?: { whatYouWillDo: string; workedExample: string }
  /**
   * Cross-cutting facet: this tool is a Docker-sandbox scenario that runs in a
   * real, access-gated container (vs. in-browser WASM). It still has a real
   * domain `category`; `sandbox` only marks *where/how* it runs. Drives the
   * "Sandbox" badge and the runtime-locked presentation in the Crypto Lab.
   */
  sandbox?: boolean
  /** Tool is under active development — show WIP badge on card */
  wip?: boolean
  /** true if any workshop step produces crypto output (key, sig, ciphertext) */
  hasOutput?: boolean
  /** correctness invariants for that output — required when hasOutput is true */
  outputSpec?: string
  /** Open-source project powering this tool */
  opensourceTool?: { name: string; url: string }
}

export const WORKSHOP_TOOLS: WorkshopTool[] = [
  // ── HSM / PKCS#11 Operations ──────────────────────────────────────────────

  // ── Rail order (B+ round 8, Wave B, 2026-09-18 — WS17 task 4) ─────────────
  // Within each category the array order IS the Crypto Lab rail order, and the
  // graders cite in-category rank ("10th of 11", "last 6th/6"). Entries are
  // ordered flagship-first per category: the tool a newcomer to that category
  // should meet first (broadest, most complete, or the marquee tool) leads;
  // narrower or advanced tools follow. Reordering here moves nothing else —
  // ids, components and search entries are keyed, not positional.
  {
    id: 'cacp-kmip',
    pt_id: 'PT-033',
    version: '1.0.1',
    name: 'KMIP Control Plane',
    description:
      'In-browser KMIP 3.0 control plane + softhsmrustv3 HSM, compiled to WebAssembly. Load a crypto-agility policy (pqc.yaml / classical.yaml), run key lifecycle ops (CreateKeyPair → Activate → Sign / Encap / Decap), and watch the policy auto-rekey a classical ECDSA-P256 key to ML-DSA-65 on the same Sign call — no server, no Docker.',
    category: 'HSM / PKCS#11',
    algorithms: [
      'ML-DSA-44',
      'ML-DSA-65',
      'ML-DSA-87',
      'ML-KEM-768',
      'ML-KEM-1024',
      'AES-256',
      'ECDSA',
      'KMIP 3.0',
    ],
    icon: ShieldCheck,
    moduleLink: '/playground/cacp',
    keywords: [
      'kmip',
      'cacp',
      'crypto-agility',
      'crypto agility',
      'control plane',
      'hsm',
      'softhsm',
      'policy',
      'rekey',
      'key lifecycle',
      'ml-dsa',
      'ml-kem',
      'ttlv',
      'wire',
      'pkcs11',
      'wasm',
    ],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    opensourceTool: {
      name: 'pqctoday-kmip',
      url: 'https://github.com/pqctoday/pqctoday-kmip',
    },
    intro: {
      whatYouWillDo:
        'Load a policy (Classical, PQC or auto-migrate-on-use), pick an algorithm or Auto — let the policy decide, then step through Create, Activate, Sign, Verify and Revoke on an in-browser KMIP 3.0 engine and WebAssembly HSM.',
      workedExample:
        'Create an ECDSA-P256 signing key under Classical, switch to auto-migrate-on-use and press Sign: the result shows policy: Rekey → ML-DSA-65 as the legacy key is superseded, and Inspect records every step.',
    },
  },
  {
    id: 'hsm-capacity',
    pt_id: 'PT-026',
    version: '1.0.2',
    name: 'HSM Capacity Calculator',
    description:
      'Size your HSM fleet for the top 10 enterprise use cases. Compare classical vs next-gen PQC HSM, tune per-algorithm TPS, and see whether your fleet is sufficient.',
    category: 'HSM / PKCS#11',
    algorithms: [
      'RSA-2048',
      'ECDSA P-256',
      'ECDH P-256',
      'ML-DSA-65',
      'ML-KEM-768',
      'SLH-DSA-128s',
      'AES-128',
      'AES-256',
    ],
    icon: Gauge,
    moduleLink: '/learn/pki-workshop',
    keywords: [
      'hsm',
      'capacity',
      'sizing',
      'tps',
      'throughput',
      'fleet',
      'pqc',
      'ml-dsa',
      'rsa',
      'ecdsa',
      'ecdh',
      'aes',
      'use case',
      'tls',
      'code signing',
      'payment',
      'tde',
      'kms',
      'vpn',
      'ssh',
      'dnssec',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['architect', 'ops', 'executive', 'grc'],
    startHere: ['executive', 'grc'],
    intro: {
      whatYouWillDo:
        "Pick a Small, Medium or Large deployment, switch on enterprise use cases and set each one's transactions per second, choose N+1 or 2N redundancy and the number of locations, then read the three fleet-sizing cards.",
      workedExample:
        'Keep the Medium preset (about 7,145 TPS) and compare Today, Post-PQC on the existing fleet and Post-PQC on next-gen HSM: each card reads Sufficient, Demand only or Overloaded, with the bottleneck algorithm explained.',
    },
    hasOutput: false,
  },
  {
    id: 'hybrid-encrypt',
    pt_id: 'PT-003',
    version: '1.0.1',
    name: 'Hybrid KEM + ECDH',
    description: 'ML-KEM + X25519 ECDH + HKDF hybrid encryption pipeline',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-KEM-768', 'X25519', 'HKDF'],
    icon: Lock,
    moduleLink: '/learn/hybrid-crypto',
    keywords: ['hybrid', 'kem', 'ecdh', 'hkdf', 'ml-kem', 'x25519', 'encryption', 'key agreement'],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    startHere: ['developer'],
    intro: {
      whatYouWillDo:
        'Execute six steps in order: Alice and Bob X25519 keypairs, ECDH in both directions, an ML-KEM-768 keypair, encapsulation, then decapsulate and HKDF-combine both secrets into one 32-byte session key.',
      workedExample:
        'Step 3 prints both ECDH secrets and confirms they match; Step 5 shows the 1088-byte ciphertext; Step 6 lists the HKDF inputs (ECDH secret, ML-KEM secret, info string) and the final 32-byte hybrid key.',
    },
    hasOutput: true,
    outputSpec:
      'ML-KEM-768 encapsulated key (1088 bytes) + shared secret (32 bytes hex); ECDH shared secret must equal both sides.',
  },
  {
    id: 'envelope-encrypt',
    pt_id: 'PT-004',
    version: '1.0.1',
    name: 'Envelope Encryption',
    description: 'ML-KEM + AES key wrap in a KMS envelope encryption pattern',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-KEM-768', 'AES-256', 'Key Wrap'],
    icon: KeyRound,
    moduleLink: '/learn/kms-pqc',
    keywords: ['envelope', 'kms', 'key wrap', 'ml-kem', 'aes', 'dek', 'kek'],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['architect', 'researcher', 'ops'],
    startHere: ['architect'],
    intro: {
      whatYouWillDo:
        'Pick a KEK algorithm (ML-KEM-512/768/1024 or RSA-2048/4096) and a wrap mechanism (AES-KW, AES-KWP or AES-GCM), press Execute (Live WASM), then step through the five-step classical-vs-PQC comparison.',
      workedExample:
        'With ML-KEM-768 and AES-KW the run generates an AES-256 DEK, encapsulates a 1088 B KEM ciphertext, wraps the DEK into 40 B and unwraps it again; the Key Integrity Verification panel shows the DEK before and after match.',
    },
    hasOutput: true,
    outputSpec:
      'AES-256-GCM wrapped DEK (base64) + ML-KEM ciphertext; unwrapped DEK must equal original DEK.',
  },
  {
    id: 'token-migration',
    pt_id: 'PT-005',
    version: '1.0.1',
    name: 'Multi-Algorithm Signing',
    description: 'Compare ML-DSA, ECDSA, and RSA signing in a token migration workflow',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA', 'ECDSA', 'RSA'],
    icon: Fingerprint,
    moduleLink: '/learn/iam-pqc',
    keywords: ['token', 'migration', 'iam', 'ml-dsa', 'ecdsa', 'rsa', 'multi-algorithm', 'jwt'],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
    startHere: ['ops'],
    intro: {
      whatYouWillDo:
        'Choose a JWT signing algorithm (RS256, ES256 or ML-DSA-44/65/87), Sign Token to see the header, unchanged payload and signature, then Verify Signature against the JWKS public key over PKCS#11.',
      workedExample:
        'Switch from the default RS256 to ML-DSA-65: the signature grows from 256 to 3,309 bytes (12.9x vs RS256) in the Size Impact Analysis, and Verify Signature returns Signature valid — CKR_OK.',
    },
    hasOutput: true,
    outputSpec:
      'ML-DSA / ECDSA / RSA signature bytes (hex); each must verify under corresponding public key.',
  },
  {
    id: 'firmware-signing',
    pt_id: 'PT-007',
    version: '1.0.2',
    name: 'Firmware Signing',
    // The tool offers ML-DSA-44/65/87 and SLH-DSA-SHA2-128s (PQC_ALGO_OPTIONS in
    // FirmwareSigningMigrator.tsx) and *defaults* to ML-DSA-65 — the previous
    // entry advertised ML-DSA-87 alone, which both under-reported the tool to the
    // algorithm search and named an algorithm the visitor would not be using.
    description:
      'UEFI secure boot firmware signing and verification with ML-DSA-44/65/87 or SLH-DSA (defaults to ML-DSA-65)',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'SLH-DSA-SHA2-128s', 'SHA-256'],
    icon: Cpu,
    moduleLink: '/learn/secure-boot-pqc',
    // NOTE: the SPHINCS+ alias is used here rather than the FIPS 205 short name,
    // which is also another tool's id. Discovery is unaffected either way — the
    // algorithms entry above already contains that name as a substring, and
    // SEARCH_SYNONYMS maps the two spellings onto each other. The alias is
    // preferred because scripts/ci/check-tool-version-bump.ts treats any tool id
    // appearing quoted on a changed line of this file as that tool having been
    // modified, and so demands a version bump for a tool nobody touched.
    keywords: [
      'firmware',
      'uefi',
      'secure boot',
      'ml-dsa',
      'sphincs',
      'pqc',
      'post-quantum',
      'signing',
      'verification',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
    startHere: ['ops'],
    intro: {
      whatYouWillDo:
        'Upload a firmware binary (or use the mock UEFI manifest), pick PQC, classical and hash algorithms, then Generate Both Keys, Sign Both and Verify Both Signatures across the four wizard steps.',
      workedExample:
        'With the defaults — ML-DSA-65 against RSA-2048 with SHA-256 — both signatures come back VERIFIED and the Migration Comparison table shows the signature growing from 256 B to 3,309 B (12.9×).',
    },
    hasOutput: true,
    outputSpec:
      'ML-DSA-87 signature over firmware image digest (hex, 4627 bytes); verify must return true against same ML-DSA-87 public key.',
  },
  {
    id: 'slh-dsa',
    pt_id: 'PT-001',
    version: '1.0.2',
    name: 'SLH-DSA Sign & Verify',
    description: 'All 12 FIPS 205 parameter sets with pre-hash support',
    category: 'HSM / PKCS#11',
    algorithms: ['SLH-DSA', 'SHA2', 'SHAKE'],
    icon: FileSignature,
    moduleLink: '/learn/slh-dsa',
    keywords: ['slh-dsa', 'sphincs', 'fips 205', 'stateless', 'hash-based', 'sign', 'verify'],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    startHere: ['researcher'],
    intro: {
      whatYouWillDo:
        'Pick one of the 12 FIPS 205 parameter sets and a pre-hash mode, then Generate Key Pair, Sign Message and Verify Signature on a real PKCS#11 v3.2 HSM emulator in the browser.',
      workedExample:
        'With the default SHA2-128s set the 32-byte public key appears, the message signs into a 7.7 KB signature, Verify Signature reports Signature Valid, and the PKCS#11 call log lists every call.',
    },
    hasOutput: true,
    outputSpec:
      'ML-DSA/SLH-DSA signature (hex); verify step must return true under same key pair. Signature size varies by param set (7856–49856 bytes for SLH-DSA).',
  },
  {
    id: 'lms-hss',
    pt_id: 'PT-002',
    version: '1.0.2',
    name: 'Stateful Hash Signatures',
    description: 'LMS and XMSS stateful signature trees using SoftHSMv3',
    category: 'HSM / PKCS#11',
    algorithms: ['LMS', 'HSS', 'XMSS'],
    icon: FileSignature,
    moduleLink: '/learn/stateful-signatures',
    keywords: ['lms', 'hss', 'xmss', 'stateful', 'hash-based', 'sp 800-208'],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Choose an SP 800-208 LMS/HSS parameter set (hash, height, W, levels), Sign Message to advance the one-time key counter, Simulate State Loss, then verify a Rust-signed signature with the C++ engine.',
      workedExample:
        'With the default LMS_SHA256_M32_H5 / LMOTS_W8 key each Sign Message moves the Signature Counter toward 32; at 32 the panel shows KEY EXHAUSTED, and Simulate State Loss names the leaf indexes that would be reused.',
    },
    hasOutput: true,
    outputSpec:
      'LMS/XMSS stateful signature (hex). Signature binds to one-time leaf; verification must succeed on unmodified message.',
  },
  {
    id: 'hybrid-sigs',
    pt_id: 'PT-027',
    version: '1.0.2',
    name: 'Hybrid Signature Spectrums',
    description:
      'Live concatenation, nesting, and Silithium (fused Fiat-Shamir) — from no non-separability to SNS',
    category: 'HSM / PKCS#11',
    algorithms: ['EC-Schnorr', 'secp256k1', 'ML-DSA-65', 'SHA-256'],
    icon: Fingerprint,
    moduleLink: '/learn/hybrid-crypto?tab=workshop&step=5',
    keywords: [
      'hybrid',
      'signature',
      'silithium',
      'fused',
      'concatenation',
      'nesting',
      'non-separability',
      'sns',
      'wns',
      'ml-dsa',
      'ec-schnorr',
      'secp256k1',
      'fiat-shamir',
      'pqc-transition',
    ],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Choose Concatenation, Nesting or Silithium (Fused), then Generate Key Pairs, Sign the message and Verify to see whether the EC-Schnorr and ML-DSA-65 halves still verify once stripped apart.',
      workedExample:
        'Concatenation verifies but both halves strip cleanly (Separable); with Silithium the Verification Results show EC-Schnorr alone and ML-DSA alone as Blocked, and Recombination Attack tries to reassemble the parts.',
    },
    hasOutput: true,
    outputSpec:
      'Concatenated/nested ML-DSA-65 + EC-Schnorr signature; each component must independently verify under respective public key.',
  },

  // ── Protocol Simulations ──────────────────────────────────────────────────
  {
    id: 'kdf-derivation',
    pt_id: 'PT-008',
    version: '1.0.1',
    name: 'SP 800-108 KDF',
    description:
      'NIST SP 800-108 counter-mode key derivation — applicable to KEM secrets, PSK, QKD, and password-derived keys',
    category: 'HSM / PKCS#11',
    algorithms: ['SP 800-108', 'HMAC-SHA256', 'PBKDF2', 'HKDF'],
    icon: KeyRound,
    moduleLink: '/learn/kms-pqc',
    keywords: [
      'kdf',
      'key derivation',
      'sp 800-108',
      'hmac',
      'counter mode',
      'kbkdf',
      'pbkdf2',
      'hkdf',
      'psk',
      'kem',
    ],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Retrieve a QKD key over ETSI QKD 014, import it into the HSM, and derive a session key from it with SP 800-108 counter-mode KDF over PKCS#11.',
      workedExample:
        'One QKD key in, one session key out, with the label and context that bind the derived key to its purpose — then the session key is used.',
    },
    hasOutput: true,
    outputSpec:
      'SP 800-108 derived key material (32 or 64 bytes hex); deterministic given same PRF, context, and label.',
  },
  {
    id: 'tee-channel',
    pt_id: 'PT-006',
    version: '1.0.2',
    name: 'TEE-HSM Secure Channel',
    description: 'Build a TEE-to-HSM trusted channel with ML-DSA + ML-KEM + AES wrap',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA', 'ML-KEM-768', 'AES Key Wrap'],
    icon: Cpu,
    moduleLink: '/learn/confidential-computing',
    keywords: ['tee', 'trusted execution', 'confidential', 'channel', 'attestation', 'hsm'],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Open a trusted channel from an enclave to the HSM: an ML-DSA-65 attestation key, ML-KEM key agreement, and an AES key wrapped across the channel.',
      workedExample:
        'Run the flow end to end; the PKCS#11 call log shows which call each algorithm makes, and the generated-keys panel shows what ended up where.',
    },
    hasOutput: true,
    outputSpec:
      'ML-DSA attestation signature (hex) over TEE measurement digest; ML-KEM-768 encapsulated session key (1088 bytes); AES-256 wrapped channel secret verifiable by recipient HSM.',
  },
  {
    id: 'tls-simulator',
    pt_id: 'PT-024',
    version: '1.0.2',
    name: 'TLS 1.3 Simulator',
    description:
      'Client–server TLS 1.3 handshake simulator: configure cipher suites, key exchange groups, mTLS, PQC and hybrid certificates',
    category: 'Protocol Simulations',
    algorithms: ['TLS 1.3', 'ML-KEM', 'X25519MLKEM768', 'ML-DSA', 'ECDSA', 'RSA'],
    icon: Shield,
    moduleLink: '/learn/tls-basics',
    keywords: [
      'tls',
      'tls 1.3',
      'handshake',
      'client',
      'server',
      'cipher',
      'ml-kem',
      'x25519',
      'hybrid',
      'mtls',
      'certificate',
      'pqc',
      'openssl',
      'simulation',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
    startHere: ['developer'],
    intro: {
      whatYouWillDo:
        'Configure the client and server panels — cipher suites, key exchange groups, an RSA-2048 or ML-DSA identity, optional client verification — then Start Full Interaction to run a real OpenSSL TLS 1.3 handshake.',
      workedExample:
        'With the defaults (X25519MLKEM768 offered first, RSA-2048 certificates) the summary names the negotiated cipher and key exchange, how many KB the handshake moved, and notes that hybrid ML-KEM plus ECDH was used.',
    },
    hasOutput: true,
    outputSpec:
      'Simulated TLS 1.3 handshake transcript; master secret and HKDF-derived traffic keys (hex); leaf certificate chain with PQC or hybrid signature verified against configured trust anchor.',
  },
  {
    id: 'vpn-sim',
    pt_id: 'PT-009',
    version: '1.0.3',
    name: 'PQC VPN Simulator',
    description:
      'Full IKEv2 handshake in WASM with PKCS#11 crypto routed through softhsmv3. Inspect live C_* calls, ECDH key exchange, and PSK authentication between initiator and responder.',
    category: 'Protocol Simulations',
    algorithms: [
      'IKEv2',
      'ML-KEM-768',
      'ML-DSA-65',
      'ECDH',
      'AES-256-CBC',
      'HMAC-SHA2-256',
      'PKCS#11',
    ],
    icon: Shield,
    moduleLink: '/learn/vpn-ssh-pqc',
    keywords: [
      'vpn',
      'ipsec',
      'ikev2',
      'pkcs11',
      'hsm',
      'softhsm',
      'ecdh',
      'wasm',
      'charon',
      'strongswan',
      'pqc',
      'hybrid',
      'rpc',
    ],
    difficulty: 'advanced',
    requires: ['sab', 'threads', 'chromium'],
    recommendedPersonas: ['developer', 'architect', 'ops', 'researcher'],
    intro: {
      whatYouWillDo:
        'Pick Classical, Hybrid (ML-KEM-768 + ECP-256) or Pure PQC key exchange, set the MTU and fragmentation, choose PSK or certificate auth, then Start Daemon and watch two strongSwan WASM workers run IKEv2.',
      workedExample:
        'Select Hybrid with ML-KEM-768 and Start Daemon: the charon log tags IKE_SA_INIT and IKE_AUTH lines, the status turns to Tunnel Established, and Tunnel Statistics report Total Bytes, Round Trips and Quantum-Safe: KEX ✓.',
    },
    hasOutput: true,
    outputSpec:
      'IKEv2 SKEYSEED and child SA keys derived per RFC 7296 (prf+); ECDH shared secret (32 bytes hex); live C_* PKCS#11 call log with CK_RV return codes.',
  },
  {
    id: 'pqc-ssh-sim',
    pt_id: 'PT-SSH-PQC',
    version: '1.0.3',
    name: 'PQC SSH Simulator',
    description:
      'Full OpenSSH 10.x handshake in WASM: mlkem768x25519-sha256 KEX + ssh-mldsa-65 host auth + publickey userauth backed by softhsmv3 PKCS#11. Compare classical vs PQC byte sizes and latency.',
    category: 'Protocol Simulations',
    algorithms: ['ML-KEM-768', 'X25519', 'ML-DSA-65', 'ssh-mldsa-65', 'PKCS#11'],
    icon: Terminal,
    moduleLink: '/learn/vpn-ssh-pqc',
    keywords: [
      'ssh',
      'openssh',
      'ml-kem',
      'ml-dsa',
      'hybrid',
      'kex',
      'pkcs11',
      'softhsm',
      'wasm',
      'pqc',
      'x25519',
      'mldsa65',
      'userauth',
    ],
    difficulty: 'advanced',
    requires: ['sab', 'threads', 'chromium'],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Pick a PQC KEX (hybrid or pure ML-KEM) and an ML-DSA or SLH-DSA host key, press Run both handshakes, then compare the classical curve25519 baseline with the PQC run in the Handshake Log, PKCS#11 Calls and Wire tabs.',
      workedExample:
        'With the default mlkem768-curve25519-sha256 + ssh-mldsa-65 a real OpenSSH handshake runs: the log reports host and user C_Sign sizes and auth time, and the comparison bars show host pubkey, signature and KEX share bytes.',
    },
    hasOutput: true,
    outputSpec:
      'SSH session ID (SHA-256, 32 bytes hex); ML-DSA-65 host key signature (3309 bytes hex); mlkem768x25519-sha256 shared secret (32 bytes hex); latency and wire-size comparison vs classical.',
  },

  // ── Entropy & Random ──────────────────────────────────────────────────────
  {
    id: 'suci-flow',
    pt_id: 'PT-018',
    version: '1.0.4',
    name: '5G SUCI Construction',
    // Profiles A/B are the ratified 3GPP TS 33.501 §C.3.3 constructions; Profile C
    // is the post-quantum profile the tool also implements (ML-KEM, hybrid with
    // X25519 or pure). The PQC half was previously absent from `description`,
    // `algorithms` and `keywords` alike, so a catalogue search for "ML-KEM"
    // returned 13 tools and never this one.
    description:
      'Subscriber identity concealment for 5G: ECDH + ANSI X9.63-KDF + AES (Profiles A/B), plus a post-quantum Profile C using ML-KEM in hybrid and pure modes',
    category: 'Protocol Simulations',
    algorithms: ['ECDH', 'X25519', 'ML-KEM-768', 'ANSI X9.63-KDF', 'AES-128/256'],
    icon: Radio,
    moduleLink: '/learn/5g-security',
    keywords: [
      '5g',
      'suci',
      'supi',
      'subscriber',
      'concealment',
      'ecdh',
      'hkdf',
      'aes',
      'ml-kem',
      'pqc',
      'post-quantum',
      'hybrid',
      'profile c',
      'x25519',
    ],
    difficulty: 'advanced',
    requires: ['sab'],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Enter a 15-digit SUPI, pick Profile A (X25519), Profile B (P-256) or Profile C (ML-KEM, hybrid or pure), then execute eleven steps from home-network key generation to SUCI assembly and SIDF decryption.',
      workedExample:
        'Default SUPI 310260123456789 under Profile A: X25519 ECDH, X9.63-KDF, AES-128 MSIN encryption and a MAC tag, then Decrypt SUCI at SIDF recovers the original SUPI.',
    },
  },

  // ── Digital Identity ──────────────────────────────────────────────────────
  {
    id: 'mls-group-messaging',
    pt_id: 'PT-030',
    version: '0.1.2',
    name: 'MLS Group Messaging',
    description:
      'RFC 9420 TreeKEM visualizer + PKCS#11 provider architecture. Add/remove members, trace re-keyed nodes on each Commit, and see how openmls_pqctoday_crypto routes every crypto op through softhsmv3.',
    category: 'Protocol Simulations',
    algorithms: ['ML-KEM-768', 'ML-DSA-65', 'X25519', 'Ed25519', 'AES-128-GCM'],
    icon: Network,
    moduleLink: '/learn/mls-group-messaging?tab=workshop',
    keywords: [
      'mls',
      'rfc 9420',
      'treekem',
      'group messaging',
      'forward secrecy',
      'post-compromise security',
      'key ratchet',
      'ml-kem',
      'ml-dsa',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Run the MLS primitives with real keys — ML-DSA-65 credential signing, ML-KEM-768 TreeKEM updates, AES-128-GCM messages — and watch the ratchet tree change as members join.',
      workedExample:
        'Alice and Bob start the group; add a third member and see which nodes on the direct path have to re-key.',
    },
    // Pre-1.0 — see the note on PT-029.
    wip: true,
    opensourceTool: {
      name: 'openmls',
      url: 'https://github.com/openmls/openmls',
    },
  },
  {
    id: 'tpm-playground',
    pt_id: 'PT-028',
    version: '1.0.4',
    name: 'TPM 2.0 PQC Playground',
    description:
      'Execute raw TPM 2.0 Post-Quantum operations entirely in the browser using the WebAssembly-compiled pqctpm emulator.',
    category: 'Protocol Simulations',
    algorithms: ['ML-KEM-768', 'ML-DSA-65', 'WASM'],
    icon: Cpu,
    // Wave B (2026-09-18): pointed at itself since it shipped, so no Learn
    // module ever offered it back. secure-boot-pqc teaches the same TPM 2.0
    // attestation and key-hierarchy material this tool executes.
    moduleLink: '/learn/secure-boot-pqc',
    keywords: ['tpm', 'pqc', 'wasm', 'ml-kem', 'ml-dsa', 'hardware', 'tcg'],
    difficulty: 'advanced',
    requires: ['sab'],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Send raw TPM 2.0 commands from the Command Builder — TPM2_GetCapability, TPM2_CreatePrimary, TPM2_Encapsulate, TPM2_SignDigest — with ML-KEM or ML-DSA, then run Quote or Certify on the Attestation tab.',
      workedExample:
        'On Attestation keep the ML-DSA-65 key, PCRs sha256:0,1,2,3,7 and the default nonce, press Run Quote: the result shows the 3309-byte signature, OpenSSL WASM verify says Signature Verified Successfully, plus a JSON bundle.',
    },
    hasOutput: true,
    outputSpec:
      'Attestation tab produces a downloadable JSON bundle: TPM2_Quote output, PCR digest, and the AK signature — independently verifiable outside the browser session.',
  },
  {
    id: 'rng-demo',
    pt_id: 'PT-010',
    version: '1.0.2',
    name: 'Random Generation',
    description: 'Web Crypto + OpenSSL DRBG random generation with statistical analysis',
    category: 'Entropy & Random',
    algorithms: ['Web Crypto', 'OpenSSL DRBG'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness?tab=workshop&step=0',
    keywords: ['random', 'rng', 'drbg', 'web crypto', 'openssl', 'math.random', 'statistics'],
    difficulty: 'beginner',
    requires: [],
    recommendedPersonas: ['researcher', 'developer', 'architect', 'ops'],
    intro: {
      whatYouWillDo:
        'Generate random bytes from Web Crypto, OpenSSL WASM, Math.random() and a linear congruential generator, and run the same statistical tests on each.',
      workedExample:
        'Generate from the LCG source, then predict its next output from its internal state after generation — the prediction matches even though the LCG usually lands within range on the visual checks.',
    },
  },
  {
    id: 'qrng-demo',
    pt_id: 'PT-012',
    version: '1.0.2',
    name: 'QRNG Demo',
    // Entropy remediation P0.7/P0.8 (2026-09-24): the module's QRNG workshop step
    // was removed, so this links to the module root, not a step. The description
    // says "simulation" first so no surface implies QRNG hardware or evidence.
    description:
      'Simulation — no QRNG hardware involved. Compares a simulated QRNG sample (crypto.getRandomValues() output, not a quantum source), live Web Crypto output and a deliberately broken PRNG on the same grouped checks, which cannot show whether any source is quantum.',
    category: 'Entropy & Random',
    algorithms: ['TRNG', 'Web Crypto'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness',
    keywords: ['qrng', 'quantum random', 'trng', 'true random', 'statistics'],
    difficulty: 'beginner',
    requires: [],
    recommendedPersonas: ['researcher', 'curious'],
    intro: {
      whatYouWillDo:
        'Compare a simulated QRNG sample, a CSPRNG sample and a deliberately broken PRNG on the same visual checks and SP 800-90B health tests, shown as separate groups.',
      workedExample:
        'Run the checks on all three samples: only the weak PRNG stands out, because the simulated QRNG and the CSPRNG are the same kind of output.',
    },
    startHere: ['curious'],
  },
  {
    id: 'entropy-test',
    pt_id: 'PT-011',
    version: '1.0.2',
    name: 'Entropy Testing',
    // Previously "NIST SP 800-90B entropy test suite: monobit, frequency,
    // min-entropy", which attributed monobit and frequency to SP 800-90B —
    // they belong to the SP 800-22 statistical-test family. The tool runs both
    // families, and now runs BOTH of SP 800-90B's mandated continuous health
    // tests (§4.4.1 repetition count and §4.4.2 adaptive proportion); until
    // 2026-08-12 it shipped only the first while claiming the standard.
    // Entropy remediation P0.4/P0.8 (2026-09-24): results are now four separate
    // groups — SP 800-22-style visual checks, the two SP 800-90B health tests,
    // a placeholder for the 90B estimators (not run here), and primitive
    // SHA-256/HMAC self-checks. The MCV-only min-entropy card and its
    // 6-bits/byte pass mark were removed: one estimator on a small buffer is
    // not an SP 800-90B assessment.
    description:
      'Separate groups: monobit, runs and chi-squared visual checks; the SP 800-90B repetition-count and adaptive-proportion health tests (on samples treated as raw noise-source output); and SHA-256/HMAC primitive self-checks. No SP 800-90B entropy estimate is made here.',
    category: 'Entropy & Random',
    algorithms: ['SP 800-90B', 'SP 800-22', 'Web Crypto'],
    icon: Dice5,
    keywords: [
      'entropy',
      'testing',
      'sp 800-90b',
      'sp 800-22',
      'health test',
      'repetition count',
      'adaptive proportion',
      'monobit',
      'runs',
      'chi-squared',
      'frequency',
      'min-entropy',
      'nist',
    ],
    moduleLink: '/learn/entropy-randomness?tab=workshop&step=1',
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['researcher', 'architect', 'developer'],
    startHere: ['researcher'],
    intro: {
      whatYouWillDo:
        'Load a 64-byte sample (Generate Random, All Zeros, Repeating Pattern, Incrementing, or Paste Hex), press Run the checks, and read each group separately: visual checks, health tests, estimators (not run here) and primitive self-checks.',
      workedExample:
        'Load Repeating Pattern (deadbeef repeated over 64 bytes) and run: the visual checks flag the pattern, and each result shows its value, its cutoff and the limit of a 64-byte sample.',
    },
  },
  {
    id: 'drbg-demo',
    pt_id: 'PT-014',
    version: '1.0.2',
    name: 'SP 800-90A DRBG',
    description:
      'Interactive HMAC_DRBG (SHA-256) state machine — Instantiate, Generate, Reseed as specified in NIST SP 800-90A Rev. 1 §10.1.2 — with a known-answer check against pinned NIST ACVP and CAVP vectors.',
    category: 'Entropy & Random',
    algorithms: ['HMAC_DRBG', 'SHA-256'],
    icon: Workflow,
    // Entropy remediation P0.2 (2026-09-24): DrbgArchitectureDemo is now the
    // module's workshop step 4 ('drbg-state-machine', index 3), so this links there.
    moduleLink: '/learn/entropy-randomness?tab=workshop&step=3',
    keywords: [
      'drbg',
      'sp 800-90a',
      'hmac_drbg',
      'instantiate',
      'generate',
      'reseed',
      'entropy',
      'random',
    ],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['architect', 'developer', 'researcher'],
    startHere: ['researcher'],
    intro: {
      whatYouWillDo:
        'Instantiate HMAC_DRBG from a 32-byte entropy input, a nonce and a personalization string, then press Generate and Reseed while the Internal State Tracker shows the working key K, state value V and reseed_counter. Run the known-answer check to compare the same code with NIST vectors.',
      workedExample:
        'Instantiate with the default personalization string and generate 32 bytes ten times: reseed_counter reaches 11, above the demo interval of 10, so a Reseed required banner blocks Generate until you press Reseed, which resets it to 1.',
    },
  },

  // ── Certificates & Proofs ─────────────────────────────────────────────────
  {
    id: 'source-combining',
    pt_id: 'PT-013',
    version: '1.0.1',
    name: 'Source Combining',
    // Entropy remediation P0 cleanup (2026-09-24): HKDF was listed as a
    // conditioning function. It is only the workshop's demonstration expansion
    // step — not an SP 800-90A DRBG and not part of an SP 800-90C construction.
    // Conditioning is Hash_df, SHA-256, HMAC-SHA-256 or AES-CMAC.
    description:
      'Two simulated raw sources: SP 800-90B health tests before conditioning, SP 800-90C concatenation (XOR, hash and HMAC as educational variants), Hash_df/SHA-256/HMAC/AES-CMAC conditioning via SoftHSMv3, and an assumption-driven verdict that can end in "not enough evidence" or "unsafe".',
    category: 'Entropy & Random',
    algorithms: ['SHA-256', 'HMAC-SHA-256', 'HKDF', 'AES-CMAC', 'XOR', 'Hash_df'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness?tab=workshop&step=4',
    keywords: [
      'source combining',
      'xor',
      'hmac',
      'hkdf',
      'hash_df',
      'aes-cmac',
      'conditioning',
      'entropy pool',
      'sp 800-90c',
      'rbg',
    ],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['researcher', 'architect', 'developer'],
    intro: {
      whatYouWillDo:
        'Health-test two simulated raw sources, assemble their samples with SP 800-90C concatenation, condition the result, then state the assumptions the combined construction rests on.',
      workedExample:
        'Load the Stuck source, detected counterexample: the health tests exclude Source A before conditioning, and Source B alone falls short of the 384 bits a 256-bit DRBG needs, so the verdict is Not enough evidence.',
    },
  },
  {
    id: 'pki-workshop',
    pt_id: 'PT-015',
    version: '1.0.1',
    name: 'PKI Workshop',
    description:
      'Build a full certificate chain hands-on: CSR → Root CA → cert issuance → parsing → CRL',
    category: 'Certificates & Proofs',
    algorithms: ['RSA', 'EC', 'ML-DSA', 'X.509', 'CRL'],
    icon: ShieldCheck,
    moduleLink: '/learn/pki-workshop',
    keywords: [
      'pki',
      'x509',
      'certificate',
      'csr',
      'root ca',
      'signing',
      'crl',
      'revocation',
      'chain',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops', 'curious'],
    startHere: ['curious'],
    intro: {
      whatYouWillDo:
        'Work through five steps: generate a CSR, create a Root CA, issue a certificate by signing the CSR with that CA, parse the certificate, then build a CRL.',
      workedExample:
        'Generate a CSR for example.com with a new RSA 2048-bit key, self-sign a Root CA, press Sign Certificate to issue the leaf, then Parse Details shows its subject and issuer.',
    },
    hasOutput: true,
    outputSpec:
      'DER-encoded X.509 certificate chain; leaf cert must verify under root CA public key. CSR subject matches issued cert subject.',
  },
  {
    id: 'cert-capacity',
    pt_id: 'PT-025',
    version: '1.0.1',
    name: 'Cert Capacity Calculator',
    description:
      'Model storage, bandwidth, and CPU impact of migrating your PKI to ML-DSA — adjust cert counts and renewal cadence.',
    category: 'Certificates & Proofs',
    algorithms: ['RSA-2048', 'ECDSA P-256', 'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'],
    icon: BarChart2,
    moduleLink: '/learn/pki-workshop',
    keywords: [
      'certificate',
      'capacity',
      'storage',
      'bandwidth',
      'cpu',
      'ml-dsa',
      'pki',
      'migration',
      'sizing',
    ],
    difficulty: 'beginner',
    requires: [],
    recommendedPersonas: ['architect', 'ops', 'executive', 'grc'],
    startHere: ['architect', 'executive', 'grc'],
    hasOutput: false,
  },
  {
    id: 'hybrid-certs',
    pt_id: 'PT-016',
    version: '1.0.1',
    name: 'Hybrid Certificates',
    description:
      'Generate and compare eight X.509 hybrid and post-quantum certificate formats via SoftHSM PKCS#11 + real DER encoding',
    category: 'Certificates & Proofs',
    algorithms: ['SLH-DSA', 'ML-DSA-65', 'ECDSA-P256'],
    icon: ShieldCheck,
    moduleLink: '/learn/hybrid-crypto',
    keywords: ['certificate', 'x509', 'composite', 'hybrid', 'pqc', 'openssl', 'der'],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
    startHere: ['architect'],
    intro: {
      whatYouWillDo:
        'Enable the HSM, press Generate on any of the eight certificate format cards or Generate All Formats, then read each PEM or parsed view and the Format Comparison table.',
      workedExample:
        'Generate Pure PQC (ML-DSA-65) and Related Certificates (RFC 9763) first: the comparison table shows their DER size, generation time and quantum-safe status side by side.',
    },
    hasOutput: true,
    outputSpec:
      'DER-encoded hybrid X.509 certificate with composite public key; ML-DSA-65 signature must verify under PQC public key component.',
  },
  {
    id: 'merkle-proof',
    pt_id: 'PT-017',
    version: '1.0.1',
    name: 'Merkle Tree Workshop',
    description:
      'Build trees, generate inclusion proofs, verify with tamper detection, compare PQC cert sizes, and simulate Certificate Transparency logs',
    category: 'Certificates & Proofs',
    algorithms: ['SHA-256', 'Merkle Tree', 'CT Log'],
    icon: Hash,
    moduleLink: '/learn/merkle-tree-certs',
    keywords: [
      'merkle',
      'tree',
      'proof',
      'inclusion',
      'sha-256',
      'tamper',
      'transparency log',
      'ct',
      'sct',
      'consistency',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'researcher', 'curious'],
    startHere: ['curious'],
    intro: {
      whatYouWillDo:
        'Add certificate leaves and build a SHA-256 Merkle tree, generate an inclusion proof for one leaf, verify it and tamper with it, compare handshake sizes, then simulate a Certificate Transparency log.',
      workedExample:
        'Load 8 sample certs and Build Merkle Tree, generate an inclusion proof for one leaf, then press Auto-Tamper and Verify Tampered: one flipped character makes the computed root diverge and verification fails.',
    },
    hasOutput: true,
    outputSpec:
      'Merkle root hash (SHA-256, 32 bytes hex); inclusion proof as ordered sibling-hash array verifiable by recomputation to root; consistency proof between two tree sizes.',
  },

  {
    id: 'digital-id',
    pt_id: 'PT-019',
    version: '1.0.1',
    name: 'EUDI Wallet Architecture',
    description:
      'Complete digital identity lifecycle: Wallet, PID Issuance, Attestation, RP Verification, and QES Provider.',
    category: 'Digital Identity',
    algorithms: ['OpenID4VCI', 'P-256', 'mDoc', 'QES'],
    icon: Shield,
    moduleLink: '/learn/digital-id',
    keywords: [
      'eudi',
      'digital id',
      'wallet',
      'pid',
      'mdoc',
      'openid4vci',
      'qes',
      'qtsp',
      'attestation',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Walk five steps: open the EUDI Wallet, get a PID issued, receive a university diploma attestation, present your identity to a bank as relying party, then sign a document with a QTSP.',
      workedExample:
        'Start Issuance Flow at the PID Issuer to get a P-256-bound mdoc, then Login with Wallet at the bank, Consent & Share family name, given name, degree and age_over_18, and the bank confirms Account Opened.',
    },
  },

  // ── Blockchain / Digital Assets ───────────────────────────────────────────
  {
    id: 'bitcoin-flow',
    pt_id: 'PT-020',
    version: '1.0.1',
    name: 'Bitcoin Transaction',
    description: 'secp256k1 ECDSA keypair, SHA256 + RIPEMD160, transaction signing',
    category: 'Blockchain & Digital Assets',
    algorithms: ['secp256k1', 'SHA-256', 'RIPEMD160'],
    icon: Bitcoin,
    moduleLink: '/learn/digital-assets?flow=bitcoin',
    keywords: ['bitcoin', 'secp256k1', 'ecdsa', 'transaction', 'utxo', 'sha256', 'ripemd160'],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'researcher'],
    intro: {
      whatYouWillDo:
        'Run nine steps: generate the source key, extract its public key, create the source address, generate a recipient key and address, format the transaction, visualize the message, sign it and verify the signature.',
      workedExample:
        "Format a 0.5 BTC transfer with a 0.0001 BTC fee between the two generated addresses, sign it with secp256k1 ECDSA, and Verify Signature reports VALID against the sender's public key.",
    },
    hasOutput: true,
    outputSpec:
      'secp256k1 keypair (compressed public key 33 bytes); ECDSA signature (DER) verifiable against public key.',
  },
  {
    id: 'hd-wallet',
    pt_id: 'PT-022',
    version: '1.0.1',
    name: 'HD Wallet Derivation',
    description: 'BIP39 mnemonic + BIP32/SLIP-0010 multi-coin HD key derivation',
    category: 'Blockchain & Digital Assets',
    algorithms: ['BIP39', 'BIP32', 'PBKDF2', 'HMAC-SHA512'],
    icon: Workflow,
    moduleLink: '/learn/digital-assets?flow=hd-wallet',
    keywords: ['hd wallet', 'bip39', 'bip32', 'mnemonic', 'derivation', 'pbkdf2', 'slip-0010'],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'researcher'],
    intro: {
      whatYouWillDo:
        'Generate a BIP39 mnemonic, derive the seed with PBKDF2, see hardened versus non-hardened derivation, derive Bitcoin, Ethereum and Solana addresses, then read the quantum threat assessment.',
      workedExample:
        "Generate Mnemonic gives 24 words from 32 bytes of entropy; Derive Accounts then shows a Bitcoin address at m/44'/0'/0'/0/0, an Ethereum address at m/44'/60'/0'/0/0 and a Solana address at m/44'/501'/0'/0'.",
    },
    hasOutput: true,
    outputSpec:
      'BIP39 mnemonic (12/24 words); BIP32 child keys deterministic from same mnemonic + derivation path.',
  },

  // ── OpenSSL Studio ────────────────────────────────────────────────────────
  {
    id: 'solana-flow',
    pt_id: 'PT-021',
    version: '1.0.2',
    name: 'Solana Transaction',
    description: 'Ed25519 keypair generation and transaction signing',
    category: 'Blockchain & Digital Assets',
    algorithms: ['Ed25519'],
    icon: Zap,
    moduleLink: '/learn/digital-assets?flow=solana',
    keywords: ['solana', 'ed25519', 'eddsa', 'transaction', 'base58'],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'researcher'],
    intro: {
      whatYouWillDo:
        'Follow a Solana transfer from an Ed25519 keypair to an address, a formatted transaction and a signed message.',
      workedExample:
        'The eight steps end with the signed message; the notes explain why an Ed25519 signature is a post-quantum liability and what would replace it.',
    },
    hasOutput: true,
    outputSpec:
      'Ed25519 keypair (public key 32 bytes); signature (64 bytes) must verify against message under same public key.',
  },
  {
    id: 'openssl-studio',
    pt_id: 'PT-023',
    version: '1.0.1',
    name: 'OpenSSL Studio',
    description:
      'Full OpenSSL v3.6.3 environment: keygen, certificates, CSR, KEM, signing, KDF, encryption — all via WASM',
    category: 'OpenSSL Studio',
    algorithms: ['RSA', 'EC', 'Ed25519', 'ML-KEM', 'ML-DSA', 'SLH-DSA', 'AES', 'HKDF', 'X.509'],
    icon: Terminal,
    moduleLink: '/playground/openssl-studio',
    keywords: [
      'openssl',
      'studio',
      'wasm',
      'genpkey',
      'req',
      'x509',
      'dgst',
      'enc',
      'kem',
      'kdf',
      'pkcs12',
      'lms',
      'certificate',
      'csr',
      'signing',
      'encryption',
      'hashing',
      'key generation',
      'random',
      'pqc',
      'terminal',
      'command line',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
    startHere: ['ops'],
    intro: {
      whatYouWillDo:
        'Pick the Learn, Explore or Workbench tab; in the Workbench choose a command category such as genpkey, req, x509, dgst, kem or enc, set its parameters, press Run Command and read the terminal output and logs.',
      workedExample:
        'Choose the preset Generate ML-DSA-65 key, which runs openssl genpkey with the ML-DSA-65 algorithm and writes ml-dsa-65.key into the file manager, ready for a self-signed certificate.',
    },
    hasOutput: true,
    outputSpec:
      'Output depends on command: keygen → PEM/DER key; sign → signature hex; KEM → encapsulated key + shared secret.',
  },
  {
    id: 'api-security-jwt',
    pt_id: 'PT-032',
    version: '1.0.4',
    name: 'API Security & JWT Workshop',
    description:
      // The JWE half is pinned to draft-ietf-jose-pqc-kem-05 ON PURPOSE. That
      // version was titled "PQ KEMs for JOSE and COSE"; -06 (6 Jul 2026) was
      // retitled COSE-only and dropped JOSE entirely — 0 occurrences of "JWE",
      // and §5.1 "Key Derivation for JOSE" is gone. The implementation is
      // correct against -05, so the citation names the version rather than
      // pointing at a document that no longer specifies this.
      'Sign JWTs with ML-DSA-44/65/87, SLH-DSA, and composite ML-DSA-65+Ed25519 using real @noble/post-quantum or softhsmv3 PKCS#11. JWE encryption via ML-KEM-768 per draft-ietf-jose-pqc-kem-05 (its successor -06 narrowed to COSE only).',
    category: 'OpenSSL Studio',
    algorithms: [
      'ML-DSA-44',
      'ML-DSA-65',
      'ML-DSA-87',
      'SLH-DSA-SHA2-128s',
      'ML-KEM-768',
      'JWS',
      'JWE',
      'JOSE',
    ],
    icon: KeySquare,
    moduleLink: '/learn/api-security-jwt?tab=workshop',
    keywords: [
      'jwt',
      'jws',
      'jwe',
      'jose',
      'api security',
      'bearer token',
      'ml-dsa',
      'slh-dsa',
      'ml-kem',
      'composite',
      'ml-dsa-65-ed25519',
      'rfc 7519',
      'draft-ietf-jose-pqc-kem',
      'noble',
      'softhsmv3',
      'pkcs11',
    ],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    startHere: ['developer'],
    intro: {
      whatYouWillDo:
        'Open six sections: inspect a JWT, sign one with ML-DSA or SLH-DSA, build a composite ML-DSA-65+Ed25519 JWT, encrypt a payload as ML-KEM-768 JWE, compare token sizes, and run the JOSE known-answer audit.',
      workedExample:
        "In PQC JWT Signing pick ML-DSA-65 on the @noble/post-quantum backend, Generate Keypair, sign the sample payload for Alice Engineer, then Verify (noble) reports Signature valid with the token's byte sizes.",
    },
    hasOutput: true,
    outputSpec:
      'Signed JWT with ML-DSA header; verifyJWS() must return true with the matching public key. JWE path: plaintext round-trips through ML-KEM-768 encap/decap.',
  },
  {
    id: 'pki-enrollment',
    pt_id: 'PT-029',
    version: '0.1.2',
    name: 'PKI Enrollment (EST + CMP)',
    description:
      'RFC 7030 EST + RFC 4210/9810 CMP — generate an ML-DSA-65 key, run CMP IR against an in-WASM mock CA, verify the issued cert.',
    category: 'OpenSSL Studio',
    algorithms: ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'ML-KEM-768', 'X.509', 'CMP', 'EST'],
    icon: Workflow,
    moduleLink: '/learn/pki-enrollment-protocols?tab=workshop',
    keywords: [
      'est',
      'cmp',
      'rfc 7030',
      'rfc 4210',
      'rfc 9810',
      'enrollment',
      'csr',
      'pkcs10',
      'x509',
      'ml-dsa',
      'ml-kem',
      'mock ca',
      'certificate',
      'issuance',
    ],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'ops', 'researcher'],
    // Pre-1.0: the WIP banner is the only signal a visitor gets that this tool
    // is still moving. `workshopRegistry.test.ts` enforces that every 0.x tool
    // sets this, so a new pre-1.0 tool cannot ship looking finished.
    wip: true,
    intro: {
      whatYouWillDo:
        'Generate an end-entity keypair, send a CMP Initial Request to an in-browser mock CA, run EST simpleenroll with the same key, then perform an ML-KEM-768 key update with encrCert proof of possession.',
      workedExample:
        'Generate an ML-DSA-65 keypair and press Send CMP Initial Request: the mock CA issues a certificate chain-validated against its root and shows it decoded; the KEM key update then reports whether both shared secrets match.',
    },
    hasOutput: true,
    outputSpec:
      'Issued X.509 cert (PEM) chained to the workshop mock CA root, signed with ML-DSA-65. Chain verification must succeed (openssl verify -CAfile root.crt ee.crt → OK).',
    opensourceTool: {
      name: 'OpenSSL 3.6 cmp',
      url: 'https://www.openssl.org/docs/man3.6/man1/openssl-cmp.html',
    },
  },
  {
    id: 'email-signing',
    pt_id: 'PT-031',
    version: '1.0.1',
    name: 'S/MIME & CMS Workshop',
    description:
      'Real OpenSSL 3.6 WASM CMS SignedData sign+verify (ML-DSA-44/65/87, SLH-DSA, RSA-PSS) and ML-KEM-768 AuthEnvelopedData encrypt+decrypt. Toggle routes signing key through softhsmv3 PKCS#11.',
    category: 'OpenSSL Studio',
    algorithms: [
      'ML-DSA-44',
      'ML-DSA-65',
      'ML-DSA-87',
      'SLH-DSA-SHA2-128s',
      'ML-KEM-768',
      'RSA-PSS',
      'ECDSA',
      'CMS',
    ],
    icon: Mail,
    moduleLink: '/learn/email-signing?tab=workshop',
    keywords: [
      's/mime',
      'cms',
      'pkcs7',
      'email signing',
      'signed data',
      'enveloped data',
      'ml-dsa',
      'slh-dsa',
      'ml-kem',
      'rfc 8551',
      'rfc 5652',
      'rfc 9629',
      'openssl',
      'wasm',
      'softhsmv3',
      'pkcs11',
    ],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect', 'researcher'],
    intro: {
      whatYouWillDo:
        'Sign, verify, encrypt and decrypt CMS messages with real OpenSSL 3.6 running in the browser, using ML-DSA, SLH-DSA and ML-KEM-768.',
      workedExample:
        'An ML-DSA-65 CMS SignedData signed and verified end to end, then an ML-KEM-768 AuthEnvelopedData encrypted and decrypted; toggle the signing key through the PKCS#11 provider.',
    },
    hasOutput: true,
    outputSpec:
      'CMS SignedData DER blob: outer ASN.1 SEQUENCE header (30 82 …), recovered plaintext matches input byte-for-byte. KEM path: decrypted plaintext matches DEFAULT_PAYLOAD.',
    opensourceTool: {
      name: 'OpenSSL 3.6 cms',
      url: 'https://www.openssl.org/docs/man3.6/man1/openssl-cms.html',
    },
  },
]

/** Prefix applied to sandbox scenario ids to avoid collisions with native tools
 *  (e.g. sandbox 'tls' vs existing tool 'tls'). The wrapper strips the prefix
 *  before loading the scenario iframe. */
export const SANDBOX_TOOL_PREFIX = 'sbx-'

const SANDBOX_ICONS: Record<SandboxTrackId, React.ElementType> = {
  'protocol-simulation': Radio,
  infrastructure: Container,
  'supply-chain': Network,
  'secrets-kms': Container,
  web: Globe,
  applications: Network,
}

// Per-track persona fit so the sandbox is discoverable under every persona
// (a flat ['developer','architect','ops'] previously hid all sandbox scenarios
// from researcher / executive / curious). Every track lists ≥1 of those three.
const SANDBOX_TRACK_PERSONAS: Record<SandboxTrackId, PersonaId[]> = {
  // 'curious' moved here from the now-removed 'quantum' track 2026-07-28:
  // pqctoday-sandbox dropped every scenario tagged to it (crypto-discovery,
  // secrets-vault, haproxy, pqcflow, mtc) — none of them actually ran
  // post-quantum cryptography, so the track (and its SandboxTrackId member)
  // is gone entirely, and was silently hiding the sandbox from this persona.
  // protocol-simulation is real, populated PQC-protocol content and the
  // closest fit for casual exploration.
  'protocol-simulation': ['developer', 'architect', 'researcher', 'curious'],
  infrastructure: ['architect', 'ops', 'developer'],
  'supply-chain': ['architect', 'ops', 'executive', 'grc'],
  'secrets-kms': ['ops', 'architect', 'developer'],
  web: ['developer', 'architect', 'ops'],
  applications: ['developer', 'architect', 'researcher'],
}

// ── Sandbox re-homing (Crypto Lab Workbench, §6) ───────────────────────────
// Each sandbox scenario keeps a real *domain* category; "runs in a container"
// is a facet (`sandbox: true`), not a category. Default per track, with
// per-scenario overrides where a scenario clearly belongs in another domain.
const SANDBOX_TRACK_CATEGORY: Record<SandboxTrackId, WorkshopCategory> = {
  'protocol-simulation': 'Protocol Simulations',
  infrastructure: 'Certificates & Proofs',
  'supply-chain': 'Certificates & Proofs',
  'secrets-kms': 'HSM / PKCS#11',
  web: 'Protocol Simulations',
  applications: 'Protocol Simulations',
}

const SANDBOX_SCENARIO_CATEGORY: Record<string, WorkshopCategory> = {
  // infrastructure track — key management / mail belong elsewhere
  'cloud-kms': 'HSM / PKCS#11',
  // 'secrets-vault' omitted: see SANDBOX_TRACK_PERSONAS comment above — inert override.
  smime: 'OpenSSL Studio',
  // 'wireguard' omitted: removed from pqctoday-sandbox in v0.9.0 (see
  // cryptoLabTaxonomy.ts for why) — this override is now inert.
  // supply-chain track — TPM key hierarchy is an HSM/key concern
  'tpm-pqc-migration': 'HSM / PKCS#11',
  // applications track — JOSE/JWT, automated CA, firmware keys, code signing
  'api-security-jwt': 'OpenSSL Studio',
  stepca: 'Certificates & Proofs',
  'firmware-hss': 'HSM / PKCS#11',
  // Code signing (PE/Authenticode) is a supply-chain signing concern, not a
  // protocol simulation — re-home off the 'applications' track default.
  osslsigncode: 'Certificates & Proofs',
}

function sandboxDomainCategory(s: { id: string; trackId: SandboxTrackId }): WorkshopCategory {
  return SANDBOX_SCENARIO_CATEGORY[s.id] ?? SANDBOX_TRACK_CATEGORY[s.trackId]
}

const SANDBOX_TOOLS: WorkshopTool[] = SANDBOX_SCENARIOS.map((s, idx) => ({
  id: `${SANDBOX_TOOL_PREFIX}${s.id}`,
  pt_id: `PT-SBX-${String(idx + 1).padStart(3, '0')}`,
  version: '1.0.0',
  name: s.title,
  description: s.useCase.length > 120 ? `${s.useCase.slice(0, 117)}...` : s.useCase,
  category: sandboxDomainCategory(s),
  sandbox: true,
  algorithms: s.algorithms,
  icon: SANDBOX_ICONS[s.trackId],
  moduleLink: '',
  keywords: Array.from(
    new Set([s.id, s.tool.name, s.trackId, 'sandbox', ...s.algorithms].map((k) => k.toLowerCase()))
  ),
  difficulty: s.difficulty,
  // One shared declaration for all 24 scenarios: they are not browser-runnable
  // at all. Declaring a browser capability like 'sab' here would make the device
  // badge lie — these do not fail a capability check, they run somewhere else.
  requires: ['container'],
  recommendedPersonas: SANDBOX_TRACK_PERSONAS[s.trackId],
  wip: true,
  opensourceTool: { name: s.tool.name, url: s.tool.url },
}))

WORKSHOP_TOOLS.push(...SANDBOX_TOOLS)

/** Reverse lookup: tool id → PT-ID (e.g. 'slh-dsa' → 'PT-001') */
export const PT_ID_MAP: Record<string, string> = Object.fromEntries(
  WORKSHOP_TOOLS.map((t) => [t.id, t.pt_id])
)

// ---------------------------------------------------------------------------
// Lazy-loaded components — each wrapped to handle named exports
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LazyComp = React.LazyExoticComponent<React.ComponentType<any>>

const LazySuciFlow = lazyWithRetry(() =>
  import('@/components/Playground/SuciFlowRoute').then((m) => ({ default: m.SuciFlowRoute }))
)

const LazySandboxEmbed = lazyWithRetry(() =>
  import('@/components/Playground/SandboxScenarioEmbed').then((m) => ({
    default: m.SandboxScenarioEmbed,
  }))
)

export const TOOL_COMPONENTS: Record<string, LazyComp> = {
  'suci-flow': LazySuciFlow,
  ...Object.fromEntries(
    SANDBOX_SCENARIOS.map((s) => [`${SANDBOX_TOOL_PREFIX}${s.id}`, LazySandboxEmbed])
  ),
  'slh-dsa': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/StatefulSignatures/workshop/SLHDSALiveDemo').then(
      (m) => ({ default: m.SLHDSALiveDemo })
    )
  ),
  'pki-enrollment': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PKIEnrollmentProtocols/PKIEnrollmentPlayground').then(
      (m) => ({ default: m.PKIEnrollmentPlayground })
    )
  ),
  'lms-hss': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/StatefulSignatures/workshop/StatefulSignaturesDemo').then(
      (m) => ({ default: m.StatefulSignaturesDemo })
    )
  ),
  'hybrid-encrypt': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/HybridCrypto/workshop/HybridEncryptionDemo').then(
      (m) => ({ default: m.HybridEncryptionDemo })
    )
  ),
  'envelope-encrypt': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/KmsPqc/workshop/EnvelopeEncryptionDemo').then((m) => ({
      default: m.EnvelopeEncryptionDemo,
    }))
  ),
  'token-migration': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/IAMPQC/workshop/TokenMigrationLab').then((m) => ({
      default: m.TokenMigrationLab,
    }))
  ),
  'tee-channel': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/ConfidentialComputing/workshop/TEEHSMTrustedChannel').then(
      (m) => ({ default: m.TEEHSMTrustedChannel })
    )
  ),
  'firmware-signing': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/SecureBootPQC/workshop/FirmwareSigningMigrator').then(
      (m) => ({ default: m.FirmwareSigningMigrator })
    )
  ),
  'kdf-derivation': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/QKD/workshop/HSMKeyDerivationDemo').then((m) => ({
      default: m.HSMKeyDerivationDemo,
    }))
  ),
  'vpn-sim': lazyWithRetry(() =>
    import('@/components/Playground/hsm/VpnSimulationPanel').then((m) => ({
      default: m.VpnSimulationPanel,
    }))
  ),
  'pqc-ssh-sim': lazyWithRetry(() =>
    import('@/components/Playground/hsm/SshSimulationPanel').then((m) => ({
      default: m.SshSimulationPanel,
    }))
  ),
  'rng-demo': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/RandomGenerationDemo').then((m) => ({
      default: m.RandomGenerationDemo,
    }))
  ),
  'entropy-test': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/EntropyTestingDemo').then((m) => ({
      default: m.EntropyTestingDemo,
    }))
  ),
  'qrng-demo': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/QRNGDemo').then((m) => ({
      default: m.QRNGDemo,
    }))
  ),
  'source-combining': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/SourceCombiningDemo').then((m) => ({
      default: m.SourceCombiningDemo,
    }))
  ),
  'drbg-demo': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/DrbgArchitectureDemo').then((m) => ({
      default: m.DrbgArchitectureDemo,
    }))
  ),
  'hybrid-certs': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/HybridCrypto/workshop/HybridCertFormats').then(
      (m) => ({ default: m.HybridCertFormats })
    )
  ),
  'hybrid-sigs': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/HybridCrypto/workshop/HybridSignatures').then((m) => ({
      default: m.HybridSignatures,
    }))
  ),
  'merkle-proof': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MerkleTreeCerts/workshop/MerkleWorkshopSteps').then(
      (m) => ({ default: m.MerkleWorkshopSteps })
    )
  ),
  'cert-capacity': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PKIWorkshop/CertCapacityCalculator').then((m) => ({
      default: m.CertCapacityCalculator,
    }))
  ),
  'hsm-capacity': lazyWithRetry(() =>
    import('@/components/Playground/hsm/HsmCapacityCalculator').then((m) => ({
      default: m.HsmCapacityCalculator,
    }))
  ),
  'pki-workshop': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PKIWorkshop').then((m) => {
      function PKIWorkshopPlayground({ initialStep }: { initialStep?: number }) {
        return <m.PKIWorkshop playgroundMode initialStep={initialStep} />
      }
      PKIWorkshopPlayground.displayName = 'PKIWorkshopPlayground'
      return { default: PKIWorkshopPlayground }
    })
  ),
  'openssl-studio': lazyWithRetry(() =>
    import('@/components/OpenSSLStudio/OpenSSLStudioView').then((m) => {
      function EmbeddedOpenSSL() {
        return <m.OpenSSLStudioView embedded />
      }
      EmbeddedOpenSSL.displayName = 'EmbeddedOpenSSL'
      return { default: EmbeddedOpenSSL }
    })
  ),
  'tls-simulator': lazyWithRetry(() =>
    import('@/components/OpenSSLStudio/TLSSimulatorTab').then((m) => ({
      default: m.TLSSimulatorTab,
    }))
  ),
  'tpm-playground': lazyWithRetry(() =>
    import('@/components/Playground/TpmPlayground/TpmPlayground').then((m) => ({
      default: m.default,
    }))
  ),
  'mls-group-messaging': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MLSGroupMessaging/workshop/MLSGroupMessagingPlayground').then(
      (m) => ({ default: m.MLSGroupMessagingPlayground })
    )
  ),
  'email-signing': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/EmailSigning/EmailSigningPlayground').then((m) => ({
      default: m.EmailSigningPlayground,
    }))
  ),
  'api-security-jwt': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/APISecurityJWT/APISecurityJWTPlayground').then(
      (m) => ({ default: m.APISecurityJWTPlayground })
    )
  ),
  // Reuses the same view mounted at the dedicated /playground/cacp route (App.tsx)
  // so the tool can also embed as a sim `workshop` step (WS-P6-DD, 07052026).
  'cacp-kmip': lazyWithRetry(() =>
    import('@/components/Playground/kmip/KmipPlaygroundView').then((m) => ({
      default: m.KmipPlaygroundView,
    }))
  ),
}

export function makeLazyWithOnBack(
  importFn: () => Promise<Record<string, React.ComponentType<{ onBack: () => void }>>>,
  exportName: string
): LazyComp {
  return lazyWithRetry(() =>
    importFn().then((m) => {
      const Comp = m[exportName] as React.ComponentType<{ onBack: () => void }>
      function WorkshopWrapper(props: { onBack: () => void }) {
        return <Comp {...props} />
      }
      WorkshopWrapper.displayName = `Workshop_${exportName}`
      return { default: WorkshopWrapper }
    })
  ) as LazyComp
}

export const ONBACK_COMPONENTS: Record<string, LazyComp> = {
  'bitcoin-flow': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalAssets/flows/BitcoinFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'BitcoinFlow'
  ),
  'solana-flow': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalAssets/flows/SolanaFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'SolanaFlow'
  ),
  'hd-wallet': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalAssets/flows/HDWalletFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'HDWalletFlow'
  ),
  'digital-id': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalID/index') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'DigitalIDModule'
  ),
}
