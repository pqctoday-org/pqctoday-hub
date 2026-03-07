// SPDX-License-Identifier: GPL-3.0-only

export type VendorTier = 'enterprise' | 'mid-market' | 'open-source'
export type PQCReadiness = 'ga' | 'beta' | 'roadmap' | 'not-planned'
export type TrafficDirection = 'north-south' | 'east-west'

export interface NGFWVendor {
  id: string
  name: string
  product: string
  tier: VendorTier
  pqcReadiness: PQCReadiness
  tlsInspectionPQC: boolean
  mlKemSupport: boolean
  mlDsaSupport: boolean
  hybridSupport: boolean
  roadmapYear: number
  hardwareOffload: boolean
  notes: string
}

export interface TrafficType {
  id: string
  name: string
  direction: TrafficDirection
  description: string
  pqcImpact: string
  certSizeImpact: string
  latencyImpact: string
  inspectionComplexity: 'low' | 'medium' | 'high' | 'very-high'
}

export interface InspectionChallenge {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation: string
  affectedVendors: string[]
}

export interface ZeroTrustComponent {
  id: string
  name: string
  description: string
  pqcMigrationPath: 'hybrid' | 'pure-pqc' | 'classical' | 'not-applicable'
  migrationComplexity: 'low' | 'medium' | 'high'
  keyAlgorithm: string
  notes: string
}

export interface IDSRuleCategory {
  id: string
  name: string
  description: string
  examplePatterns: string[]
  falsePositiveRisk: 'low' | 'medium' | 'high'
  detectionCoverage: number // 0-100%
  enabled: boolean
}

export interface CipherSuite {
  id: string
  name: string
  type: 'classical' | 'hybrid' | 'pqc'
  keyExchange: string
  authentication: string
  encryption: string
  certSizeKB: number
  handshakeMs: number
  hardwareOffloadRequired: boolean
  quantumSafe: boolean
}

export interface HardwareTier {
  id: string
  name: string
  description: string
  maxConnectionsSec: number
  supportsHardwareOffload: boolean
  pqcRecommendation: string
}

// ── NGFW Vendors ──────────────────────────────────────────────────────────────

