// SPDX-License-Identifier: GPL-3.0-only

// ── Gateway Component Types ─────────────────────────────────────────────────

export interface GatewayComponent {
  id: string
  name: string
  type: 'client' | 'cdn' | 'waf' | 'load-balancer' | 'reverse-proxy' | 'app-server' | 'origin'
  description: string
  iconName: string
  canTerminateTLS: boolean
  canInspectTraffic: boolean
}

export const GATEWAY_COMPONENTS: GatewayComponent[] = [
  {
    id: 'client',
    name: 'Client Browser',
    type: 'client',
    description: 'End-user browser or API client initiating TLS connections',
    iconName: 'Monitor',
    canTerminateTLS: false,
    canInspectTraffic: false,
  },
  {
    id: 'cdn-edge',
    name: 'CDN Edge PoP',
    type: 'cdn',
    description: 'Content delivery edge node (Cloudflare, Akamai, AWS CloudFront)',
    iconName: 'Globe',
    canTerminateTLS: true,
    canInspectTraffic: true,
  },
  {
    id: 'waf',
    name: 'WAF / IDS',
    type: 'waf',
    description: 'Web Application Firewall or Intrusion Detection System',
    iconName: 'Shield',
    canTerminateTLS: true,
    canInspectTraffic: true,
  },
  {
    id: 'load-balancer',
    name: 'Load Balancer',
    type: 'load-balancer',
    description: 'L4/L7 load balancer (F5 BIG-IP, HAProxy, NGINX, AWS ALB)',
    iconName: 'Scale',
    canTerminateTLS: true,
    canInspectTraffic: true,
  },
  {
    id: 'reverse-proxy',
    name: 'Reverse Proxy',
    type: 'reverse-proxy',
    description: 'API gateway or reverse proxy (Kong, Envoy, Traefik)',
    iconName: 'ArrowLeftRight',
    canTerminateTLS: true,
    canInspectTraffic: true,
  },
  {
    id: 'app-server',
    name: 'Application Server',
    type: 'app-server',
    description: 'Backend application (Node.js, Java, .NET, Go)',
    iconName: 'Server',
    canTerminateTLS: true,
    canInspectTraffic: false,
  },
  {
    id: 'origin',
    name: 'Origin Server',
    type: 'origin',
    description: 'Origin backend behind CDN or reverse proxy',
    iconName: 'Database',
    canTerminateTLS: true,
    canInspectTraffic: false,
  },
]

// ── TLS Connection Modes ─────────────────────────────────────────────────────

export type TLSMode =
  | 'pqc-hybrid'
  | 'classical-tls13'
  | 'mtls-classical'
  | 'mtls-pqc-hybrid'
  | 'passthrough'
  | 'plaintext'

export interface TLSModeInfo {
  id: TLSMode
  label: string
  quantumSafe: boolean
  inspectionCapable: boolean
  color: string
  description: string
}

export const TLS_MODES: TLSModeInfo[] = [
  {
    id: 'pqc-hybrid',
    label: 'PQC Hybrid TLS 1.3',
    quantumSafe: true,
    inspectionCapable: true,
    color: 'text-status-success',
    description: 'X25519MLKEM768 key exchange + ML-DSA/ECDSA certificates',
  },
  {
    id: 'classical-tls13',
    label: 'Classical TLS 1.3',
    quantumSafe: false,
    inspectionCapable: true,
    color: 'text-status-warning',
    description: 'X25519/P-256 key exchange + ECDSA/RSA certificates',
  },
  {
    id: 'mtls-classical',
    label: 'Mutual TLS (Classical)',
    quantumSafe: false,
    inspectionCapable: true,
    color: 'text-status-warning',
    description: 'Client certificate authentication + classical algorithms',
  },
  {
    id: 'mtls-pqc-hybrid',
    label: 'Mutual TLS (PQC Hybrid)',
    quantumSafe: true,
    inspectionCapable: true,
    color: 'text-status-success',
    description: 'Client certificate authentication + hybrid PQC algorithms',
  },
  {
    id: 'passthrough',
    label: 'TLS Passthrough',
    quantumSafe: false,
    inspectionCapable: false,
    color: 'text-muted-foreground',
    description: 'Gateway forwards encrypted traffic without termination',
  },
  {
    id: 'plaintext',
    label: 'Plaintext (No TLS)',
    quantumSafe: false,
    inspectionCapable: true,
    color: 'text-status-error',
    description: 'Unencrypted connection (internal network only)',
  },
]

