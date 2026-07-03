// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical sample enterprise cryptographic estate (shared @/data resource).
 *
 * Promoted from the crypto-mgmt module's local SAMPLE_INVENTORY so the CBOM
 * module, the Inventory Lifecycle Simulator, and any future tool share ONE
 * dataset. The original lifecycle fields are preserved verbatim; the CBOM
 * tools add discovery-layer, key-management, and SPKI-fingerprint fields.
 * Algorithm facts come from `@/data/algorithmProperties` (ALGORITHM_REGISTRY).
 */

export type AssetClass = 'certificates' | 'libraries' | 'software' | 'keys'
export type ClassifyTag = 'HNDL' | 'FIPS-required' | 'CNSA-scope' | 'DORA' | 'PCI' | 'internal'
export type LoopStage = 'discover' | 'classify' | 'score' | 'remediate' | 'attest' | 'reassess'

export type DiscoveryLayer = 'source' | 'binary' | 'network' | 'infra' | 'cloud'
export type KeyMgmt = 'software' | 'hsm' | 'kms'
export type ToolId =
  | 'vuln-scanner'
  | 'clm'
  | 'sbom'
  | 'cspm'
  | 'cbomkit-source'
  | 'cbomkit-theia'
  | 'hsm-query'

export interface DiscoveryTool {
  id: ToolId
  name: string
  note: string
  /** false = something you already run; true = a net-new scanner to deploy */
  netNew: boolean
}

/** Discovery tools, mirroring the real categories in pqc-testing's TESTING_TOOLS. */
export const DISCOVERY_TOOLS: DiscoveryTool[] = [
  {
    id: 'vuln-scanner',
    name: 'Qualys / Tenable / Rapid7',
    note: 'network & TLS endpoints',
    netNew: false,
  },
  {
    id: 'clm',
    name: 'Venafi / Keyfactor / DigiCert',
    note: 'certificate lifecycle + CT logs',
    netNew: false,
  },
  { id: 'sbom', name: 'SBOM / SCA pipeline', note: 'library versions', netNew: false },
  {
    id: 'cspm',
    name: 'CSPM (Wiz / Prisma / Defender)',
    note: 'cloud KMS & posture',
    netNew: false,
  },
  {
    id: 'cbomkit-source',
    name: 'CBOMkit · sonar-cryptography',
    note: 'source-code scan',
    netNew: true,
  },
  { id: 'cbomkit-theia', name: 'CBOMkit-theia', note: 'binary / container scan', netNew: true },
  { id: 'hsm-query', name: 'PKCS#11 / KMIP query', note: 'HSM / KMS inventory', netNew: true },
]

export const LAYERS: { id: DiscoveryLayer; label: string }[] = [
  { id: 'source', label: 'Source code' },
  { id: 'binary', label: 'Binary / container' },
  { id: 'network', label: 'Network / TLS' },
  { id: 'infra', label: 'Infrastructure / KMS' },
  { id: 'cloud', label: 'Cloud' },
]

export interface InventoryAsset {
  id: string
  class: AssetClass
  name: string
  owner: string
  currentAlgorithm: string
  quantumVulnerable: boolean
  tags: ClassifyTag[]
  riskScore: 1 | 2 | 3 | 4 | 5 // 5 = worst
  remediation: string
  initialStage: LoopStage
  // ── CBOM discovery fields ──
  layer: DiscoveryLayer
  discoverableBy: ToolId[]
  management: KeyMgmt
  /** Canonical algorithm token for ALGORITHM_REGISTRY lookups (null if symmetric/unparsed). */
  registryKey: string | null
  /** SPKI fingerprint; null for symmetric keys. Equal values ⇒ one logical key. */
  spki: string | null
}

// SPKI fingerprints identify each asymmetric key. An asset found by several
// tools yields several raw findings of the SAME key — the Key Correlator
// collapses them by fingerprint.

