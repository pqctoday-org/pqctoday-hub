// SPDX-License-Identifier: AGPL-3.0-only

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
  /** Omitted when the vendor's own pages do not say. */
  roadmapYear?: number
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
    product: 'ASA / Secure Firewall Threat Defense (FTD)',
    tier: 'enterprise',
    pqcReadiness: 'roadmap',
    tlsInspectionPQC: false,
    mlKemSupport: false,
    mlDsaSupport: false,
    hybridSupport: false,
    roadmapYear: 2026,
    hardwareOffload: true,
    notes:
      'The Cisco Secure Firewall roadmap blog (13 April 2026) says ML-KEM support, which lets VPN tunnels gain post-quantum resilience, arrives in FTD 10.5 and ASA 9.25, targeted for General Availability in late 2026. ML-DSA and SLH-DSA support is planned for FTD/ASA 11.0, in the second half of calendar year 2027. Cisco says delivery timelines are subject to change.',
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
    pqcReadiness: 'ga',
    tlsInspectionPQC: true,
    mlKemSupport: true,
    mlDsaSupport: false, // no ML-DSA support level is recorded for this entry
    hybridSupport: true,
    hardwareOffload: true,
    notes:
      'Fortinet documentation for FortiOS 7.6 lists post-quantum key exchange for IPsec from 7.6.1 (hybrid key exchange per RFC 9370, with ML-KEM-512, ML-KEM-768 and ML-KEM-1024 as the FIPS 203 groups) and hybrid post-quantum cryptography in SSL deep inspection in flow mode from 7.6.5. This entry records no ML-DSA support level.',
  },
  {
    id: 'juniper-srx',
    name: 'Juniper Networks',
    product: 'SRX Series (Junos)',
    tier: 'enterprise',
    pqcReadiness: 'beta',
    tlsInspectionPQC: false,
    mlKemSupport: false,
    mlDsaSupport: false,
    hybridSupport: false,
    roadmapYear: 2026,
    hardwareOffload: false,
    notes:
      'Junos OS 25.4R1 adds ML-DSA-87 signatures for software images. Juniper documents post-quantum pre-shared keys (RFC 8784) for IPsec; the product catalog says an ML-KEM hybrid IKEv2 key exchange is not yet shipping in Junos OS as of release 26.2R1.',
  },
  {
    id: 'check-point',
    name: 'Check Point',
    product: 'Quantum Security Gateway (R82)',
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
    pqcReadiness: 'not-planned',
    tlsInspectionPQC: false,
    mlKemSupport: false,
    mlDsaSupport: false,
    hybridSupport: false,
    hardwareOffload: true,
    notes:
      'SFOS 21.5 (GA, 2 June 2025) mentions post-quantum cryptography only as a DPI-mode Path MTU fix for the ML-KEM (Kyber) key exchange supported in browsers. SFOS 22.0 MR2 (Build 546, 14 July 2026) adds detection and control of PQC: intrusion prevention can detect and block pure and hybrid PQC key exchange algorithms based on ML-KEM, and Web Protection prevents web sessions from negotiating unsupported PQC algorithms. The Sophos XGS datasheet says every XGS model has a dedicated Xstream Flow Processor and that Xstream offloads crypto operations; it does not say whether that covers post-quantum algorithms.',
  },
  {
    id: 'sonicwall',
    name: 'SonicWall',
    product: 'NSa / TZ Series',
    tier: 'mid-market',
    pqcReadiness: 'not-planned',
    tlsInspectionPQC: false,
    mlKemSupport: false,
    mlDsaSupport: false,
    hybridSupport: false,
    hardwareOffload: false,
    notes:
      'The product catalog on this site (last verified 18 August 2026; latest SonicOS 8.2.2) says SonicOS firewall cryptography contains no post-quantum support today, and that the IPsec VPN documentation for SonicOS 7.0, 7.1 and 8.0 lists only classical algorithms. Current SonicOS firmware lacks ML-KEM/ML-DSA support.',
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
    hardwareOffload: false,
    notes:
      'pfSense CE 2.9.0 added post-quantum key exchange algorithms to its SSH daemon and updated strongSwan to 6.0.3; its release notes do not describe post-quantum IPsec options. OPNsense 26.7.4 and later offers hybrid IKEv2 key exchanges that pair X25519 or P-256 with ML-KEM-768, or P-384 with ML-KEM-1024, through strongSwan.',
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
      'Hybrid TLS handshakes are larger than classical ones: one published estimate says a hybrid TLS 1.3 handshake using X25519+ML-KEM-768 and ECDSA+ML-DSA-65 may exceed 15 KB, against about 4 KB for classical-only handshakes (Campbell, Computers 2026, citing IETF draft measurements).',
    certSizeImpact:
      'ML-DSA-65 certificate: at least 5.3KB (FIPS 204 Table 2: 1,952-byte public key plus 3,309-byte signature). Two-certificate TLS 1.3 chain in an IETF C509 draft example: 11,869 bytes for ML-DSA-65 vs 2,656 bytes for RSA',
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
    certSizeImpact:
      'Both parties send certificate chains, so the chain-size growth shown for north-south TLS applies in each direction',
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
    certSizeImpact:
      'Re-signed PQC cert chain: the chain sizes shown for north-south TLS apply to the certificates the NGFW presents',
    latencyImpact:
      'Illustrative simulation values, not measurements: inspected handshake of about 9 ms (classical ECDSA), 28 ms (hybrid) and 35 ms (pure PQC) in the TLS Inspection Lab',
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
      'Each extra IKEv2 key exchange (an additional key exchange transform, RFC 9370) adds a KE payload carrying an ML-KEM key (in an IKE_INTERMEDIATE exchange at tunnel setup, in IKE_FOLLOWUP_KE at rekey). Impact concentrated in tunnel setup, not data transfer.',
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
    certSizeImpact:
      'Each ML-DSA-65 certificate in the orchestrator chain carries a 3,309-byte signature (FIPS 204 Table 2)',
    latencyImpact: 'Negligible on data plane; control plane re-authentication adds +50-100ms',
    inspectionComplexity: 'high',
  },
]