export const NGFW_VENDORS: NGFWVendor[] = [
  {
    id: 'cisco-firepower',
    name: 'Cisco',
    product: 'ASA / Firepower Threat Defense (FTD)',
    tier: 'enterprise',
    pqcReadiness: 'roadmap',
    tlsInspectionPQC: false,
    mlKemSupport: false,
    mlDsaSupport: false,
    hybridSupport: false,
    roadmapYear: 2027,
    hardwareOffload: true,
    notes:
      'Cisco quantum-safe roadmap targets ML-KEM hybrid IKEv2 VPN for 2027 as part of CNSA 2.0 compliance. Current ASA 9.x does not support PQC key exchange.',
  },
  {
    id: 'palo-alto-ngfw',
    name: 'Palo Alto Networks',
    product: 'PAN-OS 12.1 Orion',
    tier: 'enterprise',
    pqcReadiness: 'ga',
    tlsInspectionPQC: true,
    mlKemSupport: true,
    mlDsaSupport: true,
    hybridSupport: true,
    roadmapYear: 2025,
    hardwareOffload: true,
    notes:
      'PAN-OS 12.1 Orion supports NIST standard PQC algorithms. Features automated cipher translation and quantum readiness dashboard with real-time cryptographic inventory.',
  },
  {
    id: 'fortinet-fortigate',
    name: 'Fortinet',
    product: 'FortiGate (FortiOS)',
    tier: 'enterprise',
    pqcReadiness: 'beta',
    tlsInspectionPQC: false,
    mlKemSupport: true,
    mlDsaSupport: true,
    hybridSupport: true,
    roadmapYear: 2026,
    hardwareOffload: true,
    notes:
      'FortiOS 7.6 ships ML-KEM-768 and ML-DSA-65 in beta. FortiGate 1000F+ series have NP7 processors with crypto acceleration. TLS inspection with PQC certificates requires firmware 7.6.2+.',
  },
  {
    id: 'juniper-srx',
    name: 'Juniper Networks',
    product: 'SRX Series (Junos)',
    tier: 'enterprise',
    pqcReadiness: 'beta',
    tlsInspectionPQC: false,
    mlKemSupport: true,
    mlDsaSupport: false,
    hybridSupport: true,
    roadmapYear: 2026,
    hardwareOffload: false,
    notes:
      'Junos 24.x introduces hybrid X25519+ML-KEM-768 for IPsec and SSL proxy. SRX5000 line planned for hardware offload in 2026. ML-DSA certificate inspection on roadmap for Junos 24.2R1.',
  },
  {
    id: 'check-point',
    name: 'Check Point',
    product: 'Quantum Security Gateway',
    tier: 'enterprise',
    pqcReadiness: 'ga',
    tlsInspectionPQC: false,
    mlKemSupport: true,
    mlDsaSupport: false,
    hybridSupport: true,
    roadmapYear: 2026,
    hardwareOffload: true,
    notes:
      'R82 recommended release with QSKE (Quantum Safe Key Exchange). Supports quantum-safe key exchange for IKEv2 site-to-site VPNs using ML-KEM-512/768/1024.',
  },
  {
    id: 'sophos-xgs',
    name: 'Sophos',
    product: 'XGS Series Firewall',
    tier: 'mid-market',
    pqcReadiness: 'roadmap',
    tlsInspectionPQC: false,
    mlKemSupport: false,
    mlDsaSupport: false,
    hybridSupport: false,
    roadmapYear: 2026,
    hardwareOffload: false,
    notes:
      'SFOS v21 roadmap includes PQC TLS support via OpenSSL 3.x backend. Mid-market positioning means hardware offload is limited. PQC feature availability expected Q3 2026 pending SFOS 21.5 release.',
  },
  {
    id: 'sonicwall',
    name: 'SonicWall',
    product: 'NSa / TZ Series',
    tier: 'mid-market',
    pqcReadiness: 'roadmap',
    tlsInspectionPQC: false,
    mlKemSupport: false,
    mlDsaSupport: false,
    hybridSupport: false,
    roadmapYear: 2027,
    hardwareOffload: false,
    notes:
      'SonicOS 7.1 uses OpenSSL 3.x enabling future PQC support. NSa 9700 hardware has dedicated crypto engine. PQC integration roadmap announced for 2027. Current firmware lacks ML-KEM/ML-DSA support.',
  },
  {
    id: 'pfsense-opnsense',
    name: 'pfSense / OPNsense',
    product: 'Community Edition',
    tier: 'open-source',
    pqcReadiness: 'beta',
    tlsInspectionPQC: false,
    mlKemSupport: true,
    mlDsaSupport: false,
    hybridSupport: true,
    roadmapYear: 2025,
    hardwareOffload: false,
    notes:
      'pfSense CE has no PQC roadmap. OPNsense 24.7+ includes experimental hybrid ML-KEM IKEv2 support via strongSwan plugin. OPNsense Suricata IDS/IPS supports PQC protocol detection.',
  },
]

// ── Traffic Types ─────────────────────────────────────────────────────────────