// ── Preset Topologies ────────────────────────────────────────────────────────

export interface TopologyConnection {
  from: string
  to: string
  mode: TLSMode
}

export interface TopologyPreset {
  id: string
  name: string
  description: string
  components: string[]
  connections: TopologyConnection[]
}

export const TOPOLOGY_PRESETS: TopologyPreset[] = [
  {
    id: 'simple-proxy',
    name: 'Simple Reverse Proxy',
    description: 'Client \u2192 NGINX/HAProxy \u2192 Application Server',
    components: ['client', 'reverse-proxy', 'app-server'],
    connections: [
      { from: 'client', to: 'reverse-proxy', mode: 'classical-tls13' },
      { from: 'reverse-proxy', to: 'app-server', mode: 'plaintext' },
    ],
  },
  {
    id: 'cdn-waf-lb',
    name: 'CDN + WAF + Load Balancer',
    description: 'Client \u2192 CDN \u2192 WAF \u2192 LB \u2192 Origin',
    components: ['client', 'cdn-edge', 'waf', 'load-balancer', 'origin'],
    connections: [
      { from: 'client', to: 'cdn-edge', mode: 'pqc-hybrid' },
      { from: 'cdn-edge', to: 'waf', mode: 'classical-tls13' },
      { from: 'waf', to: 'load-balancer', mode: 'classical-tls13' },
      { from: 'load-balancer', to: 'origin', mode: 'plaintext' },
    ],
  },
  {
    id: 'enterprise-multi-tier',
    name: 'Multi-tier Enterprise',
    description: 'Client \u2192 CDN \u2192 WAF \u2192 LB \u2192 API GW \u2192 App \u2192 Origin',
    components: [
      'client',
      'cdn-edge',
      'waf',
      'load-balancer',
      'reverse-proxy',
      'app-server',
      'origin',
    ],
    connections: [
      { from: 'client', to: 'cdn-edge', mode: 'pqc-hybrid' },
      { from: 'cdn-edge', to: 'waf', mode: 'classical-tls13' },
      { from: 'waf', to: 'load-balancer', mode: 'classical-tls13' },
      { from: 'load-balancer', to: 'reverse-proxy', mode: 'mtls-classical' },
      { from: 'reverse-proxy', to: 'app-server', mode: 'plaintext' },
      { from: 'app-server', to: 'origin', mode: 'plaintext' },
    ],
  },
  {
    id: 'zero-trust',
    name: 'Zero Trust Mesh',
    description: 'mTLS everywhere: Client \u2192 CDN \u2192 LB \u2192 App (all mTLS PQC)',
    components: ['client', 'cdn-edge', 'load-balancer', 'app-server'],
    connections: [
      { from: 'client', to: 'cdn-edge', mode: 'mtls-pqc-hybrid' },
      { from: 'cdn-edge', to: 'load-balancer', mode: 'mtls-pqc-hybrid' },
      { from: 'load-balancer', to: 'app-server', mode: 'mtls-pqc-hybrid' },
    ],
  },
]

// ── TLS Termination Patterns ─────────────────────────────────────────────────

export interface TerminationStep {
  label: string
  encrypted: boolean
  algorithm: string
}

export interface TerminationPattern {
  id: string
  name: string
  description: string
  gatewayHoldsKey: boolean
  wafCanInspect: boolean
  certsRequired: number
  latencyOverheadMs: { classical: number; pqcHybrid: number }
  bandwidthOverheadBytes: { classical: number; pqcHybrid: number }
  steps: TerminationStep[]
}

