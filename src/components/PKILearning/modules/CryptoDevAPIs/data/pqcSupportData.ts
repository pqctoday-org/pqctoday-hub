// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Single source of truth for "which runtime / library supports which
 * standardised PQC algorithm" in this module.
 *
 * RUNTIME_SUPPORT is the table. Every other data file in the module
 * (languageData, apiData, migrationData, the API × algorithm matrix below,
 * the Learn tab's readiness list) reads status from it through the helpers at
 * the bottom of this file instead of hard-coding its own booleans or strings.
 *
 * Each row separates primitive availability (status / minVersion / backend)
 * from protocol integration (protocolNote): a library can expose ML-KEM as a
 * primitive long before its TLS stack negotiates it, and the reverse.
 *
 * supportTable.test.ts fails when a row has no evidenceUrl or when its
 * checkedDate is more than 180 days older than TABLE_REVIEW_DATE.
 */

/** Primitive availability of one algorithm in one runtime or library. */
export type SupportStatus =
  'stable' | 'experimental' | 'preview' | 'not-implemented' | 'third-party-only'

/** The API × algorithm matrix also tracks standards that have not shipped yet. */
export type MatrixStatus = SupportStatus | 'planned'

export type StandardAlgorithm = 'ML-KEM' | 'ML-DSA' | 'SLH-DSA'

export type RuntimeId =
  'go' | 'python-cryptography' | 'dotnet' | 'java' | 'windows-cng' | 'openssl' | 'bouncy-castle'

export interface RuntimeSupportRow {
  runtimeId: RuntimeId
  /** Runtime or library as a reader would name it */
  runtime: string
  /** The API, package, class or provider that exposes the algorithm */
  api: string
  algorithm: StandardAlgorithm
  status: SupportStatus
  /** First release that ships it ('—' when not implemented) */
  minVersion: string
  /** Backend, OS or build dependency that decides whether it is really there */
  backend: string
  /** Protocol integration (TLS, X.509), kept separate from primitive availability */
  protocolNote: string
  evidenceUrl: string
  /** ISO date the row was last checked against evidenceUrl */
  checkedDate: string
  /** Id of the runnable sample that exercises this row, when one exists */
  sampleId?: string
  codeSnippet?: string
}

/** Date the table as a whole was last reviewed. Rows older than 180 days before it fail the guard test. */
export const TABLE_REVIEW_DATE = '2026-10-27'

const CHECKED = '2026-10-15'

/** Java rows re-checked against Oracle's October 2026 Critical Patch Update release notes. */
const JAVA_CHECKED = '2026-10-27'
const ORACLE_JDK_RELNOTES = 'https://www.oracle.com/java/technologies/javase/'

const GO_124 = 'https://go.dev/doc/go1.24'
const GO_127 = 'https://go.dev/doc/go1.27'
const PYCA = 'https://cryptography.io/en/latest/changelog/'
const DOTNET_API = 'https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.'
const CNG_IDS = 'https://learn.microsoft.com/en-us/windows/win32/seccng/cng-algorithm-identifiers'
const OPENSSL_35 = 'https://openssl-library.org/news/openssl-3.5-notes/'
const BC_JAVA = 'https://www.bouncycastle.org/download/bouncy-castle-java/'

export const RUNTIME_SUPPORT: RuntimeSupportRow[] = [
  // Go standard library
  {
    runtimeId: 'go',
    runtime: 'Go standard library',
    api: 'crypto/mlkem',
    algorithm: 'ML-KEM',
    status: 'stable',
    minVersion: 'Go 1.24',
    backend: 'Pure Go, no cgo. ML-KEM-768 and ML-KEM-1024 only (no ML-KEM-512).',
    protocolNote:
      'crypto/tls enables X25519MLKEM768 by default since Go 1.24 (GODEBUG tlsmlkem=0 reverts). MLKEM1024 key exchange added in Go 1.27, opt-in via Config.CurvePreferences.',
    evidenceUrl: GO_124,
    checkedDate: CHECKED,
    sampleId: 'go-mlkem',
    codeSnippet:
      'dk, _ := mlkem.GenerateKey768()\nsharedKey, ciphertext := dk.EncapsulationKey().Encapsulate()',
  },
  {
    runtimeId: 'go',
    runtime: 'Go standard library',
    api: 'crypto/mldsa',
    algorithm: 'ML-DSA',
    status: 'stable',
    minVersion: 'Go 1.27',
    backend: 'Pure Go, no cgo.',
    protocolNote:
      'Go 1.27: crypto/x509 supports ML-DSA keys and signatures; crypto/tls supports ML-DSA signatures in TLS 1.3 (MLDSA44, MLDSA65, MLDSA87 signature schemes).',
    evidenceUrl: GO_127,
    checkedDate: CHECKED,
    sampleId: 'go-mldsa',
  },
  {
    runtimeId: 'go',
    runtime: 'Go standard library',
    api: 'github.com/cloudflare/circl/sign/slhdsa',
    algorithm: 'SLH-DSA',
    status: 'third-party-only',
    minVersion: '—',
    backend: 'Not in the standard library; cloudflare/circl provides it in pure Go.',
    protocolNote: 'No SLH-DSA in crypto/tls or crypto/x509.',
    evidenceUrl: 'https://pkg.go.dev/github.com/cloudflare/circl/sign/slhdsa',
    checkedDate: CHECKED,
  },

  // Python — pyca/cryptography
  {
    runtimeId: 'python-cryptography',
    runtime: 'Python cryptography (pyca)',
    api: 'ML-KEM module',
    algorithm: 'ML-KEM',
    status: 'stable',
    minVersion: '47.0.0 with AWS-LC or BoringSSL; 48.0.0 with OpenSSL 3.5.0+',
    backend:
      'Depends on the linked crypto library. From 48.0.0 the official wheels (which bundle OpenSSL 3.5 or later) include it; 47.x wheels did not.',
    protocolNote:
      'cryptography does not do TLS. Python’s ssl module uses the system OpenSSL; OpenSSL 3.5+ offers X25519MLKEM768 in its default key shares.',
    evidenceUrl: PYCA,
    checkedDate: CHECKED,
    sampleId: 'python-mlkem',
  },
  {
    runtimeId: 'python-cryptography',
    runtime: 'Python cryptography (pyca)',
    api: 'ML-DSA module',
    algorithm: 'ML-DSA',
    status: 'stable',
    minVersion: '47.0.0 with AWS-LC or BoringSSL; 48.0.0 with OpenSSL 3.5.0+',
    backend:
      'Depends on the linked crypto library. From 48.0.0 the official wheels (which bundle OpenSSL 3.5 or later) include it.',
    protocolNote:
      'Later releases added ML-DSA to X.509 certificate, CSR and CRL signing and verification; check the changelog for the exact version you need.',
    evidenceUrl: PYCA,
    checkedDate: CHECKED,
    sampleId: 'python-mldsa',
  },
  {
    runtimeId: 'python-cryptography',
    runtime: 'Python cryptography (pyca)',
    api: 'liboqs-python',
    algorithm: 'SLH-DSA',
    status: 'third-party-only',
    minVersion: '—',
    backend: 'Not in pyca/cryptography; liboqs-python (bindings to liboqs) provides it.',
    protocolNote: 'No SLH-DSA in the Python ssl module.',
    evidenceUrl: 'https://github.com/open-quantum-safe/liboqs-python',
    checkedDate: CHECKED,
  },

  // .NET 10
  {
    runtimeId: 'dotnet',
    runtime: '.NET 10',
    api: 'System.Security.Cryptography.MLKem',
    algorithm: 'ML-KEM',
    status: 'stable',
    minVersion: '.NET 10',
    backend:
      'Needs OpenSSL 3.5+ on Linux, or Windows with CNG PQC support. Check MLKem.IsSupported. The class is not [Experimental].',
    protocolNote:
      'SslStream uses the OS TLS stack (Schannel on Windows, OpenSSL on Linux), so hybrid key exchange depends on that stack, not on the MLKem class.',
    evidenceUrl: `${DOTNET_API}mlkem?view=net-10.0`,
    checkedDate: CHECKED,
    sampleId: 'dotnet-mlkem',
    codeSnippet: 'using MLKem key = MLKem.GenerateKey(MLKemAlgorithm.MLKem768);',
  },
  {
    runtimeId: 'dotnet',
    runtime: '.NET 10',
    api: 'System.Security.Cryptography.MLDsa',
    algorithm: 'ML-DSA',
    status: 'stable',
    minVersion: '.NET 10',
    backend:
      'Needs OpenSSL 3.5+ on Linux, or Windows with CNG PQC support. Check MLDsa.IsSupported. The class is not [Experimental]; CompositeMLDsa is [Experimental] (SYSLIB5006).',
    protocolNote: 'Certificate and TLS use depend on the platform X.509 and TLS stacks.',
    evidenceUrl: `${DOTNET_API}mldsa?view=net-10.0`,
    checkedDate: CHECKED,
    sampleId: 'dotnet-mldsa',
    codeSnippet: 'using MLDsa key = MLDsa.GenerateKey(MLDsaAlgorithm.MLDsa65);',
  },
  {
    runtimeId: 'dotnet',
    runtime: '.NET 10',
    api: 'System.Security.Cryptography.SlhDsa',
    algorithm: 'SLH-DSA',
    status: 'experimental',
    minVersion: '.NET 10',
    backend:
      'Marked [Experimental] (SYSLIB5006). Needs a backend that implements SLH-DSA (OpenSSL 3.5+); the default Windows CNG provider does not, so check SlhDsa.IsSupported.',
    protocolNote: 'No TLS integration.',
    evidenceUrl: `${DOTNET_API}slhdsa?view=net-10.0`,
    checkedDate: CHECKED,
  },

  // Java (JDK)
  {
    runtimeId: 'java',
    runtime: 'Java (JDK)',
    api: 'javax.crypto.KEM / KeyPairGenerator "ML-KEM" (JEP 496)',
    algorithm: 'ML-KEM',
    status: 'stable',
    minVersion: 'JDK 24; Oracle JDK 25, 21.0.13 and 17.0.21',
    backend:
      "Built into the default JDK providers. Oracle backported it to its LTS releases in the 20 October 2026 update (JDK 21.0.13 and 17.0.21; JDK 25 has it); Oracle JDK 11 and 8 are planned for the second half of 2027. Other OpenJDK builds: check your vendor's release notes.",
    protocolNote:
      'JSSE hybrid post-quantum key exchange for TLS 1.3 (JEP 527, X25519MLKEM768 on by default) shipped in JDK 27 and in Oracle JDK 25.0.5 (20 October 2026); Oracle plans it for JDK 21 and 17 in the first half of 2027.',
    evidenceUrl: `${ORACLE_JDK_RELNOTES}25-0-5-relnotes.html`,
    checkedDate: JAVA_CHECKED,
    sampleId: 'java-mlkem',
    codeSnippet:
      'KeyPairGenerator g = KeyPairGenerator.getInstance("ML-KEM");\ng.initialize(NamedParameterSpec.ML_KEM_768);\nKEM kem = KEM.getInstance("ML-KEM");',
  },
  {
    runtimeId: 'java',
    runtime: 'Java (JDK)',
    api: 'Signature / KeyPairGenerator "ML-DSA" (JEP 497)',
    algorithm: 'ML-DSA',
    status: 'stable',
    minVersion: 'JDK 24; Oracle JDK 25, 21.0.13 and 17.0.21',
    backend:
      "Built into the default JDK providers. Oracle backported it to its LTS releases in the 20 October 2026 update (JDK 21.0.13 and 17.0.21; JDK 25 has it); Oracle JDK 11 and 8 are planned for the second half of 2027. Other OpenJDK builds: check your vendor's release notes.",
    protocolNote:
      'JEP 497 covers the signature APIs; check your JDK release notes before relying on ML-DSA certificates in JSSE.',
    evidenceUrl: `${ORACLE_JDK_RELNOTES}21-0-13-relnotes.html`,
    checkedDate: JAVA_CHECKED,
    sampleId: 'java-mldsa',
    codeSnippet:
      'KeyPairGenerator g = KeyPairGenerator.getInstance("ML-DSA");\ng.initialize(NamedParameterSpec.ML_DSA_65);\nSignature sig = Signature.getInstance("ML-DSA");',
  },
  {
    runtimeId: 'java',
    runtime: 'Java (JDK)',
    api: 'Bouncy Castle JCA provider',
    algorithm: 'SLH-DSA',
    status: 'third-party-only',
    minVersion: '—',
    backend: 'Not in the JDK; register the Bouncy Castle provider (1.79+).',
    protocolNote: 'No SLH-DSA in JSSE.',
    evidenceUrl: BC_JAVA,
    checkedDate: CHECKED,
    codeSnippet: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("SLH-DSA-SHA2-128s", "BC");',
  },

  // Windows CNG
  {
    runtimeId: 'windows-cng',
    runtime: 'Windows CNG',
    api: 'BCRYPT_MLKEM_ALGORITHM',
    algorithm: 'ML-KEM',
    status: 'stable',
    minVersion: 'Windows 11 24H2 / Windows Server 2025 (GA November 2025)',
    backend:
      'Default CNG provider (SymCrypt). ML-KEM-512/768/1024 via BCRYPT_PARAMETER_SET_NAME. For composite formats see KB5095093 (Windows 11) and KB5099536 (Windows Server 2025, 14 July 2026).',
    protocolNote:
      'A CNG primitive does not by itself mean Schannel negotiates ML-KEM in TLS; check the Schannel documentation for your Windows build.',
    evidenceUrl: CNG_IDS,
    checkedDate: CHECKED,
    codeSnippet: 'BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_MLKEM_ALGORITHM, NULL, 0);',
  },
  {
    runtimeId: 'windows-cng',
    runtime: 'Windows CNG',
    api: 'BCRYPT_MLDSA_ALGORITHM',
    algorithm: 'ML-DSA',
    status: 'stable',
    minVersion: 'Windows 11 24H2 / Windows Server 2025 (GA November 2025)',
    backend:
      'Default CNG provider (SymCrypt). ML-DSA-44/65/87 via BCRYPT_PARAMETER_SET_NAME. For composite formats see KB5095093 (Windows 11) and KB5099536 (Windows Server 2025, 14 July 2026).',
    protocolNote: 'Certificate and Schannel use of ML-DSA depend on the Windows build.',
    evidenceUrl: CNG_IDS,
    checkedDate: CHECKED,
    codeSnippet: 'BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_MLDSA_ALGORITHM, NULL, 0);',
  },
  {
    runtimeId: 'windows-cng',
    runtime: 'Windows CNG',
    api: 'BCRYPT_SLHDSA_ALGORITHM',
    algorithm: 'SLH-DSA',
    status: 'not-implemented',
    minVersion: '—',
    backend:
      'The identifier is defined, but Microsoft documents it as "not currently implemented by the default CNG provider". A third-party provider could add it.',
    protocolNote: 'None.',
    evidenceUrl: CNG_IDS,
    checkedDate: CHECKED,
  },

  // OpenSSL
  {
    runtimeId: 'openssl',
    runtime: 'OpenSSL',
    api: 'EVP_PKEY "ML-KEM-768" (default provider)',
    algorithm: 'ML-KEM',
    status: 'stable',
    minVersion: 'OpenSSL 3.5.0 (April 2025)',
    backend:
      'Native in the default provider. oqsprovider is only for OpenSSL before 3.5 or for algorithms that are not standardised.',
    protocolNote: 'OpenSSL 3.5 default TLS key shares offer X25519MLKEM768 and X25519.',
    evidenceUrl: OPENSSL_35,
    checkedDate: CHECKED,
    codeSnippet: 'EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-KEM-768", NULL);',
  },
  {
    runtimeId: 'openssl',
    runtime: 'OpenSSL',
    api: 'EVP_PKEY "ML-DSA-65" (default provider)',
    algorithm: 'ML-DSA',
    status: 'stable',
    minVersion: 'OpenSSL 3.5.0 (April 2025)',
    backend:
      'Native in the default provider. oqsprovider is only for OpenSSL before 3.5 or for algorithms that are not standardised.',
    protocolNote: 'Usable in X.509 certificates and CMS through the normal EVP interfaces.',
    evidenceUrl: OPENSSL_35,
    checkedDate: CHECKED,
    codeSnippet: 'EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", NULL);',
  },
  {
    runtimeId: 'openssl',
    runtime: 'OpenSSL',
    api: 'EVP_PKEY "SLH-DSA-*" (default provider)',
    algorithm: 'SLH-DSA',
    status: 'stable',
    minVersion: 'OpenSSL 3.5.0 (April 2025)',
    backend: 'Native in the default provider.',
    protocolNote: 'Usable in X.509 certificates and CMS through the normal EVP interfaces.',
    evidenceUrl: OPENSSL_35,
    checkedDate: CHECKED,
  },

  // Bouncy Castle (Java and C#)
  {
    runtimeId: 'bouncy-castle',
    runtime: 'Bouncy Castle',
    api: 'BC provider / lightweight API',
    algorithm: 'ML-KEM',
    status: 'stable',
    minVersion: 'BC 1.79+',
    backend:
      'Pure Java (the C# edition also supports ML-KEM, per the 9 June 2025 announcement); no native dependency. ML-KEM-512/768/1024.',
    protocolNote: 'BC JSSE provider can be used for hybrid TLS experiments.',
    evidenceUrl: BC_JAVA,
    checkedDate: CHECKED,
    codeSnippet:
      'MLKEMKeyPairGenerator gen = new MLKEMKeyPairGenerator();\ngen.init(new MLKEMKeyGenerationParameters(random, MLKEMParameters.ml_kem_768));',
  },
  {
    runtimeId: 'bouncy-castle',
    runtime: 'Bouncy Castle',
    api: 'BC provider / lightweight API',
    algorithm: 'ML-DSA',
    status: 'stable',
    minVersion: 'BC 1.79+',
    backend:
      'Pure Java (the C# edition also supports ML-DSA, per the 9 June 2025 announcement); no native dependency. ML-DSA-44/65/87.',
    protocolNote: 'BC PKIX APIs can build ML-DSA certificates.',
    evidenceUrl: BC_JAVA,
    checkedDate: CHECKED,
    codeSnippet: 'Signature sig = Signature.getInstance("ML-DSA-65", "BC");',
  },
  {
    runtimeId: 'bouncy-castle',
    runtime: 'Bouncy Castle',
    api: 'BC provider / lightweight API',
    algorithm: 'SLH-DSA',
    status: 'stable',
    minVersion: 'BC 1.79+',
    backend:
      'Pure Java (the C# edition also supports SLH-DSA, per the 9 June 2025 announcement); all 12 parameter sets.',
    protocolNote: 'BC PKIX APIs can build SLH-DSA certificates.',
    evidenceUrl: BC_JAVA,
    checkedDate: CHECKED,
    codeSnippet: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("SLH-DSA-SHA2-128s", "BC");',
  },
]

// ── Lookup helpers — other data files read support status through these ──

export const STATUS_TEXT: Record<MatrixStatus, string> = {
  stable: 'Stable',
  experimental: 'Experimental',
  preview: 'Preview',
  'not-implemented': 'Not implemented',
  'third-party-only': 'Third-party only',
  planned: 'Planned',
}

export function getRuntimeSupport(
  runtimeId: RuntimeId,
  algorithm: StandardAlgorithm
): RuntimeSupportRow {
  const row = RUNTIME_SUPPORT.find((r) => r.runtimeId === runtimeId && r.algorithm === algorithm)
  if (!row) throw new Error(`No support row for ${runtimeId} × ${algorithm}`)
  return row
}

export function getRuntimeRows(runtimeId: RuntimeId): RuntimeSupportRow[] {
  return RUNTIME_SUPPORT.filter((r) => r.runtimeId === runtimeId)
}

/** True when the runtime itself (not a third-party add-on) ships at least one standardised PQC algorithm. */
export function runtimeHasNativePqc(runtimeId: RuntimeId): boolean {
  return getRuntimeRows(runtimeId).some(
    (r) => r.status === 'stable' || r.status === 'experimental' || r.status === 'preview'
  )
}

/** One-line summary, e.g. "ML-KEM: stable (Go 1.24) · ML-DSA: stable (Go 1.27) · SLH-DSA: third-party only". */
export function describeRuntimeSupport(runtimeId: RuntimeId): string {
  return getRuntimeRows(runtimeId)
    .map((r) => {
      const status = STATUS_TEXT[r.status].toLowerCase()
      return r.minVersion === '—'
        ? `${r.algorithm}: ${status}`
        : `${r.algorithm}: ${status} (${r.minVersion})`
    })
    .join(' · ')
}

// ── API × algorithm matrix (Workshop step 6) ──

export interface PQCSupportCell {
  apiId: string
  algorithmId: string
  status: MatrixStatus
  version: string
  notes: string
  codeSnippet?: string
  /** Present when the cell is derived from RUNTIME_SUPPORT */
  protocolNote?: string
  evidenceUrl?: string
  checkedDate?: string
  sampleId?: string
}

export interface RoadmapEvent {
  apiId: string
  date: string
  event: string
  algorithms: string[]
}

export const PQC_ALGORITHMS = [
  { id: 'ml-kem', label: 'ML-KEM', family: 'KEM', fips: 'FIPS 203' },
  { id: 'ml-dsa', label: 'ML-DSA', family: 'Signature', fips: 'FIPS 204' },
  { id: 'slh-dsa', label: 'SLH-DSA', family: 'Signature', fips: 'FIPS 205' },
  { id: 'fn-dsa', label: 'FN-DSA (Falcon)', family: 'Signature', fips: 'Draft' },
  { id: 'lms-xmss', label: 'LMS/XMSS', family: 'Hash-based Sig', fips: 'SP 800-208' },
  { id: 'hqc', label: 'HQC', family: 'KEM', fips: 'Round 4' },
  { id: 'mceliece', label: 'Classic McEliece', family: 'KEM', fips: 'Round 4' },
] as const

export const SUPPORT_STATUS_COLORS: Record<MatrixStatus, string> = {
  stable: 'bg-status-success/20 text-status-success border-status-success/50',
  experimental: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  preview: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  'third-party-only': 'bg-primary/10 text-primary border-primary/40',
  planned: 'bg-status-info/20 text-status-info border-status-info/50',
  'not-implemented': 'bg-muted/50 text-muted-foreground border-border',
}

export const SUPPORT_STATUS_LABELS: Record<MatrixStatus, string> = STATUS_TEXT

/** Which RUNTIME_SUPPORT runtime backs each API row of the matrix. */
const API_RUNTIME: Record<string, RuntimeId> = {
  'jca-jce': 'java',
  openssl: 'openssl',
  'ksp-cng': 'windows-cng',
  'bouncy-castle': 'bouncy-castle',
}

const ALGORITHM_BY_ID: Record<string, StandardAlgorithm> = {
  'ml-kem': 'ML-KEM',
  'ml-dsa': 'ML-DSA',
  'slh-dsa': 'SLH-DSA',
}

function cellFromRuntime(apiId: string, algorithmId: string): PQCSupportCell {
  const row = getRuntimeSupport(API_RUNTIME[apiId], ALGORITHM_BY_ID[algorithmId])
  return {
    apiId,
    algorithmId,
    status: row.status,
    version: row.minVersion,
    notes: `${row.api}. ${row.backend}`,
    codeSnippet: row.codeSnippet,
    protocolNote: row.protocolNote,
    evidenceUrl: row.evidenceUrl,
    checkedDate: row.checkedDate,
    sampleId: row.sampleId,
  }
}

const DERIVED_CELLS: PQCSupportCell[] = Object.keys(API_RUNTIME).flatMap((apiId) =>
  Object.keys(ALGORITHM_BY_ID).map((algorithmId) => cellFromRuntime(apiId, algorithmId))
)

/** Cells for algorithms and APIs (HSM wrappers) that RUNTIME_SUPPORT does not cover. */
const OTHER_CELLS: PQCSupportCell[] = [
  // JCA/JCE — non-FIPS-203/204/205 algorithms come from Bouncy Castle
  {
    apiId: 'jca-jce',
    algorithmId: 'fn-dsa',
    status: 'third-party-only',
    version: 'BC 1.74+',
    notes:
      'Not in the JDK; Falcon (the basis of FN-DSA, FIPS 206 not published) via the Bouncy Castle provider',
    codeSnippet: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("FALCON-512", "BC");',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'lms-xmss',
    status: 'third-party-only',
    version: 'BC 1.74+ (BC provider; 1.65+ in the lightweight API)',
    notes: 'Via the Bouncy Castle provider. Stateful signatures — requires state management',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'hqc',
    status: 'third-party-only',
    version: 'BC 1.72+ (BCPQC provider)',
    notes: 'Not in the JDK; via the Bouncy Castle provider',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'mceliece',
    status: 'third-party-only',
    version: 'BC 1.71+ (BCPQC provider)',
    notes: 'Not in the JDK; via the Bouncy Castle provider',
  },

  // OpenSSL — algorithms outside FIPS 203/204/205
  {
    apiId: 'openssl',
    algorithmId: 'fn-dsa',
    status: 'third-party-only',
    version: 'via oqsprovider',
    notes: 'Not native; requires oqsprovider (liboqs)',
  },
  {
    apiId: 'openssl',
    algorithmId: 'lms-xmss',
    status: 'not-implemented',
    version: '-',
    notes: 'Not in oqsprovider; use standalone implementations',
  },
  {
    apiId: 'openssl',
    algorithmId: 'hqc',
    status: 'third-party-only',
    version: 'via oqsprovider',
    notes: 'Not native; requires oqsprovider (liboqs)',
  },
  {
    apiId: 'openssl',
    algorithmId: 'mceliece',
    status: 'third-party-only',
    version: 'via oqsprovider',
    notes: 'Not native; via oqsprovider — very large keys',
  },

  // PKCS#11
  {
    apiId: 'pkcs11',
    algorithmId: 'ml-kem',
    status: 'stable',
    version: 'v3.2',
    notes: 'CKM_ML_KEM_KEY_PAIR_GEN, C_EncapsulateKey/C_DecapsulateKey',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'ml-dsa',
    status: 'stable',
    version: 'v3.2',
    notes: 'CKM_ML_DSA, CKM_HASH_ML_DSA_*',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'slh-dsa',
    status: 'stable',
    version: 'v3.2',
    notes: 'CKM_SLH_DSA, CKM_HASH_SLH_DSA_*, all 12 parameter sets',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'fn-dsa',
    status: 'planned',
    version: 'v3.3+',
    notes: 'Not yet in PKCS#11 standard — expected in future revision',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'lms-xmss',
    status: 'stable',
    version: 'v3.1',
    notes: 'CKM_HSS_KEY_PAIR_GEN — stateful, requires state object',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'hqc',
    status: 'planned',
    version: 'v3.3+',
    notes: 'Awaiting NIST standardization',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'mceliece',
    status: 'not-implemented',
    version: '-',
    notes: 'Key sizes too large for most HSM tokens',
  },

  // KSP / CNG — algorithms outside ML-KEM / ML-DSA / SLH-DSA
  {
    apiId: 'ksp-cng',
    algorithmId: 'fn-dsa',
    status: 'not-implemented',
    version: '-',
    notes: 'No CNG algorithm identifier',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'lms-xmss',
    status: 'not-implemented',
    version: '-',
    notes:
      'BCRYPT_LMS_ALGORITHM and BCRYPT_XMSS_ALGORITHM are defined but not currently implemented by the default CNG provider',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'hqc',
    status: 'not-implemented',
    version: '-',
    notes: 'No CNG algorithm identifier',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'mceliece',
    status: 'not-implemented',
    version: '-',
    notes: 'No CNG algorithm identifier',
  },

  // Bouncy Castle
  {
    apiId: 'bouncy-castle',
    algorithmId: 'fn-dsa',
    status: 'stable',
    version: '1.74+',
    notes: 'Falcon-512/1024 (the basis of FN-DSA; FIPS 206 not published)',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'lms-xmss',
    status: 'stable',
    version: '1.74+ (BC provider; 1.65+ in the lightweight API)',
    notes: 'Full LMS/HSS and XMSS/XMSS^MT',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'hqc',
    status: 'stable',
    version: '1.72+ (BCPQC provider)',
    notes: 'HQC-128/192/256',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'mceliece',
    status: 'stable',
    version: '1.71+ (BCPQC provider)',
    notes: 'Classic McEliece — all parameter sets',
  },

  // JCProv (Thales)
  {
    apiId: 'jcprov',
    algorithmId: 'ml-kem',
    status: 'stable',
    version: 'Luna 7.x FW',
    notes: 'Depends on HSM firmware version',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'ml-dsa',
    status: 'stable',
    version: 'Luna 7.x FW',
    notes: 'Depends on HSM firmware version',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'slh-dsa',
    status: 'experimental',
    version: 'Luna 8.x FW',
    notes: 'Firmware update required',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'fn-dsa',
    status: 'not-implemented',
    version: '-',
    notes: 'Not yet supported in Luna firmware',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'lms-xmss',
    status: 'stable',
    version: 'Luna 7.x FW',
    notes: 'Stateful — HSM manages state counter',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'hqc',
    status: 'not-implemented',
    version: '-',
    notes: 'Not in Luna firmware',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'mceliece',
    status: 'not-implemented',
    version: '-',
    notes: 'Key sizes exceed HSM capacity',
  },
]

export const PQC_SUPPORT_MATRIX: PQCSupportCell[] = [...DERIVED_CELLS, ...OTHER_CELLS]

export const ROADMAP_EVENTS: RoadmapEvent[] = [
  {
    apiId: 'bouncy-castle',
    date: '2022-Q3',
    event: 'CRYSTALS-Kyber/Dilithium support added',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
  {
    apiId: 'openssl',
    date: '2023-Q1',
    event: 'oqsprovider 0.5 for OpenSSL 3.x',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'bouncy-castle',
    date: '2024-Q2',
    event: 'Updated to FIPS 203/204/205 final names',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'Go',
    date: '2025-Q1',
    event: 'Go 1.24: crypto/mlkem; X25519MLKEM768 on by default in crypto/tls',
    algorithms: ['ml-kem'],
  },
  {
    apiId: 'jca-jce',
    date: '2025-Q1',
    event: 'JDK 24: native ML-KEM (JEP 496) and ML-DSA (JEP 497)',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
  {
    apiId: 'openssl',
    date: '2025-Q2',
    event: 'OpenSSL 3.5: native ML-KEM, ML-DSA and SLH-DSA; X25519MLKEM768 in default key shares',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'jca-jce',
    date: '2025-Q3',
    event: 'JDK 25 LTS: first long-term-support JDK with ML-KEM and ML-DSA',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
  {
    apiId: '.NET',
    date: '2025-Q4',
    event: '.NET 10: MLKem and MLDsa; SlhDsa as [Experimental]',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'pkcs11',
    date: '2025-Q4',
    event:
      'PKCS#11 v3.2 ratified as an OASIS Standard (3 June 2026) with PQC mechanisms; CS01 was approved Nov 2025',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'ksp-cng',
    date: '2025-Q4',
    event:
      'Windows CNG ML-KEM and ML-DSA generally available (Nov 2025); SLH-DSA not implemented by the default provider',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
  {
    apiId: 'Python cryptography',
    date: '2026-Q2',
    event: 'cryptography 47.0.0 (AWS-LC/BoringSSL) and 48.0.0 (OpenSSL 3.5+): ML-KEM and ML-DSA',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
  {
    apiId: 'Go',
    date: '2026-Q3',
    event: 'Go 1.27: crypto/mldsa; ML-DSA in crypto/x509 and crypto/tls; MLKEM1024 in TLS',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
  {
    apiId: 'jca-jce',
    date: '2026-Q3',
    event:
      'JDK 27: hybrid ML-KEM key exchange in JSSE TLS 1.3 (JEP 527), X25519MLKEM768 on by default',
    algorithms: ['ml-kem'],
  },
  {
    apiId: 'jca-jce',
    date: '2026-Q4',
    event:
      'Oracle JDK LTS backports: 25.0.5 adds hybrid TLS (JEP 527); 21.0.13 and 17.0.21 add ML-KEM and ML-DSA',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
]

export const ALGORITHM_FAMILY_FILTER_OPTIONS = [
  { id: 'All', label: 'All Families' },
  { id: 'KEM', label: 'KEM' },
  { id: 'Signature', label: 'Signature' },
  { id: 'Hash-based Sig', label: 'Hash-based Sig' },
]

export const READINESS_FILTER_OPTIONS = [
  { id: 'All', label: 'All Status' },
  ...(Object.keys(STATUS_TEXT) as MatrixStatus[]).map((id) => ({ id, label: STATUS_TEXT[id] })),
]
