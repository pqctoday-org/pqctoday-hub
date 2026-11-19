// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Reference data for Energy, Utilities & Grid PQC (LM-082).
 * All byte sizes align strictly with FIPS 203 (ML-KEM), FIPS 204 (ML-DSA),
 * and src/data/algorithmProperties.ts.
 */

export type GridDomainId = 'substation' | 'scada-center' | 'ami-mesh' | 'der-edge'

export interface GridArchitectureZone {
  id: GridDomainId
  zoneName: string
  operationalService: string
  protectedAsset: string
  protocols: string[]
  cryptoRole: string
  latencyBudget: string
  mtuOrFrameLimit: string
  hndlRisk: 'high' | 'medium' | 'low'
  integrityRisk: 'critical' | 'high'
  pqcMigrationPattern: string
  whatNotToDo: string
  productionVerification: string
}

export const GRID_ARCHITECTURE_ZONES: GridArchitectureZone[] = [
  {
    id: 'substation',
    zoneName: 'Generation & Transmission Substation',
    operationalService: 'Substation Protection, Relaying & Firmware-Update Service',
    protectedAsset: 'Field IED root-of-trust keys, relay settings, and fault-oscillography records',
    protocols: [
      'IEC 61850 GOOSE / SV',
      'IEC 62351-6',
      'IEC 62351-9 / RFC 8052 (GDOI)',
      'MMS over TLS',
    ],
    cryptoRole:
      'Symmetric HMAC-SHA-256 / AES-256-GCM message authentication for GOOSE/SV; asymmetric key distribution via GDOI/TLS; hash-based or ML-DSA firmware verification.',
    latencyBudget: '< 4 ms (protection-relay trip GOOSE/SV); < 100 ms (MMS supervisory)',
    mtuOrFrameLimit: '1,500-byte Ethernet frame (Layer 2 GOOSE/SV)',
    hndlRisk: 'medium',
    integrityRisk: 'critical',
    pqcMigrationPattern:
      'Keep symmetric HMAC-SHA-256 (32-byte tag) on the <4 ms GOOSE/SV data plane. Migrate out-of-band key distribution (GDOI KDC / TLS 1.3 RFC 10024) and MMS control sessions to ML-KEM-768 hybrid key agreement; use LMS-SHA256 or ML-DSA-44/65 for offline IED firmware signing.',
    whatNotToDo:
      'Never place 2,420-byte ML-DSA-44 or 3,309-byte ML-DSA-65 signatures inside a <4 ms Layer 2 GOOSE protection-relay tripping loop.',
    productionVerification:
      'Measure end-to-end GOOSE trip latency in a hardware-in-the-loop (HIL) relay testbed and inspect GDOI/TLS KDC cipher suites via packet capture.',
  },
  {
    id: 'scada-center',
    zoneName: 'SCADA / EMS Control Center & WAN Gateways',
    operationalService: 'SCADA Telemetry, Telecontrol & Inter-Control-Center Service',
    protectedAsset:
      'Long-lived grid topology records, state-estimator models, and ICCP/TASE.2 links',
    protocols: [
      'DNP3-SA (IEEE 1815)',
      'IEC 60870-5-104 over TLS',
      'ICCP/TASE.2',
      'IKEv2 (RFC 9370) / TLS 1.3 (RFC 10024)',
    ],
    cryptoRole:
      'WAN tunnel key establishment (IKEv2 / TLS 1.3), DNP3-SA symmetric session-key authentication, and PKI certificate authentication between control centers (NERC CIP-012).',
    latencyBudget: '50–500 ms (SCADA polling & WAN telecontrol)',
    mtuOrFrameLimit: '1,400–1,500-byte IP/WAN MTU (watch IPsec/TLS fragmentation)',
    hndlRisk: 'high',
    integrityRisk: 'critical',
    pqcMigrationPattern:
      'Deploy hybrid ML-KEM-768 (RFC 10024 for TLS 1.3, RFC 9370 additional key exchanges for IKEv2) on inter-control-center and substation WAN gateways first. Retain HMAC-SHA-256 for DNP3-SA per-message MACs while upgrading DNP3-SA update-key distribution to PQC-protected channels.',
    whatNotToDo:
      'Do not upgrade only the corporate-to-control-center VPN while leaving backup satellite/microwave SCADA failover links on classical-only IKEv1/RSA.',
    productionVerification:
      'Verify negotiated IKEv2 RFC 9370 KE payloads and TLS 1.3 X25519MLKEM768 (0x11EC) on both primary and failover WAN gateways under CIP-012 change control.',
  },
  {
    id: 'ami-mesh',
    zoneName: 'AMI Smart-Meter Mesh & Head-End',
    operationalService: 'AMI Head-End Collection & Remote Disconnect Service',
    protectedAsset: 'Customer metering histories (10+ year retention) and meter-fleet master keys',
    protocols: [
      'DLMS/COSEM (IEC 62056-5-3)',
      'IEEE 802.15.4g / Wi-SUN RF-Mesh',
      'NB-IoT / Cellular Backhaul',
    ],
    cryptoRole:
      'Symmetric AES-GCM / GMAC application-layer security on constrained meters; PKI certificate provisioning and head-end TLS/VPN backhaul.',
    latencyBudget: '1–30 s (meter polling); hours (fleet firmware rollout)',
    mtuOrFrameLimit: '127–1,280 bytes (RF-mesh MAC/6LoWPAN frames; severe fragmentation overhead)',
    hndlRisk: 'high',
    integrityRisk: 'critical',
    pqcMigrationPattern:
      'Protect collector-to-head-end backhaul immediately with hybrid TLS 1.3 (X25519MLKEM768) or IKEv2 RFC 9370. On legacy RF-mesh meters, rely on 256-bit symmetric AES/HMAC session keys derived from diversified master keys; specify ML-KEM-768 and LMS-SHA256/ML-DSA-44 hardware support in next-generation meter RFPs.',
    whatNotToDo:
      'Do not push multi-kilobyte ML-DSA certificate chains over 127-byte RF-mesh frames without validating 6LoWPAN reassembly and battery/duty-cycle budgets.',
    productionVerification:
      'Audit collector-to-HES TLS cipher logs and test DLMS/COSEM security suite key-rotation procedures in an AMI lab bench before field staging.',
  },
  {
    id: 'der-edge',
    zoneName: 'DER / Solar Inverter & Substation Edge Gateways',
    operationalService: 'DER Aggregation, Volt-VAR Dispatch & Edge Telemetry Service',
    protectedAsset:
      'Aggregator signing credentials, inverter firmware roots, and grid-dispatch schedules',
    protocols: [
      'IEEE 2030.5 (Smart Energy Profile 2.0)',
      'SunSpec Modbus / TLS',
      'HTTPS REST APIs',
    ],
    cryptoRole:
      'Mutual TLS (mTLS) device identity certificates (historically ECDSA P-256), firmware verification, and cloud-aggregator API transport.',
    latencyBudget: '100 ms–2 s (dispatch telemetry & inverter curtailment)',
    mtuOrFrameLimit: '1,500-byte IP/LTE MTU (constrained MCU flash/RAM on legacy inverters)',
    hndlRisk: 'medium',
    integrityRisk: 'critical',
    pqcMigrationPattern:
      'Enable hybrid ML-KEM-768 on DERMS cloud/aggregator TLS 1.3 front doors and edge gateways first. Use gateway-terminated PQC mTLS for legacy ECDSA-only inverters while requiring FIPS 203/204-ready cryptographic modules in new IEEE 2030.5 DER procurement specifications.',
    whatNotToDo:
      'Do not assume an aggregator SaaS portal supporting hybrid browser TLS automatically secures the backend IEEE 2030.5 mTLS leg to field inverters.',
    productionVerification:
      'Probe aggregator API endpoints for X25519MLKEM768 and verify device-certificate chain size compatibility against inverter MCU memory specs.',
  },
]