export const TRAFFIC_TYPES: TrafficType[] = [
  {
    id: 'north-south-tls',
    name: 'North-South TLS (External)',
    direction: 'north-south',
    description: 'Client-to-server HTTPS traffic crossing perimeter. Primary inspection target.',
    pqcImpact:
      'Hybrid TLS handshakes are 1.5-2x larger. PQC certificates add 1-3KB overhead per chain.',
    certSizeImpact: 'ML-DSA-65 cert: ~2.5KB vs RSA-2048: ~1.2KB (+108%)',
    latencyImpact: '+5-15ms on software-only firewalls; hardware offload reduces to +1-3ms',
    inspectionComplexity: 'high',
  },
  {
    id: 'east-west-mtls',
    name: 'East-West mTLS (Internal)',
    direction: 'east-west',
    description: 'Microservice-to-microservice mutual TLS inside the data center.',
    pqcImpact:
      'mTLS doubles the certificate overhead (both parties present certs). High-volume east-west traffic amplifies PQC size penalty.',
    certSizeImpact: 'Hybrid mTLS chain: ~7KB vs classical mTLS: ~3.5KB per connection (+100%)',
    latencyImpact: '+3-8ms per new connection; session resumption unaffected',
    inspectionComplexity: 'very-high',
  },
  {
    id: 'dpi-encrypted',
    name: 'Deep Packet Inspection (DPI)',
    direction: 'north-south',
    description: 'Layer 7 inspection of encrypted traffic via TLS interception proxy.',
    pqcImpact:
      'NGFW must re-encrypt with PQC certs, doubling the key exchange cost. Inline inspection adds latency from PQC key derivation.',
    certSizeImpact: 'Re-signed PQC cert chain: 5-8KB vs classical 2-3KB',
    latencyImpact: '+20-50ms for software-only DPI; ASIC offload critical for PQC performance',
    inspectionComplexity: 'very-high',
  },
  {
    id: 'tls13-hybrid',
    name: 'TLS 1.3 Hybrid Key Exchange',
    direction: 'north-south',
    description: 'TLS 1.3 ClientHello with hybrid key_share (X25519+ML-KEM-768).',
    pqcImpact:
      'ClientHello grows by ~1.2KB for ML-KEM-768 key_share. Servers must support both classical and hybrid codepoints.',
    certSizeImpact: 'key_share extension: +1,184 bytes (ML-KEM-768 public key)',
    latencyImpact:
      '+2-5ms additional handshake time due to larger messages and key derivation computation',
    inspectionComplexity: 'medium',
  },
  {
    id: 'ipsec-pqc',
    name: 'IPsec/IKEv2 with PQC',
    direction: 'north-south',
    description: 'Site-to-site VPN using IKEv2 with PQC KEM (RFC 9370 hybrid KEM for IKEv2).',
    pqcImpact:
      'IKEv2 ADDITIONAL_KEY_EXCHANGE (AKE) payload adds ML-KEM overhead. Impact concentrated in tunnel setup, not data transfer.',
    certSizeImpact: 'IKEv2 KE payload: +1,184-1,568 bytes for ML-KEM-768/1024 public keys',
    latencyImpact: '+10-30ms tunnel establishment; session rekey overhead is minimal',
    inspectionComplexity: 'medium',
  },
  {
    id: 'sdwan-pqc',
    name: 'SD-WAN Overlay with PQC',
    direction: 'north-south',
    description: 'SD-WAN control plane and data plane encryption migration to PQC.',
    pqcImpact:
      'SD-WAN orchestrator certificates must be PQC-signed. DTLS-based data planes need updated IANA codepoints for ML-KEM.',
    certSizeImpact: 'Orchestrator cert bundle: +3-5KB for PQC hybrid chain',
    latencyImpact: 'Negligible on data plane; control plane re-authentication adds +50-100ms',
    inspectionComplexity: 'high',
  },
]

// ── Inspection Challenges ─────────────────────────────────────────────────────

