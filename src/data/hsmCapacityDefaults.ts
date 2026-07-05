// SPDX-License-Identifier: GPL-3.0-only
/**
 * HSM Capacity Calculator defaults.
 *
 * Models the top 10 enterprise HSM use cases and how much work each one
 * places on a fleet, in two scenarios:
 *   - Classical workload  (today: RSA-2048 / ECDSA P-256 signatures; ECDH P-256 key exchange)
 *   - PQC workload        (post-migration: ML-DSA-65 replaces RSA/ECDSA signatures;
 *                          ML-KEM-768 replaces ECDH P-256 key exchange; symmetric unchanged)
 *
 * HSM performance numbers are illustrative reference values derived from
 * publicly available vendor datasheets (Thales Luna 7 PCIe, Entrust nShield 5c,
 * Utimaco SecurityServer Se Gen2). No public vendor currently publishes
 * ML-DSA hardware-accelerated TPS — the "next-gen PQC HSM" ML-DSA number is
 * an estimate based on FPGA / ASIC prototype measurements in NIST PQC
 * evaluation reports. All values are exposed as sliders so operators can
 * replace them with their own benchmarked numbers.
 */

export type AlgoId =
  | 'rsa-2048'
  | 'ecdsa-p256'
  | 'ecdh-p256'
  | 'ml-dsa-65'
  | 'ml-kem-768'
  | 'slh-dsa-128s'
  | 'aes-128'
  | 'aes-256'

export const ALGO_LABELS: Record<AlgoId, string> = {
  'rsa-2048': 'RSA-2048',
  'ecdsa-p256': 'ECDSA P-256',
  'ecdh-p256': 'ECDH P-256',
  'ml-dsa-65': 'ML-DSA-65',
  'ml-kem-768': 'ML-KEM-768',
  'slh-dsa-128s': 'SLH-DSA-128s',
  'aes-128': 'AES-128',
  'aes-256': 'AES-256',
}

/**
 * Which "post-PQC" op profile the calculator applies:
 *  - 'standards-today' — only algorithm swaps whose protocol-layer standard is
 *    actually published/deployed per src/data/pqcProtocolMatrix.ts (hybrid KEM
 *    everywhere; PQC signatures only where the sig RFC is published).
 *  - 'end-state' — every use case fully migrated (hypothetical final state).
 * Alignment between profiles and the matrix is enforced by
 * hsmCapacityMatrixLink.test.ts.
 */
export type MigrationHorizon = 'standards-today' | 'end-state'

/** Selectable signature algorithm for the code-signing use case (C3). */
export type CodeSigningAlg = 'ml-dsa-65' | 'slh-dsa-128s'

export type DeploymentSize = 'small' | 'medium' | 'large'

export interface UseCaseEstimation {
  /** Plain-language explanation of why the default TPS range was chosen. */
  rationale: string
  /** Formula walkthrough at the medium deployment size. */
  math: string
  /** Cited standards and benchmarks. */
  sources: string[]
  /** How switching to PQC algorithms changes the ops count for this use case. */
  pqcImpact: string
}

export interface UseCase {
  id: string
  name: string
  description: string
  /** Ops per transaction under today's classical workload (RSA / ECDSA). */
  classicalOps: Partial<Record<AlgoId, number>>
  /** Ops per transaction under the FULL end-state PQC workload (every use case migrated). */
  pqcOps: Partial<Record<AlgoId, number>>
  /**
   * Ops per transaction under the "standards today" horizon — only swaps whose
   * protocol-layer standardization is published/deployed per pqcProtocolMatrix:
   * hybrid ML-KEM key exchange where standardized; PQC signatures only where the
   * signature RFC is published (X.509 / CMS); classical signatures otherwise.
   */
  pqcTodayOps: Partial<Record<AlgoId, number>>
  /** Default transactions/sec for each deployment size. */
  defaultTps: Record<DeploymentSize, number>
  defaultEnabled: boolean
  /** Methodology behind the TPS defaults and ops-per-transaction ratios. */
  estimation: UseCaseEstimation
}