export interface GridLinkProfile {
  id: string
  name: string
  protocol: string
  mtuBytes: number
  latencyBudgetMs: number
  throughputKbps: number
  headerOverheadBytes: number
  notes: string
}

export const GRID_LINK_PROFILES: GridLinkProfile[] = [
  {
    id: 'goose-l2',
    name: 'Substation Protection Relay (GOOSE / SV)',
    protocol: 'IEC 61850 / IEC 62351-6 (Layer 2 Ethernet)',
    mtuBytes: 1500,
    latencyBudgetMs: 4,
    throughputKbps: 100000,
    headerOverheadBytes: 120,
    notes: 'Hard <4 ms trip budget; Layer 2 multicast does not support IP fragmentation.',
  },
  {
    id: 'dnp3-wan',
    name: 'SCADA Telecontrol WAN (DNP3-SA / IEC 104)',
    protocol: 'DNP3-SA (IEEE 1815) over IP/MPLS or Cellular',
    mtuBytes: 1400,
    latencyBudgetMs: 250,
    throughputKbps: 256,
    headerOverheadBytes: 96,
    notes:
      'IP fragmentation degrades reliability on narrowband microwave or cellular backup links.',
  },
  {
    id: 'ami-rf-mesh',
    name: 'AMI Smart-Meter RF-Mesh (DLMS/COSEM)',
    protocol: 'IEC 62056-5-3 over IEEE 802.15.4g / 6LoWPAN',
    mtuBytes: 127,
    latencyBudgetMs: 5000,
    throughputKbps: 50,
    headerOverheadBytes: 40,
    notes:
      'Constrained 127-byte MAC frames; large handshake payloads trigger multi-hop fragmentation storms.',
  },
  {
    id: 'iccp-fiber',
    name: 'Control-Center Interconnect (ICCP / IKEv2 / TLS 1.3)',
    protocol: 'TLS 1.3 (RFC 10024) / IKEv2 (RFC 9370) over Fiber',
    mtuBytes: 1500,
    latencyBudgetMs: 100,
    throughputKbps: 1000000,
    headerOverheadBytes: 100,
    notes:
      'High-bandwidth fiber backbone; multi-segment TCP handshakes are routine when middleboxes allow >1,500 B ClientHello.',
  },
]

