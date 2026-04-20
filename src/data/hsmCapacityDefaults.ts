// SPDX-License-Identifier: GPL-3.0-only
/**
 * HSM Capacity Calculator defaults.
 *
 * Models the top 10 enterprise HSM use cases and how much work each one
 * places on a fleet, in two scenarios:
 *   - Classical workload  (today: RSA-2048 / ECDSA P-256 for signatures)
 *   - PQC workload        (post-migration: ML-DSA-65 replaces RSA/ECDSA
 *                          signatures; key-exchange / symmetric stay the same)
 *
 * HSM performance numbers are illustrative reference values derived from
 * publicly available vendor datasheets (Thales Luna 7 PCIe, Entrust nShield 5c,
 * Utimaco SecurityServer Se Gen2). No public vendor currently publishes
 * ML-DSA hardware-accelerated TPS — the "next-gen PQC HSM" ML-DSA number is
 * an estimate based on FPGA / ASIC prototype measurements in NIST PQC
 * evaluation reports. All values are exposed as sliders so operators can
 * replace them with their own benchmarked numbers.
 */

export type AlgoId = 'rsa-2048' | 'ecdsa-p256' | 'ecdh-p256' | 'ml-dsa-65' | 'aes-128' | 'aes-256'

export const ALGO_LABELS: Record<AlgoId, string> = {
  'rsa-2048': 'RSA-2048',
  'ecdsa-p256': 'ECDSA P-256',
  'ecdh-p256': 'ECDH P-256',
  'ml-dsa-65': 'ML-DSA-65',
  'aes-128': 'AES-128',
  'aes-256': 'AES-256',
}

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
  /** Ops per transaction under PQC workload (ML-DSA replaces RSA/ECDSA signs). */
  pqcOps: Partial<Record<AlgoId, number>>
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
      'Web tier and API gateway TLS handshakes. 1 server signature + 1 ECDH per handshake.',
    classicalOps: { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1, 'ecdh-p256': 1 },
    defaultTps: { small: 500, medium: 5_000, large: 50_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by concurrent active users, session duration, TLS session-resumption rate, and microservice-to-microservice mTLS traffic. A medium enterprise (~10,000 active users each generating ~3 HTTPS requests/sec) produces ~30,000 requests/sec. With ~80% served via TLS session resumption, the remaining 20% require a full HSM-backed handshake → ~6,000 new handshakes/sec, averaging to ~5,000 TPS. A small org (~1,000 active users) reaches ~500 TPS at the same ratio. A large CDN-scale enterprise spans 10+ PoPs, each handling thousands of simultaneous connections, pushing TPS to 50,000 — because every additional PoP, user cohort, or microservice fan-out multiplies the raw handshake rate.',
      math: 'At medium (5,000 TPS): 5,000 ECDSA P-256 ops/s + 5,000 ECDH P-256 ops/s on the HSM fleet.',
      sources: [
        'RFC 8446 §4.4 (TLS 1.3 Certificate Verify)',
        'NIST SP 800-52 Rev. 2 (TLS guidance)',
        'Cloudflare/Fastly published TLS handshake rate data',
      ],
      pqcImpact:
        'ECDSA P-256 → ML-DSA-65. On a classical HSM, ML-DSA-65 runs at ~500 ops/s (software fallback) vs. 20,000 ops/s for ECDSA — a 40× slowdown. TLS is the primary HSM bottleneck in post-PQC scenarios on existing hardware.',
    },
  },
  {
    id: 'code-signing',
    name: 'Code signing (CI/CD, containers)',
    description: 'Release artifact, container image, and SBOM signatures. 1 signature per build.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 2, medium: 20, large: 200 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the number of developers, commit frequency, and artifacts signed per build. A medium enterprise with 1,000 active developers each committing 20 times/day and signing 3 artifacts per commit (binary, container image, SBOM) generates 60,000 signing operations/day. With 50% of commits landing in a 1-hour peak deployment window and a 2.4× sprint-end surge: (1,000 × 20 × 3 × 50%) / 3,600s × 2.4 ≈ 20 TPS. A small org (100 developers, same pattern) → 2 TPS; a large hyperscaler (10,000 developers) → 200 TPS. Each additional developer multiplies the daily commit and artifact count proportionally.',
      math: 'At medium (20 TPS): 20 RSA-2048 ops/s on the HSM (<0.2% of 10,000 ops/s capacity — code signing is never the sizing constraint).',
      sources: [
        'NIST SP 800-218 §2.4 (SSDF — sign all release artifacts)',
        'Sigstore/cosign adoption data',
        'BSI TR-03116-4 (code signing for software distribution)',
      ],
      pqcImpact:
        'RSA-2048 → ML-DSA-65. HSM throughput impact at typical CI/CD volumes is negligible. The main concern is signature size growth (ML-DSA-65: 3,293 bytes vs. RSA-2048: 256 bytes), which affects artifact registries and distribution pipelines rather than HSM capacity.',
    },
  },
  {
    id: 'doc-signing',
    name: 'Document / PDF signing (eIDAS)',
    description:
      'Advanced / qualified electronic signatures on documents. 1 signature per document.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 1, medium: 5, large: 50 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the volume of documents requiring electronic signatures per hour. A medium national institution (insurance company, national bank) processes 18,000 signed documents per hour at business peak (loan applications, policy contracts, compliance filings, HR onboarding packets): 18,000 / 3,600 = 5 documents/sec → 5 TPS. A small regional firm (clinic, branch office, law practice) processes 1,800 documents/hour → 1 TPS. A large national e-signature platform or major bank processes 180,000 documents/hour → 50 TPS. Larger organizations sign more due to higher client volume, more regulated workflows, and more employees in contract-heavy roles.',
      math: 'At medium (50 TPS): 50 RSA-2048 ops/s. HSM is not the bottleneck — throughput is I/O-bound (PDF rendering, network) before it is HSM-bound.',
      sources: [
        'ETSI EN 319 102-1 (AdES signature formats)',
        'eIDAS Regulation 910/2014 Art. 26 (QES requirements)',
        'ETSI TS 119 312 (cryptographic suites for qualified signatures)',
      ],
      pqcImpact:
        'RSA-2048 → ML-DSA-65. ETSI TS 119 312 v1.4.1 draft includes ML-DSA OIDs for qualified electronic signatures. Signature payload growth (~3 KB) requires PDF container (PAdES) and long-term validation (LTV) infrastructure updates.',
    },
  },
  {
    id: 'payment',
    name: 'Payment / PIN translation (PCI, EMV)',
    description:
      'PIN block encrypt and MAC for cardholder transactions. Mostly symmetric, occasional RSA.',
    classicalOps: { 'aes-128': 2, 'rsa-2048': 0.05 },
    pqcOps: { 'aes-128': 2, 'ml-dsa-65': 0.05 },
    defaultTps: { small: 50, medium: 500, large: 5_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by peak payment transaction volume, number of active POS terminals and ATMs, number of acquiring regions (each with its own zone keys), and key rotation frequency. Each card transaction requires PIN block translation: decrypt under the inbound zone key (1 AES-128 op) and re-encrypt under the outbound zone key (1 AES-128 op). Zone-key exchange uses RSA at ~1 per 20 transactions (per PCI PIN §18 rotation requirements). A medium national acquirer processes ~500 peak payment TPS. A small regional processor handles ~50 TPS. A large national processor reaches 5,000 TPS because it supports more POS terminals, more concurrent acquiring regions, and higher peak hours (end-of-day retail, holiday spikes).',
      math: 'At medium (500 TPS): 500 × 2 = 1,000 AES-128 ops/s; 500 × 0.05 = 25 RSA-2048 ops/s.',
      sources: [
        'PCI DSS v4.0 §3.7 (key management)',
        'EMV® Book 2 §6 (key hierarchy)',
        'ANSI X9.24-1 (retail financial services key management)',
        'PCI PIN Security Requirements §18',
      ],
      pqcImpact:
        'The RSA-2048 component represents asymmetric key exchange for zone-key delivery — in practice this migrates to ML-KEM-768 (FIPS 203), not ML-DSA. ML-DSA-65 is used here as a proxy for the PQC asymmetric load since ML-KEM is not separately tracked in this simulator. AES-128 is quantum-safe at current key sizes.',
    },
  },
  {
    id: 'tde',
    name: 'Database TDE (Oracle / SQL Server)',
    description:
      'Transparent data encryption. AES-256 DEK unwrap per key rotation + RSA master key wrap.',
    classicalOps: { 'aes-256': 1, 'rsa-2048': 0.1 },
    pqcOps: { 'aes-256': 1, 'ml-dsa-65': 0.1 },
    defaultTps: { small: 20, medium: 200, large: 2_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the number of databases and tablespaces, size of connection pools, and the key material TTL — how often applications request fresh DEK material from the HSM on connection renewal. A medium enterprise runs 20 production databases, each with 10 active connection pools of 100 connections: 20 × 10 × 100 = 20,000 concurrent DB connections. With a key material TTL of 100 seconds: 20,000 / 100 = 200 DEK operations/sec → 200 TPS. A small org (3 databases × 5 pools × 133 connections → 2,000 connections / 100s = 20 TPS); a large enterprise (200 databases × 10 pools × 100 connections → 200,000 / 100 = 2,000 TPS). More databases, larger connection pools, and stricter (shorter) TTLs all increase the DEK fetch rate.',
      math: 'At medium (200 TPS): 200 × 1 = 200 AES-256 ops/s; 200 × 0.1 = 20 RSA-2048 ops/s.',
      sources: [
        'Oracle Advanced Security TDE documentation (Oracle 19c)',
        'Microsoft SQL Server TDE architecture (SQL Server 2022)',
        'NIST SP 800-57 Part 1 Rev. 5 §5.3 (key hierarchy)',
        'PCI DSS v4.0 §3.5 (encryption of stored data)',
      ],
      pqcImpact:
        "AES-256 is quantum-resistant (Grover's algorithm requires 2^128 operations at 256-bit keys). RSA-2048 MEK wrapping would migrate to ML-KEM-768 in practice; modeled as ML-DSA-65 proxy in this simulator since ML-KEM is not separately tracked.",
    },
  },
  {
    id: 'pki-ca',
    name: 'PKI CA issuance / OCSP',
    description:
      'Certificate issuance and OCSP response signing. 1 signature per cert or OCSP reply.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
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
        'RSA-2048 → ML-DSA-65 (FIPS 204). CA/B Forum is evaluating PQC OIDs for publicly-trusted certificates. ML-DSA-65 certificates add ~2 KB to OCSP responses and CRLs — bandwidth impact may exceed HSM throughput impact at scale.',
    },
  },
  {
    id: 'kms',
    name: 'KMS envelope encryption',
    description: 'Cloud KMS pattern — AES-256 key wrap for data keys, ECDH for recipient delivery.',
    classicalOps: { 'aes-256': 1, 'ecdh-p256': 0.2 },
    pqcOps: { 'aes-256': 1, 'ecdh-p256': 0.2 },
    defaultTps: { small: 100, medium: 1_000, large: 10_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is driven by the number of microservices and applications calling KMS, volume of encrypted objects, data-key cache TTL (shorter = more KMS calls per app), and number of tenants or encryption contexts. A medium enterprise with ~200 microservices each making ~5 KMS decrypt calls/sec (to unwrap cached data keys) generates 1,000 KMS TPS; every 5th call triggers a new data-key via ECDH. A small org (20 services at 5 calls/sec) reaches 100 TPS. A large multi-tenant SaaS platform reaches 10,000 TPS because it runs thousands of services, enforces short key cache TTLs for compliance, and handles per-tenant key isolation that multiplies HSM operations per request.',
      math: 'At medium (1,000 TPS): 1,000 AES-256 ops/s + 1,000 × 0.2 = 200 ECDH P-256 ops/s. At large scale ECDH becomes the bottleneck (2,000 ops/s vs. 10,000 capacity needed).',
      sources: [
        'AWS KMS Developer Guide (envelope encryption pattern)',
        'Google Cloud KMS architecture whitepaper',
        'NIST SP 800-57 Part 1 Rev. 5 §6.2.5',
        'NIST SP 800-175B Rev. 1',
      ],
      pqcImpact:
        'ECDH P-256 for data-key delivery would migrate to ML-KEM-768 (FIPS 203) in a fully PQC-migrated KMS. This simulator retains ECDH in the PQC workload since ML-KEM is not yet separately profiled. AES-256 key wrapping is quantum-resistant.',
    },
  },
  {
    id: 'vpn-ike',
    name: 'VPN / IPsec IKE',
    description:
      'Site-to-site and remote-access IKEv2 tunnel negotiation. 1 ECDH + 1 ECDSA per setup.',
    classicalOps: { 'ecdh-p256': 1, 'ecdsa-p256': 1 },
    pqcOps: { 'ecdh-p256': 1, 'ml-dsa-65': 1 },
    defaultTps: { small: 10, medium: 100, large: 1_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS represents the peak IKEv2 handshake rate during the business-hours login window — the key sizing event for the HSM fleet. A medium enterprise with 5,000 remote workers whose VPN clients connect within a 50-second window at shift start (staggered by calendar and time zones): 5,000 / 50 = 100 new IKEv2 handshakes/sec → 100 TPS. A small org (500 workers / 50s = 10 TPS); a large global enterprise (50,000 endpoints / 50s = 1,000 TPS). More endpoints and more distributed time zones create larger and more frequent reconnect waves during shift starts, failover events, and software-triggered re-authentications.',
      math: 'At medium (100 TPS): 100 ECDH P-256 ops/s + 100 ECDSA P-256 ops/s on the HSM.',
      sources: [
        'RFC 7296 §2.15 (IKEv2 AUTH payload)',
        'RFC 8031 (ECDH groups in IKE)',
        'NIST SP 800-77 Rev. 1 (IPsec guidance)',
        'draft-ietf-ipsecme-ikev2-mlkem (PQC key exchange for IKEv2)',
      ],
      pqcImpact:
        'ECDSA P-256 AUTH → ML-DSA-65. ECDH P-256 key exchange is retained (ML-KEM for IKE is in draft stage). At 1,000 TPS (large), ML-DSA-65 at 500 ops/s on a classical HSM requires 2+ HSMs just for IKE AUTH — VPN is the second most impacted use case after TLS.',
    },
  },
  {
    id: 'ssh',
    name: 'SSH user / host authentication',
    description: 'Privileged access and machine-to-machine SSH. 1 ECDSA sign + 1 ECDH per session.',
    classicalOps: { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1, 'ecdh-p256': 1 },
    defaultTps: { small: 20, medium: 200, large: 2_000 },
    defaultEnabled: true,
    estimation: {
      rationale:
        'TPS is dominated by automated tooling rather than human operators. A medium enterprise managing 2,000 servers and containers, each polled by monitoring and configuration-management automation (Ansible, Prometheus exporters, health-check scripts) via SSH every 10 seconds: 2,000 / 10 = 200 new SSH sessions/sec → 200 TPS. A small org with 200 servers at the same polling interval → 200 / 10 = 20 TPS; a large container platform with 20,000 ephemeral pods → 20,000 / 10 = 2,000 TPS. Larger infrastructure footprints and higher automation density multiply the SSH session rate in direct proportion to server count.',
      math: 'At medium (200 TPS): 200 ECDSA P-256 ops/s + 200 ECDH P-256 ops/s on the HSM.',
      sources: [
        'RFC 4253 §6.6 (SSH transport layer — host key signature)',
        'RFC 5656 (ECDSA curves in SSH)',
        'RFC 8731 (Curve25519 key exchange in SSH)',
        'draft-kampanakis-curdle-ssh-pq-ke (PQC key exchange for SSH)',
      ],
      pqcImpact:
        'ECDSA P-256 host-key signing → ML-DSA-65. At 2,000 TPS (large), ML-DSA-65 at 500 ops/s on a classical HSM requires 4+ HSMs for SSH AUTH alone. ECDH P-256 key exchange is retained; production PQC SSH would also migrate to ML-KEM per IETF drafts.',
    },
  },
  {
    id: 'dnssec',
    name: 'DNSSEC zone signing',
    description:
      'Authoritative DNSSEC zone and RRset signing. 1 signature per record on zone re-sign.',
    classicalOps: { 'ecdsa-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
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
        'NIST SP 800-81 Rev. 2 (secure DNS deployment guide)',
        'draft-ietf-dnsop-dnssec-pqc',
      ],
      pqcImpact:
        'ECDSA P-256 ZSK/KSK signing → ML-DSA-65. At 1,000 TPS (large), classical HSM re-signing throughput drops to 500 ops/s — requiring 2+ HSMs. More critically, ML-DSA-65 signatures are 3,293 bytes vs. 64 bytes for ECDSA P-256, forcing TCP fallback for virtually all signed DNS responses (UDP limit: 512 bytes), significantly impacting DNS infrastructure design and resolver latency.',
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
    'General-purpose network HSM without PQC hardware acceleration. ML-DSA runs in firmware (software fallback).',
  opsPerSec: {
    'rsa-2048': 10_000,
    'ecdsa-p256': 20_000,
    'ecdh-p256': 10_000,
    'ml-dsa-65': 500,
    'aes-128': 200_000,
    'aes-256': 150_000,
  },
  sourceNote:
    'Reference class: Thales Luna 7 PCIe / Entrust nShield 5c / Utimaco SecurityServer Se Gen2 public datasheets.',
}