export const INSPECTION_CHALLENGES: InspectionChallenge[] = [
  {
    id: 'cert-size-buffer',
    title: 'Certificate Size Buffer Overflow',
    severity: 'critical',
    description:
      'Many NGFW TLS inspection engines allocate fixed-size buffers for TLS certificates based on classical RSA sizes (1-2KB). ML-DSA-65 certificates are ~2.5KB; hybrid chains can reach 5-8KB, causing buffer overflows or silent inspection bypass.',
    mitigation:
      'Update NGFW firmware to support dynamic certificate buffer allocation. Set minimum buffer size to 16KB for PQC-aware inspection. Audit all inspection policies for buffer size limits.',
    affectedVendors: ['cisco-firepower', 'check-point', 'sonicwall', 'sophos-xgs'],
  },
  {
    id: 'key-exchange-latency',
    title: 'TLS Handshake Latency Increase',
    severity: 'high',
    description:
      'Software-based TLS inspection on NGFWs processes ML-KEM key encapsulation/decapsulation in software, adding 20-50ms per new connection. For high-frequency trading, API gateways, or real-time applications, this degradation can be unacceptable.',
    mitigation:
      'Prioritize hardware offload-capable platforms (Cisco Firepower 4100, PA-5400, FortiGate 1000F+). Enable session resumption and TLS 1.3 session tickets to minimize full handshake frequency. Consider PQC bypass policies for latency-sensitive applications.',
    affectedVendors: ['sophos-xgs', 'sonicwall', 'pfsense-opnsense', 'juniper-srx'],
  },
  {
    id: 'dpi-fragmentation',
    title: 'Deep Packet Inspection Fragmentation',
    severity: 'high',
    description:
      'Larger PQC TLS records (up to 16KB) can fragment across multiple TCP segments. Some DPI engines reassemble IP fragments but not TLS record fragments, causing inspection failures or incorrect protocol classification.',
    mitigation:
      'Enable TLS record reassembly in NGFW inspection profiles. Set maximum TCP segment size (MSS) limits to account for PQC overhead. Update application identification signatures to recognize hybrid TLS codepoints.',
    affectedVendors: ['cisco-firepower', 'palo-alto-ngfw', 'check-point', 'juniper-srx'],
  },
  {
    id: 'hardware-offload-limits',
    title: 'Hardware Offload Algorithm Gaps',
    severity: 'high',
    description:
      'Even NGFWs with dedicated crypto ASICs may not yet support ML-KEM/ML-DSA in hardware. Offloading to software fallback for PQC operations on high-throughput appliances causes CPU saturation and connection drops at sustained load.',
    mitigation:
      'Verify vendor roadmap for hardware crypto offload support. Plan for 30-50% throughput reduction during PQC transition on software-offload devices. Consider dedicated TLS inspection appliances (F5, A10) with proven PQC hardware acceleration.',
    affectedVendors: ['check-point', 'sophos-xgs', 'sonicwall', 'juniper-srx'],
  },
  {
    id: 'ocsp-size',
    title: 'OCSP Stapling Size Limits',
    severity: 'medium',
    description:
      'Online Certificate Status Protocol (OCSP) stapling responses contain certificate signatures. PQC OCSP responses with ML-DSA signatures are 3-5KB vs ~300 bytes for ECDSA, potentially exceeding TLS extension size limits on older firewalls.',
    mitigation:
      'Update TLS extension size limits in NGFW configuration. Evaluate CRLite or short-lived certificate approaches to avoid OCSP stapling overhead. Monitor TLS handshake failures for OCSP size issues during transition.',
    affectedVendors: ['cisco-firepower', 'sonicwall', 'sophos-xgs'],
  },
  {
    id: 'policy-exception-management',
    title: 'PQC Bypass Policy Management',
    severity: 'medium',
    description:
      'Until all NGFWs fully support PQC TLS inspection, security teams will create bypass policies for PQC-encrypted connections. Managing exemption lists across hundreds of firewall rules creates audit gaps and compliance issues.',
    mitigation:
      'Implement centralized policy management with automated tracking of PQC bypass rules. Set expiration dates on bypass policies with mandatory review. Log all bypassed connections with PQC algorithm metadata for audit.',
    affectedVendors: ['cisco-firepower', 'check-point', 'sophos-xgs', 'sonicwall'],
  },
]

// ── ZTNA Components ───────────────────────────────────────────────────────────