export const TERMINATION_PATTERNS: TerminationPattern[] = [
  {
    id: 'terminate-inspect',
    name: 'Terminate & Inspect',
    description:
      'Gateway terminates TLS, inspects plaintext, forwards to backend (usually plaintext or separate TLS).',
    gatewayHoldsKey: true,
    wafCanInspect: true,
    certsRequired: 1,
    latencyOverheadMs: { classical: 2, pqcHybrid: 5 },
    bandwidthOverheadBytes: { classical: 5200, pqcHybrid: 15400 },
    steps: [
      { label: 'Client \u2192 Gateway', encrypted: true, algorithm: 'TLS 1.3' },
      { label: 'Gateway decrypts & inspects', encrypted: false, algorithm: 'Plaintext' },
      { label: 'Gateway \u2192 Backend', encrypted: false, algorithm: 'Plaintext / Internal TLS' },
    ],
  },
  {
    id: 'passthrough',
    name: 'TLS Passthrough',
    description:
      'Gateway forwards encrypted traffic to backend without decryption. No inspection possible.',
    gatewayHoldsKey: false,
    wafCanInspect: false,
    certsRequired: 0,
    latencyOverheadMs: { classical: 0, pqcHybrid: 0 },
    bandwidthOverheadBytes: { classical: 0, pqcHybrid: 0 },
    steps: [
      { label: 'Client \u2192 Gateway (encrypted)', encrypted: true, algorithm: 'TLS 1.3' },
      {
        label: 'Gateway forwards (no decryption)',
        encrypted: true,
        algorithm: 'TLS 1.3 (pass-through)',
      },
      { label: 'Backend terminates TLS', encrypted: true, algorithm: 'TLS 1.3' },
    ],
  },
  {
    id: 're-encrypt',
    name: 'Re-encrypt Backend',
    description: 'Gateway terminates client TLS, then establishes a new TLS session to backend.',
    gatewayHoldsKey: true,
    wafCanInspect: true,
    certsRequired: 2,
    latencyOverheadMs: { classical: 4, pqcHybrid: 10 },
    bandwidthOverheadBytes: { classical: 10400, pqcHybrid: 30800 },
    steps: [
      { label: 'Client \u2192 Gateway (TLS 1)', encrypted: true, algorithm: 'TLS 1.3' },
      { label: 'Gateway decrypts & inspects', encrypted: false, algorithm: 'Plaintext' },
      { label: 'Gateway \u2192 Backend (TLS 2)', encrypted: true, algorithm: 'TLS 1.3' },
    ],
  },
  {
    id: 'split-tls',
    name: 'Split TLS',
    description:
      'Different CAs/algorithms for client-facing (public CA) and backend-facing (internal CA) TLS.',
    gatewayHoldsKey: true,
    wafCanInspect: true,
    certsRequired: 2,
    latencyOverheadMs: { classical: 4, pqcHybrid: 8 },
    bandwidthOverheadBytes: { classical: 10400, pqcHybrid: 25600 },
    steps: [
      { label: 'Client \u2192 Gateway (Public CA)', encrypted: true, algorithm: 'TLS 1.3' },
      { label: 'Gateway decrypts', encrypted: false, algorithm: 'Plaintext' },
      {
        label: 'Gateway \u2192 Backend (Internal CA)',
        encrypted: true,
        algorithm: 'TLS 1.3 (may differ)',
      },
    ],
  },
]

// ── Handshake Size Calculator Types ─────────────────────────────────────────

export interface GatewayKEMOption {
  id: string
  name: string
  category: 'classical' | 'pqc' | 'hybrid'
  publicKeyBytes: number
  ciphertextBytes: number
}

export const GATEWAY_KEM_OPTIONS: GatewayKEMOption[] = [
  {
    id: 'x25519',
    name: 'X25519',
    category: 'classical',
    publicKeyBytes: 32,
    ciphertextBytes: 32,
  },
  {
    id: 'ml-kem-768',
    name: 'ML-KEM-768',
    category: 'pqc',
    publicKeyBytes: 1184,
    ciphertextBytes: 1088,
  },
  {
    id: 'x25519-ml-kem-768',
    name: 'X25519MLKEM768',
    category: 'hybrid',
    publicKeyBytes: 1216,
    ciphertextBytes: 1120,
  },
  {
    id: 'ml-kem-1024',
    name: 'ML-KEM-1024',
    category: 'pqc',
    publicKeyBytes: 1568,
    ciphertextBytes: 1568,
  },
]

export interface GatewaySigOption {
  id: string
  name: string
  category: 'classical' | 'pqc' | 'hybrid'
  publicKeyBytes: number
  signatureBytes: number
}