// ── Inspection Challenges ─────────────────────────────────────────────────────

export const INSPECTION_CHALLENGES: InspectionChallenge[] = [
  {
    id: 'cert-size-buffer',
    title: 'Certificate Size and Middlebox Buffers',
    severity: 'critical',
    description:
      'Many network devices (firewalls, IDS/IPS, WAFs, DLP) inspect TLS certificate chains, and larger certificates may exceed buffer sizes or parsing limits (Applied Quantum PQC Migration Framework v2.1, Activity 6.1). The framework adds that many middleboxes have hardcoded buffer sizes or parsing assumptions that break with PQC-sized handshakes and certificates. An ML-DSA-65 certificate holds a 1,952-byte public key and a 3,309-byte signature (FIPS 204 Table 2), at least 5.3KB together; in an IETF C509 draft example, a two-certificate ML-DSA-65 TLS chain is 11,869 bytes against 2,656 bytes for an RSA chain.',
    mitigation:
      'Test every middlebox on every production network path (Applied Quantum PQC Migration Framework v2.1, Phase 6). This module also suggests updating NGFW firmware to support dynamic certificate buffer allocation and auditing all inspection policies for buffer size limits. A minimum buffer size of 16KB is this module’s own engineering figure, not a vendor or standards value.',
    affectedVendors: ['cisco-firepower', 'check-point', 'sonicwall', 'sophos-xgs'],
  },
  {
    id: 'key-exchange-latency',
    title: 'TLS Handshake Latency Increase',
    severity: 'high',
    description:
      'Software-based TLS inspection on NGFWs processes ML-KEM key encapsulation/decapsulation in software, which adds handshake latency; the latencies in the TLS Inspection Lab are illustrative simulation values, not measurements. For high-frequency trading, API gateways, or real-time applications, added latency can be unacceptable.',
    mitigation:
      'Prioritize platforms with hardware offload for the algorithms you deploy, and ask each vendor whether your model and firmware offload ML-KEM. Enable session resumption and TLS 1.3 session tickets to minimize full handshake frequency. Consider PQC bypass policies for latency-sensitive applications.',
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
      'Verify vendor roadmap for hardware crypto offload support. Measure throughput on your own platform with PQC enabled; the throughput factors in the NGFW Cipher Analyzer are illustrative simulation settings, not measurements. If you consider dedicated TLS inspection appliances, ask the vendor to show PQC hardware acceleration before you rely on it.',
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
      'Device certificates presented to policy engine must be quantum-safe. Agent-to-controller channels migrate to TLS with ML-KEM-768 hybrid. For commercial ZTNA, a lower security level (ML-DSA-44) may suffice for device certificates vs ML-DSA-65 for users; National Security Systems must use the CNSA 2.0 parameters (ML-DSA-87, ML-KEM-1024).',
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
      'Alert on TLS Certificate messages where the certificate chain exceeds a size threshold that you set above your classical chains; the example thresholds below (4096 and 8192 bytes) are illustrations, not standard values. Identifies PQC certs, certificate stuffing attacks, and misconfigured chains.',
    examplePatterns: [
      'TLS Certificate record size > 4096 bytes (example threshold)',
      'TLS Certificate record size > 8192 bytes (example threshold)',
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
      'Log, at the VPN gateways, IKEv2 negotiations that include an additional key exchange transform using ML-KEM (RFC 9370). The IKE_INTERMEDIATE exchange that carries the KE payload is encrypted, so a passive network tap cannot see it. Enables inventory of PQC-protected VPN tunnels and detection of non-PQC IPsec.',
    examplePatterns: [
      'IKEv2 SA proposal with ML-KEM-768 transform (Transform Type 4)',
      'IKEv2 negotiation that used an additional key exchange transform with ML-KEM (from gateway logs)',
      'IKEv2 proposal without PQC KEM (HNDL risk for site-to-site VPN)',
    ],
    falsePositiveRisk: 'low',
    detectionCoverage: 88,
    enabled: true,
  },
]

// ── Cipher Suites ─────────────────────────────────────────────────────────────
// certSizeKB for the classical suites is this module's illustrative value. For the
// ML-DSA suites it is the minimum a certificate holding the public key and a signature
// of the same parameter set can have, from FIPS 204 Table 2 (bytes): ML-DSA-65 1,952 +
// 3,309 = 5,261 (5.3KB); ML-DSA-87 2,592 + 4,627 = 7,219 (7.2KB). Hybrid certificates
// also carry the classical key and signature, so they are at least this size.
// handshakeMs is an illustrative simulation setting, not a measurement.

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
    certSizeKB: 5.3,
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
    certSizeKB: 7.2,
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
    certSizeKB: 5.3,
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
    certSizeKB: 7.2,
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
      'Pass-through (no decryption) loses Layer 7 visibility. In this module’s simulation, software handling of PQC cipher suites lowers effective connections per second on this tier; treat the simulated factors as illustrations, not measurements. Ask each vendor whether your model and firmware offload ML-KEM. Plan TLS inspection bypass policies for PQC traffic.',
  },
  {
    id: 'high-end',
    name: 'High-End (Enterprise Core)',
    description:
      'Dedicated crypto ASIC, 100+ Gbps throughput, multi-core with hardware TLS offload.',
    maxConnectionsSec: 500000,
    supportsHardwareOffload: true,
    pqcRecommendation:
      'This module’s guidance: dedicated crypto hardware may need a firmware update before it can offload ML-KEM or ML-DSA, so check the vendor documentation for the exact models and firmware you run before planning full PQC TLS inspection.',
  },
]