export const ZTNA_COMPONENTS: ZeroTrustComponent[] = [
  {
    id: 'identity-provider',
    name: 'Identity Provider (IdP)',
    description:
      'Authentication service (Okta, Azure AD, Ping) issuing tokens and certificates to users and devices.',
    pqcMigrationPath: 'hybrid',
    migrationComplexity: 'high',
    keyAlgorithm: 'ML-DSA-65 + ECDSA P-256 (hybrid X.509)',
    notes:
      'IdP certificate chains must be PQC-signed for ZTNA policies to be quantum-safe end-to-end. SAML/OIDC tokens signed with ML-DSA. Hybrid mode ensures compatibility with non-PQC clients during transition.',
  },
  {
    id: 'device-posture',
    name: 'Device Posture Assessment',
    description:
      'Endpoint agents that validate device health, software inventory, and compliance before granting access.',
    pqcMigrationPath: 'hybrid',
    migrationComplexity: 'medium',
    keyAlgorithm: 'ML-DSA-44 (device attestation signatures)',
    notes:
      'Device certificates presented to policy engine must be quantum-safe. Agent-to-controller channels migrate to TLS with ML-KEM-768 hybrid. Lower security level (ML-DSA-44) acceptable for device certs vs ML-DSA-65 for users.',
  },
  {
    id: 'policy-engine',
    name: 'Policy Engine / PEP',
    description:
      'Policy Enforcement Point that evaluates access requests against ZTNA policies in real-time.',
    pqcMigrationPath: 'hybrid',
    migrationComplexity: 'medium',
    keyAlgorithm: 'ML-KEM-768 (TLS 1.3 hybrid key exchange)',
    notes:
      'Policy enforcement channels must be quantum-safe to prevent MITM attacks on access decisions. TLS 1.3 with X25519+ML-KEM-768 provides hybrid protection. Policy database encryption uses AES-256-GCM (already quantum-safe).',
  },
  {
    id: 'micro-segmentation',
    name: 'Micro-Segmentation',
    description:
      'Network fabric enforcing workload-to-workload isolation with cryptographic policy enforcement.',
    pqcMigrationPath: 'hybrid',
    migrationComplexity: 'high',
    keyAlgorithm: 'ML-KEM-768 (IPsec/WireGuard hybrid KEM)',
    notes:
      'East-west micro-segmentation tunnels (IPsec, WireGuard) migrate to hybrid KEM. High density of short-lived sessions in containerized environments amplifies handshake overhead. Service mesh (Istio/Linkerd) mTLS migration requires PQC-aware certificate issuance.',
  },
  {
    id: 'application-gateway',
    name: 'Application Access Gateway',
    description: 'Reverse proxy that authenticates users and proxies application traffic via TLS.',
    pqcMigrationPath: 'hybrid',
    migrationComplexity: 'medium',
    keyAlgorithm: 'ML-DSA-65 server cert + ML-KEM-768 key exchange (TLS 1.3)',
    notes:
      'Application gateway is the critical PQC chokepoint for external user access. Must present hybrid TLS certs for compatibility. Vendors: Cloudflare Access, Zscaler ZPA, Prisma Access. Most have hybrid PQC TLS in GA or beta.',
  },
]

// ── IDS/IPS Rule Categories ───────────────────────────────────────────────────