export const SAMPLE_INVENTORY: InventoryAsset[] = [
  // Certificates
  {
    id: 'cert-prod-api',
    class: 'certificates',
    name: 'prod-api.example.com TLS',
    owner: 'Platform SRE',
    currentAlgorithm: 'ECDSA P-256 / SHA-256',
    quantumVulnerable: true,
    tags: ['HNDL', 'FIPS-required'],
    riskScore: 3,
    remediation: 'Enable hybrid X25519+ML-KEM-768 at edge; stage cert rotation via ACME',
    initialStage: 'discover',
    layer: 'network',
    discoverableBy: ['vuln-scanner', 'clm'],
    management: 'hsm',
    registryKey: 'ECDSA P-256',
    spki: 'SHA256:7d41…b2',
  },
  {
    id: 'cert-shadow-legacy',
    class: 'certificates',
    name: 'legacy-payroll.corp.internal (shadow)',
    owner: 'Unknown (discovered via CT log)',
    currentAlgorithm: 'RSA-2048 / SHA-256',
    quantumVulnerable: true,
    tags: ['internal', 'HNDL'],
    riskScore: 5,
    remediation:
      'Attribute ownership, enrol into CLM, schedule renewal via EST, consider decommission',
    initialStage: 'discover',
    layer: 'network',
    discoverableBy: ['clm'],
    management: 'software',
    registryKey: 'RSA-2048',
    spki: 'SHA256:0b88…3e',
  },
  {
    id: 'cert-intermediate-ca',
    class: 'certificates',
    name: 'Corp Issuing CA G3',
    owner: 'PKI Ops',
    currentAlgorithm: 'RSA-4096 / SHA-256',
    quantumVulnerable: true,
    tags: ['CNSA-scope', 'FIPS-required'],
    riskScore: 4,
    remediation: 'Plan intermediate-CA rotation with hybrid RSA+ML-DSA-87; rehearse runbook in lab',
    initialStage: 'classify',
    layer: 'network',
    discoverableBy: ['clm', 'vuln-scanner'],
    management: 'hsm',
    registryKey: 'RSA-4096',
    spki: 'SHA256:1a9c…ef',
  },
  // Libraries
  {
    id: 'lib-openssl-1.1.1',
    class: 'libraries',
    name: 'OpenSSL 1.1.1w (EoL)',
    owner: 'Core Services',
    currentAlgorithm: 'TLS 1.2 stack, RSA/ECDSA',
    quantumVulnerable: true,
    tags: ['FIPS-required', 'HNDL'],
    riskScore: 5,
    remediation: 'Migrate to OpenSSL 3.5 LTS with FIPS provider; validate against CMVP #4985',
    initialStage: 'score',
    layer: 'binary',
    discoverableBy: ['sbom', 'cbomkit-theia'],
    management: 'software',
    registryKey: null,
    spki: null,
  },
  {
    id: 'lib-bc-java',
    class: 'libraries',
    name: 'Bouncy Castle (Java, non-FIPS)',
    owner: 'Payments Platform',
    currentAlgorithm: 'RSA, ECDSA, SHA-256',
    quantumVulnerable: true,
    tags: ['PCI', 'FIPS-required'],
    riskScore: 4,
    remediation:
      'Swap to BC FIPS 2.0.0 (CMVP #4616); re-run ACVP tests when implementation guidance updates land',
    initialStage: 'remediate',
    layer: 'source',
    discoverableBy: ['sbom', 'cbomkit-source'],
    management: 'software',
    registryKey: null,
    spki: null,
  },
  {
    id: 'lib-liboqs',
    class: 'libraries',
    name: 'liboqs 0.12.0 (research pilot)',
    owner: 'Quantum Readiness WG',
    currentAlgorithm: 'ML-KEM, ML-DSA, SLH-DSA',
    quantumVulnerable: false,
    tags: ['internal'],
    riskScore: 2,
    remediation: 'Keep behind FIPS shim for production; track CVE feed; re-pin weekly',
    initialStage: 'attest',
    layer: 'binary',
    discoverableBy: ['sbom'],
    management: 'software',
    registryKey: 'ML-KEM-768',
    spki: null,
  },
  // Software
  {
    id: 'sw-batch-signer',
    class: 'software',
    name: 'Nightly Batch Signer (Python)',
    owner: 'Data Platform',
    currentAlgorithm: 'RSA-2048 via PyCryptodome',
    quantumVulnerable: true,
    tags: ['HNDL', 'internal'],
    riskScore: 3,
    remediation: 'Migrate to python-cryptography with aws-lc-rs FIPS backend; swap to ML-DSA-65',
    initialStage: 'discover',
    layer: 'source',
    discoverableBy: ['cbomkit-source'],
    management: 'software',
    registryKey: 'RSA-2048',
    spki: 'SHA256:33aa…41',
  },
  {
    id: 'sw-custom-crypto',
    class: 'software',
    name: 'Custom in-house crypto helpers (grep-discovered)',
    owner: 'Legacy Apps',
    currentAlgorithm: 'Hand-rolled AES-CBC, SHA-1 HMAC',
    quantumVulnerable: true,
    tags: ['HNDL', 'PCI'],
    riskScore: 5,
    remediation: 'Replace with vetted library; deprecate SHA-1 HMAC immediately',
    initialStage: 'classify',
    layer: 'source',
    discoverableBy: ['cbomkit-source'],
    management: 'software',
    registryKey: null,
    spki: null,
  },
  // Keys
  {
    id: 'key-root-ca-signing',
    class: 'keys',
    name: 'Root CA signing key (Luna 7 HSM)',
    owner: 'PKI Ops',
    currentAlgorithm: 'RSA-4096',
    quantumVulnerable: true,
    tags: ['CNSA-scope', 'FIPS-required'],
    riskScore: 4,
    remediation: 'Plan ML-DSA-87 dual-sign migration using Luna firmware 7.9+ PQC path',
    initialStage: 'score',
    layer: 'infra',
    discoverableBy: ['hsm-query', 'clm'],
    management: 'hsm',
    registryKey: 'RSA-4096',
    spki: 'SHA256:4f7d…91',
  },
  {
    id: 'key-kek-kms',
    class: 'keys',
    name: 'KEK in Azure Dedicated HSM',
    owner: 'Cloud Security',
    currentAlgorithm: 'AES-256 wrapped via RSA-3072',
    quantumVulnerable: true,
    tags: ['FIPS-required', 'DORA'],
    riskScore: 5,
    remediation: 'Request migration to active PQC firmware or hybrid X25519+ML-KEM-768 wrap',
    initialStage: 'discover',
    layer: 'cloud',
    discoverableBy: ['cspm', 'hsm-query'],
    management: 'kms',
    registryKey: 'RSA-3072',
    spki: 'SHA256:71bd…3c',
  },
  {
    id: 'key-signing-code',
    class: 'keys',
    name: 'Code-signing key (YubiHSM 2)',
    owner: 'DevEx',
    currentAlgorithm: 'ECDSA P-384',
    quantumVulnerable: true,
    tags: ['HNDL'],
    riskScore: 3,
    remediation: 'Upgrade to ML-DSA-65 once YubiHSM PQC firmware ships; pilot on non-prod',
    initialStage: 'remediate',
    layer: 'infra',
    discoverableBy: ['hsm-query'],
    management: 'hsm',
    registryKey: 'ECDSA P-384',
    spki: 'SHA256:c2b0…9a',
  },
  // A true ghost: no tool parses it (legacy appliance), surfaced only by manual/passive note.
  {
    id: 'legacy-appliance',
    class: 'software',
    name: 'Legacy crypto appliance (firmware blob)',
    owner: 'Unknown',
    currentAlgorithm: '(unparsed)',
    quantumVulnerable: true,
    tags: ['HNDL', 'internal'],
    riskScore: 5,
    remediation: 'Vendor EoL; passive-capture the handshake, plan replacement',
    initialStage: 'discover',
    layer: 'network',
    discoverableBy: [],
    management: 'software',
    registryKey: null,
    spki: null,
  },
]

export const LOOP_STAGES: LoopStage[] = [
  'discover',
  'classify',
  'score',
  'remediate',
  'attest',
  'reassess',
]

export const LOOP_STAGE_LABELS: Record<LoopStage, string> = {
  discover: 'Discover',
  classify: 'Classify',
  score: 'Score',
  remediate: 'Remediate',
  attest: 'Attest',
  reassess: 'Reassess',
}