/**
 * Next-gen PQC HSM — dedicated ML-KEM / ML-DSA hardware engine.
 */
export const PQC_HSM_DEFAULT: HsmProfile = {
  id: 'pqc',
  name: 'Next-gen PQC HSM',
  description:
    'Next-generation HSM with dedicated ML-DSA / ML-KEM hardware accelerator. Classical TPS unchanged or improved.',
  opsPerSec: {
    'rsa-2048': 10_000,
    'ecdsa-p256': 20_000,
    'ecdh-p256': 10_000,
    'ml-dsa-65': 8_000,
    'aes-128': 250_000,
    'aes-256': 200_000,
  },
  sourceNote:
    'Illustrative estimate. No vendor publishes production ML-DSA HW-accel TPS as of 2026-04; number extrapolated from NIST PQC FPGA/ASIC prototype benchmarks.',
}

export interface SizePreset {
  id: DeploymentSize
  name: string
  description: string
  /** Approximate aggregate transactions/sec across all default use cases. */
  aggregateTps: number
}

export const SIZE_PRESETS: SizePreset[] = [
  {
    id: 'small',
    name: 'Small',
    description: 'Regional business, < 5k employees, single data center.',
    aggregateTps: 2_000,
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'National enterprise, 5k–50k employees, multi-region.',
    aggregateTps: 20_000,
  },
  {
    id: 'large',
    name: 'Large',
    description: 'Global enterprise, > 50k employees, global distribution.',
    aggregateTps: 200_000,
  },
]

export const ALGO_IDS: AlgoId[] = [
  'rsa-2048',
  'ecdsa-p256',
  'ecdh-p256',
  'ml-dsa-65',
  'aes-128',
  'aes-256',
]

/**
 * Per-algorithm slider ranges for the HSM performance panel.
 * Step size matches the order of magnitude so sliders feel responsive.
 */
export const ALGO_SLIDER_RANGES: Record<AlgoId, { min: number; max: number; step: number }> = {
  'rsa-2048': { min: 100, max: 50_000, step: 100 },
  'ecdsa-p256': { min: 100, max: 100_000, step: 100 },
  'ecdh-p256': { min: 100, max: 50_000, step: 100 },
  'ml-dsa-65': { min: 50, max: 50_000, step: 50 },
  'aes-128': { min: 1_000, max: 1_000_000, step: 1_000 },
  'aes-256': { min: 1_000, max: 1_000_000, step: 1_000 },
}
