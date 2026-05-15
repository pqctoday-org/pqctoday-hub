/**
 * PQC Protocol Support Matrix — 10 standard families × release / draft / 4 PQC dimensions / OSS libs / playground.
 *
 * Snapshot date: 2026-05-15.
 *
 * The 4 dimensions reflect the published external PQC-readiness heatmap:
 *  - pureKem   = pure post-quantum KEM (e.g. ML-KEM-only, no classical fallback)
 *  - hybridKem = classical + PQ KEM concatenation (e.g. X25519+ML-KEM-768)
 *  - pureSig   = pure PQ signature/auth (e.g. ML-DSA-only, SLH-DSA-only)
 *  - hybridSig = classical + PQ composite signature (e.g. ECDSA+ML-DSA)
 *
 * Dimension status values:
 *  - 'rfc'          published RFC / TCG release / ITU-T edition
 *  - 'draft'        active IETF / TCG draft
 *  - 'experimental' non-IETF or expired draft / vendor pre-standard
 *  - 'none'         not specified, not pursued
 *  - 'na'           not applicable for this protocol family
 *
 * Playground testability values (per existing tool in /playground):
 *  - 'full'    user can select / exercise this dimension in the tool
 *  - 'partial' supported via backend / URL param but not exposed in UI
 *  - 'none'    not supported by the tool
 *  - 'na'      dimension not applicable to this protocol
 */

export type DimensionStatusValue = 'rfc' | 'draft' | 'experimental' | 'none' | 'na'

export interface DimensionStatus {
  value: DimensionStatusValue
  note: string
}

export interface ProtocolDoc {
  id: string
  title: string
  url: string
  date: string
  localFile?: string
}

export interface OssLibrary {
  productId: string
  name: string
  versionNote?: string
}

export type TestabilityValue = 'full' | 'partial' | 'none' | 'na'

export interface PlaygroundTool {
  toolId: string
  toolName: string
  testability: {
    pureKem: TestabilityValue
    hybridKem: TestabilityValue
    pureSig: TestabilityValue
    hybridSig: TestabilityValue
  }
}

export interface ProtocolMatrixRow {
  id: string
  name: string
  description: string
  latestRelease: ProtocolDoc[]
  latestDraft: ProtocolDoc[]
  dimensions: {
    pureKem: DimensionStatus
    hybridKem: DimensionStatus
    pureSig: DimensionStatus
    hybridSig: DimensionStatus
  }
  ossLibraries: OssLibrary[]
  playground: PlaygroundTool | null
  gaps: string[]
}