export const USE_CASES: UseCase[] = [
  {
    id: 'tls',
    name: 'TLS / HTTPS termination',
    description:
      'Web tier and API gateway TLS handshakes. 1 server signature + 1 hybrid KEM (ML-KEM-768 + ECDH P-256) per handshake. Assumes full-handshake offload to the HSM (both the certificate signature and the ephemeral KEM); keyless-TLS designs that only offload the signature would charge substantially less HSM load.',
    classicalOps: { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    // Hybrid KEM is production (draft-ietf-tls-ecdhe-mlkem, RFC Ed queue); ML-DSA in
    // TLS (draft-ietf-tls-mldsa) is still at IESG — server sig stays ECDSA today.
    pqcTodayOps: { 'ecdsa-p256': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    defaultTps: { small: 500, medium: 5_000, large: 50_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by concurrent active users, session duration, TLS session-resumption rate, and microservice-to-microservice mTLS traffic. A medium enterprise (~10,000 active users each generating ~3 HTTPS requests/sec) produces ~30,000 requests/sec. With ~80% served via TLS session resumption, the remaining 20% require a full HSM-backed handshake → ~6,000 new handshakes/sec, averaging to ~5,000 TPS. A small org (~1,000 active users) reaches ~500 TPS at the same ratio. A large CDN-scale enterprise spans 10+ PoPs, each handling thousands of simultaneous connections, pushing TPS to 50,000 — because every additional PoP, user cohort, or microservice fan-out multiplies the raw handshake rate.',
      math: 'At medium (5,000 TPS): 5,000 ECDSA P-256 + 5,000 ECDH P-256 ops/s (classical); 5,000 ML-DSA-65 + 5,000 ML-KEM-768 + 5,000 ECDH P-256 ops/s (PQC hybrid — SecP256r1MLKEM768).',
      sources: [
        'RFC 8446 §4.4 (TLS 1.3 Certificate Verify)',
        'NIST SP 800-52 Rev. 2 (TLS guidance)',
        'Cloudflare/Fastly published TLS handshake rate data',
      ],
      pqcImpact:
        'ECDSA P-256 → ML-DSA-65; ECDH P-256 → hybrid ML-KEM-768 + ECDH P-256 (SecP256r1MLKEM768, draft-ietf-tls-ecdhe-mlkem-05 — the P-256 hybrid group used in FIPS/CNSA-constrained deployments; browsers instead default to the X25519MLKEM768 hybrid group). Hybrid KEM adds an extra ECDH operation per handshake alongside ML-KEM-768. ML-DSA-65 at 150 ops/s on a classical HSM is the primary bottleneck (~133× slower than ECDSA); ECDH P-256 hardware throughput is unchanged.',
    },
  },
  {
    id: 'code-signing',
    name: 'Code signing (CI/CD, containers)',
    description: 'Release artifact, container image, and SBOM signatures. 1 signature per build.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    // X.509-layer PQC sig RFCs are published (RFC 9881 ML-DSA, RFC 9909 SLH-DSA) and
    // UEFI/Authenticode pilots inherit them — signing artifacts with a PQC key is
    // standards-grounded today even though Sigstore's own PQC track is experimental.
    pqcTodayOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 2, medium: 20, large: 200 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the number of developers, commit frequency, and artifacts signed per build. A medium enterprise with 1,000 active developers each committing 20 times/day and signing 3 artifacts per commit (binary, container image, SBOM) generates 60,000 signing operations/day. With 50% of commits landing in a 1-hour peak deployment window and a 2.4× sprint-end surge: (1,000 × 20 × 3 × 50%) / 3,600s × 2.4 ≈ 20 TPS. A small org (100 developers, same pattern) → 2 TPS; a large hyperscaler (10,000 developers) → 200 TPS. Each additional developer multiplies the daily commit and artifact count proportionally.',
      math: 'At medium (20 TPS): 20 RSA-2048 ops/s on the HSM (<0.2% of 10,000 ops/s capacity — code signing is never the sizing constraint).',
      sources: [
        'NIST SP 800-218 §2.4 (SSDF — sign all release artifacts)',
        'Sigstore/cosign adoption data',
        'CNSA 2.0 (NSA) — LMS/XMSS or ML-DSA for software/firmware signing',
        'NIST SP 800-208 (stateful hash-based signatures)',
        'RFC 9909 (SLH-DSA X.509 certificates)',
      ],
      pqcImpact:
        'RSA-2048 → ML-DSA-65 by default, or SLH-DSA-128s via the algorithm selector on this card. CNSA 2.0 and NIST SP 800-208 favor hash-based signatures (LMS/XMSS, SLH-DSA) for software/firmware signing; SLH-DSA X.509 certificates are RFC 9909. The capacity trade-off is dramatic: SLH-DSA-128s signs ~75× slower than ML-DSA-65 on classical HSM firmware (~2 vs ~150 ops/s) and produces 7,856-byte signatures (vs 3,309 for ML-DSA-65, 256 for RSA-2048) — with hash-based signing, code signing can become a genuine HSM sizing constraint instead of a rounding error.',
    },
  },
  {
    id: 'doc-signing',
    name: 'Document / PDF signing (eIDAS)',
    description:
      'Advanced / qualified electronic signatures on documents. 1 signature per document.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    // CMS ML-DSA is a published RFC (RFC 9882) — PQC document signatures are
    // standards-grounded today (eIDAS/ETSI qualified-signature layer still pending).
    pqcTodayOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 1, medium: 5, large: 50 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the volume of documents requiring electronic signatures per hour. A medium national institution (insurance company, national bank) processes 18,000 signed documents per hour at business peak (loan applications, policy contracts, compliance filings, HR onboarding packets): 18,000 / 3,600 = 5 documents/sec → 5 TPS. A small regional firm (clinic, branch office, law practice) processes 1,800 documents/hour → 1 TPS. A large national e-signature platform or major bank processes 180,000 documents/hour → 50 TPS. Larger organizations sign more due to higher client volume, more regulated workflows, and more employees in contract-heavy roles.',
      math: 'At medium (5 TPS): 5 RSA-2048 ops/s. At large (50 TPS): still not the bottleneck — throughput is I/O-bound (PDF rendering, network) before it is HSM-bound.',
      sources: [
        'ETSI EN 319 102-1 (AdES signature formats)',
        'eIDAS Regulation 910/2014 Art. 26 (QES requirements)',
        'ETSI TS 119 312 (cryptographic suites for qualified signatures)',
      ],
      pqcImpact:
        "RSA-2048 → ML-DSA-65. ETSI signature suites (TS 119 312) do not yet define ML-DSA OIDs for qualified electronic signatures — the latest published version (v1.5.1, 2024-12) has no PQC content; ETSI ESI tracks PQC AdES suites as in-progress work. ML-DSA OIDs themselves are assigned in NIST's CSOR arc. Signature payload growth (~3 KB) requires PDF container (PAdES) and long-term validation (LTV) infrastructure updates.",
    },
  },
  {
    id: 'payment',
    name: 'Payment / PIN translation (PCI, EMV)',
    description:
      'PIN block encrypt and MAC for cardholder transactions. Mostly symmetric, occasional RSA. Modelled here on a shared general-purpose fleet; in practice PIN translation runs on a dedicated payment-HSM segment (payShield-class), sized separately.',
    classicalOps: { 'aes-128': 2, 'rsa-2048': 0.05 },
    pqcOps: { 'aes-256': 2, 'ml-kem-768': 0.05 },
    // No published PQC standard for payment zone-key exchange (no protocol-matrix row;
    // ANSI X9 / EMVCo work in progress) — AES-256 upgrade is policy-only, zone keys stay RSA.
    pqcTodayOps: { 'aes-256': 2, 'rsa-2048': 0.05 },
    defaultTps: { small: 50, medium: 500, large: 5_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by peak payment transaction volume, number of active POS terminals and ATMs, number of acquiring regions (each with its own zone keys), and key rotation frequency. Each card transaction requires PIN block translation: decrypt under the inbound zone key (1 AES op) and re-encrypt under the outbound zone key (1 AES op) — AES-128 today, AES-256 post-PQC migration. Zone-key exchange uses RSA at ~1 per 20 transactions (per PCI PIN §18 rotation requirements). A medium national acquirer processes ~500 peak payment TPS. A small regional processor handles ~50 TPS. A large national processor reaches 5,000 TPS because it supports more POS terminals, more concurrent acquiring regions, and higher peak hours (end-of-day retail, holiday spikes).',
      math: 'At medium (500 TPS): classical — 1,000 AES-128 + 25 RSA-2048 ops/s; PQC — 1,000 AES-256 + 25 ML-KEM-768 ops/s. AES-256 at ~20,000 ops/s on classical HSM handles this load easily.',
      sources: [
        'PCI DSS v4.0 §3.7 (key management)',
        'EMV® Book 2 §6 (key hierarchy)',
        'ANSI X9.24-1 (retail financial services key management)',
        'PCI PIN Security Requirements §18',
      ],
      pqcImpact:
        'AES-128 PIN block encryption → AES-256 (NIST SP 800-57 post-quantum recommendation). RSA-2048 zone-key exchange → ML-KEM-768 (FIPS 203). AES-256 throughput on classical HSMs (~20,000 ops/s) comfortably handles the symmetric load; ML-KEM-768 at ~500 ops/s is negligible at this TPS.',
    },
  },
  {
    id: 'tde',
    name: 'Database TDE (Oracle / SQL Server)',
    description:
      'Transparent data encryption. AES-256 DEK unwrap per key rotation + RSA master key wrap.',
    classicalOps: { 'aes-256': 1, 'rsa-2048': 0.1 },
    pqcOps: { 'aes-256': 1, 'ml-kem-768': 0.1 },
    // ML-KEM key-wrap mechanisms exist at the token layer today (PKCS#11 v3.2 CS01,
    // CMS KEMRecipientInfo RFC 9629/9936) — MEK wrap can move to ML-KEM now.
    pqcTodayOps: { 'aes-256': 1, 'ml-kem-768': 0.1 },
    defaultTps: { small: 20, medium: 200, large: 2_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the number of databases and tablespaces, size of connection pools, and the key material TTL — how often applications request fresh DEK material from the HSM on connection renewal. A medium enterprise runs 20 production databases, each with 10 active connection pools of 100 connections: 20 × 10 × 100 = 20,000 concurrent DB connections. With a key material TTL of 100 seconds: 20,000 / 100 = 200 DEK operations/sec → 200 TPS. A small org (2 databases × 10 pools × 100 connections → 2,000 connections / 100s = 20 TPS); a large enterprise (200 databases × 10 pools × 100 connections → 200,000 / 100 = 2,000 TPS). More databases, larger connection pools, and stricter (shorter) TTLs all increase the DEK fetch rate.',
      math: 'At medium (200 TPS): 200 × 1 = 200 AES-256 ops/s; 200 × 0.1 = 20 RSA-2048 ops/s.',
      sources: [
        'Oracle Advanced Security TDE documentation (Oracle 19c)',
        'Microsoft SQL Server TDE architecture (SQL Server 2022)',
        'NIST SP 800-57 Part 1 Rev. 5 §5.3 (key hierarchy)',
        'PCI DSS v4.0 §3.5 (encryption of stored data)',
      ],
      pqcImpact:
        "AES-256 is quantum-resistant (Grover's algorithm requires 2^128 operations at 256-bit keys). RSA-2048 MEK wrapping → ML-KEM-768 (FIPS 203). At 2,000 TPS (large), the 200 ML-KEM-768 ops/s demand is well within classical HSM firmware capacity.",
    },
  },
  {
    id: 'pki-ca',
    name: 'PKI CA issuance / OCSP',
    description:
      'Certificate issuance and OCSP response signing. 1 signature per cert or OCSP reply.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    // ML-DSA X.509 certificates are a published RFC (RFC 9881) — CA issuance/OCSP
    // signing with ML-DSA is the most standards-grounded PQC signature use of all.
    pqcTodayOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 2, medium: 20, large: 200 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the total employee and device population and how frequently each entity triggers certificate validation. A medium enterprise with 10,000 employees, each generating 50 OCSP validation events per day (VPN reconnects, HTTPS session checks, S/MIME email, software downloads), concentrated 3.4× during business hours: 10,000 × 50 / 86,400 × 3.4 ≈ 20 TPS. A small org (1,000 employees × 50 events × 3.4× / 86,400 = 2 TPS); a large enterprise with 100,000 employees or an equivalent IoT device fleet (100,000 × 50 × 3.4 / 86,400 ≈ 200 TPS). More employees, more managed devices (typically 3–10× employee count), and shorter certificate lifetimes all multiply the daily validation event count.',
      math: 'At medium (20 TPS): 20 RSA-2048 ops/s (<0.2% of HSM capacity). PKI CA is rarely the bottleneck — TLS termination runs 250× larger at the same org scale.',
      sources: [
        'RFC 5280 §4 (X.509 certificate profile)',
        'RFC 6960 §2 (OCSP)',
        'NIST SP 800-57 Part 3 Rev. 1 (CA key management guidance)',
        'CA/Browser Forum Baseline Requirements v2.0',
      ],
      pqcImpact:
        "RSA-2048 → ML-DSA-65 (FIPS 204). CA/B Forum is evaluating PQC OIDs for publicly-trusted certificates. ML-DSA-65 grows OCSP responses and CRLs substantially — the signature alone adds ~3.3 KB vs. RSA-2048's 256 bytes, and ~5 KB+ once the responder's ML-DSA public key (1,952 bytes) is also transmitted — bandwidth impact may exceed HSM throughput impact at scale.",
    },
  },
  {
    id: 'kms',
    name: 'KMS envelope encryption',
    description: 'Cloud KMS pattern — AES-256 key wrap for data keys, ECDH for recipient delivery.',
    classicalOps: { 'aes-256': 1, 'ecdh-p256': 0.2 },
    pqcOps: { 'aes-256': 1, 'ml-kem-768': 0.2 },
    // ML-KEM objects/mechanisms exist at the KMS token layer (PKCS#11 v3.2 CS01
    // production posture; KMIP CSD01 pilot) — data-key delivery can move to ML-KEM now.
    pqcTodayOps: { 'aes-256': 1, 'ml-kem-768': 0.2 },
    defaultTps: { small: 100, medium: 1_000, large: 10_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the number of microservices and applications calling KMS, volume of encrypted objects, data-key cache TTL (shorter = more KMS calls per app), and number of tenants or encryption contexts. A medium enterprise with ~200 microservices each making ~5 KMS decrypt calls/sec (to unwrap cached data keys) generates 1,000 KMS TPS; every 5th call triggers a new data-key via ECDH. A small org (20 services at 5 calls/sec) reaches 100 TPS. A large multi-tenant SaaS platform reaches 10,000 TPS because it runs thousands of services, enforces short key cache TTLs for compliance, and handles per-tenant key isolation that multiplies HSM operations per request.',
      math: "At medium (1,000 TPS): 1,000 AES-256 ops/s + 200 ECDH P-256 ops/s (classical); 1,000 AES-256 ops/s + 200 ML-KEM-768 ops/s (PQC). ML-KEM-768 at ~500 ops/s on a classical HSM means the 200 ops/s KEM share consumes ~40% of one HSM's capacity — no longer negligible the way AES/ECDH throughput is.",
      sources: [
        'AWS KMS Developer Guide (envelope encryption pattern)',
        'Google Cloud KMS architecture whitepaper',
        'NIST SP 800-57 Part 1 Rev. 5 §6.2.5',
        'NIST SP 800-175B Rev. 1',
      ],
      pqcImpact:
        'ECDH P-256 data-key delivery → ML-KEM-768 (FIPS 203). AES-256 key wrapping is quantum-resistant. ML-KEM-768 at 500 ops/s on classical HSM firmware handles small/medium deployments, but becomes a ~4-HSM bottleneck at the large-deployment KMS key-delivery load (2,000 ops/s) — unlike AES/ECDH, this does not scale for free.',
    },
  },
  {
    id: 'vpn-ike',
    name: 'VPN / IPsec IKE',
    description:
      'Site-to-site and remote-access IKEv2 tunnel negotiation. 1 hybrid KEM (ML-KEM-768 + ECDH, RFC 9370 multi-KE) + 2 AUTH (mutual) per setup.',
    classicalOps: { 'ecdh-p256': 1, 'ecdsa-p256': 2 },
    // Hybrid KEX: RFC 9370 multi-KE keeps the classical (EC)DH exchange alongside
    // ML-KEM (draft-ietf-ipsecme-ikev2-mlkem) — the classical op stays in the PQC mix.
    pqcOps: { 'ml-kem-768': 1, 'ecdh-p256': 1, 'ml-dsa-65': 2 },
    // ML-DSA IKEv2 authentication is an IESG-submitted draft, not an RFC — AUTH
    // signatures stay ECDSA today; only the key exchange goes hybrid ML-KEM.
    pqcTodayOps: { 'ml-kem-768': 1, 'ecdh-p256': 1, 'ecdsa-p256': 2 },
    defaultTps: { small: 10, medium: 100, large: 1_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS represents the peak IKEv2 handshake rate during the business-hours login window — the key sizing event for the HSM fleet. A medium enterprise with 5,000 remote workers whose VPN clients connect within a 50-second window at shift start (staggered by calendar and time zones): 5,000 / 50 = 100 new IKEv2 handshakes/sec → 100 TPS. A small org (500 workers / 50s = 10 TPS); a large global enterprise (50,000 endpoints / 50s = 1,000 TPS). More endpoints and more distributed time zones create larger and more frequent reconnect waves during shift starts, failover events, and software-triggered re-authentications.',
      math: 'At medium (100 TPS): 100 ECDH P-256 + 200 ECDSA P-256 ops/s (classical, mutual auth); 100 ML-KEM-768 + 100 ECDH P-256 + 200 ML-DSA-65 ops/s (PQC hybrid, mutual auth). RFC 7296 §2.15: both initiator and responder send AUTH.',
      sources: [
        'RFC 7296 §2.15 (IKEv2 AUTH payload)',
        'RFC 8031 (ECDH groups in IKE)',
        'RFC 9370 (Multiple Key Exchanges in IKEv2)',
        'NIST SP 800-77 Rev. 1 (IPsec guidance)',
        'draft-ietf-ipsecme-ikev2-mlkem (ML-KEM key exchange for IKEv2)',
      ],
      pqcImpact:
        'ECDSA P-256 AUTH × 2 → ML-DSA-65 × 2 (RFC 7296 §2.15 mutual auth: both initiator and responder authenticate); ECDH P-256 → ML-KEM-768 (RFC 9370 hybrid framework + draft-ietf-ipsecme-ikev2-mlkem). At 1,000 TPS (large), 2,000 ML-DSA-65 ops/s on a classical HSM (150 ops/s) requires 14 HSMs just for IKE AUTH. The ×2 assumes both tunnel endpoints are org-owned HSMs (site-to-site); for pure remote-access VPN, the client authenticates on its own device and only 1× AUTH lands on the org fleet.',
    },
  },
  {
    id: 'ssh',
    name: 'SSH user / host authentication',
    description:
      'Privileged access and machine-to-machine SSH. 1 signature + 1 hybrid KEM (ML-KEM-768 + classical ECDH, as in mlkem768x25519) per session. Assumes a centralized SSH CA / bastion architecture where host keys and session KEM are HSM-resident, not per-server local keys.',
    classicalOps: { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    // Hybrid KEX: the standardized/deployed SSH PQC key exchange is hybrid
    // (mlkem768x25519 — OpenSSH 10.0 default; RFC 9941 sntrup761x25519) — the
    // classical op stays in the PQC mix, mirroring TLS.
    pqcOps: { 'ml-dsa-65': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    // ML-DSA host-key auth is only an individual draft (draft-sfluhrer-ssh-mldsa) —
    // host keys stay classical today; only the key exchange goes hybrid ML-KEM.
    pqcTodayOps: { 'ecdsa-p256': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    defaultTps: { small: 20, medium: 200, large: 2_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is dominated by automated tooling rather than human operators. A medium enterprise managing 2,000 servers and containers, each polled by monitoring and configuration-management automation (Ansible, Prometheus exporters, health-check scripts) via SSH every 10 seconds: 2,000 / 10 = 200 new SSH sessions/sec → 200 TPS. A small org with 200 servers at the same polling interval → 200 / 10 = 20 TPS; a large container platform with 20,000 ephemeral pods → 20,000 / 10 = 2,000 TPS. Larger infrastructure footprints and higher automation density multiply the SSH session rate in direct proportion to server count.',
      math: 'At medium (200 TPS): 200 ECDSA P-256 + 200 ECDH P-256 ops/s (classical); 200 ML-DSA-65 + 200 ML-KEM-768 + 200 ECDH P-256 ops/s (PQC hybrid).',
      sources: [
        'RFC 4253 §6.6 (SSH transport layer — host key signature)',
        'RFC 5656 (ECDSA curves in SSH)',
        'RFC 8731 (Curve25519 key exchange in SSH)',
        'draft-ietf-sshm-mlkem-hybrid-kex (ML-KEM hybrid key exchange for SSH, RFC Editor queue)',
      ],
      pqcImpact:
        'ECDSA P-256 → ML-DSA-65; ECDH P-256 → ML-KEM-768 (draft-ietf-sshm-mlkem-hybrid-kex — OpenSSH 10.0, released 2025, made the ML-KEM hybrid group the default key exchange). Full KEM migration modelled as the most conservative capacity estimate. At 2,000 TPS (large), ML-DSA-65 at 150 ops/s on a classical HSM requires 14 HSMs for SSH AUTH; ML-KEM-768 at 500 ops/s adds 4 more HSMs.',
    },
  },
  {
    id: 'dnssec',
    name: 'DNSSEC zone signing',
    description:
      'Authoritative DNSSEC zone and RRset signing. 1 signature per record on zone re-sign.',
    classicalOps: { 'ecdsa-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    // PQC DNSSEC has no WG draft and no IANA DNSKEY code point (matrix stage:
    // identified) — nothing to migrate to yet; signing stays ECDSA today.
    pqcTodayOps: { 'ecdsa-p256': 1 },
    defaultTps: { small: 10, medium: 100, large: 1_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'DNSSEC TPS equals the continuous RRset re-signing rate determined by RRSIG TTL. With a 1-hour RRSIG TTL (common for production zones balancing security and performance), every zone must be fully re-signed every hour. A medium enterprise managing 1,000 DNS zones with ~360 RRsets each: 1,000 × 360 / 3,600s = 100 signatures/sec → 100 TPS. A small org (100 zones × 360 RRsets / 3,600s = 10 TPS); a TLD operator or large CDN (10,000 zones × 360 RRsets / 3,600s = 1,000 TPS). Larger operators manage more zones (more services, subdomains, delegations, partner zones) and often enforce shorter RRSIG TTLs for security, both directly multiplying the continuous signing rate.',
      math: 'At medium (100 TPS): 100 ECDSA P-256 ops/s on the HSM (<1% of capacity — negligible classical load).',
      sources: [
        'RFC 4034 §3 (DNSSEC RRSIG record format)',
        'RFC 6605 (ECDSA curves for DNSSEC)',
        'RFC 9276 (NSEC3 operational guidance)',
        'NIST SP 800-81r3 (2026, secure DNS deployment guide)',
        'draft-sheth-pqc-dnssec-strategy',
        'draft-fregly-dnsop-slh-dsa-mtl-dnssec',
      ],
      pqcImpact:
        'ECDSA P-256 ZSK/KSK signing → ML-DSA-65. At 1,000 TPS (large), classical HSM re-signing throughput drops to 150 ops/s — requiring 7 HSMs. More critically, ML-DSA-65 signatures are 3,309 bytes vs. 64 bytes for ECDSA P-256, forcing TCP fallback for virtually all signed DNS responses (exceeds the EDNS0 1,232-byte default recommended since DNS Flag Day 2020), significantly impacting DNS infrastructure design and resolver latency.',
    },
  },
]

export interface HsmProfile {
  id: 'classical' | 'pqc'
  name: string
  description: string
  /** Ops per second the HSM sustains for each algorithm. */
  opsPerSec: Record<AlgoId, number>
  /** Public source / reference class for these numbers. */
  sourceNote: string
}

/**
 * Classical HSM — no PQC hardware acceleration. ML-DSA is handled in software
 * on the HSM firmware controller, which is 1–2 orders of magnitude slower
 * than classical signature primitives with dedicated modular-arithmetic
 * engines.
 */
export const CLASSICAL_HSM_DEFAULT: HsmProfile = {
  id: 'classical',
  name: 'Classical HSM',
  description:
    'General-purpose network HSM without PQC hardware acceleration. ML-DSA and ML-KEM run in firmware (software fallback). ML-KEM requires a vendor firmware update with PKCS#11 v3.2 support; some models may not support it without hardware replacement.',
  opsPerSec: {
    'rsa-2048': 10_000,
    'ecdsa-p256': 20_000,
    'ecdh-p256': 10_000,
    'ml-dsa-65': 150,
    'ml-kem-768': 500,
    'slh-dsa-128s': 2,
    'aes-128': 25_000,
    'aes-256': 20_000,
  },
  sourceNote:
    'Reference class: Thales Luna 7 PCIe / Entrust nShield 5c / Utimaco SecurityServer Se Gen2 public datasheets. RSA-2048 ~10k ops/s, ECDSA P-256 ~20k ops/s (vendor datasheets). ML-DSA software fallback ~150 ops/s (NIST PQC evaluation reports). ML-KEM-768 software estimate ~500 ops/s (lattice KEM operations; no vendor publishes this figure). SLH-DSA-128s firmware fallback ~2 sign/s (hash-based signing is orders of magnitude slower than lattice; extrapolated from SUPERCOP/liboqs-class benchmarks).',
}

/**
 * Next-gen PQC HSM — dedicated ML-KEM / ML-DSA hardware engine.
 */
export const PQC_HSM_DEFAULT: HsmProfile = {
  id: 'pqc',
  name: 'Next-gen PQC HSM',
  description:
    'Next-generation HSM with dedicated ML-DSA / ML-KEM hardware accelerator. Newer silicon delivers higher classical TPS than legacy HSMs; PQC ops ~16–24× faster than classical software fallback.',
  opsPerSec: {
    'rsa-2048': 100_000,
    'ecdsa-p256': 100_000,
    'ecdh-p256': 100_000,
    'ml-dsa-65': 8_000,
    'ml-kem-768': 12_000,
    'slh-dsa-128s': 40,
    'aes-128': 250_000,
    'aes-256': 200_000,
  },
  sourceNote:
    'Illustrative estimate — no vendor publishes production ML-DSA or ML-KEM HW-accel TPS as of 2026-04. ML-DSA-65 extrapolated from NIST PQC FPGA/ASIC prototype benchmarks. ML-KEM-768 extrapolated from Samsung S3SSE2A eSE (18× hardware speedup vs software, CES 2026 Innovation Award) and Marvell LS2 HSM (FIPS 140-3 Level 3 module, certificate #4703; PQC coverage via separate CAVP algorithm certifications — the module certificate itself lists no PQC algorithms). SLH-DSA-128s ~40 sign/s assumes dedicated hashing acceleration — still ~200× slower than accelerated ML-DSA.',
}

export interface SizePreset {
  id: DeploymentSize
  name: string
  description: string
  /** Approximate aggregate transactions/sec across all default use cases. */
  aggregateTps: number
}

/**
 * `aggregateTps` is the sum of every use case's default per-site TPS at this
 * size (derived via `deriveUseCaseTps` over `ORG_PARAM_DEFAULTS`) — it must
 * match the "Checked TPS total" readout when all use cases are enabled.
 * Verified by the estimation-consistency test suite.
 */
export const SIZE_PRESETS: SizePreset[] = [
  {
    id: 'small',
    name: 'Small',
    description: 'Regional business, < 5k employees, single data center.',
    aggregateTps: 715,
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'National enterprise, 5k–50k employees, multi-region.',
    aggregateTps: 7_145,
  },
  {
    id: 'large',
    name: 'Large',
    description: 'Global enterprise, > 50k employees, global distribution.',
    aggregateTps: 71_447,
  },
]

/**
 * RSA-2048 is the canonical HSM capacity unit. Vendors (Thales Luna 7,
 * Entrust nShield 5c, Utimaco SecurityServer) all publish throughput in
 * RSA-2048 signs/sec; every other algorithm's TPS is most readable as a
 * ratio against that anchor.
 */
export const BASE_UNIT_ALGO: AlgoId = 'rsa-2048'

/**
 * How many RSA-2048-equivalent ops one op of `algo` "costs" on this HSM.
 * Cost > 1 means the algorithm is slower than the RSA-2048 baseline.
 */
export function algoCostRatio(profile: HsmProfile, algo: AlgoId): number {
  const base = profile.opsPerSec[BASE_UNIT_ALGO]
  const algoRate = profile.opsPerSec[algo]
  if (!algoRate || algoRate <= 0) return Infinity
  return base / algoRate
}

/**
 * Geographic region presets for the per-location distribution panel. Labels
 * are purely cosmetic — each location independently serves the full per-site
 * workload (no splitting). Ordered so the first N defaults sketch a
 * plausible global active-active deployment.
 */
export const REGION_PRESETS: string[] = [
  'Frankfurt',
  'Virginia',
  'Singapore',
  'Dublin',
  'Oregon',
  'Tokyo',
  'São Paulo',
  'Sydney',
  'London',
  'Paris',
  'Mumbai',
  'Toronto',
]

export const ALGO_IDS: AlgoId[] = [
  'rsa-2048',
  'ecdsa-p256',
  'ecdh-p256',
  'ml-dsa-65',
  'ml-kem-768',
  'slh-dsa-128s',
  'aes-128',
  'aes-256',
]

/**
 * Classical signature algorithms — used by the "hybrid signature transition" toggle
 * to add classical signing load back onto the PQC workload (RSA/ECDSA + ML-DSA on
 * every artifact), modelling operators who dual-sign during the migration window.
 * KEM/symmetric algorithms are excluded: transition-window hybrid signing is a
 * signature-only practice.
 */
export const SIGNATURE_ALGOS: AlgoId[] = ['rsa-2048', 'ecdsa-p256']

/**
 * PQC signature algorithms — used to gate the hybrid-signing toggle (dual-sign
 * load is only meaningful for use cases whose selected PQC ops actually contain
 * a PQC signature) and by the matrix-alignment drift test.
 */
export const PQC_SIG_ALGOS: AlgoId[] = ['ml-dsa-65', 'slh-dsa-128s']

/**
 * Per-algorithm slider ranges for the HSM performance panel.
 * Step size matches the order of magnitude so sliders feel responsive.
 */
export const ALGO_SLIDER_RANGES: Record<AlgoId, { min: number; max: number; step: number }> = {
  'rsa-2048': { min: 100, max: 50_000, step: 100 },
  'ecdsa-p256': { min: 100, max: 100_000, step: 100 },
  'ecdh-p256': { min: 100, max: 50_000, step: 100 },
  'ml-dsa-65': { min: 50, max: 50_000, step: 50 },
  'ml-kem-768': { min: 100, max: 100_000, step: 100 },
  'slh-dsa-128s': { min: 1, max: 2_000, step: 1 },
  'aes-128': { min: 1_000, max: 1_000_000, step: 1_000 },
  'aes-256': { min: 1_000, max: 1_000_000, step: 1_000 },
}

// ---------------------------------------------------------------------------
// Org-size parameters
// ---------------------------------------------------------------------------

/**
 * Organisation-level parameters that drive per-use-case TPS defaults.
 * Changing any of these re-derives TPS for the affected use cases via
 * `deriveUseCaseTps`.
 */
export interface OrgParams {
  employees: number
  developers: number
  servers: number
  databases: number
  microservices: number
  paymentTps: number
}

export const ORG_PARAM_DEFAULTS: Record<DeploymentSize, OrgParams> = {
  small: {
    employees: 1_000,
    developers: 100,
    servers: 200,
    databases: 2,
    microservices: 20,
    paymentTps: 50,
  },
  medium: {
    employees: 10_000,
    developers: 1_000,
    servers: 2_000,
    databases: 20,
    microservices: 200,
    paymentTps: 500,
  },
  large: {
    employees: 100_000,
    developers: 10_000,
    servers: 20_000,
    databases: 200,
    microservices: 2_000,
    paymentTps: 5_000,
  },
}

export const ORG_PARAM_RANGES: Record<
  keyof OrgParams,
  { min: number; max: number; step: number; label: string; description: string }
> = {
  employees: {
    min: 100,
    max: 200_000,
    step: 100,
    label: 'Employees',
    description: 'Drives TLS, PKI CA/OCSP, VPN, document signing',
  },
  developers: {
    min: 10,
    max: 50_000,
    step: 10,
    label: 'Developers',
    description: 'Drives code signing (CI/CD, containers)',
  },
  servers: {
    min: 10,
    max: 50_000,
    step: 10,
    label: 'Servers / infra nodes',
    description: 'Drives SSH authentication and DNSSEC zone count',
  },
  databases: {
    min: 1,
    max: 1_000,
    step: 1,
    label: 'Databases',
    description: 'Drives database TDE (DEK unwrap rate)',
  },
  microservices: {
    min: 5,
    max: 5_000,
    step: 5,
    label: 'Microservices',
    description: 'Drives KMS envelope encryption call rate',
  },
  paymentTps: {
    min: 0,
    max: 20_000,
    step: 50,
    label: 'Payment peak TPS',
    description: 'Peak payment transaction rate (0 if not applicable)',
  },
}

/**
 * Derives the default TPS for a single use case from org-level parameters.
 * Formulas reproduce the existing `defaultTps` values exactly at the default
 * `ORG_PARAM_DEFAULTS` values — verified against the estimation methodology
 * documented in each use case's `estimation` field.
 */
export function deriveUseCaseTps(ucId: string, p: OrgParams): number {
  switch (ucId) {
    case 'tls':
      // employees × 3 req/s × ~20% new handshakes (80% resumption), smoothed
      return Math.max(1, Math.round(p.employees * 0.5))
    case 'code-signing':
      // devs × 20 commits/day × 3 artifacts × 50% peak window × 2.4× surge / 3600s
      return Math.max(1, Math.round((p.developers * 20 * 3 * 0.5 * 2.4) / 3_600))
    case 'doc-signing':
      // ~1 contract-requiring employee in 2000 generates 1 doc signing/s at peak
      return Math.max(1, Math.round(p.employees / 2_000))
    case 'payment':
      return Math.max(0, p.paymentTps)
    case 'tde':
      // databases × 10 connection-pools × 100 connections / 100s DEK TTL
      return Math.max(1, Math.round(p.databases * 10))
    case 'pki-ca':
      // employees × 50 OCSP events/day × 3.4× peak / 86400s
      return Math.max(1, Math.round((p.employees * 50 * 3.4) / 86_400))
    case 'kms':
      // microservices × 5 KMS calls/sec each
      return Math.max(1, p.microservices * 5)
    case 'vpn-ike':
      // 50% of employees connect in 50s peak window
      return Math.max(1, Math.round((p.employees * 0.5) / 50))
    case 'ssh':
      // servers polled every 10s by automation
      return Math.max(1, Math.round(p.servers / 10))
    case 'dnssec':
      // servers/20 ≈ DNS zones × 360 RRsets / 3600s RRSIG TTL
      return Math.max(1, Math.round(p.servers / 20))
    default:
      return 1
  }
}
