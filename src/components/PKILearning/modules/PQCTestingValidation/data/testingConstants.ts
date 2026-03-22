// SPDX-License-Identifier: GPL-3.0-only

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
      details: 'Modern TLS but X25519 is not quantum-safe. Upgrade to hybrid required.',
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
      details: 'Google/Cloudflare endpoint. Hybrid PQC negotiated — both endpoints support it.',
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
      details: 'QUIC to CDN. PQC not yet negotiated — CDN does not support hybrid KEM.',
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
      details: 'Cipher negotiation not visible — possible TLS inspection bypass at perimeter.',
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
      details: 'SCADA to historian. TLS 1.2 with RSA — quantum-vulnerable and classically weak CBC.',
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
      details: 'DNP3 with authentication only — no encryption, symmetric HMAC is quantum-resistant but lacks confidentiality.',
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
  { id: 't1', hostname: 'webserver.internal', port: 443, protocol: 'tls', description: 'Internal web app' },
  { id: 't2', hostname: 'api.internal', port: 8443, protocol: 'tls', description: 'Internal API gateway' },
  { id: 't3', hostname: 'mail.internal', port: 443, protocol: 'tls', description: 'Email server (SMTP/S)' },
  { id: 't4', hostname: 'bastion.internal', port: 22, protocol: 'ssh', description: 'SSH bastion host' },
  { id: 't5', hostname: 'devbox.internal', port: 22, protocol: 'ssh', description: 'Developer workstation' },
  { id: 't6', hostname: 'vpn-gw.internal', port: 500, protocol: 'ikev2', description: 'IPSec VPN gateway' },
  { id: 't7', hostname: 'legacy-app.internal', port: 443, protocol: 'tls', description: 'Legacy application' },
  { id: 't8', hostname: 'cloud-proxy.internal', port: 443, protocol: 'tls', description: 'Cloud egress proxy' },
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
    vulnerabilities: ['Quantum-vulnerable key exchange (X25519)', 'ECDSA cert vulnerable to Shor\'s algorithm'],
    riskScore: 72,
    recommendation: 'Upgrade to hybrid X25519+ML-KEM-768 for key exchange. Plan ML-DSA certificate migration.',
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
    recommendation: 'Key exchange is hybrid-safe. Migrate certificate to ML-DSA or composite cert to achieve full PQC.',
  },
  t3: {
    targetId: 't3',
    tlsVersion: 'TLS 1.2',
    keyExchange: 'RSA-2048',
    cipherSuite: 'TLS_RSA_WITH_AES_128_CBC_SHA256',
    certAlgorithm: 'RSA-2048',
    certKeySize: 2048,
    pqcSupport: 'none',
    vulnerabilities: ['TLS 1.2 (deprecated)', 'RSA key exchange (quantum-vulnerable)', 'CBC mode (BEAST-class risk)', 'RSA cert quantum-vulnerable'],
    riskScore: 95,
    recommendation: 'Critical: Upgrade to TLS 1.3 immediately. Migrate from RSA to ECDSA/ML-DSA. Enable hybrid PQC key exchange.',
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
    vulnerabilities: ['Host key (Ed25519) quantum-vulnerable', 'Hybrid KEX uses NTRU (not NIST ML-KEM standard)'],
    riskScore: 35,
    recommendation: 'Hybrid KEX active. Migrate host key to ML-DSA or SLH-DSA. Consider upgrading to NIST-standard ML-KEM hybrid KEX.',
  },
  t5: {
    targetId: 't5',
    tlsVersion: 'N/A',
    keyExchange: 'curve25519-sha256',
    cipherSuite: 'aes256-ctr',
    certAlgorithm: 'RSA-4096 host key',
    certKeySize: 4096,
    pqcSupport: 'none',
    vulnerabilities: ['RSA-4096 host key quantum-vulnerable', 'ECDH key exchange quantum-vulnerable'],
    riskScore: 68,
    recommendation: 'Upgrade SSH host key to ML-DSA-65. Enable hybrid ML-KEM key exchange in sshd_config.',
  },
  t6: {
    targetId: 't6',
    tlsVersion: 'N/A',
    keyExchange: 'DH Group 14 (2048-bit)',
    cipherSuite: 'AES-256-CBC + HMAC-SHA1',
    certAlgorithm: 'RSA-2048',
    certKeySize: 2048,
    pqcSupport: 'none',
    vulnerabilities: ['DH-2048 quantum-vulnerable', 'HMAC-SHA1 deprecated', 'RSA-2048 cert quantum-vulnerable', 'IKEv2 auth vulnerable to Shor\'s algorithm'],
    riskScore: 88,
    recommendation: 'High priority: Migrate to IKEv2 with ML-KEM + ML-DSA authentication per draft-ietf-ipsecme-ikev2-pqc-auth.',
  },
  t7: {
    targetId: 't7',
    tlsVersion: 'TLS 1.1',
    keyExchange: 'RSA-2048',
    cipherSuite: 'TLS_RSA_WITH_3DES_EDE_CBC_SHA',
    certAlgorithm: 'RSA-2048',
    certKeySize: 2048,
    pqcSupport: 'none',
    vulnerabilities: ['TLS 1.1 (end-of-life)', 'RSA key exchange', '3DES cipher (SWEET32 attack)', 'CBC mode', 'RSA cert quantum-vulnerable'],
    riskScore: 99,
    recommendation: 'Critical: Decommission or upgrade immediately. TLS 1.1 + 3DES is insecure regardless of quantum threats.',
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
    recommendation: 'Good progress: hybrid key exchange active. Migrate proxy certificate to ML-DSA or ECDSA+ML-DSA composite.',
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

export const BENCHMARK_DATA: Record<AlgorithmSet, Record<NetworkProfile, BenchmarkResult>> = {
  classical: {
    lan: { tlsHandshakeMs: 8, keyGenMs: 0.1, saSetupMs: 38, certSizeKb: 1.2, clientHelloBytes: 320, fragmentation: false, throughputPct: 100 },
    wan: { tlsHandshakeMs: 68, keyGenMs: 0.1, saSetupMs: 240, certSizeKb: 1.2, clientHelloBytes: 320, fragmentation: false, throughputPct: 100 },
    satellite: { tlsHandshakeMs: 1208, keyGenMs: 0.1, saSetupMs: 4800, certSizeKb: 1.2, clientHelloBytes: 320, fragmentation: false, throughputPct: 100 },
  },
  hybrid: {
    lan: { tlsHandshakeMs: 10, keyGenMs: 0.4, saSetupMs: 68, certSizeKb: 4.8, clientHelloBytes: 1120, fragmentation: false, throughputPct: 93 },
    wan: { tlsHandshakeMs: 82, keyGenMs: 0.4, saSetupMs: 380, certSizeKb: 4.8, clientHelloBytes: 1120, fragmentation: true, throughputPct: 87 },
    satellite: { tlsHandshakeMs: 1340, keyGenMs: 0.4, saSetupMs: 7200, certSizeKb: 4.8, clientHelloBytes: 1120, fragmentation: true, throughputPct: 74 },
  },
  'pure-pqc': {
    lan: { tlsHandshakeMs: 12, keyGenMs: 0.8, saSetupMs: 380, certSizeKb: 17.2, clientHelloBytes: 1536, fragmentation: true, throughputPct: 88 },
    wan: { tlsHandshakeMs: 95, keyGenMs: 0.8, saSetupMs: 12626, certSizeKb: 17.2, clientHelloBytes: 1536, fragmentation: true, throughputPct: 79 },
    satellite: { tlsHandshakeMs: 1520, keyGenMs: 0.8, saSetupMs: 95000, certSizeKb: 17.2, clientHelloBytes: 1536, fragmentation: true, throughputPct: 51 },
  },
}

export const NETWORK_PROFILE_LABELS: Record<NetworkProfile, { label: string; rttMs: number; description: string }> = {
  lan: { label: 'LAN / Datacenter (1ms RTT)', rttMs: 1, description: 'Modern datacenter or campus LAN' },
  wan: { label: 'Enterprise WAN (50ms RTT)', rttMs: 50, description: 'Typical MPLS or SD-WAN branch connection' },
  satellite: { label: 'Satellite / VSAT (600ms RTT)', rttMs: 600, description: 'Remote site or maritime satellite link' },
}

export const ALGORITHM_SET_LABELS: Record<AlgorithmSet, { label: string; description: string; color: string }> = {
  classical: { label: 'Classical', description: 'ECDH + RSA/ECDSA (current baseline)', color: 'text-status-warning' },
  hybrid: { label: 'Hybrid PQC', description: 'X25519+ML-KEM-768 + ECDSA (recommended migration step)', color: 'text-status-info' },
  'pure-pqc': { label: 'Pure PQC', description: 'ML-KEM-768 + ML-DSA-65 (NIST FIPS 203/204 only)', color: 'text-status-success' },
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
  { id: 'chrome-hybrid', label: 'Chrome 130+ (X25519+ML-KEM-768)' },
  { id: 'firefox-hybrid', label: 'Firefox 128+ (X25519+ML-KEM-768)' },
  { id: 'classical-only', label: 'Legacy Client (ECDH only)' },
  { id: 'pure-pqc', label: 'Pure PQC Client (ML-KEM-768 only)' },
]

export const SERVER_CONFIGS = [
  { id: 'oqs-server', label: 'OQS Test Server (all KEM)' },
  { id: 'cloudflare', label: 'Cloudflare (hybrid ML-KEM)' },
  { id: 'nginx-hybrid', label: 'nginx + oqs-provider' },
  { id: 'legacy-server', label: 'Legacy TLS 1.2 Server' },
  { id: 'aws-pqc', label: 'AWS (hybrid ML-KEM-768)' },
]

export const INTEROP_MATRIX: Record<string, Record<string, InteropEntry>> = {
  'oqs-openssl': {
    'oqs-server': { client: 'oqs-openssl', server: 'oqs-server', status: 'compatible', note: 'Full ML-KEM-768 negotiation confirmed via test.openquantumsafe.org' },
    cloudflare: { client: 'oqs-openssl', server: 'cloudflare', status: 'compatible', note: 'X25519+ML-KEM-768 hybrid negotiated successfully' },
    'nginx-hybrid': { client: 'oqs-openssl', server: 'nginx-hybrid', status: 'compatible', note: 'OQS provider on both ends — full compatibility' },
    'legacy-server': { client: 'oqs-openssl', server: 'legacy-server', status: 'partial', note: 'Falls back to classical ECDH — PQC not used; RFC 9794 fallback path' },
    'aws-pqc': { client: 'oqs-openssl', server: 'aws-pqc', status: 'compatible', note: 'AWS KMS hybrid ML-KEM endpoint negotiates successfully' },
  },
  'chrome-hybrid': {
    'oqs-server': { client: 'chrome-hybrid', server: 'oqs-server', status: 'compatible', note: 'Chrome hybrid extension negotiated; OQS server accepts both components' },
    cloudflare: { client: 'chrome-hybrid', server: 'cloudflare', status: 'compatible', note: 'Chrome + Cloudflare hybrid PQC — production-ready as of Chrome 130' },
    'nginx-hybrid': { client: 'chrome-hybrid', server: 'nginx-hybrid', status: 'compatible', note: 'nginx with oqs-provider accepts Chrome hybrid ClientHello' },
    'legacy-server': { client: 'chrome-hybrid', server: 'legacy-server', status: 'partial', note: 'Chrome sends hybrid ClientHello; legacy server rejects PQC extension; Chrome falls back to X25519' },
    'aws-pqc': { client: 'chrome-hybrid', server: 'aws-pqc', status: 'compatible', note: 'AWS accepts Chrome hybrid — compatible' },
  },
  'firefox-hybrid': {
    'oqs-server': { client: 'firefox-hybrid', server: 'oqs-server', status: 'compatible', note: 'Firefox 128+ hybrid ML-KEM supported by OQS server' },
    cloudflare: { client: 'firefox-hybrid', server: 'cloudflare', status: 'compatible', note: 'Firefox hybrid negotiates with Cloudflare' },
    'nginx-hybrid': { client: 'firefox-hybrid', server: 'nginx-hybrid', status: 'compatible', note: 'Compatible — OQS provider handles Firefox hybrid extension' },
    'legacy-server': { client: 'firefox-hybrid', server: 'legacy-server', status: 'partial', note: 'Fallback to classical — PQC not used on legacy servers' },
    'aws-pqc': { client: 'firefox-hybrid', server: 'aws-pqc', status: 'compatible', note: 'AWS accepts Firefox hybrid ML-KEM' },
  },
  'classical-only': {
    'oqs-server': { client: 'classical-only', server: 'oqs-server', status: 'partial', note: 'OQS server negotiates classical ECDH — PQC not used but connection succeeds' },
    cloudflare: { client: 'classical-only', server: 'cloudflare', status: 'partial', note: 'Cloudflare falls back to X25519 — no PQC benefit' },
    'nginx-hybrid': { client: 'classical-only', server: 'nginx-hybrid', status: 'partial', note: 'nginx falls back to classical — OQS provider inactive for this client' },
    'legacy-server': { client: 'classical-only', server: 'legacy-server', status: 'compatible', note: 'Full classical TLS — works but quantum-vulnerable' },
    'aws-pqc': { client: 'classical-only', server: 'aws-pqc', status: 'partial', note: 'AWS falls back to classical X25519 for non-PQC clients' },
  },
  'pure-pqc': {
    'oqs-server': { client: 'pure-pqc', server: 'oqs-server', status: 'compatible', note: 'OQS server supports pure ML-KEM-768 without classical component' },
    cloudflare: { client: 'pure-pqc', server: 'cloudflare', status: 'incompatible', note: 'Cloudflare requires hybrid (both classical + PQC) — pure PQC rejected per RFC 9794 policy' },
    'nginx-hybrid': { client: 'pure-pqc', server: 'nginx-hybrid', status: 'partial', note: 'nginx configured for hybrid only — pure PQC client causes oversized ClientHello rejection on some builds' },
    'legacy-server': { client: 'pure-pqc', server: 'legacy-server', status: 'incompatible', note: 'Legacy TLS 1.2 server has no PQC support — connection fails; no fallback' },
    'aws-pqc': { client: 'pure-pqc', server: 'aws-pqc', status: 'untested', note: 'AWS PQC endpoint behavior with pure PQC clients not documented' },
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
    description: 'Reference implementation without masking countermeasures. Vulnerable to first-order power analysis at NTT stage.',
  },
  {
    id: 'mlkem-masked',
    label: 'ML-KEM (Masked, 1st-order)',
    algorithm: 'ML-KEM-768',
    implementation: 'masked',
    description: 'First-order masked implementation. Resistant to single-trace attacks but may leak at higher orders.',
  },
  {
    id: 'mldsa-unmasked',
    label: 'ML-DSA (Reference, Unmasked)',
    algorithm: 'ML-DSA-65',
    implementation: 'unmasked',
    description: 'Reference signing implementation. Leaks nonce information in polynomial multiplication stage.',
  },
  {
    id: 'mldsa-masked',
    label: 'ML-DSA (Masked, 1st-order)',
    algorithm: 'ML-DSA-65',
    implementation: 'masked',
    description: 'First-order masked signing. Randomized nonce generation reduces but does not eliminate leakage.',
  },
]

export interface TVLAStage {
  id: string
  label: string
  description: string
  leaksIn: string[]
}

export const TVLA_STAGES: TVLAStage[] = [
  {
    id: 'key-load',
    label: 'Key Load',
    description: 'Loading secret key material into registers',
    leaksIn: ['mlkem-unmasked', 'mldsa-unmasked'],
  },
  {
    id: 'ntt',
    label: 'NTT / INTT',
    description: 'Number Theoretic Transform — core lattice operation',
    leaksIn: ['mlkem-unmasked', 'mldsa-unmasked'],
  },
  {
    id: 'poly-mul',
    label: 'Polynomial Multiplication',
    description: 'Coefficient-wise multiplication in Zq ring',
    leaksIn: ['mlkem-unmasked', 'mldsa-unmasked', 'mldsa-masked'],
  },
  {
    id: 'mod-reduction',
    label: 'Modular Reduction',
    description: 'Reduction modulo q (3329 for ML-KEM)',
    leaksIn: ['mlkem-unmasked'],
  },
  {
    id: 'sampling',
    label: 'Randomness Sampling',
    description: 'Generating random polynomials (CBD or rej. sampling)',
    leaksIn: [],
  },
  {
    id: 'compress',
    label: 'Compression / Encoding',
    description: 'Encoding ciphertext or signature bytes',
    leaksIn: ['mlkem-unmasked'],
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

export const STRATEGY_MATRIX: Record<MigrationPhase, Record<EnvironmentType, TestStrategyStep[]>> = {
  inventory: {
    enterprise: [
      { order: 1, method: 'Passive Network Discovery', tools: ['pqc-flow', 'CryptoNext COMPASS', 'VIAVI Observer'], effort: '1-2 weeks', gateCondition: '≥90% network segments scanned; all TLS/SSH flows classified' },
      { order: 2, method: 'Active Endpoint Scanning', tools: ['pqcscan', 'SSLyze', 'PQC Network Scanner'], effort: '1 week', gateCondition: 'All externally-reachable endpoints scored; risk register populated' },
      { order: 3, method: 'Certificate Inventory', tools: ['Keyfactor AgileSec', 'DigiCert TrustCore'], effort: '2-3 days', gateCondition: 'Full CBOM (Cryptography Bill of Materials) generated' },
    ],
    'cloud-native': [
      { order: 1, method: 'CBOM Generation', tools: ['CBOMkit', 'SCANOSS', 'Syft'], effort: '3-5 days', gateCondition: 'SBOM + CBOM generated for all container images and services' },
      { order: 2, method: 'API Endpoint Scanning', tools: ['pqcscan', 'SSLyze'], effort: '1 week', gateCondition: 'All API endpoints and service mesh mTLS connections assessed' },
      { order: 3, method: 'Secrets & Key Inventory', tools: ['Vault (audit)', 'AWS Secrets audit'], effort: '1-2 days', gateCondition: 'All secret types and key algorithms cataloged' },
    ],
    'ot-ics': [
      { order: 1, method: 'Passive OT Network Scan (read-only)', tools: ['CryptoNext COMPASS', 'pqc-flow (read-only)'], effort: '2-3 weeks', gateCondition: 'All OT protocols classified; no active probing performed' },
      { order: 2, method: 'Vendor Firmware Audit', tools: ['Vendor portal inquiry', 'PSIRT disclosure'], effort: '4-6 weeks', gateCondition: 'PQC roadmap confirmed for all critical OT vendors' },
    ],
    embedded: [
      { order: 1, method: 'Firmware Binary Analysis', tools: ['Binwalk', 'Ghidra crypto plugin', 'crypto-detector'], effort: '2-4 weeks/device', gateCondition: 'All crypto primitives identified in firmware; CBOM per device class' },
      { order: 2, method: 'Side-Channel Pre-Assessment', tools: ['Keysight Inspector', 'ChipWhisperer (open source)'], effort: '1-2 weeks/device', gateCondition: 'Baseline power trace captured; leakage assessment scheduled' },
    ],
  },
  'lab-test': {
    enterprise: [
      { order: 1, method: 'Performance Benchmarking', tools: ['PQC-LEO', 'VIAVI TeraVM', 'Keysight CyPerf'], effort: '1-2 weeks', gateCondition: 'TLS handshake + IPSec SA overhead measured; hardware capacity confirmed' },
      { order: 2, method: 'Interoperability Testing', tools: ['OQS Test Server', 'pqcscan'], effort: '1 week', gateCondition: 'Hybrid negotiation validated against all vendor endpoints in scope' },
      { order: 3, method: 'Certificate Chain Validation', tools: ['OpenSSL (oqs-provider)', 'OQS Demo CA'], effort: '3-5 days', gateCondition: 'Composite cert chain validates end-to-end; CRL/OCSP path confirmed' },
    ],
    'cloud-native': [
      { order: 1, method: 'Service Mesh PQC Test', tools: ['Keysight CyPerf', 'OQS-Envoy'], effort: '1 week', gateCondition: 'mTLS with hybrid KEM confirmed across Kubernetes service mesh' },
      { order: 2, method: 'CI/CD Pipeline Validation', tools: ['pqcscan', 'cosign (ML-DSA)'], effort: '3-5 days', gateCondition: 'Container signing migrated to ML-DSA; artifact integrity verified' },
    ],
    'ot-ics': [
      { order: 1, method: 'Protocol Emulation Testing', tools: ['TestBed replica', 'Wireshark OQS'], effort: '2-4 weeks', gateCondition: 'PQC-enabled protocol tested on physical replica; no impact on safety systems' },
      { order: 2, method: 'Latency Budget Analysis', tools: ['VIAVI TeraVM', 'PQC-LEO'], effort: '1 week', gateCondition: 'PQC latency within OT real-time constraints (typically <10ms)' },
    ],
    embedded: [
      { order: 1, method: 'Side-Channel Testing (TVLA)', tools: ['Keysight Inspector', 'ChipWhisperer'], effort: '2-4 weeks', gateCondition: 'ML-KEM/ML-DSA implementation passes first-order TVLA; no leakage in NTT stage' },
      { order: 2, method: 'Fault Injection Testing', tools: ['Keysight Inspector FJ2'], effort: '2-3 weeks', gateCondition: 'Fault injection countermeasures verified; no key recovery from fault attacks' },
    ],
  },
  pilot: {
    enterprise: [
      { order: 1, method: 'Pilot Network Segment Rollout', tools: ['VIAVI Observer (monitoring)', 'pqc-flow'], effort: '2-4 weeks', gateCondition: '5% of production traffic using hybrid PQC; no regression in service availability' },
      { order: 2, method: 'User Experience Monitoring', tools: ['VIAVI TeraVM (load test)', 'APM tools'], effort: 'Ongoing', gateCondition: 'P99 latency delta <15% vs baseline for pilot segment' },
    ],
    'cloud-native': [
      { order: 1, method: 'Canary Deployment', tools: ['Argo Rollouts', 'pqc-flow (monitoring)'], effort: '2-3 weeks', gateCondition: '10% of API traffic using hybrid PQC; error rate unchanged' },
    ],
    'ot-ics': [
      { order: 1, method: 'Isolated Asset Pilot', tools: ['CryptoNext COMPASS (monitor)'], effort: '4-8 weeks', gateCondition: 'Non-critical OT asset running PQC for 30 days with no incidents' },
    ],
    embedded: [
      { order: 1, method: 'Field Trial (limited deployment)', tools: ['Fleet monitoring'], effort: '4-12 weeks', gateCondition: '100 devices in field with PQC firmware; no reported failures' },
    ],
  },
  'production': {
    enterprise: [
      { order: 1, method: 'Full Rollout Monitoring', tools: ['VIAVI Observer', 'CryptoNext COMPASS', 'pqc-flow'], effort: 'Ongoing', gateCondition: '100% of traffic using hybrid PQC; classical-only flagged as policy violation' },
      { order: 2, method: 'Continuous Compliance Scanning', tools: ['pqcscan (scheduled)', 'SSLyze (CI)'], effort: 'Ongoing', gateCondition: 'Weekly scan confirms no classical-only endpoints; zero regressions' },
    ],
    'cloud-native': [
      { order: 1, method: 'Policy Enforcement', tools: ['OPA/Kyverno PQC policy', 'pqcscan (CI gate)'], effort: 'Ongoing', gateCondition: 'CI gate blocks deployments with classical-only TLS configs' },
    ],
    'ot-ics': [
      { order: 1, method: 'Full OT Migration Monitor', tools: ['CryptoNext COMPASS'], effort: 'Ongoing', gateCondition: 'All OT assets with PQC capable firmware; legacy isolated behind VPN' },
    ],
    embedded: [
      { order: 1, method: 'OTA Update Monitoring', tools: ['Firmware attestation', 'ML-DSA signature verify'], effort: 'Ongoing', gateCondition: '100% of fleet running PQC-capable firmware; update integrity verified via ML-DSA' },
    ],
  },
}