export const GATEWAY_SIG_OPTIONS: GatewaySigOption[] = [
  {
    id: 'ecdsa-p256',
    name: 'ECDSA P-256',
    category: 'classical',
    publicKeyBytes: 64,
    signatureBytes: 64,
  },
  {
    id: 'rsa-2048',
    name: 'RSA-2048',
    category: 'classical',
    publicKeyBytes: 256,
    signatureBytes: 256,
  },
  {
    id: 'ml-dsa-44',
    name: 'ML-DSA-44',
    category: 'pqc',
    publicKeyBytes: 1312,
    signatureBytes: 2420,
  },
  {
    id: 'ml-dsa-65',
    name: 'ML-DSA-65',
    category: 'pqc',
    publicKeyBytes: 1952,
    signatureBytes: 3309,
  },
  {
    id: 'ecdsa-ml-dsa-44',
    name: 'ECDSA + ML-DSA-44',
    category: 'hybrid',
    publicKeyBytes: 1376,
    signatureBytes: 2484,
  },
]

// ── Mitigation Options ───────────────────────────────────────────────────────

export interface HandshakeMitigation {
  id: string
  name: string
  reductionPercent: number
  description: string
  applicability: string
}

export const HANDSHAKE_MITIGATIONS: HandshakeMitigation[] = [
  {
    id: 'psk',
    name: 'Session Resumption (PSK)',
    reductionPercent: 90,
    description: 'Reuse prior session keys; eliminates certificate exchange on reconnect.',
    applicability: 'Returning clients only (60\u201380% of traffic at typical gateways)',
  },
  {
    id: 'compression',
    name: 'Certificate Compression (RFC 8879)',
    reductionPercent: 30,
    description: 'Zlib/Brotli compress certificate chain during handshake.',
    applicability: 'All TLS 1.3 connections; requires both sides to support',
  },
  {
    id: 'mtc',
    name: 'Merkle Tree Certificates',
    reductionPercent: 85,
    description: 'Replace per-cert signatures with compact Merkle inclusion proofs.',
    applicability: 'Experimental (Cloudflare/Chrome); IETF PLANTS WG draft',
  },
  {
    id: 'http3-quic',
    name: 'HTTP/3 (QUIC)',
    reductionPercent: 15,
    description: 'Reduce round trips via 0-RTT and integrated transport+TLS.',
    applicability: 'QUIC-capable clients and gateways',
  },
  {
    id: 'connection-coalescing',
    name: 'Connection Coalescing',
    reductionPercent: 50,
    description: 'Reuse a single TLS connection for multiple domains (HTTP/2+).',
    applicability: 'Wildcard/SAN certificates; same IP address',
  },
]

// ── Gateway Vendor Data ──────────────────────────────────────────────────────

export interface GatewayVendor {
  id: string
  name: string
  category: 'load-balancer' | 'cdn' | 'waf' | 'reverse-proxy' | 'api-gateway' | 'sase'
  pqcStatus: 'production' | 'planned' | 'no-roadmap'
  pqcVersion: string
  algorithms: string[]
  fipsStatus: string
  notes: string
}