export interface GridCryptoMechanism {
  id: string
  label: string
  category: 'symmetric-mac' | 'classical-sig' | 'pqc-kem' | 'pqc-sig'
  standard: string
  wirePayloadBytes: number
  publicKeyBytes: number
  typicalComputeMs: number
  quantumStatus: 'quantum-safe' | 'vulnerable'
  detail: string
}

export const GRID_CRYPTO_MECHANISMS: GridCryptoMechanism[] = [
  {
    id: 'hmac-sha256',
    label: 'HMAC-SHA-256 (Symmetric MAC)',
    category: 'symmetric-mac',
    standard: 'FIPS 198-1 / IEC 62351-6 / DNP3-SA',
    wirePayloadBytes: 32,
    publicKeyBytes: 0,
    typicalComputeMs: 0.05,
    quantumStatus: 'quantum-safe',
    detail:
      '32-byte MAC tag with 256-bit key. Meets <4 ms GOOSE/SV budgets when session keys are distributed via PQC.',
  },
  {
    id: 'ecdsa-p256',
    label: 'ECDSA P-256 (Classical Signature)',
    category: 'classical-sig',
    standard: 'FIPS 186-5 (Deprecated 2030 under NIST IR 8547)',
    wirePayloadBytes: 64,
    publicKeyBytes: 64,
    typicalComputeMs: 1.2,
    quantumStatus: 'vulnerable',
    detail:
      'Compact 64-byte signature and 64-byte public key, but broken by Shor’s algorithm on a CRQC.',
  },
  {
    id: 'rsa-2048',
    label: 'RSA-2048 (Classical Signature)',
    category: 'classical-sig',
    standard: 'FIPS 186-5 (Deprecated 2030 under NIST IR 8547)',
    wirePayloadBytes: 256,
    publicKeyBytes: 256,
    typicalComputeMs: 3.5,
    quantumStatus: 'vulnerable',
    detail:
      '256-byte signature and 256-byte public key; vulnerable to Shor’s algorithm and slow on legacy IED CPUs.',
  },
  {
    id: 'ml-kem-768',
    label: 'ML-KEM-768 (FIPS 203 Key Exchange)',
    category: 'pqc-kem',
    standard: 'FIPS 203 / RFC 10024 / RFC 9370',
    wirePayloadBytes: 1088,
    publicKeyBytes: 1184,
    typicalComputeMs: 0.8,
    quantumStatus: 'quantum-safe',
    detail:
      '1,184-byte public key and 1,088-byte ciphertext (32-byte shared secret). Ideal for control-plane session setup, not per-frame GOOSE.',
  },
  {
    id: 'ml-dsa-44',
    label: 'ML-DSA-44 (FIPS 204 Signature)',
    category: 'pqc-sig',
    standard: 'FIPS 204 (Security Category 2)',
    wirePayloadBytes: 2420,
    publicKeyBytes: 1312,
    typicalComputeMs: 2.1,
    quantumStatus: 'quantum-safe',
    detail:
      '2,420-byte signature and 1,312-byte public key. Exceeds a single 1,500-byte Ethernet MTU — suited for firmware/cert signing, not L2 GOOSE.',
  },
  {
    id: 'ml-dsa-65',
    label: 'ML-DSA-65 (FIPS 204 Signature)',
    category: 'pqc-sig',
    standard: 'FIPS 204 (Security Category 3)',
    wirePayloadBytes: 3309,
    publicKeyBytes: 1952,
    typicalComputeMs: 3.2,
    quantumStatus: 'quantum-safe',
    detail:
      '3,309-byte signature and 1,952-byte public key. Recommended for control-center PKI and firmware roots, not constrained RF-mesh or L2 GOOSE.',
  },
]