export const IDS_RULE_CATEGORIES: IDSRuleCategory[] = [
  {
    id: 'hybrid-kem-detection',
    name: 'Hybrid KEM Handshake Detection',
    description:
      'Detect TLS ClientHello messages containing hybrid key_share extensions (IANA codepoints for X25519+ML-KEM-768, P-256+ML-KEM-768). Useful for inventory and baseline establishment.',
    examplePatterns: [
      'TLS ClientHello key_share group 0x11EC (X25519MLKEM768)',
      'TLS ClientHello key_share group 0x11EB (SecP256r1MLKEM768)',
      'TLS 1.3 supported_groups extension with PQC codepoints',
    ],
    falsePositiveRisk: 'low',
    detectionCoverage: 92,
    enabled: true,
  },
  {
    id: 'cert-size-anomaly',
    name: 'Certificate Size Threshold Anomalies',
    description:
      'Alert on TLS Certificate messages where the certificate chain exceeds classical size norms (>4KB for a full chain). Identifies PQC certs, certificate stuffing attacks, and misconfigured chains.',
    examplePatterns: [
      'TLS Certificate record size > 4096 bytes (classical threshold)',
      'TLS Certificate record size > 8192 bytes (PQC hybrid threshold)',
      'Certificate chain depth > 3 with total size > 6KB',
    ],
    falsePositiveRisk: 'medium',
    detectionCoverage: 85,
    enabled: true,
  },
  {
    id: 'pqc-algorithm-inventory',
    name: 'PQC Algorithm Inventory',
    description:
      'Log all connections using PQC algorithms for cryptographic asset inventory. Identifies ML-KEM, ML-DSA, SLH-DSA, Falcon usage across the network without blocking.',
    examplePatterns: [
      'X.509 Subject Public Key Info: id-ML-KEM-768 (OID 2.16.840.1.101.3.4.4.2)',
      'X.509 Signature Algorithm: id-ML-DSA-65 (OID 2.16.840.1.101.3.4.3.18)',
      'TLS server certificate using PQC algorithm family',
    ],
    falsePositiveRisk: 'low',
    detectionCoverage: 78,
    enabled: true,
  },
  {
    id: 'classical-only-legacy',
    name: 'Classical-Only Legacy TLS Detection',
    description:
      'Alert on TLS 1.2-only connections, TLS 1.3 without hybrid key_share, and certificates using RSA-2048 or ECDSA P-256 only (no PQC). Helps track migration progress and enforce policy.',
    examplePatterns: [
      'TLS 1.2 connection to internal resource (HNDL risk)',
      'TLS 1.3 ClientHello with no PQC key_share groups',
      'Server certificate: RSA-2048 (quantum-vulnerable, no hybrid)',
    ],
    falsePositiveRisk: 'low',
    detectionCoverage: 96,
    enabled: false,
  },
  {
    id: 'downgrade-attack',
    name: 'PQC Downgrade Attack Detection',
    description:
      'Detect MITM attempts that strip PQC key_share extensions from TLS ClientHello (forcing classical-only key exchange). Identifies active attacks against hybrid TLS deployments.',
    examplePatterns: [
      'TLS ClientHello modified to remove PQC key_share groups (MITM indicator)',
      'Unexpected classical-only TLS from client known to support hybrid',
      'TLS extension tampering: supported_groups changed mid-session',
    ],
    falsePositiveRisk: 'high',
    detectionCoverage: 65,
    enabled: false,
  },
  {
    id: 'ipsec-pqc-ike',
    name: 'IPsec IKEv2 PQC Key Exchange',
    description:
      'Detect and log IKEv2 ADDITIONAL_KEY_EXCHANGE (AKE) payloads containing ML-KEM KEMs per RFC 9370. Enables inventory of PQC-protected VPN tunnels and detection of non-PQC IPsec.',
    examplePatterns: [
      'IKEv2 SA proposal with ML-KEM-768 transform (Transform Type 4)',
      'IKEv2 ADDITIONAL_KEY_EXCHANGE payload present',
      'IKEv2 proposal without PQC KEM (HNDL risk for site-to-site VPN)',
    ],
    falsePositiveRisk: 'low',
    detectionCoverage: 88,
    enabled: true,
  },
]

// ── Cipher Suites ─────────────────────────────────────────────────────────────