export const GATEWAY_VENDORS: GatewayVendor[] = [
  {
    id: 'f5-big-ip',
    name: 'F5 BIG-IP',
    category: 'load-balancer',
    pqcStatus: 'production',
    pqcVersion: '17.5+',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'FIPS 140-2',
    notes: 'Enterprise ADC. Hybrid PQC TLS for client and server connections.',
  },
  {
    id: 'nginx-plus',
    name: 'NGINX Plus',
    category: 'reverse-proxy',
    pqcStatus: 'production',
    pqcVersion: 'R32+',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'FIPS 140-3 (OpenSSL)',
    notes: 'Commercial NGINX with ML-KEM hybrid via OpenSSL 3.x + liboqs-provider.',
  },
  {
    id: 'nginx-oss',
    name: 'NGINX (Open Source)',
    category: 'reverse-proxy',
    pqcStatus: 'production',
    pqcVersion: '1.28+',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'No',
    notes: 'PQC when compiled against OpenSSL 3.2+. No vendor support.',
  },
  {
    id: 'haproxy',
    name: 'HAProxy',
    category: 'load-balancer',
    pqcStatus: 'production',
    pqcVersion: '3.1+',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'No',
    notes: 'Open source LB. PQC via OpenSSL 3.5+ or liboqs.',
  },
  {
    id: 'envoy',
    name: 'Envoy Proxy',
    category: 'reverse-proxy',
    pqcStatus: 'production',
    pqcVersion: '1.37+',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'BoringCrypto',
    notes: 'Cloud-native proxy. Out-of-the-box PQC via BoringSSL. Underpins Istio service mesh.',
  },
  {
    id: 'kong',
    name: 'Kong API Gateway',
    category: 'api-gateway',
    pqcStatus: 'planned',
    pqcVersion: 'Via NGINX/OpenSSL 3.5+',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'No',
    notes: 'API gateway built on NGINX. PQC mTLS via underlying crypto library updates.',
  },
  {
    id: 'traefik',
    name: 'Traefik',
    category: 'reverse-proxy',
    pqcStatus: 'planned',
    pqcVersion: 'Go 1.25 (expected)',
    algorithms: ['ML-KEM-768'],
    fipsStatus: 'No',
    notes: 'Kubernetes ingress. PQC via Go stdlib ML-KEM when enabled by default.',
  },
  {
    id: 'cloudflare-edge',
    name: 'Cloudflare Edge',
    category: 'cdn',
    pqcStatus: 'production',
    pqcVersion: 'Current',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'Edge platform',
    notes: 'ML-KEM enabled by default. 20%+ of TLS connections use hybrid PQC.',
  },
  {
    id: 'aws-alb',
    name: 'AWS ALB/NLB',
    category: 'load-balancer',
    pqcStatus: 'production',
    pqcVersion: 'Current',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'FIPS 140-3 (AWS-LC)',
    notes: 'Managed cloud LB with instant PQC TLS. No application code changes needed.',
  },
  {
    id: 'imperva-waf',
    name: 'Imperva WAF',
    category: 'waf',
    pqcStatus: 'planned',
    pqcVersion: 'TBD (Thales integration)',
    algorithms: [],
    fipsStatus: 'Pending',
    notes: 'Enterprise WAF under Thales portfolio. PQC roadmap pending ML-KEM hybrid adoption.',
  },
  {
    id: 'cloudflare-zt',
    name: 'Cloudflare Zero Trust',
    category: 'sase',
    pqcStatus: 'production',
    pqcVersion: 'Current',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'No',
    notes: 'SASE with ML-KEM hybrid TLS active on global network. WARP client PQC tunnels.',
  },
  {
    id: 'zscaler',
    name: 'Zscaler ZTE',
    category: 'sase',
    pqcStatus: 'planned',
    pqcVersion: 'TBD',
    algorithms: [],
    fipsStatus: 'No',
    notes: 'Cloud SASE. TLS interception requires ML-KEM upgrade. No GA date published.',
  },
  {
    id: 'palo-alto',
    name: 'Palo Alto PAN-OS',
    category: 'waf',
    pqcStatus: 'production',
    pqcVersion: '12.1 Orion',
    algorithms: ['ML-KEM', 'ML-DSA'],
    fipsStatus: 'Yes',
    notes: 'Cipher proxy for automated PQC translation. Quantum readiness dashboard.',
  },
  {
    id: 'apache-httpd',
    name: 'Apache HTTP Server',
    category: 'reverse-proxy',
    pqcStatus: 'production',
    pqcVersion: '2.4.60+',
    algorithms: ['X25519MLKEM768'],
    fipsStatus: 'No',
    notes: 'PQC via mod_ssl + OpenSSL 3.2+. Widely deployed web server.',
  },
  {
    id: 'broadcom-avi',
    name: 'Broadcom Avi / NSX ALB',
    category: 'load-balancer',
    pqcStatus: 'planned',
    pqcVersion: 'TBD',
    algorithms: [],
    fipsStatus: 'FIPS 140-2',
    notes:
      'VMware NSX Advanced Load Balancer (formerly Avi Networks). PQC roadmap pending Broadcom integration.',
  },
]

// ── Gateway Capacity Benchmarks ──────────────────────────────────────────────

export interface GatewayBenchmark {
  name: string
  classicalHandshakesPerSec: number
  pqcHybridHandshakesPerSec: number
  notes: string
}

export const GATEWAY_BENCHMARKS: GatewayBenchmark[] = [
  {
    name: 'F5 BIG-IP i10800',
    classicalHandshakesPerSec: 140000,
    pqcHybridHandshakesPerSec: 90000,
    notes: 'Hardware-accelerated SSL offload',
  },
  {
    name: 'NGINX (32-core Xeon)',
    classicalHandshakesPerSec: 50000,
    pqcHybridHandshakesPerSec: 28000,
    notes: 'Software-only; OpenSSL 3.5',
  },
  {
    name: 'HAProxy (16-core)',
    classicalHandshakesPerSec: 30000,
    pqcHybridHandshakesPerSec: 18000,
    notes: 'Software LB; OpenSSL 3.5',
  },
  {
    name: 'Envoy (8-core, BoringSSL)',
    classicalHandshakesPerSec: 25000,
    pqcHybridHandshakesPerSec: 16000,
    notes: 'Kubernetes sidecar proxy',
  },
  {
    name: 'AWS ALB (managed)',
    classicalHandshakesPerSec: 100000,
    pqcHybridHandshakesPerSec: 100000,
    notes: 'Auto-scaling; no customer-visible capacity limit',
  },
]

