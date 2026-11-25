// SPDX-License-Identifier: AGPL-3.0-only
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
  ArrowLeftRight,
} from 'lucide-react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import type { PersonaId } from '@/data/learningPersonas'
import { SANDBOX_SCENARIOS, type SandboxTrackId } from '@/data/sandboxScenarios'
import {
  PLAYGROUND_TOOL_RECORDS,
  SANDBOX_TOOL_RECORDS,
  type PlaygroundToolRecord,
} from '@/data/generated/tools.generated'

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

/**
 * What an entry below declares: the tool's content (description, intro, icon,
 * keywords, runtime requirements, outputs, component link). Its organising
 * fields — name, tracking number, version, category, level, recommended roles
 * and position — live once in the tools data file (`src/data/tools_*.csv`,
 * read through `tools.generated.ts`) and are joined in below.
 */
export type WorkshopToolContent = Omit<
  WorkshopTool,
  | 'pt_id'
  | 'version'
  | 'name'
  | 'category'
  | 'difficulty'
  | 'recommendedPersonas'
  | 'sandbox'
  | 'wip'
>

// ── Position ───────────────────────────────────────────────────────────────
// The order of the Crypto Lab rail is the `order` column of the tools data file
// (one run across the browser tools and the sandbox scenarios), not the order
// of the entries below. The graders cite in-category rank ("10th of 11", "last
// 6th/6"), and the file lists each category flagship-first: the tool a newcomer
// to that category should meet first (broadest, most complete, or the marquee
// tool) leads; narrower or advanced tools follow. Reordering the entries here
// moves nothing — ids, components and search entries are keyed, not positional.
const WORKSHOP_TOOL_CONTENT: WorkshopToolContent[] = [
  {
    id: 'cacp-kmip',
    description:
      'In-browser KMIP 3.0 control plane + softhsmrustv3 HSM, compiled to WebAssembly. Load a crypto-agility policy (pqc.yaml / classical.yaml), run key lifecycle ops (CreateKeyPair → Activate → Sign / Encap / Decap), and watch the policy auto-rekey a classical ECDSA-P256 key to ML-DSA-65 on the same Sign call — no server, no Docker.',
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
    moduleLink: '/learn/crypto-agility',
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
    requires: [],
    hasOutput: true,
    outputSpec:
      'Produces a browser-local KMIP operation trace, policy decision, PKCS #11 result, and before/after key-lifecycle state for the selected scenario.',
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
    description:
      'Explore fictional HSM workloads, utilisation headroom and local redundancy. Preserve per-site inventory and size payment workloads separately; not a production capacity prediction.',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Explore fictional per-site workloads, assumed operation rates, utilisation headroom and local redundancy. Inspect actual site allocations and separate payment-fleet results.',
      workedExample:
        'Enter ten general-purpose devices and three sites: the allocations are 4/3/3, not twelve devices. Compare each site against the model requirement at 70% target utilisation, then apply N+1.',
    },
    hasOutput: false,
  },
  {
    id: 'hybrid-encrypt',
    description: 'ML-KEM + X25519 ECDH + HKDF hybrid encryption pipeline',
    algorithms: ['ML-KEM-768', 'X25519', 'HKDF', 'HPKE-PQ'],
    icon: Lock,
    moduleLink: '/learn/hybrid-crypto',
    keywords: ['hybrid', 'kem', 'ecdh', 'hkdf', 'ml-kem', 'x25519', 'encryption', 'key agreement'],
    requires: [],
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
    description: 'ML-KEM + AES key wrap in a KMS envelope encryption pattern',
    algorithms: ['ML-KEM-768', 'AES-256', 'Key Wrap'],
    icon: KeyRound,
    moduleLink: '/learn/kms-pqc',
    keywords: ['envelope', 'kms', 'key wrap', 'ml-kem', 'aes', 'dek', 'kek'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Pick a KEK algorithm (ML-KEM-512/768/1024 or RSA-2048/4096) and a wrap mechanism (AES-KW, AES-KWP or AES-GCM), press Execute (Live WASM), then step through the five-step classical-vs-PQC comparison.',
      workedExample:
        'With ML-KEM-768 and AES-KW the run generates an AES-256 DEK, encapsulates a 1088 B KEM ciphertext, wraps the DEK into 40 B and unwraps it again; the Key Integrity Verification panel shows the DEK before and after match.',
    },
    hasOutput: true,
    outputSpec:
      'Copyable hex for the wrapped DEK. ML-KEM runs also produce a KEM ciphertext, and AES-GCM adds a nonce. Compare all 32 recovered DEK bytes with the original.',
  },
  {
    id: 'cloud-kms-key-exchange',
    description:
      'Simulate importing a key into AWS KMS, Google Cloud KMS and Azure: the classical RSA key-wrap flow next to the HPKE flow, on PKCS#11 v3.2, the v3.3 draft and the candidate CKM_HPKE mechanism',
    algorithms: ['ML-KEM-768', 'ML-KEM-1024', 'X-Wing', 'RSA-3072', 'AES-256', 'HPKE'],
    icon: ArrowLeftRight,
    moduleLink: '/learn/kms-pqc?tab=workshop&step=6',
    keywords: [
      'cloud kms',
      'aws kms',
      'google cloud kms',
      'azure key vault',
      'byok',
      'key import',
      'key exchange',
      'hpke',
      'x-wing',
      'ml-kem',
      'rsa key wrap',
      'ckm_rsa_aes_key_wrap',
      'ckm_comp_kem',
      'simulation',
    ],
    requires: [],
    intro: {
      whatYouWillDo:
        'Pick AWS KMS, Google Cloud KMS or Azure, then a flow: the classical RSA import, or the HPKE import on the PKCS#11 v3.2, v3.3 draft or candidate CKM_HPKE engine. Press Run simulation and read the measured sizes and where the key sits at each step.',
      workedExample:
        'On AWS KMS choose Classical import and run it: the wrapped blob is the RSA part plus the AES-KWP part, and the recovered key matches the original. Switch to HPKE (candidate), pick X-Wing and run: the message grows to enc plus ciphertext, protected by a post-quantum KEM. Everything is a simulation; no cloud call is made.',
    },
    hasOutput: true,
    outputSpec:
      'Wrapped key blob (RSA-OAEP part plus AES-KWP part) or HPKE enc || ciphertext; the key imported on the provider side must be the same key the third-party HSM exported, shown by a signature or a key check value and never by reading the key out.',
  },
  {
    id: 'token-migration',
    description: 'Compare ML-DSA, ECDSA, and RSA signing in a token migration workflow',
    algorithms: ['ML-DSA', 'ECDSA', 'RSA'],
    icon: Fingerprint,
    moduleLink: '/learn/iam-pqc?tab=workshop&step=1',
    keywords: ['token', 'migration', 'iam', 'ml-dsa', 'ecdsa', 'rsa', 'multi-algorithm', 'jwt'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Choose a JWT signing algorithm and sign with the browser HSM. Verify the original payload with the local public key, change the received subject, then restore it.',
      workedExample:
        'With ML-DSA-65, the signature grows from the 256-byte RS256 baseline to 3,309 bytes. Verification accepts the original payload, rejects the changed subject and succeeds when the original value is restored.',
    },
    hasOutput: true,
    outputSpec:
      'A signature preview and byte count, plus real PKCS#11 verification of the selected received payload in Live HSM Mode.',
  },
  {
    id: 'firmware-signing',
    // The tool offers ML-DSA-44/65/87 and SLH-DSA-SHA2-128s (PQC_ALGO_OPTIONS in
    // FirmwareSigningMigrator.tsx) and *defaults* to ML-DSA-65 — the previous
    // entry advertised ML-DSA-87 alone, which both under-reported the tool to the
    // algorithm search and named an algorithm the visitor would not be using.
    description:
      'UEFI secure boot firmware signing and verification with ML-DSA-44/65/87 or SLH-DSA (defaults to ML-DSA-65)',
    algorithms: ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'SLH-DSA-SHA2-128s', 'SHA-256'],
    icon: Cpu,
    moduleLink: '/learn/secure-boot-pqc?tab=workshop&step=1',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Upload a firmware binary or use the sample UEFI manifest. Generate classical and PQC key pairs, sign the manifest and verify both signatures. Change the received manifest to test rejection.',
      workedExample:
        'With the defaults — ML-DSA-65 against RSA-2048 with SHA-256 — both signatures come back VERIFIED and the Migration Comparison table shows the signature growing from 256 B to 3,309 B (12.9×).',
    },
    hasOutput: true,
    outputSpec:
      'A PQC signature and a classical signature over the manifest. For an uploaded binary the manifest binds its byte length and SHA-256 digest. Both signatures must verify under their own public keys to finish.',
  },
  {
    id: 'slh-dsa',
    description: 'All 12 FIPS 205 parameter sets with pre-hash support',
    algorithms: ['SLH-DSA', 'SHA2', 'SHAKE'],
    icon: FileSignature,
    moduleLink: '/learn/slh-dsa',
    keywords: ['slh-dsa', 'sphincs', 'fips 205', 'stateless', 'hash-based', 'sign', 'verify'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Pick one of the 12 FIPS 205 parameter sets and a pre-hash mode, then Generate Key Pair, Sign Message and Verify Signature on a real PKCS#11 v3.2 HSM emulator in the browser.',
      workedExample:
        'With the default SHA2-128s set the 32-byte public key appears, the message signs into a 7,856 B (7.7 KB) signature, Verify Signature reports Signature Valid, and the PKCS#11 call log lists every call.',
    },
    hasOutput: true,
    outputSpec:
      'FIPS 205 SLH-DSA signature (hex); verify step must return true under the same key pair. Signature size depends on the parameter set (7,856–49,856 bytes).',
  },
  {
    id: 'lms-hss',
    description: 'LMS and XMSS stateful signature trees using SoftHSMv3',
    algorithms: ['LMS', 'HSS', 'XMSS'],
    icon: FileSignature,
    moduleLink: '/learn/stateful-signatures',
    keywords: ['lms', 'hss', 'xmss', 'stateful', 'hash-based', 'sp 800-208'],
    requires: [],
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
    description:
      'Execute concatenation, nesting and a local shared-binding model; compare component checks and a replacement experiment. Not a security proof.',
    algorithms: ['EC-Schnorr', 'secp256k1', 'ML-DSA-65', 'SHA-256'],
    icon: Fingerprint,
    moduleLink: '/learn/hybrid-crypto?tab=workshop&step=3&sv=2',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Choose Concatenation, Nesting or Shared-binding model (Silithium-inspired), then Generate Key Pairs, Sign and Verify. Read the full-binding and raw-message EC/ML checks. The local model is not the published Silithium scheme, and this page does not claim strong non-separability or a security proof.',
      workedExample:
        'With a valid local-model sample, both full-binding components pass while the separate raw-message checks do not. Recombination Attack retains the EC public key and original EC bytes while signing a replacement ML component with its own key: inspect the actual EC, ML and combined results.',
    },
    hasOutput: true,
    outputSpec:
      'Sample EC-Schnorr + ML-DSA-65 bytes with executed full-binding, raw-component and replacement checks. Results apply to the selected local construction; they do not establish a published profile, interoperability or a security proof.',
  },

  // ── Protocol Simulations ──────────────────────────────────────────────────
  {
    id: 'kdf-derivation',
    description:
      'NIST SP 800-108 counter-mode key derivation — applicable to KEM secrets, PSK, QKD, and password-derived keys',
    algorithms: ['SP 800-108', 'HMAC-SHA256', 'PBKDF2', 'HKDF'],
    icon: KeyRound,
    moduleLink: '/learn/qkd?tab=workshop&step=4',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Generate a local key shaped like an ETSI QKD 014 response and import it into the browser HSM. Compare SP 800-108 counter-mode derivations with the same session context and a one-bit change.',
      workedExample:
        'Run the local HSM sample. Repeating the same inputs reproduces the key. Changing the session context gives a different key from the same imported secret and label.',
    },
    hasOutput: true,
    outputSpec:
      'Three 32-byte derivation outputs in hex for the live HSM sample. With the HSM disabled, the walkthrough displays one labelled illustrative random value.',
  },
  {
    id: 'tee-channel',
    description:
      'Explore sample TEE-HSM provisioning with signature verification, ML-KEM and AES key wrap',
    algorithms: ['ML-DSA', 'ML-KEM-768', 'AES Key Wrap'],
    icon: Cpu,
    moduleLink: '/learn/confidential-computing',
    keywords: ['tee', 'trusted execution', 'confidential', 'channel', 'attestation', 'hsm'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Inspect generated sample attestation messages and signature-gated key unwrap. PQC mode uses ML-DSA-65 and ML-KEM; classical mode uses ECDSA and an independently generated AES wrapping key.',
      workedExample:
        'Run the flow end to end; the PKCS#11 call log shows which call each algorithm makes, and the generated-keys panel shows what ended up where.',
    },
    hasOutput: true,
    outputSpec:
      'Sample signature-verification results; ML-KEM-768 encapsulation ciphertext (1,088 bytes) in PQC mode; AES-wrapped provisioning key. Production quote trust, freshness and measurement-policy checks are outside this sample.',
  },
  {
    id: 'tls-simulator',
    description:
      'Client–server TLS 1.3 handshake simulator: configure cipher suites, classical or hybrid key exchange, and RSA or ML-DSA certificates',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Configure the client and server panels — cipher suites, key exchange groups, an RSA-2048 or ML-DSA identity, optional client verification — then Start Full Interaction to run a real OpenSSL TLS 1.3 handshake.',
      workedExample:
        'With the defaults (X25519MLKEM768 offered first, RSA-2048 certificates) the summary names the negotiated cipher and key exchange, how many KB the handshake moved, and notes that hybrid ML-KEM plus ECDH was used.',
    },
    hasOutput: true,
    outputSpec:
      'OpenSSL TLS 1.3 handshake trace with the negotiated cipher, key exchange group and server handshake signature scheme, or an error when the handshake fails.',
  },
  {
    id: 'vpn-sim',
    description:
      'Full IKEv2 handshake in WASM with PKCS#11 crypto routed through softhsmv3. Inspect live C_* calls, ECDH key exchange, and PSK authentication between initiator and responder.',
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
    requires: ['sab', 'threads', 'chromium'],
    intro: {
      whatYouWillDo:
        'Pick Classical, Hybrid (ECP-256 + ML-KEM) or Pure PQC key exchange, choose the ML-KEM size, set the MTU and fragmentation, choose PSK or certificate auth, then Start Daemon and watch two strongSwan WASM workers run IKEv2.',
      workedExample:
        'Select Hybrid with ML-KEM-768 and Start Daemon: the charon log tags IKE_SA_INIT, IKE_INTERMEDIATE and IKE_AUTH lines, the status turns to Tunnel Established, and Tunnel Statistics report Total Bytes, Round Trips and Quantum-Safe: KEX ✓.',
    },
    hasOutput: true,
    outputSpec:
      'IKEv2 SKEYSEED and child SA keys derived per RFC 7296 (prf+); ECDH shared secret (32 bytes hex); live C_* PKCS#11 call log with CK_RV return codes.',
  },
  {
    id: 'pqc-ssh-sim',
    description:
      'Compare byte sizes and timings from bundled modified OpenSSH handshake samples and modeled token-operation traces. Experimental PQC authentication requires matching peer and build support.',
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
    requires: ['sab', 'threads', 'chromium'],
    intro: {
      whatYouWillDo:
        'Pick a PQC KEX (hybrid or pure ML-KEM) and an ML-DSA or SLH-DSA host key, press Run comparison, then compare the classical curve25519 baseline with the PQC run in the Run Log, PKCS#11 Calls and Wire tabs.',
      workedExample:
        'With the default mlkem768-curve25519-sha256 + ssh-mldsa-65 a real OpenSSH handshake runs: the log reports host and user C_Sign sizes and auth time, and the comparison bars show host pubkey, signature and KEX share bytes.',
    },
    hasOutput: true,
    outputSpec:
      'Algorithm identifiers, key/signature/share byte counts, operation timing and logs. Bundled OpenSSH handshake results and modeled protocol-sequence illustrations are identified separately.',
  },

  // ── Entropy & Random ──────────────────────────────────────────────────────
  {
    id: 'suci-flow',
    // Profiles A/B are the ratified 3GPP TS 33.501 §C.3.3 constructions; Profile C
    // is the post-quantum profile the tool also implements (ML-KEM, hybrid with
    // X25519 or pure). The PQC half was previously absent from `description`,
    // `algorithms` and `keywords` alike, so a catalogue search for "ML-KEM"
    // returned 13 tools and never this one.
    description:
      'Subscriber identity concealment for 5G: ECDH + ANSI X9.63-KDF + AES (Profiles A/B), plus a post-quantum Profile C using ML-KEM in hybrid and pure modes',
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
    requires: ['sab'],
    intro: {
      whatYouWillDo:
        'Enter a 15-digit SUPI, pick Profile A (X25519), Profile B (P-256) or Profile C (ML-KEM, hybrid or pure), then execute eleven steps from home-network key generation to SUCI assembly and SIDF decryption.',
      workedExample:
        'Default SUPI 310260123456789 under Profile A: X25519 ECDH, X9.63-KDF, AES-128 MSIN encryption and a MAC tag, then Decrypt SUCI at SIDF recovers the original SUPI.',
    },
    hasOutput: true,
    outputSpec:
      'Produces the synthetic SUCI, derived-key and decryption trace for the selected profile and learner-supplied demonstration SUPI.',
  },

  // ── Digital Identity ──────────────────────────────────────────────────────
  {
    id: 'mls-group-messaging',
    description:
      'RFC 9420 TreeKEM visualizer + PKCS#11 provider architecture. Add/remove members, trace re-keyed nodes on each Commit, and see how openmls_pqctoday_crypto routes every crypto op through softhsmv3.',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Run the MLS primitives with real keys — ML-DSA-65 credential signing, ML-KEM-768 TreeKEM updates, AES-128-GCM messages — and watch the ratchet tree change as members join.',
      workedExample:
        'Alice and Bob start the group; add a third member and see which nodes on the direct path have to re-key.',
    },
    hasOutput: true,
    outputSpec:
      'Produces credential-signature, key-update and encrypted-message results plus the modelled TreeKEM epoch and re-keyed-node trace.',
    opensourceTool: {
      name: 'openmls',
      url: 'https://github.com/openmls/openmls',
    },
  },
  {
    id: 'tpm-playground',
    description:
      'Execute raw TPM 2.0 Post-Quantum operations entirely in the browser using the WebAssembly-compiled pqctpm emulator.',
    algorithms: ['ML-KEM-768', 'ML-DSA-65', 'WASM'],
    icon: Cpu,
    // Wave B (2026-09-18): pointed at itself since it shipped, so no Learn
    // module ever offered it back. secure-boot-pqc teaches the same TPM 2.0
    // attestation and key-hierarchy material this tool executes.
    moduleLink: '/learn/secure-boot-pqc',
    keywords: ['tpm', 'pqc', 'wasm', 'ml-kem', 'ml-dsa', 'hardware', 'tcg'],
    requires: ['sab'],
    intro: {
      whatYouWillDo:
        'Send raw TPM 2.0 commands from the Command Builder — TPM2_GetCapability, TPM2_CreatePrimary, TPM2_Encapsulate, TPM2_SignDigest — with ML-KEM or ML-DSA, then run Quote or Certify on the Attestation tab.',
      workedExample:
        'On Attestation keep the ML-DSA-65 key, PCRs sha256:0,1,2,3,7 and the default nonce, press Run Quote: the result shows the 3309-byte signature, OpenSSL WASM verify says Signature Verified Successfully, plus a JSON bundle.',
    },
    hasOutput: true,
    outputSpec:
      'Attestation exports sample report bytes and an AK signature for separate inspection. Format and signature checks do not by themselves establish trusted hardware origin, freshness or an acceptable PCR policy.',
  },
  {
    id: 'rng-demo',
    description: 'Web Crypto + OpenSSL DRBG random generation with statistical analysis',
    algorithms: ['Web Crypto', 'OpenSSL DRBG'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness?tab=workshop&step=0',
    keywords: ['random', 'rng', 'drbg', 'web crypto', 'openssl', 'math.random', 'statistics'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Generate random bytes from Web Crypto, OpenSSL WASM, Math.random() and a linear congruential generator, and run the same statistical tests on each.',
      workedExample:
        'Generate from the LCG source, then predict its next output from its internal state after generation — the prediction matches even though the LCG usually lands within range on the visual checks.',
    },
    hasOutput: true,
    outputSpec:
      'Produces sample bytes, source-labelled visual statistics and, for the LCG, the predicted next output from exposed state.',
  },
  {
    id: 'qrng-demo',
    // Entropy remediation P0.7/P0.8 (2026-09-24): the module's QRNG workshop step
    // was removed, so this links to the module root, not a step. The description
    // says "simulation" first so no surface implies QRNG hardware or evidence.
    description:
      'Simulation — no QRNG hardware involved. Compares a simulated QRNG sample (crypto.getRandomValues() output, not a quantum source), live Web Crypto output and a deliberately broken PRNG on the same grouped checks, which cannot show whether any source is quantum.',
    algorithms: ['TRNG', 'Web Crypto'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness',
    keywords: ['qrng', 'quantum random', 'trng', 'true random', 'statistics'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Compare a simulated QRNG sample, a CSPRNG sample and a deliberately broken PRNG on the same visual checks and SP 800-90B health tests, shown as separate groups.',
      workedExample:
        'Run the checks on all three samples: only the weak PRNG stands out, because the simulated QRNG and the CSPRNG are the same kind of output.',
    },
    hasOutput: true,
    outputSpec:
      'Produces source-labelled synthetic sample bytes and grouped statistical/health-test results; it produces no QRNG hardware evidence.',
  },
  {
    id: 'entropy-test',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Load a sample (Generate Random, All Zeros and Incrementing are 64 bytes; Repeating Pattern is 1,024 bytes; or Paste Hex), press Run the checks, and read each group separately: visual checks, health tests, estimators (not run here) and primitive self-checks.',
      workedExample:
        'Load Repeating Pattern (deadbeef repeated over 1,024 bytes) and run: the visual checks flag the pattern, Adaptive Proportion signals a failure on two full 512-sample windows (0xDE recurs 128 times against a cutoff of 13), Repetition Count stays quiet, and each result shows its value, its cutoff and its limit.',
    },
    hasOutput: true,
    outputSpec:
      'Produces grouped visual checks, SP 800-90B health-test outcomes and primitive self-checks for the displayed sample (64 or 1,024 bytes); no entropy estimate.',
  },
  {
    id: 'drbg-demo',
    description:
      'Interactive HMAC_DRBG (SHA-256) state machine — Instantiate, Generate, Reseed as specified in NIST SP 800-90A Rev. 1 §10.1.2 — with a known-answer check against pinned NIST ACVP and CAVP vectors.',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Instantiate HMAC_DRBG from a 32-byte entropy input, a nonce and a personalization string, then press Generate and Reseed while the Internal State Tracker shows the working key K, state value V and reseed_counter. Run the known-answer check to compare the same code with NIST vectors.',
      workedExample:
        'Instantiate with the default personalization string and generate 32 bytes ten times: reseed_counter reaches 11, above the demo interval of 10, so a Reseed required banner blocks Generate until you press Reseed, which resets it to 1.',
    },
    hasOutput: true,
    outputSpec:
      'Produces HMAC_DRBG output bytes, K/V/reseed-counter transitions and a known-answer comparison tied to the displayed inputs.',
  },

  // ── Certificates & Proofs ─────────────────────────────────────────────────
  {
    id: 'source-combining',
    // Entropy remediation P0 cleanup (2026-09-24): HKDF was listed as a
    // conditioning function. It is only the workshop's demonstration expansion
    // step — not an SP 800-90A DRBG and not part of an SP 800-90C construction.
    // Conditioning is Hash_df, SHA-256, HMAC-SHA-256 or AES-CMAC.
    description:
      'Two simulated raw sources: SP 800-90B health tests before conditioning, SP 800-90C concatenation (XOR, hash and HMAC as educational variants), Hash_df/SHA-256/HMAC/AES-CMAC conditioning via SoftHSMv3, and an assumption-driven verdict that can end in "not enough evidence" or "unsafe".',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Health-test two simulated raw sources, assemble their samples with SP 800-90C concatenation, condition the result, then state the assumptions the combined construction rests on.',
      workedExample:
        'Load the Stuck source, detected counterexample: the health tests exclude Source A before conditioning, and Source B alone falls short of the 384 bits a 256-bit DRBG needs, so the verdict is Not enough evidence.',
    },
    hasOutput: true,
    outputSpec:
      'Produces source health-test outcomes, the conditioned output and an assumption-led sufficiency verdict for the simulated sources.',
  },
  {
    id: 'pki-workshop',
    description:
      'Build a full certificate chain hands-on: CSR → Root CA → cert issuance → parsing → CRL',
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
    requires: [],
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
    intro: {
      whatYouWillDo:
        'Compare estimated certificate-related TLS payload and annual leaf issuance for classical and PQC three-level chains, without CPU predictions.',
      workedExample:
        'Set a 240-day renewal interval: the annualized rate is 365/240, about 1.520833. TLS sends the intermediate and leaf, excludes the root, and adds one server signature contribution.',
    },
    description:
      'Estimate certificate-related TLS payload and annual leaf issuance storage for classical and PQC three-level chains. Adjust renewal cadence and encoding assumptions; no CPU prediction.',
    algorithms: ['RSA-2048', 'ECDSA P-256', 'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'],
    icon: BarChart2,
    moduleLink: '/learn/pki-workshop',
    keywords: [
      'certificate',
      'capacity',
      'storage',
      'bandwidth',
      'ml-dsa',
      'pki',
      'migration',
      'sizing',
    ],
    requires: [],
    hasOutput: false,
  },
  {
    id: 'hybrid-certs',
    description:
      'Compare X.509 certificate formats, RFC 10073 composite signatures, and real TLS handshakes with a classical baseline',
    algorithms: ['SLH-DSA', 'ML-DSA-65', 'ECDSA-P256'],
    icon: ShieldCheck,
    moduleLink: '/learn/hybrid-crypto?tab=workshop&step=5&sv=2',
    keywords: ['certificate', 'x509', 'composite', 'hybrid', 'pqc', 'openssl', 'der'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Run the certificate-to-TLS exercise to compare classical and hybrid key exchange with RSA and ML-DSA authentication. Then enable the HSM and generate certificate formats to inspect their signatures, legacy acceptance and TLS applicability. Advanced and historical examples are generated separately.',
      workedExample:
        'Run the RSA baseline, then keep the same RSA certificate while switching to X25519MLKEM768: key exchange changes, but CertificateVerify remains RSA. The ML-DSA run changes authentication too.',
    },
    hasOutput: true,
    outputSpec:
      'DER-encoded X.509 certificates for each format — CA-issued where the format calls for it — each with its signature, issuer chain and key usage verified by an implementation other than the HSM that signed it.',
  },
  {
    id: 'merkle-proof',
    description:
      'Build trees, generate inclusion proofs, verify with tamper detection, compare PQC cert sizes, and simulate Certificate Transparency logs',
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
    requires: [],
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
    description:
      'Explore sample wallet representations, PID issuance, attestation and relying-party checks, plus a modelled QES workflow.',
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
    requires: [],
    intro: {
      whatYouWillDo:
        'Walk five sample steps: inspect the wallet, issue a sample PID, receive a sample diploma attestation, present selected attributes to the relying-party exercise, then explore a modelled QTSP-signing workflow.',
      workedExample:
        'Present a sample PID to see the bank refuse the missing degree. Issue the diploma, compare an audience mismatch with a complete presentation for the intended bank, and inspect which PID fields were shared.',
    },
    hasOutput: true,
    outputSpec:
      'Produces synthetic wallet credentials, consented presentation state and a modelled qualified-signature workflow; no real identity or trust-service transaction.',
  },

  // ── Blockchain / Digital Assets ───────────────────────────────────────────
  {
    id: 'bitcoin-flow',
    description: 'secp256k1 ECDSA keypair, SHA256 + RIPEMD160, transaction signing',
    algorithms: ['secp256k1', 'SHA-256', 'RIPEMD160'],
    icon: Bitcoin,
    moduleLink: '/learn/digital-assets?tab=workshop&flow=bitcoin',
    keywords: ['bitcoin', 'secp256k1', 'ecdsa', 'transaction', 'utxo', 'sha256', 'ripemd160'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Run nine steps: generate the source key, extract its public key, create the source address, generate a recipient key and address, format the transaction, visualize the message, sign it and verify the signature.',
      workedExample:
        'Format the sample 0.5 BTC transfer, sign it with secp256k1 ECDSA and verify the original. Increase the first output by one satoshi and try the same signature again.',
    },
    hasOutput: true,
    outputSpec:
      '33-byte compressed secp256k1 public key, a raw 64-byte r || s signature over the double SHA-256 of the sample JSON, and the verification results.',
  },
  {
    id: 'hd-wallet',
    description: 'BIP39 mnemonic + BIP32/SLIP-0010 multi-coin HD key derivation',
    algorithms: ['BIP39', 'BIP32', 'PBKDF2', 'HMAC-SHA512'],
    icon: Workflow,
    moduleLink: '/learn/digital-assets?tab=workshop&flow=hd-wallet',
    keywords: ['hd wallet', 'bip39', 'bip32', 'mnemonic', 'derivation', 'pbkdf2', 'slip-0010'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Generate a BIP39 mnemonic, derive the seed with PBKDF2, see hardened versus non-hardened derivation, derive Bitcoin, Ethereum and Solana addresses, then read the quantum threat assessment.',
      workedExample:
        "Generate Mnemonic gives 24 words from 32 bytes of entropy; Derive Accounts then shows a Bitcoin address at m/44'/0'/0'/0/0, an Ethereum address at m/44'/60'/0'/0/0 and a Solana address at m/44'/501'/0'/0'.",
    },
    hasOutput: true,
    outputSpec:
      'BIP39 mnemonic, derived sample account addresses and a BIP 32 reference check for the software token’s public derivation.',
  },

  // ── OpenSSL Studio ────────────────────────────────────────────────────────
  {
    id: 'solana-flow',
    description: 'Ed25519 keypair generation and transaction signing',
    algorithms: ['Ed25519'],
    icon: Zap,
    moduleLink: '/learn/digital-assets?tab=workshop&flow=solana',
    keywords: ['solana', 'ed25519', 'eddsa', 'transaction', 'base58'],
    requires: [],
    intro: {
      whatYouWillDo:
        'Follow a Solana transfer from an Ed25519 keypair to an address, a formatted transaction and a signed message.',
      workedExample:
        'Sign the sample JSON message, change one message or signature byte and compare the verification result with the original.',
    },
    hasOutput: true,
    outputSpec:
      '32-byte Ed25519 public key, 64-byte signature over the sample JSON message and the result of verifying the original or changed bytes.',
  },
  {
    id: 'openssl-studio',
    description:
      'Full OpenSSL v3.6.3 environment: keygen, certificates, CSR, KEM, signing, KDF, encryption — all via WASM',
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
    requires: [],
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
    description:
      // The JWE half names the draft revisions it was verified against
      // (hpke-encrypt-22, hpke-pq-pqt-02). The earlier direct-KEM JWE
      // (draft-ietf-jose-pqc-kem-05) was removed when -06 narrowed to COSE.
      'Sign JWTs with ML-DSA-44/65/87, SLH-DSA, and composite ML-DSA-65+Ed25519 using real @noble/post-quantum or softhsmv3 PKCS#11. Encrypt them as HPKE JWE with ML-KEM-768 or ML-KEM-768 + X25519 per draft-ietf-jose-hpke-encrypt-22 and draft-ietf-jose-hpke-pq-pqt-02, in the browser or entirely inside softhsmv3 (PQCToday candidate CKM_HPKE mechanism).',
    algorithms: [
      'ML-DSA-44',
      'ML-DSA-65',
      'ML-DSA-87',
      'SLH-DSA-SHA2-128s',
      'ML-KEM-768',
      'X-Wing',
      'HPKE',
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
      'hpke',
      'draft-ietf-jose-hpke-encrypt',
      'draft-ietf-jose-hpke-pq-pqt',
      'noble',
      'softhsmv3',
      'pkcs11',
    ],
    requires: [],
    intro: {
      whatYouWillDo:
        'Open seven sections: inspect a JWT, sign one with ML-DSA or SLH-DSA, build a composite ML-DSA-65+Ed25519 JWT, encrypt a payload as an HPKE JWE with ML-KEM-768 or the X25519 hybrid, compare token sizes, run the JOSE known-answer audit, and attack a JWT verifier in the Attack Lab.',
      workedExample:
        "In PQC JWT Signing pick ML-DSA-65 on the @noble/post-quantum backend, Generate Keypair, sign the sample payload for Alice Engineer, then Verify (noble) reports Signature valid with the token's byte sizes.",
    },
    hasOutput: true,
    outputSpec:
      'Signed JWT with ML-DSA header; verifyJWS() must return true with the matching public key. JWE path: plaintext round-trips through ML-KEM-768 encap/decap.',
  },
  {
    id: 'pki-enrollment',
    description:
      'RFC 7030 EST + RFC 4210/9810 CMP — generate an ML-DSA-65 key, run CMP IR against an in-WASM mock CA, verify the issued cert.',
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
    requires: [],
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
    description:
      'Real OpenSSL 3.6 WASM CMS SignedData sign+verify (ML-DSA-44/65/87, SLH-DSA, RSA-PSS) and ML-KEM-768 AuthEnvelopedData encrypt+decrypt. Toggle routes signing key through softhsmv3 PKCS#11.',
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
    requires: [],
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

// A sandbox scenario keeps a real *domain* category; "runs in a container" is a
// facet (`sandbox: true`), not a category. Which domain, which track, which
// roles it suits and where it sits are all rows of the tools data file
// (`sbx-<scenario id>`), the same as for any other tool.

const CONTENT_BY_ID = new Map(WORKSHOP_TOOL_CONTENT.map((content) => [content.id, content]))

function browserTool(record: PlaygroundToolRecord): WorkshopTool {
  const content = CONTENT_BY_ID.get(record.toolId)
  if (!content) {
    throw new Error(`tools data file lists "${record.toolId}" but workshopRegistry has no entry`)
  }
  return {
    ...content,
    pt_id: record.ptId,
    version: record.version,
    name: record.name,
    category: record.category,
    difficulty: record.level,
    recommendedPersonas: [...record.recommendedPersonas],
  }
}

const SANDBOX_RECORD_BY_ID = new Map(SANDBOX_TOOL_RECORDS.map((record) => [record.toolId, record]))

const SANDBOX_TOOLS: WorkshopTool[] = SANDBOX_SCENARIOS.map((s) => {
  const id = `${SANDBOX_TOOL_PREFIX}${s.id}`
  const record = SANDBOX_RECORD_BY_ID.get(id)
  if (!record)
    throw new Error(`sandbox scenario "${s.id}" has no row "${id}" in the tools data file`)
  return {
    id,
    pt_id: record.ptId,
    // Generated, not literal: a sandbox tool is versioned with its scenario sync.
    version: '1.0.0',
    name: record.name,
    description: s.useCase.length > 120 ? `${s.useCase.slice(0, 117)}...` : s.useCase,
    category: record.category,
    sandbox: true,
    algorithms: s.algorithms,
    icon: SANDBOX_ICONS[record.sandboxTrack],
    moduleLink: '',
    keywords: Array.from(
      new Set(
        [s.id, s.tool.name, record.sandboxTrack, 'sandbox', ...s.algorithms].map((k) =>
          k.toLowerCase()
        )
      )
    ),
    difficulty: record.level,
    // One shared declaration for all sandbox scenarios: they are not browser-runnable
    // at all. Declaring a browser capability like 'sab' here would make the device
    // badge lie — these do not fail a capability check, they run somewhere else.
    requires: ['container'],
    recommendedPersonas: [...record.recommendedPersonas],
    ...(record.workInProgress ? { wip: true } : {}),
    opensourceTool: { name: s.tool.name, url: s.tool.url },
  }
})

if (
  CONTENT_BY_ID.size !== WORKSHOP_TOOL_CONTENT.length ||
  CONTENT_BY_ID.size !== PLAYGROUND_TOOL_RECORDS.length ||
  SANDBOX_TOOLS.length !== SANDBOX_TOOL_RECORDS.length
) {
  throw new Error('tools data file and tool registry list different tools')
}

const ORDER_BY_ID = new Map(
  [...PLAYGROUND_TOOL_RECORDS, ...SANDBOX_TOOL_RECORDS].map((record) => [
    record.toolId,
    record.order,
  ])
)

/** Every Crypto Lab tool in the order of the tools data file (`order` column). */
export const WORKSHOP_TOOLS: WorkshopTool[] = [
  ...PLAYGROUND_TOOL_RECORDS.map(browserTool),
  ...SANDBOX_TOOLS,
].sort((a, b) => (ORDER_BY_ID.get(a.id) ?? 0) - (ORDER_BY_ID.get(b.id) ?? 0))

/** How many Docker-backed sandbox scenarios the registry holds. The desktop header and the phone
 *  note both read this one number. */
export const SANDBOX_TOOL_COUNT = WORKSHOP_TOOLS.filter((t) => t.sandbox).length

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
  'cloud-kms-key-exchange': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/KmsPqc/workshop/CloudKmsKeyExchange').then((m) => ({
      default: m.CloudKmsKeyExchange,
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
