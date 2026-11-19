// SPDX-License-Identifier: AGPL-3.0-only

// ─── Network Segments ────────────────────────────────────────────────────────

export interface NetworkSegment {
  id: string
  label: string
  description: string
  typicalTraffic: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export const NETWORK_SEGMENTS: NetworkSegment[] = [
  {
    id: 'datacenter-core',
    label: 'Datacenter Core',
    description: 'East-west traffic between servers, storage, and internal services',
    typicalTraffic: ['TLS 1.3 (ECDH)', 'TLS 1.3 (RSA)', 'mTLS (ECDSA)', 'SSH (RSA-4096)'],
    riskLevel: 'critical',
  },
  {
    id: 'branch-wan',
    label: 'Branch WAN Edge',
    description: 'IPSec tunnels and encrypted WAN links to headquarters',
    typicalTraffic: ['IKEv2/IPSec (DH-2048)', 'TLS 1.3 (ECDH)', 'SSL VPN (RSA-2048)'],
    riskLevel: 'high',
  },
  {
    id: 'cloud-egress',
    label: 'Cloud Egress / API Gateway',
    description: 'North-south traffic to SaaS, cloud APIs, and public endpoints',
    typicalTraffic: ['TLS 1.3 (X25519)', 'TLS 1.3 (ML-KEM-768 hybrid)', 'QUIC/HTTP3'],
    riskLevel: 'high',
  },
  {
    id: 'ot-network',
    label: 'OT / Industrial Network',
    description: 'SCADA, ICS, and operational technology segments',
    typicalTraffic: ['TLS 1.2 (RSA-2048)', 'Modbus TCP (no encryption)', 'DNP3 (HMAC-SHA-256)'],
    riskLevel: 'critical',
  },
]

// ─── Passive Discovery Findings ──────────────────────────────────────────────

export interface TrafficObservation {
  id: string
  protocol: string
  source: string
  destination: string
  algorithm: string
  keySize: number
  quantumSafe: 'yes' | 'no' | 'hybrid' | 'unknown'
  risk: 'none' | 'low' | 'medium' | 'high' | 'critical'
  details: string
}

export const PASSIVE_OBSERVATIONS: Record<string, TrafficObservation[]> = {
  'datacenter-core': [
    {
      id: 'obs-dc-1',
      protocol: 'TLS 1.3',
      source: '10.1.0.12',
      destination: '10.1.0.45',
      algorithm: 'ECDH-P256 + AES-128-GCM',
      keySize: 256,
      quantumSafe: 'no',
      risk: 'critical',
      details: 'East-west mTLS between app servers. ECDH vulnerable to quantum. Contains PII.',
    },
    {
      id: 'obs-dc-2',
      protocol: 'TLS 1.3',
      source: '10.1.1.8',
      destination: '10.1.1.100',
      algorithm: 'X25519+ML-KEM-768 (hybrid) + AES-256-GCM',
      keySize: 768,
      quantumSafe: 'hybrid',
      risk: 'low',
      details: 'Database connection using hybrid PQC. Both classical and quantum-safe KEM active.',
    },
    {
      id: 'obs-dc-3',
      protocol: 'SSH',
      source: '10.1.0.5',
      destination: '10.1.0.99',
      algorithm: 'RSA-4096 host key + ECDH-P256 KEX',
      keySize: 4096,
      quantumSafe: 'no',
      risk: 'high',
      details: 'Admin SSH. Host key is RSA-4096 but key exchange uses quantum-vulnerable ECDH.',
    },
    {
      id: 'obs-dc-4',
      protocol: 'TLS 1.2',
      source: '10.1.2.44',
      destination: '10.1.2.10',
      algorithm: 'RSA-2048 + AES-128-CBC',
      keySize: 2048,
      quantumSafe: 'no',
      risk: 'critical',
      details: 'Legacy TLS 1.2 with CBC mode. Vulnerable to both quantum and classical attacks.',
    },
  ],
  'branch-wan': [
    {
      id: 'obs-wan-1',
      protocol: 'IKEv2/IPSec',
      source: '203.0.113.5',
      destination: '198.51.100.1',
      algorithm: 'DH Group 2 (1024-bit) + AES-128',
      keySize: 1024,
      quantumSafe: 'no',
      risk: 'critical',
      details: 'Branch IPSec tunnel using DH-1024. Critically weak — quantum AND classically weak.',
    },
    {
      id: 'obs-wan-2',
      protocol: 'SSL VPN',
      source: '203.0.113.10',
      destination: '198.51.100.2',
      algorithm: 'RSA-2048 + ECDH-P384',
      keySize: 2048,
      quantumSafe: 'no',
      risk: 'high',
      details: 'Remote access VPN. ECDH key exchange is quantum-vulnerable despite RSA cert.',
    },
    {
      id: 'obs-wan-3',
      protocol: 'TLS 1.3',
      source: '203.0.113.15',
      destination: '198.51.100.5',
      algorithm: 'X25519 + ChaCha20-Poly1305',
      keySize: 255,
      quantumSafe: 'no',
      risk: 'high',
      details:
        'Modern TLS, but X25519 is not quantum-safe and no hybrid exchange was observed in this flow. Plan a hybrid key exchange where both ends support it.',
    },
  ],
  'cloud-egress': [
    {
      id: 'obs-cloud-1',
      protocol: 'TLS 1.3',
      source: '10.0.0.5',
      destination: 'api.example.com',
      algorithm: 'X25519+ML-KEM-768 (hybrid) + AES-256-GCM',
      keySize: 768,
      quantumSafe: 'hybrid',
      risk: 'low',
      details:
        'Google/Cloudflare endpoint. Hybrid PQC was negotiated in this flow, which shows both endpoints supported it for this connection.',
    },
    {
      id: 'obs-cloud-2',
      protocol: 'QUIC/HTTP3',
      source: '10.0.0.8',
      destination: 'cdn.example.com',
      algorithm: 'X25519 + ChaCha20-Poly1305',
      keySize: 255,
      quantumSafe: 'no',
      risk: 'medium',
      details:
        'QUIC to CDN. A hybrid key exchange was not observed in this flow. That does not show the CDN lacks support: whether it supports hybrid KEM is unknown from this capture (an active probe or the CDN documentation would show it).',
    },
    {
      id: 'obs-cloud-3',
      protocol: 'TLS 1.3',
      source: '10.0.0.12',
      destination: 'saas-vendor.com',
      algorithm: 'Unknown / encrypted',
      keySize: 0,
      quantumSafe: 'unknown',
      risk: 'medium',
      details:
        'The negotiated algorithms are not recorded in this capture, so hybrid was not observed and support is unknown. TLS 1.3 encrypts the Certificate message, so a passive tap without endpoint secrets cannot see the certificate chain; endpoint telemetry, decryption at an endpoint you control, or an active probe is needed.',
    },
  ],
  'ot-network': [
    {
      id: 'obs-ot-1',
      protocol: 'Modbus TCP',
      source: '192.168.100.5',
      destination: '192.168.100.10',
      algorithm: 'None (plaintext)',
      keySize: 0,
      quantumSafe: 'no',
      risk: 'critical',
      details: 'Unencrypted Modbus. No cryptography at all — must add TLS wrapper or VPN.',
    },
    {
      id: 'obs-ot-2',
      protocol: 'TLS 1.2',
      source: '192.168.100.20',
      destination: '192.168.100.1',
      algorithm: 'RSA-2048 + AES-128-CBC',
      keySize: 2048,
      quantumSafe: 'no',
      risk: 'critical',
      details:
        'SCADA to historian. TLS 1.2 with RSA — quantum-vulnerable and classically weak CBC.',
    },
    {
      id: 'obs-ot-3',
      protocol: 'DNP3',
      source: '192.168.100.30',
      destination: '192.168.100.5',
      algorithm: 'HMAC-SHA-256',
      keySize: 256,
      quantumSafe: 'no',
      risk: 'high',
      details:
        'DNP3 with authentication only — no encryption, symmetric HMAC is quantum-resistant but lacks confidentiality.',
    },
  ],
}

// ─── Active Scan Targets ──────────────────────────────────────────────────────

export interface ScanTarget {
  id: string
  hostname: string
  port: number
  protocol: 'tls' | 'ssh' | 'ikev2'
  description: string
}

export const SCAN_TARGETS: ScanTarget[] = [
  {
    id: 't1',
    hostname: 'webserver.internal',
    port: 443,
    protocol: 'tls',
    description: 'Internal web app',
  },
  {
    id: 't2',
    hostname: 'api.internal',
    port: 8443,
    protocol: 'tls',
    description: 'Internal API gateway',
  },
  {
    id: 't3',
    hostname: 'mail.internal',
    port: 443,
    protocol: 'tls',
    description: 'Email server (SMTP/S)',
  },
  {
    id: 't4',
    hostname: 'bastion.internal',
    port: 22,
    protocol: 'ssh',
    description: 'SSH bastion host',
  },
  {
    id: 't5',
    hostname: 'devbox.internal',
    port: 22,
    protocol: 'ssh',
    description: 'Developer workstation',
  },
  {
    id: 't6',
    hostname: 'vpn-gw.internal',
    port: 500,
    protocol: 'ikev2',
    description: 'IPSec VPN gateway',
  },
  {
    id: 't7',
    hostname: 'legacy-app.internal',
    port: 443,
    protocol: 'tls',
    description: 'Legacy application',
  },
  {
    id: 't8',
    hostname: 'cloud-proxy.internal',
    port: 443,
    protocol: 'tls',
    description: 'Cloud egress proxy',
  },
]

export interface ScanResult {
  targetId: string
  tlsVersion: string
  keyExchange: string
  cipherSuite: string
  certAlgorithm: string
  certKeySize: number
  pqcSupport: 'full' | 'hybrid' | 'none'
  hybridAlgorithm?: string
  vulnerabilities: string[]
  riskScore: number
  recommendation: string
}

export const SCAN_RESULTS: Record<string, ScanResult> = {
  t1: {
    targetId: 't1',
    tlsVersion: 'TLS 1.3',
    keyExchange: 'X25519',
    cipherSuite: 'TLS_AES_256_GCM_SHA384',
    certAlgorithm: 'ECDSA-P256',
    certKeySize: 256,
    pqcSupport: 'none',
    vulnerabilities: [
      'Quantum-vulnerable key exchange (X25519)',
      "ECDSA cert vulnerable to Shor's algorithm",
    ],
    riskScore: 72,
    recommendation:
      'Upgrade to hybrid X25519+ML-KEM-768 for key exchange. Plan ML-DSA certificate migration.',
  },
  t2: {
    targetId: 't2',
    tlsVersion: 'TLS 1.3',
    keyExchange: 'X25519+ML-KEM-768 (hybrid)',
    cipherSuite: 'TLS_AES_256_GCM_SHA384',
    certAlgorithm: 'ECDSA-P384',
    certKeySize: 384,
    pqcSupport: 'hybrid',
    hybridAlgorithm: 'X25519+ML-KEM-768',
    vulnerabilities: ['ECDSA cert still quantum-vulnerable (hybrid key exchange only)'],
    riskScore: 28,
    recommendation:
      'Key exchange is hybrid-safe. Migrate certificate to ML-DSA or composite cert to achieve full PQC.',
  },
  t3: {
    targetId: 't3',
    tlsVersion: 'TLS 1.2',
    keyExchange: 'RSA-2048',
    cipherSuite: 'TLS_RSA_WITH_AES_128_CBC_SHA256',
    certAlgorithm: 'RSA-2048',
    certKeySize: 2048,
    pqcSupport: 'none',
    vulnerabilities: [
      'Static RSA key exchange: quantum-vulnerable and no forward secrecy (RFC 9325: SHOULD NOT negotiate)',
      'CBC cipher suite: padding-oracle (Lucky Thirteen class) risk depends on the implementation and on whether encrypt-then-MAC is negotiated (RFC 9325: SHOULD NOT use CBC without it)',
      'RSA cert quantum-vulnerable',
    ],
    riskScore: 95,
    recommendation:
      'High priority: TLS 1.2 itself is not deprecated (RFC 8996 deprecates TLS 1.0 and 1.1), but this configuration is weak. Move to TLS 1.3, or at least to TLS 1.2 with an ephemeral key exchange and an AEAD cipher suite. Migrate from RSA to ECDSA/ML-DSA and enable hybrid PQC key exchange.',
  },
  t4: {
    targetId: 't4',
    tlsVersion: 'N/A',
    keyExchange: 'sntrup761x25519-sha512@openssh.com',
    cipherSuite: 'chacha20-poly1305@openssh.com',
    certAlgorithm: 'Ed25519 host key',
    certKeySize: 255,
    pqcSupport: 'hybrid',
    hybridAlgorithm: 'sntrup761+X25519',
    vulnerabilities: [
      'Host key (Ed25519) quantum-vulnerable',
      'Hybrid KEX uses NTRU (not NIST ML-KEM standard)',
    ],
    riskScore: 35,
    recommendation:
      'Hybrid KEX active. Migrate host key to ML-DSA or SLH-DSA. Consider upgrading to NIST-standard ML-KEM hybrid KEX.',
  },
  t5: {
    targetId: 't5',
    tlsVersion: 'N/A',
    keyExchange: 'curve25519-sha256',
    cipherSuite: 'aes256-ctr',
    certAlgorithm: 'RSA-4096 host key',
    certKeySize: 4096,
    pqcSupport: 'none',
    vulnerabilities: [
      'RSA-4096 host key quantum-vulnerable',
      'ECDH key exchange quantum-vulnerable',
    ],
    riskScore: 68,
    recommendation:
      'Upgrade SSH host key to ML-DSA-65. Enable hybrid ML-KEM key exchange in sshd_config.',
  },
  t6: {
    targetId: 't6',
    tlsVersion: 'N/A',
    keyExchange: 'DH Group 14 (2048-bit)',
    cipherSuite: 'AES-256-CBC + HMAC-SHA1',
    certAlgorithm: 'RSA-2048',
    certKeySize: 2048,
    pqcSupport: 'none',
    vulnerabilities: [
      'DH-2048 quantum-vulnerable',
      'HMAC-SHA1 deprecated',
      'RSA-2048 cert quantum-vulnerable',
      "IKEv2 auth vulnerable to Shor's algorithm",
    ],
    riskScore: 88,
    recommendation:
      'High priority: Migrate to IKEv2 with ML-DSA authentication per draft-ietf-ipsecme-ikev2-pqc-auth, a work-in-progress Internet-Draft that covers PQC signature authentication only.',
  },
  t7: {
    targetId: 't7',
    tlsVersion: 'TLS 1.1',
    keyExchange: 'RSA-2048',
    cipherSuite: 'TLS_RSA_WITH_3DES_EDE_CBC_SHA',
    certAlgorithm: 'RSA-2048',
    certKeySize: 2048,
    pqcSupport: 'none',
    vulnerabilities: [
      'TLS 1.1 (end-of-life)',
      'RSA key exchange',
      '3DES cipher (SWEET32 attack)',
      'CBC mode',
      'RSA cert quantum-vulnerable',
    ],
    riskScore: 99,
    recommendation:
      'Critical: Decommission or upgrade immediately. TLS 1.1 + 3DES is insecure regardless of quantum threats.',
  },
  t8: {
    targetId: 't8',
    tlsVersion: 'TLS 1.3',
    keyExchange: 'X25519+ML-KEM-768 (hybrid)',
    cipherSuite: 'TLS_AES_256_GCM_SHA384',
    certAlgorithm: 'RSA-2048',
    certKeySize: 2048,
    pqcSupport: 'hybrid',
    hybridAlgorithm: 'X25519+ML-KEM-768',
    vulnerabilities: ['RSA-2048 cert quantum-vulnerable (key exchange is hybrid-safe)'],
    riskScore: 30,
    recommendation:
      'Good progress: hybrid key exchange active. Migrate proxy certificate to ML-DSA or ECDSA+ML-DSA composite.',
  },
}

// ─── Performance Benchmark Data ───────────────────────────────────────────────

export type AlgorithmSet = 'classical' | 'hybrid' | 'pure-pqc'
export type NetworkProfile = 'lan' | 'wan' | 'satellite'

export interface BenchmarkResult {
  tlsHandshakeMs: number
  keyGenMs: number
  saSetupMs: number
  certSizeKb: number
  clientHelloBytes: number
  fragmentation: boolean
  throughputPct: number // % of classical baseline
}

// clientHelloBytes: the classical value is the module's modeled baseline. The hybrid value is
// that baseline with its 32-byte X25519 share replaced by the 1,216-byte X25519MLKEM768 client
// share (1,184-byte ML-KEM-768 encapsulation key + 32-byte X25519 share; RFC 10024 section 4.1):
// 320 - 32 + 1,216 = 1,504 bytes, which is above the 1,460-byte Ethernet MSS on every network.
export const BENCHMARK_DATA: Record<AlgorithmSet, Record<NetworkProfile, BenchmarkResult>> = {
  classical: {
    lan: {
      tlsHandshakeMs: 8,
      keyGenMs: 0.1,
      saSetupMs: 38,
      certSizeKb: 1.2,
      clientHelloBytes: 320,
      fragmentation: false,
      throughputPct: 100,
    },
    wan: {
      tlsHandshakeMs: 68,
      keyGenMs: 0.1,
      saSetupMs: 240,
      certSizeKb: 1.2,
      clientHelloBytes: 320,
      fragmentation: false,
      throughputPct: 100,
    },
    satellite: {
      tlsHandshakeMs: 1208,
      keyGenMs: 0.1,
      saSetupMs: 4800,
      certSizeKb: 1.2,
      clientHelloBytes: 320,
      fragmentation: false,
      throughputPct: 100,
    },
  },
  hybrid: {
    lan: {
      tlsHandshakeMs: 10,
      keyGenMs: 0.4,
      saSetupMs: 68,
      certSizeKb: 4.8,
      clientHelloBytes: 1504,
      fragmentation: true,
      throughputPct: 93,
    },
    wan: {
      tlsHandshakeMs: 82,
      keyGenMs: 0.4,
      saSetupMs: 380,
      certSizeKb: 4.8,
      clientHelloBytes: 1504,
      fragmentation: true,
      throughputPct: 87,
    },
    satellite: {
      tlsHandshakeMs: 1340,
      keyGenMs: 0.4,
      saSetupMs: 7200,
      certSizeKb: 4.8,
      clientHelloBytes: 1504,
      fragmentation: true,
      throughputPct: 74,
    },
  },
  'pure-pqc': {
    lan: {
      tlsHandshakeMs: 12,
      keyGenMs: 0.8,
      saSetupMs: 380,
      certSizeKb: 17.2,
      clientHelloBytes: 1536,
      fragmentation: true,
      throughputPct: 88,
    },
    wan: {
      tlsHandshakeMs: 95,
      keyGenMs: 0.8,
      saSetupMs: 12626,
      certSizeKb: 17.2,
      clientHelloBytes: 1536,
      fragmentation: true,
      throughputPct: 79,
    },
    satellite: {
      tlsHandshakeMs: 1520,
      keyGenMs: 0.8,
      saSetupMs: 95000,
      certSizeKb: 17.2,
      clientHelloBytes: 1536,
      fragmentation: true,
      throughputPct: 51,
    },
  },
}

// ─── Production-Scale KPIs (VIAVI TeraVM on Dell R6625) ──────────────────────
// Source: VIAVI Solutions "Testing, Measuring and Managing PQC Migration" (2026)
// Test setup: TeraVM Security Test on Dell R6625, HAProxy TLS + Strongswan IKEv2
// Classical = X25519, Hybrid = X25519+ML-KEM-768 (Kyber768)

export type EnvironmentScenario = 'clean-path' | 'ngfw-inspection' | 'multi-hop-proxy'
export type TrafficPattern = 'steady-state' | 'burst-login-storm' | 'microservice-chatter'

export interface ProductionKPI {
  label: string
  unit: string
  classical: number
  hybrid: number
}

export const PRODUCTION_TLS_KPIS: ProductionKPI[] = [
  {
    label: 'Connection Rate (CPS)',
    unit: 'cps',
    classical: 51520,
    hybrid: 32320,
  },
  {
    label: 'Client Throughput',
    unit: 'Mbps',
    classical: 7312,
    hybrid: 4968,
  },
  {
    label: 'Client Gets/s',
    unit: 'req/s',
    classical: 51520,
    hybrid: 32960,
  },
  {
    label: 'Client Get Time (mean)',
    unit: 'ms',
    classical: 2.72,
    hybrid: 98.55,
  },
  {
    label: 'Time to First Byte (mean)',
    unit: 'ms',
    classical: 2.04,
    hybrid: 85.045,
  },
  {
    label: 'Time to Last Byte (mean)',
    unit: 'ms',
    classical: 2.72,
    hybrid: 98.553,
  },
]

export const PRODUCTION_VPN_KPIS: ProductionKPI[] = [
  {
    label: 'VPN Tunnel Establishment Rate',
    unit: 'tunnels/s',
    classical: 17768,
    hybrid: 4471,
  },
  {
    label: 'VPN Tunnel Setup Time',
    unit: 'ms',
    classical: 3.422,
    hybrid: 4.28,
  },
]

export const ENVIRONMENT_SCENARIOS: Record<
  EnvironmentScenario,
  { label: string; description: string; overheadMultiplier: number }
> = {
  'clean-path': {
    label: 'Clean Path (Direct)',
    description: 'Client → Server with no middleboxes. Baseline PQC overhead only.',
    overheadMultiplier: 1.0,
  },
  'ngfw-inspection': {
    label: 'NGFW TLS Inspection',
    description:
      'Traffic passes through a Next-Gen Firewall that decrypts, inspects, and re-encrypts. Each inspection point completes a full PQC handshake with both client and server — doubling crypto workload.',
    overheadMultiplier: 2.0,
  },
  'multi-hop-proxy': {
    label: 'Multi-Hop Proxy Chain',
    description:
      'Traffic traverses NGFW → Secure Web Gateway → DLP proxy. Each hop performs TLS decrypt/re-encrypt, tripling the PQC handshake cost.',
    overheadMultiplier: 3.0,
  },
}

export const TRAFFIC_PATTERNS: Record<
  TrafficPattern,
  { label: string; description: string; connectionMultiplier: number }
> = {
  'steady-state': {
    label: 'Steady State',
    description:
      'Persistent connections with infrequent renegotiation. VPN tunnels, long-lived WebSocket, database pools. PQC cost amortized over session lifetime.',
    connectionMultiplier: 1.0,
  },
  'burst-login-storm': {
    label: 'Burst (Login Storm)',
    description:
      'Thousands of new connections in seconds — morning login surges, shift changes, post-outage reconnection floods. Every connection pays full PQC handshake cost.',
    connectionMultiplier: 5.0,
  },
  'microservice-chatter': {
    label: 'Microservice Chatter',
    description:
      'Short-lived mTLS connections between services. Each API call may establish a new TLS session, multiplying PQC overhead across the service mesh.',
    connectionMultiplier: 10.0,
  },
}

export const NETWORK_PROFILE_LABELS: Record<
  NetworkProfile,
  { label: string; rttMs: number; description: string }
> = {
  lan: {
    label: 'LAN / Datacenter (1ms RTT)',
    rttMs: 1,
    description: 'Modern datacenter or campus LAN',
  },
  wan: {
    label: 'Enterprise WAN (50ms RTT)',
    rttMs: 50,
    description: 'Typical MPLS or SD-WAN branch connection',
  },
  satellite: {
    label: 'Satellite / VSAT (600ms RTT)',
    rttMs: 600,
    description: 'Remote site or maritime satellite link',
  },
}

export const ALGORITHM_SET_LABELS: Record<
  AlgorithmSet,
  { label: string; description: string; color: string }
> = {
  classical: {
    label: 'Classical',
    description: 'ECDH + RSA/ECDSA (current baseline)',
    color: 'text-status-warning',
  },
  hybrid: {
    label: 'Hybrid PQC',
    description: 'X25519+ML-KEM-768 + ECDSA (recommended migration step)',
    color: 'text-status-info',
  },
  'pure-pqc': {
    label: 'Pure PQC',
    description: 'ML-KEM-768 + ML-DSA-65 (NIST FIPS 203/204 only)',
    color: 'text-status-success',
  },
}

// ─── Interoperability Matrix ──────────────────────────────────────────────────

export type CompatStatus = 'compatible' | 'partial' | 'incompatible' | 'untested'

export interface InteropEntry {
  client: string
  server: string
  status: CompatStatus
  note: string
}

export const CLIENT_CONFIGS = [
  { id: 'oqs-openssl', label: 'OQS-OpenSSL (ML-KEM-768)' },
  { id: 'chrome-hybrid', label: 'Chrome 131+ (hybrid key agreement default)' },
  { id: 'firefox-hybrid', label: 'Firefox 132+ desktop / 145+ Android (hybrid default)' },
  { id: 'classical-only', label: 'Legacy Client (ECDH only)' },
  { id: 'pure-pqc', label: 'Pure PQC Client (ML-KEM-768 only)' },
]

export const SERVER_CONFIGS = [
  { id: 'oqs-server', label: 'OQS Test Server (profile depends on port)' },
  { id: 'cloudflare', label: 'Cloudflare visitor TLS (X25519MLKEM768 documented)' },
  { id: 'nginx-hybrid', label: 'nginx + OpenSSL 3.5+ (configured profile)' },
  { id: 'legacy-server', label: 'Legacy TLS 1.2 Server' },
  { id: 'aws-pqc', label: 'AWS KMS API (supporting SDK/configuration required)' },
]

export const INTEROP_MATRIX: Record<string, Record<string, InteropEntry>> = {
  'oqs-openssl': {
    'oqs-server': {
      client: 'oqs-openssl',
      server: 'oqs-server',
      status: 'compatible',
      note: 'Expected only when the selected OQS test-server port and this client use the same ML-KEM-768 profile. This exercise includes no handshake trace; check the endpoint documentation and capture the negotiated group.',
    },
    cloudflare: {
      client: 'oqs-openssl',
      server: 'cloudflare',
      status: 'compatible',
      note: 'Cloudflare documents X25519MLKEM768 for visitor TLS. Matching client support makes this a documented compatibility expectation, not a captured result from this exercise.',
    },
    'nginx-hybrid': {
      client: 'oqs-openssl',
      server: 'nginx-hybrid',
      status: 'compatible',
      note: 'Expected when nginx is built with OpenSSL 3.5+ and configured for the same X25519MLKEM768 group. Verify the exact build and negotiated group.',
    },
    'legacy-server': {
      client: 'oqs-openssl',
      server: 'legacy-server',
      status: 'partial',
      note: 'A TLS 1.2-only peer cannot negotiate the TLS 1.3 hybrid group. A classical TLS 1.2 connection is possible only if both sides share and permit a TLS 1.2 group; observe and record that outcome.',
    },
    'aws-pqc': {
      client: 'oqs-openssl',
      server: 'aws-pqc',
      status: 'compatible',
      note: 'AWS documents hybrid TLS for KMS API calls through supporting clients and provides CloudTrail tlsDetails.keyExchange evidence. This OQS-OpenSSL pairing has not been tested; use the AWS SDK procedure for the service.',
    },
  },
  'chrome-hybrid': {
    'oqs-server': {
      client: 'chrome-hybrid',
      server: 'oqs-server',
      status: 'compatible',
      note: 'Cloudflare documents Chrome 131+ with hybrid key agreement enabled by default. OQS server behavior depends on its selected port/profile; this pairing has no captured trace here.',
    },
    cloudflare: {
      client: 'chrome-hybrid',
      server: 'cloudflare',
      status: 'compatible',
      note: 'Cloudflare documents Chrome 131+ with default hybrid key agreement and X25519MLKEM768 on its visitor TLS service. This is vendor-documented support, not a measured handshake in this exercise.',
    },
    'nginx-hybrid': {
      client: 'chrome-hybrid',
      server: 'nginx-hybrid',
      status: 'compatible',
      note: 'Expected only when this nginx/OpenSSL build enables the group offered by Chrome. Validate the exact build and capture the negotiated group.',
    },
    'legacy-server': {
      client: 'chrome-hybrid',
      server: 'legacy-server',
      status: 'partial',
      note: 'A legacy TLS 1.2 server cannot negotiate the TLS 1.3 hybrid group. Whether the browser completes a classical fallback depends on both endpoints and any middleboxes; test and record the actual result.',
    },
    'aws-pqc': {
      client: 'chrome-hybrid',
      server: 'aws-pqc',
      status: 'compatible',
      note: 'AWS KMS hybrid TLS is documented for configured SDK clients; a browser-to-KMS pairing is not established by that documentation. Use a supported SDK and verify its CloudTrail keyExchange field.',
    },
  },
  'firefox-hybrid': {
    'oqs-server': {
      client: 'firefox-hybrid',
      server: 'oqs-server',
      status: 'compatible',
      note: 'Firefox offers hybrid X25519+ML-KEM-768 by default on supported versions. OQS server compatibility depends on the configured port/profile; this pairing has no captured trace here.',
    },
    cloudflare: {
      client: 'firefox-hybrid',
      server: 'cloudflare',
      status: 'compatible',
      note: 'Cloudflare documents Firefox 132+ desktop and 145+ Android with hybrid key agreement by default. This is vendor-documented support, not a measured handshake in this exercise.',
    },
    'nginx-hybrid': {
      client: 'firefox-hybrid',
      server: 'nginx-hybrid',
      status: 'compatible',
      note: 'Expected only when this nginx/OpenSSL build enables the group offered by Firefox. Validate the exact build and capture the negotiated group.',
    },
    'legacy-server': {
      client: 'firefox-hybrid',
      server: 'legacy-server',
      status: 'partial',
      note: 'A TLS 1.2-only server cannot negotiate the TLS 1.3 hybrid group. Whether Firefox completes a classical fallback depends on both endpoints and any middleboxes; test and record the actual result.',
    },
    'aws-pqc': {
      client: 'firefox-hybrid',
      server: 'aws-pqc',
      status: 'compatible',
      note: 'AWS KMS hybrid TLS is documented for configured SDK clients; a browser-to-KMS pairing is not established by that documentation. Use a supported SDK and verify its CloudTrail keyExchange field.',
    },
  },
  'classical-only': {
    'oqs-server': {
      client: 'classical-only',
      server: 'oqs-server',
      status: 'partial',
      note: 'Expected to use a classical group only if this server offers one and the client is configured for it. The outcome must be measured; do not count this as PQ protection.',
    },
    cloudflare: {
      client: 'classical-only',
      server: 'cloudflare',
      status: 'partial',
      note: 'If the Cloudflare visitor endpoint and client both permit X25519, they can negotiate a classical group. Confirm the actual group; a successful TLS connection alone does not prove hybrid negotiation.',
    },
    'nginx-hybrid': {
      client: 'classical-only',
      server: 'nginx-hybrid',
      status: 'partial',
      note: 'If nginx offers a shared classical group, the connection may succeed without PQ protection. Confirm the actual group rather than inferring it from the configured server profile.',
    },
    'legacy-server': {
      client: 'classical-only',
      server: 'legacy-server',
      status: 'compatible',
      note: 'Expected classical TLS when the configured client and server share a classical group. This scenario has no captured trace; a successful handshake is not PQ protection.',
    },
    'aws-pqc': {
      client: 'classical-only',
      server: 'aws-pqc',
      status: 'partial',
      note: 'AWS KMS supports hybrid TLS when the selected client/SDK enables it; this matrix does not establish fallback behavior for an arbitrary classical client. Verify the API call in CloudTrail.',
    },
  },
  'pure-pqc': {
    'oqs-server': {
      client: 'pure-pqc',
      server: 'oqs-server',
      status: 'compatible',
      note: 'Expected only if the chosen OQS test-server port explicitly enables the same pure ML-KEM profile. Confirm its current configuration before testing.',
    },
    cloudflare: {
      client: 'pure-pqc',
      server: 'cloudflare',
      status: 'untested',
      note: 'Cloudflare documents X25519MLKEM768 for visitor TLS; the documentation checked here does not establish a pure ML-KEM browser-facing profile or a server-policy rejection. Treat this pairing as untested.',
    },
    'nginx-hybrid': {
      client: 'pure-pqc',
      server: 'nginx-hybrid',
      status: 'incompatible',
      note: 'Under this scenario, nginx offers only X25519MLKEM768 while the client offers only pure ML-KEM-768, so there is no shared group. A real deployment may differ; confirm the actual offers and failure reason.',
    },
    'legacy-server': {
      client: 'pure-pqc',
      server: 'legacy-server',
      status: 'incompatible',
      note: 'A TLS 1.2-only server cannot negotiate pure ML-KEM in this TLS 1.3 scenario, and this client profile has no classical fallback. The no-shared-group expectation follows from the stated profiles.',
    },
    'aws-pqc': {
      client: 'pure-pqc',
      server: 'aws-pqc',
      status: 'untested',
      note: 'AWS PQC endpoint behavior with pure PQC clients not documented',
    },
  },
}

// ─── TVLA Data ────────────────────────────────────────────────────────────────

export interface TVLATarget {
  id: string
  label: string
  algorithm: string
  implementation: 'masked' | 'unmasked'
  description: string
}

export const TVLA_TARGETS: TVLATarget[] = [
  {
    id: 'mlkem-unmasked',
    label: 'ML-KEM (Reference, Unmasked)',
    algorithm: 'ML-KEM-768',
    implementation: 'unmasked',
    description:
      'Reference implementation without masking countermeasures. Vulnerable to first-order power analysis at NTT stage.',
  },
  {
    id: 'mlkem-masked',
    label: 'ML-KEM (Masked, 1st-order)',
    algorithm: 'ML-KEM-768',
    implementation: 'masked',
    description:
      'First-order masked implementation. Resistant to single-trace attacks but may leak at higher orders.',
  },
  {
    id: 'mldsa-unmasked',
    label: 'ML-DSA (Reference, Unmasked)',
    algorithm: 'ML-DSA-65',
    implementation: 'unmasked',
    description:
      'Reference signing implementation. Leaks nonce information in polynomial multiplication stage.',
  },
  {
    id: 'mldsa-masked',
    label: 'ML-DSA (Masked, 1st-order)',
    algorithm: 'ML-DSA-65',
    implementation: 'masked',
    description:
      'First-order masked signing. Randomized nonce generation reduces but does not eliminate leakage.',
  },
]

export interface TVLAStage {
  id: string
  label: string
  description: string
  leaksIn: string[]
  /** True for a stage described as encoding public output (the ciphertext or signature bytes). */
  publicData: boolean
}

export const TVLA_STAGES: TVLAStage[] = [
  {
    id: 'key-load',
    label: 'Key Load',
    description: 'Loading secret key material into registers',
    leaksIn: ['mlkem-unmasked', 'mldsa-unmasked'],
    publicData: false,
  },
  {
    id: 'ntt',
    label: 'NTT / INTT',
    description: 'Number Theoretic Transform — core lattice operation',
    leaksIn: ['mlkem-unmasked', 'mldsa-unmasked'],
    publicData: false,
  },
  {
    id: 'poly-mul',
    label: 'Polynomial Multiplication',
    description: 'Coefficient-wise multiplication in Zq ring',
    leaksIn: ['mlkem-unmasked', 'mldsa-unmasked', 'mldsa-masked'],
    publicData: false,
  },
  {
    id: 'mod-reduction',
    label: 'Modular Reduction',
    description: 'Reduction modulo q (3329 for ML-KEM)',
    leaksIn: ['mlkem-unmasked'],
    publicData: false,
  },
  {
    id: 'sampling',
    label: 'Randomness Sampling',
    description: 'Generating random polynomials (CBD or rej. sampling)',
    leaksIn: [],
    publicData: false,
  },
  {
    id: 'compress',
    label: 'Compression / Encoding',
    description: 'Encoding ciphertext or signature bytes',
    leaksIn: ['mlkem-unmasked'],
    publicData: true,
  },
]

// ─── Test Strategy Profiles ───────────────────────────────────────────────────

export type MigrationPhase = 'inventory' | 'lab-test' | 'pilot' | 'production'
export type EnvironmentType = 'enterprise' | 'cloud-native' | 'ot-ics' | 'embedded'
export type ComplianceDeadline = 'nist-2030' | 'nist-2035' | 'eu-2026'

export interface TestStrategyStep {
  order: number
  method: string
  tools: string[]
  effort: string
  gateCondition: string
}

export const STRATEGY_MATRIX: Record<
  MigrationPhase,
  Record<EnvironmentType, TestStrategyStep[]>
> = {
  inventory: {
    enterprise: [
      {
        order: 1,
        method: 'Passive Network Discovery',
        tools: ['pqc-flow', 'CryptoNext COMPASS', 'VIAVI Observer'],
        effort: '1-2 weeks',
        gateCondition: '≥90% network segments scanned; all TLS/SSH flows classified',
      },
      {
        order: 2,
        method: 'Active Endpoint Scanning',
        tools: ['pqcscan', 'SSLyze', 'PQC Network Scanner'],
        effort: '1 week',
        gateCondition: 'All externally-reachable endpoints scored; risk register populated',
      },
      {
        order: 3,
        method: 'Certificate Inventory',
        tools: ['Keyfactor AgileSec', 'DigiCert TrustCore'],
        effort: '2-3 days',
        gateCondition: 'Full CBOM (Cryptography Bill of Materials) generated',
      },
    ],
    'cloud-native': [
      {
        order: 1,
        method: 'CBOM Generation',
        tools: ['CBOMkit', 'SCANOSS', 'Syft'],
        effort: '3-5 days',
        gateCondition: 'SBOM + CBOM generated for all container images and services',
      },
      {
        order: 2,
        method: 'API Endpoint Scanning',
        tools: ['pqcscan', 'SSLyze'],
        effort: '1 week',
        gateCondition: 'All API endpoints and service mesh mTLS connections assessed',
      },
      {
        order: 3,
        method: 'Secrets & Key Inventory',
        tools: ['Vault (audit)', 'AWS Secrets audit'],
        effort: '1-2 days',
        gateCondition: 'All secret types and key algorithms cataloged',
      },
    ],
    'ot-ics': [
      {
        order: 1,
        method: 'Passive OT Network Scan (read-only)',
        tools: ['CryptoNext COMPASS', 'pqc-flow (read-only)'],
        effort: '2-3 weeks',
        gateCondition: 'All OT protocols classified; no active probing performed',
      },
      {
        order: 2,
        method: 'Vendor Firmware Audit',
        tools: ['Vendor portal inquiry', 'PSIRT disclosure'],
        effort: '4-6 weeks',
        gateCondition: 'PQC roadmap confirmed for all critical OT vendors',
      },
    ],
    embedded: [
      {
        order: 1,
        method: 'Firmware Binary Analysis',
        tools: ['Binwalk', 'Ghidra crypto plugin', 'crypto-detector'],
        effort: '2-4 weeks/device',
        gateCondition: 'All crypto primitives identified in firmware; CBOM per device class',
      },
      {
        order: 2,
        method: 'Side-Channel Pre-Assessment',
        tools: ['Keysight Inspector', 'ChipWhisperer (open source)'],
        effort: '1-2 weeks/device',
        gateCondition: 'Baseline power trace captured; leakage assessment scheduled',
      },
    ],
  },
  'lab-test': {
    enterprise: [
      {
        order: 1,
        method: 'Performance Benchmarking',
        tools: ['PQC-LEO', 'VIAVI TeraVM', 'Keysight CyPerf'],
        effort: '1-2 weeks',
        gateCondition: 'TLS handshake + IPSec SA overhead measured; hardware capacity confirmed',
      },
      {
        order: 2,
        method: 'Interoperability Testing',
        tools: ['OQS Test Server', 'pqcscan'],
        effort: '1 week',
        gateCondition: 'Hybrid negotiation validated against all vendor endpoints in scope',
      },
      {
        order: 3,
        method: 'Certificate Chain Validation',
        tools: ['OpenSSL (oqs-provider)', 'OQS Demo CA'],
        effort: '3-5 days',
        gateCondition: 'Composite cert chain validates end-to-end; CRL/OCSP path confirmed',
      },
    ],
    'cloud-native': [
      {
        order: 1,
        method: 'Service Mesh PQC Test',
        tools: ['Keysight CyPerf', 'OQS-Envoy'],
        effort: '1 week',
        gateCondition: 'mTLS with hybrid KEM confirmed across Kubernetes service mesh',
      },
      {
        order: 2,
        method: 'CI/CD Pipeline Validation',
        tools: ['pqcscan', 'cosign (ML-DSA)'],
        effort: '3-5 days',
        gateCondition: 'Container signing migrated to ML-DSA; artifact integrity verified',
      },
    ],
    'ot-ics': [
      {
        order: 1,
        method: 'Protocol Emulation Testing',
        tools: ['TestBed replica', 'Wireshark OQS'],
        effort: '2-4 weeks',
        gateCondition:
          'PQC-enabled protocol tested on physical replica; no impact on safety systems',
      },
      {
        order: 2,
        method: 'Latency Budget Analysis',
        tools: ['VIAVI TeraVM', 'PQC-LEO'],
        effort: '1 week',
        gateCondition: 'PQC latency within OT real-time constraints (typically <10ms)',
      },
    ],
    embedded: [
      {
        order: 1,
        method: 'Side-Channel Testing (TVLA)',
        tools: ['Keysight Inspector', 'ChipWhisperer'],
        effort: '2-4 weeks',
        gateCondition:
          'ML-KEM/ML-DSA implementation passes first-order TVLA; no leakage in NTT stage',
      },
      {
        order: 2,
        method: 'Fault Injection Testing',
        tools: ['Keysight Inspector FJ2'],
        effort: '2-3 weeks',
        gateCondition:
          'Fault injection countermeasures verified; no key recovery from fault attacks',
      },
    ],
  },
  pilot: {
    enterprise: [
      {
        order: 1,
        method: 'Pilot Network Segment Rollout',
        tools: ['VIAVI Observer (monitoring)', 'pqc-flow'],
        effort: '2-4 weeks',
        gateCondition:
          '5% of production traffic using hybrid PQC; no regression in service availability',
      },
      {
        order: 2,
        method: 'User Experience Monitoring',
        tools: ['VIAVI TeraVM (load test)', 'APM tools'],
        effort: 'Ongoing',
        gateCondition: 'P99 latency delta <15% vs baseline for pilot segment',
      },
    ],
    'cloud-native': [
      {
        order: 1,
        method: 'Canary Deployment',
        tools: ['Argo Rollouts', 'pqc-flow (monitoring)'],
        effort: '2-3 weeks',
        gateCondition: '10% of API traffic using hybrid PQC; error rate unchanged',
      },
    ],
    'ot-ics': [
      {
        order: 1,
        method: 'Isolated Asset Pilot',
        tools: ['CryptoNext COMPASS (monitor)'],
        effort: '4-8 weeks',
        gateCondition: 'Non-critical OT asset running PQC for 30 days with no incidents',
      },
    ],
    embedded: [
      {
        order: 1,
        method: 'Field Trial (limited deployment)',
        tools: ['Fleet monitoring'],
        effort: '4-12 weeks',
        gateCondition: '100 devices in field with PQC firmware; no reported failures',
      },
    ],
  },
  production: {
    enterprise: [
      {
        order: 1,
        method: 'Full Rollout Monitoring',
        tools: ['VIAVI Observer', 'CryptoNext COMPASS', 'pqc-flow'],
        effort: 'Ongoing',
        gateCondition:
          '100% of traffic using hybrid PQC; classical-only flagged as policy violation',
      },
      {
        order: 2,
        method: 'Continuous Compliance Scanning',
        tools: ['pqcscan (scheduled)', 'SSLyze (CI)'],
        effort: 'Ongoing',
        gateCondition: 'Weekly scan confirms no classical-only endpoints; zero regressions',
      },
    ],
    'cloud-native': [
      {
        order: 1,
        method: 'Policy Enforcement',
        tools: ['OPA/Kyverno PQC policy', 'pqcscan (CI gate)'],
        effort: 'Ongoing',
        gateCondition: 'CI gate blocks deployments with classical-only TLS configs',
      },
    ],
    'ot-ics': [
      {
        order: 1,
        method: 'Full OT Migration Monitor',
        tools: ['CryptoNext COMPASS'],
        effort: 'Ongoing',
        gateCondition: 'All OT assets with PQC capable firmware; legacy isolated behind VPN',
      },
    ],
    embedded: [
      {
        order: 1,
        method: 'OTA Update Monitoring',
        tools: ['Firmware attestation', 'ML-DSA signature verify'],
        effort: 'Ongoing',
        gateCondition:
          '100% of fleet running PQC-capable firmware; update integrity verified via ML-DSA',
      },
    ],
  },
}

// ─── ACVP KAT Conformance vs Module Boundary & Certificate Verification ────────

export const PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY = {
  acvpIutConformance:
    'NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (IUT).',
  moduleBoundaryValidation:
    'CMVP FIPS 140-3 validates a cryptographic module against its security requirements (module specification and boundary, interfaces, self-tests, key and SSP zeroization, physical security, with entropy sources validated separately under SP 800-90B); non-invasive (side-channel) requirements are currently N/A by default. Common Criteria/EUCC evaluates the product against its own Security Target, and only what the ST claims.',
  productionCertificateCrossCheckChecklist: [
    'Certificate or module number and status (active, historical or revoked)',
    'Exact module or product name and version',
    'Tested operational environment or evaluated configuration (CMVP Security Policy; CC certification report)',
    'CAVP algorithm certificate numbers for the algorithms you rely on',
    'CC/EUCC: Security Target and claimed assurance level',
  ] as const,
  sampleNonEquivalenceNotice:
    'A sample Hub exercise or vendor marketing datasheet is never certification evidence.',
} as const