export interface FieldAssetProfile {
  id: string
  name: string
  typicalLifespanYears: number
  defaultDeployYear: number
  defaultConfidentialityYears: number
  defaultMigrationLeadYears: number
  hardwareConstraint: string
  interimMitigation: string
  replacementStrategy: string
}

export const FIELD_ASSET_PROFILES: FieldAssetProfile[] = [
  {
    id: 'ied-relay',
    name: 'Substation Protection Relay (IED)',
    typicalLifespanYears: 20,
    defaultDeployYear: 2024,
    defaultConfidentialityYears: 5,
    defaultMigrationLeadYears: 6,
    hardwareConstraint:
      'Deterministic RTOS, limited flash/RAM, strict outage windows tied to substation bus maintenance.',
    interimMitigation:
      'Wrap substation WAN egress in a PQC-capable gateway (IKEv2 RFC 9370 / TLS 1.3 RFC 10024) and enforce HMAC-SHA-256 on internal GOOSE/SV with GDOI key rotation.',
    replacementStrategy:
      'Require FIPS 140-3 validated modules, LMS-SHA256 / ML-DSA firmware verification, and IEC 62351-9 PQC support in next planned relay refresh.',
  },
  {
    id: 'rtu-gateway',
    name: 'Remote Terminal Unit (RTU) / Data Concentrator',
    typicalLifespanYears: 15,
    defaultDeployYear: 2022,
    defaultConfidentialityYears: 8,
    defaultMigrationLeadYears: 4,
    hardwareConstraint:
      'Often located at remote pole-top or feeder sites with narrowband cellular/radio backhaul.',
    interimMitigation:
      'Enable DNP3-SA symmetric HMAC-SHA-256 authentication and terminate hybrid PQC VPN tunnels at ruggedized cellular routers.',
    replacementStrategy:
      'Stage firmware-upgradeable RTUs supporting hybrid TLS 1.3 and IKEv2 RFC 9370 during feeder automation upgrades.',
  },
  {
    id: 'smart-meter',
    name: 'AMI Smart Meter Fleet (DLMS/COSEM)',
    typicalLifespanYears: 18,
    defaultDeployYear: 2023,
    defaultConfidentialityYears: 10,
    defaultMigrationLeadYears: 7,
    hardwareConstraint:
      'Millions of low-power MCUs over 127-byte RF-mesh frames; physical truck-roll replacement takes 5–10 years.',
    interimMitigation:
      'Upgrade collector-to-head-end backhaul to hybrid TLS 1.3 immediately and rotate 256-bit symmetric DLMS/COSEM keys via diversified KEKs.',
    replacementStrategy:
      'Embed crypto-agile bootloaders (LMS-SHA256 / ML-DSA-44 verification) and ML-KEM-768 provisioning support into next-generation AMI RFP cycles.',
  },
  {
    id: 'der-inverter',
    name: 'Utility-Scale DER Inverter / Edge Controller',
    typicalLifespanYears: 15,
    defaultDeployYear: 2025,
    defaultConfidentialityYears: 5,
    defaultMigrationLeadYears: 4,
    hardwareConstraint:
      'Third-party OEM firmware with IEEE 2030.5 ECDSA P-256 device certificates burned at manufacturing.',
    interimMitigation:
      'Place DER site controllers behind a utility-managed PQC mTLS/VPN edge gateway and enforce strict certificate pinning + anomaly monitoring.',
    replacementStrategy:
      'Mandate signed PQC firmware verification and crypto-agile IEEE 2030.5 successor profiles in interconnection agreements.',
  },
]

export interface GridChecklistItem {
  id: string
  domainLabel: string
  question: string
  whyItMatters: string
  drivers: string[]
  evidenceRequest: string
}