// ── Handshake Size Calculation Helpers ────────────────────────────────────────

/** Calculate full TLS 1.3 handshake size in bytes */
export function calculateHandshakeSize(
  kem: GatewayKEMOption,
  sig: GatewaySigOption,
  chainDepth: number
): { clientHello: number; serverHello: number; certificate: number; total: number } {
  // Client Hello includes KEM public key share
  const clientHello = 200 + kem.publicKeyBytes
  // Server Hello includes KEM ciphertext
  const serverHello = 150 + kem.ciphertextBytes
  // Certificate chain: each cert has a public key + signature from the issuer
  const certificate = chainDepth * (200 + sig.publicKeyBytes + sig.signatureBytes)

  return {
    clientHello,
    serverHello,
    certificate,
    total: clientHello + serverHello + certificate,
  }
}

/** Apply mitigations and return adjusted handshake size */
export function applyMitigations(
  baseSize: number,
  mitigationIds: string[]
): { adjustedSize: number; savings: number; savingsPercent: number } {
  let adjustedSize = baseSize
  for (const id of mitigationIds) {
    const mitigation = HANDSHAKE_MITIGATIONS.find((m) => m.id === id)
    if (mitigation) {
      adjustedSize = adjustedSize * (1 - mitigation.reductionPercent / 100)
    }
  }
  const savings = baseSize - adjustedSize
  return {
    adjustedSize: Math.round(adjustedSize),
    savings: Math.round(savings),
    savingsPercent: baseSize > 0 ? Math.round((savings / baseSize) * 100) : 0,
  }
}

// ── Topology Analysis Helpers ────────────────────────────────────────────────

export interface TopologyAnalysis {
  vulnerableSegments: number
  totalSegments: number
  certsNeeded: number
  hndlExposure: 'high' | 'medium' | 'low'
  recommendations: string[]
}

export function analyzeTopology(connections: TopologyConnection[]): TopologyAnalysis {
  const totalSegments = connections.length
  const vulnerableSegments = connections.filter((c) => {
    const mode = TLS_MODES.find((m) => m.id === c.mode)
    return mode && !mode.quantumSafe
  }).length

  const certsNeeded = connections.filter(
    (c) => c.mode !== 'passthrough' && c.mode !== 'plaintext'
  ).length

  const vulnerableRatio = totalSegments > 0 ? vulnerableSegments / totalSegments : 0
  const hndlExposure: 'high' | 'medium' | 'low' =
    vulnerableRatio > 0.5 ? 'high' : vulnerableRatio > 0 ? 'medium' : 'low'

  const recommendations: string[] = []
  const internetFacing = connections[0]
  if (internetFacing) {
    const mode = TLS_MODES.find((m) => m.id === internetFacing.mode)
    if (mode && !mode.quantumSafe) {
      recommendations.push(
        'Upgrade the client-facing connection to PQC Hybrid first \u2014 this is your highest HNDL exposure point.'
      )
    }
  }

  const passthroughConns = connections.filter((c) => c.mode === 'passthrough')
  if (passthroughConns.length > 0) {
    recommendations.push(
      'TLS passthrough segments prevent WAF/IDS inspection. Consider terminate-and-re-encrypt for security visibility.'
    )
  }

  const plaintextConns = connections.filter((c) => c.mode === 'plaintext')
  if (plaintextConns.length > 0) {
    recommendations.push(
      'Plaintext segments are vulnerable to internal network attacks. Consider mTLS for zero-trust architecture.'
    )
  }

  if (vulnerableSegments === 0 && totalSegments > 0) {
    recommendations.push(
      'All segments are quantum-safe. Consider implementing certificate compression (RFC 8879) to reduce handshake overhead.'
    )
  }

  return { vulnerableSegments, totalSegments, certsNeeded, hndlExposure, recommendations }
}