export const CIPHER_SUITES: CipherSuite[] = [
  {
    id: 'tls-rsa-aes128',
    name: 'TLS_RSA_WITH_AES_128_GCM_SHA256',
    type: 'classical',
    keyExchange: 'RSA-2048',
    authentication: 'RSA-2048',
    encryption: 'AES-128-GCM',
    certSizeKB: 1.2,
    handshakeMs: 8,
    hardwareOffloadRequired: false,
    quantumSafe: false,
  },
  {
    id: 'tls13-x25519-aes256',
    name: 'TLS_AES_256_GCM_SHA384 (X25519)',
    type: 'classical',
    keyExchange: 'X25519',
    authentication: 'ECDSA P-256',
    encryption: 'AES-256-GCM',
    certSizeKB: 1.0,
    handshakeMs: 5,
    hardwareOffloadRequired: false,
    quantumSafe: false,
  },
  {
    id: 'tls13-hybrid-mlkem768',
    name: 'TLS_AES_256_GCM_SHA384 (X25519+ML-KEM-768)',
    type: 'hybrid',
    keyExchange: 'X25519+ML-KEM-768',
    authentication: 'ECDSA P-256 + ML-DSA-65 (hybrid cert)',
    encryption: 'AES-256-GCM',
    certSizeKB: 3.8,
    handshakeMs: 12,
    hardwareOffloadRequired: false,
    quantumSafe: true,
  },
  {
    id: 'tls13-hybrid-mlkem1024',
    name: 'TLS_AES_256_GCM_SHA384 (X25519+ML-KEM-1024)',
    type: 'hybrid',
    keyExchange: 'X25519+ML-KEM-1024',
    authentication: 'ECDSA P-384 + ML-DSA-87 (hybrid cert)',
    encryption: 'AES-256-GCM',
    certSizeKB: 5.2,
    handshakeMs: 18,
    hardwareOffloadRequired: true,
    quantumSafe: true,
  },
  {
    id: 'tls13-pure-mlkem768',
    name: 'TLS_AES_256_GCM_SHA384 (ML-KEM-768 only)',
    type: 'pqc',
    keyExchange: 'ML-KEM-768',
    authentication: 'ML-DSA-65',
    encryption: 'AES-256-GCM',
    certSizeKB: 2.5,
    handshakeMs: 15,
    hardwareOffloadRequired: true,
    quantumSafe: true,
  },
  {
    id: 'tls13-pure-mlkem1024',
    name: 'TLS_AES_256_GCM_SHA384 (ML-KEM-1024 only)',
    type: 'pqc',
    keyExchange: 'ML-KEM-1024',
    authentication: 'ML-DSA-87',
    encryption: 'AES-256-GCM',
    certSizeKB: 3.5,
    handshakeMs: 22,
    hardwareOffloadRequired: true,
    quantumSafe: true,
  },
]

// ── Hardware Tiers ────────────────────────────────────────────────────────────

export const HARDWARE_TIERS: HardwareTier[] = [
  {
    id: 'entry',
    name: 'Entry-Level (Branch/SMB)',
    description: 'Software-only crypto, 1-5 Gbps throughput, no dedicated crypto ASIC.',
    maxConnectionsSec: 5000,
    supportsHardwareOffload: false,
    pqcRecommendation:
      'Enable hybrid TLS for north-south only. Avoid full DPI with PQC until vendor firmware update. Budget for hardware refresh in 2026-2027.',
  },
  {
    id: 'mid-range',
    name: 'Mid-Range (Campus/DC Edge)',
    description: 'Limited crypto acceleration, 10-40 Gbps throughput, NP-class processor.',
    maxConnectionsSec: 50000,
    supportsHardwareOffload: false,
    pqcRecommendation:
      'Hybrid TLS passthrough safe. Software DPI for PQC certs will reduce throughput by 30-40%. Hardware offload for ML-KEM requires firmware 2026+. Plan TLS inspection bypass policies for PQC traffic.',
  },
  {
    id: 'high-end',
    name: 'High-End (Enterprise Core)',
    description:
      'Dedicated crypto ASIC, 100+ Gbps throughput, multi-core with hardware TLS offload.',
    maxConnectionsSec: 500000,
    supportsHardwareOffload: true,
    pqcRecommendation:
      'Full PQC TLS inspection feasible with firmware update. Hardware offload for ML-KEM-768 available on Cisco 9300/Firepower 9300, PA-7000, FortiGate 3000F+. Target hybrid inspection in 2026, full PQC by 2028.',
  },
]