export const GRID_EVIDENCE_ITEMS: GridChecklistItem[] = [
  {
    id: 'ot-cbom',
    domainLabel: 'OT Cryptographic Inventory',
    question:
      'Have you inventoried asymmetric key usage across substations, SCADA WAN gateways, AMI collectors, and DER gateways (separating services from protected assets)?',
    whyItMatters:
      'Without a verified OT/IT CBOM, utilities miss legacy IKEv1 failover links, embedded IED roots, and long-lived topology/metering archives.',
    drivers: ['NERC CIP-010-4', 'NIST SP 800-82 Rev. 3', 'NIST IR 8547'],
    evidenceRequest:
      'Signed OT/IT cryptographic inventory mapping each operational service, protected asset retention horizon, protocol, and key length.',
  },
  {
    id: 'scada-wan-hybrid',
    domainLabel: 'SCADA & Inter-Control-Center WAN',
    question:
      'Are primary and backup SCADA / inter-control-center links verified for hybrid PQC key exchange (TLS 1.3 RFC 10024 or IKEv2 RFC 9370)?',
    whyItMatters:
      'Control-center telemetry and topology data face immediate HNDL risk; backup microwave or satellite links often lag primary fiber upgrades.',
    drivers: ['NERC CIP-012-2', 'RFC 10024', 'RFC 9370'],
    evidenceRequest:
      'Packet captures or gateway telemetry logs confirming X25519MLKEM768 (0x11EC) or IKEv2 RFC 9370 additional key exchanges on both primary and failover paths.',
  },
  {
    id: 'substation-realtime',
    domainLabel: 'Substation Real-Time Protection',
    question:
      'Is your IEC 62351 / DNP3-SA architecture verified to keep symmetric HMAC-SHA-256 on real-time <4 ms loops while securing out-of-band key distribution with PQC?',
    whyItMatters:
      'Placing multi-kilobyte PQC signatures directly on GOOSE/SV tripping frames violates protection timing budgets and threatens grid stability.',
    drivers: ['IEC 62351-6', 'RFC 8052 (GDOI)', 'IEC 62443-4-2'],
    evidenceRequest:
      'Hardware-in-the-loop (HIL) relay latency test report (<4 ms pass) plus KDC/GDOI key-distribution cryptographic configuration.',
  },
  {
    id: 'oem-firmware-signing',
    domainLabel: 'OEM Supply Chain & Firmware Signing',
    question:
      'Have IED, RTU, and smart-meter OEMs provided verifiable roadmaps and FIPS 140-3 validation status for PQC firmware verification (LMS-SHA256 / ML-DSA)?',
    whyItMatters:
      'Devices deployed today will remain in the field past 2040; OEM marketing claims do not prove bootloader verification or active FIPS 140-3 status.',
    drivers: ['NERC CIP-013-2', 'NIST SP 800-208', 'FIPS 140-3'],
    evidenceRequest:
      'Vendor SBOM/CBOM, active CMVP FIPS 140-3 certificate numbers (rejecting Historical FIPS 140-2 certs), and dated bootloader PQC milestones.',
  },
  {
    id: 'ami-headend-backhaul',
    domainLabel: 'AMI Head-End & Metering Archives',
    question:
      'Are AMI collector-to-head-end backhaul links and long-term metering data archives protected against HNDL with documented symmetric key-rotation schedules?',
    whyItMatters:
      'Customer metering histories and load profiles are retained for 10+ years, while RF-mesh meters cannot be replaced overnight.',
    drivers: ['IEC 62056-5-3 (DLMS/COSEM)', 'NERC CIP-011-3', 'NIST IR 8547'],
    evidenceRequest:
      'Head-end TLS handshake logs, AES-256/HMAC key-diversification policy, and archive encryption key-management procedures.',
  },
  {
    id: 'regulatory-mapping',
    domainLabel: 'Regulatory Scope & Governance',
    question:
      'Does your governance register accurately distinguish legal risk-management duties (NERC CIP, NIS2) from PQC milestone targets (EU PQC Roadmap v1.1, NIST IR 8547, EO 14412)?',
    whyItMatters:
      'Conflating NERC CIP or NIS2 with a standalone PQC algorithm deadline misleads boards and auditors; accurate scoping aligns funding with real obligations.',
    drivers: ['NIS2 Directive', 'EU PQC Roadmap v1.1', 'EO 14412 / OMB M-26-15'],
    evidenceRequest:
      'Board-ready compliance matrix citing applicable jurisdiction rules, exception registers, and scheduled review dates.',
  },
]