export const PROTOCOL_MATRIX: ProtocolMatrixRow[] = [
  {
    id: 'ssh',
    name: 'SSH',
    description: 'Secure Shell — transport-layer security for remote login and tunneling.',
    latestRelease: [
      {
        id: 'RFC-4253',
        title: 'RFC 4253 — SSH Transport Layer Protocol',
        url: 'https://datatracker.ietf.org/doc/html/rfc4253',
        date: '2006-01',
        localFile: '/library/IETF_RFC_4253.html',
      },
      {
        id: 'RFC-9941',
        title: 'RFC 9941 — Streamlined NTRU Prime sntrup761 Key Exchange for SSH',
        url: 'https://datatracker.ietf.org/doc/html/rfc9941',
        date: '2026-04',
        localFile: '/library/RFC_9941.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-sshm-mlkem-hybrid-kex-10',
        title: 'draft-ietf-sshm-mlkem-hybrid-kex-10 — ML-KEM Hybrid KEX for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-sshm-mlkem-hybrid-kex/',
        date: '2026-02-26',
        localFile: '/library/draft-ietf-sshm-mlkem-hybrid-kex-10.html',
      },
      {
        id: 'draft-becker-cnsa2-ssh-profile-03',
        title: 'draft-becker-cnsa2-ssh-profile-03 — CNSA 2.0 Profile for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-becker-cnsa2-ssh-profile/',
        date: '2026-05-08',
        localFile: '/library/draft-becker-cnsa2-ssh-profile-03.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        note: 'CNSA 2.0 SSH profile requires ML-KEM-1024 alone from 2027; not yet RFC-published.',
      },
      hybridKem: {
        value: 'rfc',
        note: 'sntrup761x25519 published as RFC 9941 (Apr 2026); ML-KEM-768+X25519 in draft -10.',
      },
      pureSig: {
        value: 'draft',
        note: 'ssh-mldsa-65/87 host-key methods specified in CNSA 2.0 SSH profile (Independent Submission).',
      },
      hybridSig: {
        value: 'none',
        note: 'No IETF draft for composite SSH host-key authentication as of 2026-05.',
      },
    },
    ossLibraries: [
      {
        productId: 'openssh',
        name: 'OpenSSH',
        versionNote: '9.9+ (sntrup761x25519, mlkem768x25519)',
      },
      { productId: 'wolfssh', name: 'wolfSSH' },
    ],
    playground: {
      toolId: 'pqc-ssh-sim',
      toolName: 'PQC SSH Simulation',
      testability: {
        pureKem: 'none',
        hybridKem: 'full',
        pureSig: 'full',
        hybridSig: 'partial',
      },
    },
    gaps: [
      'Pure ML-KEM (no classical) is not user-selectable in the SSH playground.',
      'Composite SSH host-key signature (classical + ML-DSA) not testable.',
    ],
  },
  {
    id: 'tls-1-2',
    name: 'TLS 1.2',
    description: 'Legacy transport-layer security — no PQC standardization path.',
    latestRelease: [
      {
        id: 'RFC-5246',
        title: 'RFC 5246 — TLS 1.2',
        url: 'https://datatracker.ietf.org/doc/html/rfc5246',
        date: '2008-08',
        localFile: '/library/RFC_5246.html',
      },
      {
        id: 'RFC-9325',
        title: 'RFC 9325 / BCP 195 — Recommendations for Secure Use of TLS and DTLS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9325',
        date: '2022-11',
        localFile: '/library/RFC_9325.html',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: { value: 'na', note: 'IETF TLS WG has scoped all PQC work to TLS 1.3 only.' },
      hybridKem: { value: 'na', note: 'No IETF draft proposes hybrid PQC for TLS 1.2.' },
      pureSig: { value: 'na', note: 'No PQC signature support planned for TLS 1.2.' },
      hybridSig: { value: 'na', note: 'No PQC signature support planned for TLS 1.2.' },
    },
    ossLibraries: [
      { productId: 'openssl', name: 'OpenSSL', versionNote: 'TLS 1.2 transport — no PQC' },
      { productId: 'boringssl', name: 'BoringSSL', versionNote: 'TLS 1.2 transport — no PQC' },
      { productId: 'wolfssl', name: 'wolfSSL', versionNote: 'TLS 1.2 transport — no PQC' },
    ],
    playground: null,
    gaps: [
      'PQC is intentionally NOT pursued for TLS 1.2 — recommendation is to migrate to TLS 1.3 first.',
      'No playground tool — by design.',
    ],
  },
  {
    id: 'tls-1-3',
    name: 'TLS 1.3',
    description:
      'Modern transport-layer security with hybrid + pure PQC key exchange and PQ signatures.',
    latestRelease: [
      {
        id: 'RFC-8446',
        title: 'RFC 8446 — TLS 1.3',
        url: 'https://datatracker.ietf.org/doc/html/rfc8446',
        date: '2018-08',
        localFile: '/library/RFC_8446.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-tls-ecdhe-mlkem-04',
        title: 'draft-ietf-tls-ecdhe-mlkem-04 — Hybrid X25519MLKEM768 / SecP256r1MLKEM768',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/',
        date: '2026-02-08',
        localFile: '/library/draft-ietf-tls-ecdhe-mlkem-04.html',
      },
      {
        id: 'draft-ietf-tls-mlkem-07',
        title: 'draft-ietf-tls-mlkem-07 — Standalone ML-KEM groups for TLS',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
        date: '2026-02-12',
        localFile: '/library/draft-ietf-tls-mlkem-07.html',
      },
      {
        id: 'draft-ietf-tls-mldsa-03',
        title: 'draft-ietf-tls-mldsa-03 — ML-DSA in TLS 1.3',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/',
        date: '2026-05-06',
        localFile: '/library/draft-ietf-tls-mldsa-03.html',
      },
      {
        id: 'draft-ietf-tls-hybrid-design-16',
        title: 'draft-ietf-tls-hybrid-design-16 — Hybrid KEX design framework',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-hybrid-design/',
        date: '2025-09-07',
        localFile: '/library/draft-ietf-tls-hybrid-design-16.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        note: 'draft-ietf-tls-mlkem-07: pure ML-KEM-512/768/1024 groups (revising post-WGLC).',
      },
      hybridKem: {
        value: 'draft',
        note: 'X25519MLKEM768 (0x11EC) shipped in production; in RFC Editor queue.',
      },
      pureSig: { value: 'draft', note: 'draft-ietf-tls-mldsa-03 in Publication Requested.' },
      hybridSig: {
        value: 'draft',
        note: 'Composite signatures via X.509 RFC 9881 + draft-lamps-pq-composite-sigs.',
      },
    },
    ossLibraries: [
      {
        productId: 'openssl-3-5-0',
        name: 'OpenSSL 3.5.0',
        versionNote: 'Native ML-KEM via X25519MLKEM768 group',
      },
      { productId: 'aws-lc', name: 'AWS-LC', versionNote: 'ML-KEM + ML-DSA' },
      { productId: 'boringssl', name: 'BoringSSL', versionNote: 'X25519MLKEM768 production' },
      { productId: 'rustls', name: 'rustls', versionNote: 'via rustls-post-quantum crate' },
      { productId: 'wolfssl', name: 'wolfSSL', versionNote: 'ML-KEM, ML-DSA, FALCON' },
      { productId: 'oqs-provider', name: 'oqs-provider', versionNote: 'OpenSSL 3.x plugin' },
    ],
    playground: {
      toolId: 'tls-simulator',
      toolName: 'TLS 1.3 Simulator',
      testability: { pureKem: 'full', hybridKem: 'full', pureSig: 'full', hybridSig: 'full' },
    },
    gaps: [],
  },
  {
    id: 'x509',
    name: 'X.509',
    description:
      'PKI certificate format — algorithm OIDs for ML-DSA / ML-KEM / SLH-DSA + composite (hybrid) variants.',
    latestRelease: [
      {
        id: 'RFC-5280',
        title: 'RFC 5280 — X.509 PKI Certificate and CRL Profile',
        url: 'https://datatracker.ietf.org/doc/html/rfc5280',
        date: '2008-05',
        localFile: '/library/RFC_5280.html',
      },
      {
        id: 'RFC-9881',
        title: 'RFC 9881 — X.509 Algorithm Identifiers for ML-DSA',
        url: 'https://datatracker.ietf.org/doc/html/rfc9881',
        date: '2025-10',
        localFile: '/library/RFC_9881.html',
      },
      {
        id: 'RFC-9935',
        title: 'RFC 9935 — X.509 Algorithm Identifiers for ML-KEM',
        url: 'https://datatracker.ietf.org/doc/html/rfc9935',
        date: '2026-03',
        localFile: '/library/RFC_9935.html',
      },
      {
        id: 'RFC-9909',
        title: 'RFC 9909 — X.509 Algorithm Identifiers for SLH-DSA',
        url: 'https://datatracker.ietf.org/doc/html/rfc9909',
        date: '2025-12',
        localFile: '/library/RFC_9909.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-lamps-pq-composite-sigs-19',
        title: 'draft-ietf-lamps-pq-composite-sigs-19 — Composite ML-DSA in X.509',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
        date: '2026-04-21',
        localFile: '/library/draft-ietf-lamps-pq-composite-sigs-19.html',
      },
      {
        id: 'draft-ietf-lamps-pq-composite-kem-14',
        title: 'draft-ietf-lamps-pq-composite-kem-14 — Composite ML-KEM in X.509',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
        date: '2026-03-27',
        localFile: '/library/draft-ietf-lamps-pq-composite-kem-14.html',
      },
    ],
    dimensions: {
      pureKem: { value: 'rfc', note: 'RFC 9935: ML-KEM-512/768/1024 OIDs.' },
      hybridKem: {
        value: 'draft',
        note: 'draft-ietf-lamps-pq-composite-kem-14: ML-KEM + classical composite.',
      },
      pureSig: { value: 'rfc', note: 'RFC 9881 (ML-DSA) + RFC 9909 (SLH-DSA).' },
      hybridSig: {
        value: 'draft',
        note: 'draft-ietf-lamps-pq-composite-sigs-19: ML-DSA + ECDSA/RSA/Ed25519/EdDSA composite.',
      },
    },
    ossLibraries: [
      {
        productId: 'openssl-3-5-0',
        name: 'OpenSSL 3.5.0',
        versionNote: 'ML-DSA / ML-KEM cert ops',
      },
      {
        productId: 'bouncy-castle-java',
        name: 'Bouncy Castle Java',
        versionNote: '1.78+ PQC suite',
      },
      {
        productId: 'oqs-provider',
        name: 'oqs-provider',
        versionNote: 'OpenSSL plugin for cert ops',
      },
      { productId: 'aws-lc', name: 'AWS-LC', versionNote: 'PQ cert verification' },
    ],
    playground: {
      toolId: 'hybrid-certs',
      toolName: 'Hybrid Certificate Workshop',
      testability: { pureKem: 'na', hybridKem: 'na', pureSig: 'full', hybridSig: 'full' },
    },
    gaps: ['Workshop is signature-focused — no KEM certificate generation flow.'],
  },
  {
    id: 'smime',
    name: 'S/MIME (CMS)',
    description: 'Cryptographic Message Syntax for signed/encrypted email and S/MIME messages.',
    latestRelease: [
      {
        id: 'RFC-8551',
        title: 'RFC 8551 — S/MIME v4.0',
        url: 'https://datatracker.ietf.org/doc/html/rfc8551',
        date: '2019-04',
        localFile: '/library/RFC_8551.html',
      },
      {
        id: 'RFC-5652',
        title: 'RFC 5652 — Cryptographic Message Syntax (CMS)',
        url: 'https://datatracker.ietf.org/doc/html/rfc5652',
        date: '2009-09',
        localFile: '/library/RFC_5652.html',
      },
      {
        id: 'RFC-9936',
        title: 'RFC 9936 — Use of ML-KEM in CMS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9936',
        date: '2026-03',
        localFile: '/library/RFC_9936.html',
      },
      {
        id: 'RFC-9882',
        title: 'RFC 9882 — Use of ML-DSA in CMS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9882',
        date: '2025-10',
        localFile: '/library/RFC_9882.html',
      },
      {
        id: 'RFC-9814',
        title: 'RFC 9814 — Use of SLH-DSA in CMS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9814',
        date: '2025-07',
        localFile: '/library/RFC_9814.html',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: { value: 'rfc', note: 'RFC 9936: ML-KEM key transport in CMS.' },
      hybridKem: {
        value: 'experimental',
        note: 'No IETF draft for hybrid CMS KEM yet; vendor pre-standard only.',
      },
      pureSig: { value: 'rfc', note: 'RFC 9882 (ML-DSA) + RFC 9814 (SLH-DSA).' },
      hybridSig: {
        value: 'experimental',
        note: 'Composite via X.509 cert binding (RFC 9881 + composite-sigs draft).',
      },
    },
    ossLibraries: [
      { productId: 'bouncy-castle-java', name: 'Bouncy Castle Java', versionNote: 'PQC CMS' },
      { productId: 'nss-mozilla', name: 'NSS (Mozilla)', versionNote: 'CMS PQ in progress' },
      { productId: 'openssl-3-5-0', name: 'OpenSSL 3.5.0', versionNote: 'PQ CMS via oqs-provider' },
    ],
    playground: null,
    gaps: [
      'No S/MIME or CMS playground tool exists in /playground.',
      'Hybrid CMS KEM has no IETF draft as of 2026-05.',
    ],
  },
  {
    id: 'openpgp',
    name: 'OpenPGP',
    description:
      'OpenPGP message format — composite ML-KEM+ECDH encryption and ML-DSA+ECDSA signatures, plus standalone SLH-DSA.',
    latestRelease: [
      {
        id: 'RFC-9580',
        title: 'RFC 9580 — OpenPGP (crypto refresh)',
        url: 'https://datatracker.ietf.org/doc/html/rfc9580',
        date: '2024-07',
        localFile: '/library/RFC_9580.html',
      },
      {
        id: 'RFC-9581',
        title: 'RFC 9581 — Persistent Symmetric Keys in OpenPGP',
        url: 'https://datatracker.ietf.org/doc/html/rfc9581',
        date: '2024-07',
        localFile: '/library/RFC_9581.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-openpgp-pqc-17',
        title: 'draft-ietf-openpgp-pqc-17 — PQC for OpenPGP (in AUTH48)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-pqc/',
        date: '2026-01-13',
        localFile: '/library/draft-ietf-openpgp-pqc-17.html',
      },
      {
        id: 'draft-ietf-openpgp-nist-bp-comp-03',
        title: 'draft-ietf-openpgp-nist-bp-comp-03 — NIST + Brainpool composites',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-nist-bp-comp/',
        date: '2026-01-08',
        localFile: '/library/draft-ietf-openpgp-nist-bp-comp-03.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'none',
        note: 'OpenPGP-PQC scheme defines composite KEM only; no pure ML-KEM mode.',
      },
      hybridKem: {
        value: 'draft',
        note: 'draft-ietf-openpgp-pqc-17: composite ML-KEM-768/1024 + ECDH (P-256/P-384/X25519/X448).',
      },
      pureSig: { value: 'draft', note: 'draft-ietf-openpgp-pqc-17: SLH-DSA standalone signature.' },
      hybridSig: {
        value: 'draft',
        note: 'draft-ietf-openpgp-pqc-17: composite ML-DSA + ECDSA/EdDSA.',
      },
    },
    ossLibraries: [
      { productId: 'gnupg', name: 'GnuPG', versionNote: 'PQC branch tracking draft -17' },
      { productId: 'sequoia-pgp-pqc', name: 'Sequoia-PGP PQC' },
      { productId: 'openpgp-js', name: 'OpenPGP.js', versionNote: 'PQC PR series' },
    ],
    playground: null,
    gaps: [
      'No OpenPGP playground tool exists in /playground.',
      'Pure ML-KEM (without classical concatenation) is not specified by the draft.',
    ],
  },
  {
    id: 'ike-ipsec',
    name: 'IKE / IPsec',
    description:
      'Internet Key Exchange v2 and IPsec — ML-KEM as additional key exchange and ML-DSA / SLH-DSA for authentication.',
    latestRelease: [
      {
        id: 'RFC-7296',
        title: 'RFC 7296 — IKEv2',
        url: 'https://datatracker.ietf.org/doc/html/rfc7296',
        date: '2014-10',
        localFile: '/library/IETF_RFC_7296.html',
      },
      {
        id: 'RFC-8784',
        title: 'RFC 8784 — Mixing Preshared Keys in IKEv2 for PQ Security',
        url: 'https://datatracker.ietf.org/doc/html/rfc8784',
        date: '2020-06',
        localFile: '/library/RFC_8784.html',
      },
      {
        id: 'RFC-9370',
        title: 'RFC 9370 — Multiple Key Exchanges in IKEv2',
        url: 'https://datatracker.ietf.org/doc/html/rfc9370',
        date: '2023-05',
        localFile: '/library/RFC_9370.html',
      },
      {
        id: 'RFC-9867',
        title: 'RFC 9867 — PSK Mixing in IKE_INTERMEDIATE / CREATE_CHILD_SA',
        url: 'https://datatracker.ietf.org/doc/html/rfc9867',
        date: '2025',
        localFile: '/library/RFC_9867.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-ipsecme-ikev2-mlkem-05',
        title: 'draft-ietf-ipsecme-ikev2-mlkem-05 — ML-KEM in IKEv2',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-mlkem/',
        date: '2026-03-14',
        localFile: '/library/draft-ietf-ipsecme-ikev2-mlkem-05.html',
      },
      {
        id: 'draft-ietf-ipsecme-ikev2-pqc-auth-08',
        title: 'draft-ietf-ipsecme-ikev2-pqc-auth-08 — PQ Authentication in IKEv2',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-pqc-auth/',
        date: '2026-04-14',
        localFile: '/library/draft-ietf-ipsecme-ikev2-pqc-auth-08.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        note: 'draft-ietf-ipsecme-ikev2-mlkem-05: ML-KEM standalone transform IDs.',
      },
      hybridKem: {
        value: 'rfc',
        note: 'RFC 9370 multiple KE framework — production-ready since May 2023.',
      },
      pureSig: {
        value: 'draft',
        note: 'draft-ietf-ipsecme-ikev2-pqc-auth-08: ML-DSA and SLH-DSA auth methods.',
      },
      hybridSig: {
        value: 'experimental',
        note: 'No IETF draft for composite IKEv2 authentication.',
      },
    },
    ossLibraries: [
      {
        productId: 'strongswan',
        name: 'strongSwan',
        versionNote: '6.0.1+ (ML-KEM + ML-DSA via plugin)',
      },
      { productId: 'libreswan', name: 'Libreswan' },
    ],
    playground: {
      toolId: 'vpn-sim',
      toolName: 'PQC IKEv2/IPsec Workshop',
      testability: { pureKem: 'partial', hybridKem: 'full', pureSig: 'full', hybridSig: 'none' },
    },
    gaps: [
      'Pure ML-KEM IKEv2 mode is URL-driven only (?vpnMode=pure-pqc); no UI selector.',
      'Composite IKEv2 authentication (classical + ML-DSA) not testable.',
    ],
  },
  {
    id: 'mls',
    name: 'MLS',
    description:
      'Messaging Layer Security — group messaging with forward-secure ratcheting; PQ cipher suites and combiners in WG Last Call.',
    latestRelease: [
      {
        id: 'RFC-9420',
        title: 'RFC 9420 — The Messaging Layer Security (MLS) Protocol',
        url: 'https://datatracker.ietf.org/doc/html/rfc9420',
        date: '2023-07',
        localFile: '/library/RFC_9420.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-mls-pq-ciphersuites-04',
        title: 'draft-ietf-mls-pq-ciphersuites-04 — PQ Cipher Suites for MLS (WGLC)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
        date: '2026-03-18',
        localFile: '/library/draft-ietf-mls-pq-ciphersuites-04.html',
      },
      {
        id: 'draft-ietf-mls-combiner-02',
        title: 'draft-ietf-mls-combiner-02 — Traditional + PQ MLS combiner',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-combiner/',
        date: '2025-10-22',
        localFile: '/library/draft-ietf-mls-combiner-02.html',
      },
      {
        id: 'draft-ietf-mls-extensions-09',
        title: 'draft-ietf-mls-extensions-09 — MLS Extensions framework',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-extensions/',
        date: '2026-03-02',
        localFile: '/library/draft-ietf-mls-extensions-09.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        note: 'draft-ietf-mls-pq-ciphersuites-04: pure ML-KEM cipher suites (WG Last Call).',
      },
      hybridKem: {
        value: 'experimental',
        note: 'draft-ietf-mls-combiner-02 expired but tracked; WG milestone Dec 2026.',
      },
      pureSig: {
        value: 'draft',
        note: 'draft-ietf-mls-pq-ciphersuites-04 pairs PQ KEM with PQ signature (ML-DSA).',
      },
      hybridSig: {
        value: 'experimental',
        note: 'Hybrid sig handled at the X.509 layer or via the MLS combiner draft.',
      },
    },
    ossLibraries: [
      {
        productId: 'openmls',
        name: 'OpenMLS',
        versionNote: 'Rust — PQ branch tracking ciphersuites draft',
      },
      { productId: 'mls-rs', name: 'mls-rs', versionNote: 'AWS Rust SDK' },
      { productId: 'mlspp', name: 'mlspp', versionNote: 'C++ reference impl' },
    ],
    playground: null,
    gaps: [
      'No MLS playground tool exists in /playground.',
      'Combiner draft -02 is expired; revival in flight for WGLC.',
    ],
  },
  {
    id: 'tpm',
    name: 'TPM',
    description:
      'Trusted Platform Module — TPM 2.0 Library v1.85 adds ML-DSA, ML-KEM, Labeled KEM, EdDSA.',
    latestRelease: [
      {
        id: 'TCG-TPM-2.0-Library-v1.83',
        title: 'TCG TPM 2.0 Library Specification v1.83',
        url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
        date: '2023',
      },
    ],
    latestDraft: [
      {
        id: 'TCG-TPM-2.0-Library-v1.85-RC4',
        title: 'TCG TPM 2.0 Library Specification v1.85 RC4 (ML-DSA + ML-KEM + Labeled KEM)',
        url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
        date: '2025-12-12',
        localFile: '/library/TCG-TPM-V185-Part1-Architecture.pdf',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        note: 'v1.85 SHALL support ML-KEM-768 or ML-KEM-1024 (TCG draft RC4).',
      },
      hybridKem: {
        value: 'experimental',
        note: 'v1.85 Labeled KEM abstraction can mix algorithms; not standardized as "hybrid".',
      },
      pureSig: { value: 'draft', note: 'v1.85 SHALL support ML-DSA-65 or ML-DSA-87.' },
      hybridSig: {
        value: 'na',
        note: 'TPM signatures are atomic per-key; hybrid sig not in TCG scope.',
      },
    },
    ossLibraries: [
      {
        productId: 'libtpms',
        name: 'libtpms',
        versionNote: 'Tracks v1.83; v1.85 in fork branches',
      },
      { productId: 'swtpm', name: 'swtpm', versionNote: 'Tracks v1.83' },
      {
        productId: 'pqctoday-tpm',
        name: 'pqctoday-tpm',
        versionNote: 'Our fork — v1.85 PQ commands',
      },
      { productId: 'wolftpm-pqc', name: 'wolfTPM PQC' },
    ],
    playground: {
      toolId: 'tpm-playground',
      toolName: 'PQC TPM Workshop',
      testability: { pureKem: 'full', hybridKem: 'none', pureSig: 'full', hybridSig: 'na' },
    },
    gaps: [
      'Hybrid KEM not in TCG v1.85 — only Labeled KEM abstraction.',
      'libtpms / swtpm upstream still track v1.83; pqctoday-tpm fork ports v1.85 PQ commands.',
    ],
  },
  {
    id: 'dnssec',
    name: 'DNSSEC',
    description:
      'DNS Security Extensions — sig-only protocol; PQ adoption blocked by signature size vs DNS MTU.',
    latestRelease: [
      {
        id: 'RFC-4034',
        title: 'RFC 4034 — Resource Records for the DNS Security Extensions',
        url: 'https://datatracker.ietf.org/doc/html/rfc4034',
        date: '2005-03',
        localFile: '/library/RFC_4034.html',
      },
      {
        id: 'RFC-9364',
        title: 'RFC 9364 / BCP 237 — DNS Security Extensions (DNSSEC)',
        url: 'https://datatracker.ietf.org/doc/html/rfc9364',
        date: '2023-02',
        localFile: '/library/RFC_9364.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-fregly-dnsop-slh-dsa-mtl-dnssec-06',
        title: 'draft-fregly-dnsop-slh-dsa-mtl-dnssec-06 — SLH-DSA Merkle Tree Ladder mode',
        url: 'https://datatracker.ietf.org/doc/draft-fregly-dnsop-slh-dsa-mtl-dnssec/',
        date: '2026-03-30',
        localFile: '/library/draft-fregly-dnsop-slh-dsa-mtl-dnssec-06.html',
      },
      {
        id: 'draft-sheth-pqc-dnssec-strategy-01',
        title: 'draft-sheth-pqc-dnssec-strategy-01 — PQC Strategy for DNSSEC',
        url: 'https://datatracker.ietf.org/doc/draft-sheth-pqc-dnssec-strategy/',
        date: '2026-04-17',
        localFile: '/library/draft-sheth-pqc-dnssec-strategy-01.html',
      },
    ],
    dimensions: {
      pureKem: { value: 'na', note: 'DNSSEC is a signature-only protocol; no KEM dimension.' },
      hybridKem: { value: 'na', note: 'DNSSEC is a signature-only protocol; no KEM dimension.' },
      pureSig: {
        value: 'experimental',
        note: 'Individual drafts only (not WG-adopted); no IANA DNSKEY code point assigned yet.',
      },
      hybridSig: {
        value: 'experimental',
        note: 'Strategy draft enumerates candidates; no concrete hybrid mode.',
      },
    },
    ossLibraries: [
      { productId: 'coredns-pqc-dnssec', name: 'CoreDNS PQC DNSSEC', versionNote: 'Experimental' },
      {
        productId: 'powerdns-pqc-dnssec',
        name: 'PowerDNS PQC DNSSEC',
        versionNote: 'Experimental',
      },
      { productId: 'isc-bind-9-21', name: 'ISC BIND 9.21', versionNote: 'Classical DNSSEC only' },
    ],
    playground: null,
    gaps: [
      'No DNSSEC playground tool exists in /playground.',
      'No PQ algorithm has been assigned a DNSKEY algorithm code point in the IANA registry.',
      'Signature size (ML-DSA 2.4–4.6 KB, SLH-DSA 7.8–49.8 KB) exceeds the ~1232-byte DNS MTU — drives TCP fallback.',
    ],
  },
]
