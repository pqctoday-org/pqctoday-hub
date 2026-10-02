// SPDX-License-Identifier: GPL-3.0-only

// ---------------------------------------------------------------------------
// NERC CIP standards with PQC impact mapping
// ---------------------------------------------------------------------------

export interface NERCCIPStandard {
  id: string
  name: string
  title: string
  description: string
  pqcImpact: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  affectedAssets: string[]
  recommendedActions: string[]
}

export const NERC_CIP_STANDARDS: NERCCIPStandard[] = [
  {
    id: 'CIP-005',
    name: 'CIP-005',
    title: 'Electronic Security Perimeter',
    description:
      'Requires identification and protection of Electronic Security Perimeters (ESP) around BES Cyber Assets. Controls network access at ESP boundary points.',
    pqcImpact:
      'VPN and firewall crypto at ESP boundary must migrate to PQC. TLS termination points, IKEv2 tunnels, and remote access gateways are directly affected.',
    urgency: 'critical',
    affectedAssets: ['VPN gateways', 'Firewalls', 'Remote access servers', 'ICCP links'],
    recommendedActions: [
      'Inventory all ESP boundary crypto (TLS versions, cipher suites)',
      'Deploy PQC hybrid VPN on internet-facing perimeters first',
      'Update access control lists to permit PQC cipher suites',
    ],
  },
  {
    id: 'CIP-007',
    name: 'CIP-007',
    title: 'Systems Security Management',
    description:
      'Requires security patch management, port/service management, malicious code prevention, and security event monitoring for BES Cyber Systems.',
    pqcImpact:
      'Firmware signing for IEDs and RTUs requires PQC-ready signatures. Patch verification using digital signatures must support PQC algorithms. Security event log integrity depends on crypto primitives.',
    urgency: 'high',
    affectedAssets: ['IED firmware', 'RTU firmware', 'SCADA servers', 'Security event logs'],
    recommendedActions: [
      'Verify IED vendor PQC firmware signing roadmaps',
      'Plan dual-signature firmware (classical + PQC) for transition',
      'Update patch management tools to verify PQC signatures',
    ],
  },
  {
    id: 'CIP-010',
    name: 'CIP-010',
    title: 'Configuration Change Management',
    description:
      'Requires baseline configurations, configuration monitoring, and vulnerability assessments for BES Cyber Systems.',
    pqcImpact:
      'Cryptographic algorithm changes are configuration changes requiring formal change management. CBOM (Cryptographic Bill of Materials) must be maintained. Vulnerability assessments must include quantum risk.',
    urgency: 'medium',
    affectedAssets: ['All BES Cyber Systems', 'Configuration management databases'],
    recommendedActions: [
      'Add crypto algorithm inventory to configuration baselines',
      'Include CRQC risk in vulnerability assessment methodology',
      'Track PQC migration as formal configuration changes',
    ],
  },
  {
    id: 'CIP-012',
    name: 'CIP-012',
    title: 'Communications Between Control Centers',
    description:
      'Requires protection of communication links between Control Centers. Mandates confidentiality and integrity for Real-time Assessment and Real-time Monitoring data.',
    pqcImpact:
      'ICCP/TASE.2 links between control centers use TLS/IPsec with RSA/ECDSA. These are the highest-priority PQC migration targets in the energy sector due to internet exposure and data sensitivity.',
    urgency: 'critical',
    affectedAssets: ['ICCP/TASE.2 links', 'Inter-control-center VPNs', 'Real-time data feeds'],
    recommendedActions: [
      'Inventory all inter-control-center communication links',
      'Prioritize ICCP links for PQC hybrid TLS deployment',
      'Coordinate migration timeline with interconnected utilities',
    ],
  },
  {
    id: 'CIP-013',
    name: 'CIP-013',
    title: 'Supply Chain Risk Management',
    description:
      'Requires identification and assessment of cyber security risks to BES Cyber Systems from vendor products and services.',
    pqcImpact:
      'Vendor PQC readiness must be assessed for all critical components: smart meter manufacturers, IED vendors, SCADA platform vendors. Procurement contracts must include PQC migration requirements.',
    urgency: 'high',
    affectedAssets: ['Vendor relationships', 'Procurement contracts', 'Third-party software'],
    recommendedActions: [
      'Add PQC readiness criteria to vendor qualification process',
      'Require PQC migration roadmaps in new procurement contracts',
      'Assess existing vendors for quantum risk in supply chain',
    ],
  },
]

// ---------------------------------------------------------------------------
// IEC 62351 parts
// ---------------------------------------------------------------------------

export interface IEC62351Part {
  part: number
  title: string
  scope: string
  pqcImpact: string
  quantumVulnerable: boolean
}

export const IEC_62351_PARTS: IEC62351Part[] = [
  {
    part: 3,
    title: 'TCP/IP Profile Security',
    scope: 'TLS profiles for MMS, ICCP, and other TCP-based power system protocols.',
    pqcImpact:
      'Full TLS migration to PQC hybrid required. RSA/ECDSA certificates and key exchange must transition.',
    quantumVulnerable: true,
  },
  {
    part: 4,
    title: 'MMS Security',
    scope: 'Security for Manufacturing Message Specification (IEC 61850 client/server).',
    pqcImpact: 'Depends on Part 3 TLS. MMS-level authentication tokens derived from TLS sessions.',
    quantumVulnerable: true,
  },
  {
    part: 5,
    title: 'IEC 61850 Security',
    scope: 'Security for GOOSE and Sampled Values, including digital signature authentication.',
    pqcImpact:
      'GOOSE/SV use HMAC for per-message auth (quantum-safe). Key distribution to seed HMAC keys uses RSA/ECDSA (quantum-vulnerable).',
    quantumVulnerable: true,
  },
  {
    part: 6,
    title: 'Peer-to-Peer Security',
    scope:
      'Security for IEC 61850 peer-to-peer communication, specifically GOOSE message authentication.',
    pqcImpact:
      'HMAC-SHA256 authentication is quantum-safe. The asymmetric key distribution channel for HMAC seed keys requires PQC migration.',
    quantumVulnerable: true,
  },
  {
    part: 9,
    title: 'Key Management',
    scope:
      'Key management architecture for power systems: role-based access, key hierarchy, certificate lifecycle.',
    pqcImpact:
      'Key distribution protocols and CA infrastructure must support PQC algorithms. Key hierarchy redesign needed for larger PQC key sizes.',
    quantumVulnerable: true,
  },
  {
    part: 14,
    title: 'Cyber Security Event Logging',
    scope: 'Security event logging format and transport for power system cyber events.',
    pqcImpact:
      'Log integrity signatures should transition to PQC. Lower urgency since logs are primarily internal.',
    quantumVulnerable: false,
  },
]
