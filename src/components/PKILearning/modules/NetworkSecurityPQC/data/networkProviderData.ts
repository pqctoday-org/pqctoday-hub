// SPDX-License-Identifier: GPL-3.0-only

export interface VendorMigrationStatus {
  id: string
  vendor: string
  product: string
  tier: 'enterprise' | 'mid-market' | 'open-source'
  pqcStatus: 'ga' | 'beta' | 'roadmap' | 'not-planned'
  tlsInspectionPQC: 'supported' | 'partial' | 'roadmap' | 'not-supported'
  mlKemStatus: 'ga' | 'beta' | 'roadmap' | 'not-supported'
  mlDsaStatus: 'ga' | 'beta' | 'roadmap' | 'not-supported'
  hybridMode: boolean
  certSizeLimit: string
  roadmapYear: number
  hardwareOffload: boolean
  fipsCompliant: boolean
  upgradeRequired: boolean
  upgradeDetails: string
  notes: string
}

export type PQCStatusKey = 'ga' | 'beta' | 'roadmap' | 'not-planned'
export type SupportStatusKey = 'supported' | 'partial' | 'roadmap' | 'not-supported'

export interface StatusLabel {
  label: string
  className: string
  color: string
}

export const PQC_STATUS_LABELS: Record<PQCStatusKey, StatusLabel> = {
  ga: {
    label: 'GA',
    className: 'bg-success/10 text-status-success border-success/30',
    color: 'text-status-success',
  },
  beta: {
    label: 'Beta',
    className: 'bg-primary/10 text-primary border-primary/30',
    color: 'text-primary',
  },
  roadmap: {
    label: 'Roadmap',
    className: 'bg-warning/10 text-status-warning border-warning/30',
    color: 'text-status-warning',
  },
  'not-planned': {
    label: 'Not Planned',
    className: 'bg-destructive/10 text-status-error border-destructive/30',
    color: 'text-status-error',
  },
}

export const SUPPORT_STATUS_LABELS: Record<SupportStatusKey, StatusLabel> = {
  supported: {
    label: 'Supported',
    className: 'bg-success/10 text-status-success border-success/30',
    color: 'text-status-success',
  },
  partial: {
    label: 'Partial',
    className: 'bg-primary/10 text-primary border-primary/30',
    color: 'text-primary',
  },
  roadmap: {
    label: 'Roadmap',
    className: 'bg-warning/10 text-status-warning border-warning/30',
    color: 'text-status-warning',
  },
  'not-supported': {
    label: 'Not Supported',
    className: 'bg-destructive/10 text-status-error border-destructive/30',
    color: 'text-status-error',
  },
}

export const VENDOR_MIGRATION_DATA: VendorMigrationStatus[] = [
  {
    id: 'cisco-firepower',
    vendor: 'Cisco',
    product: 'ASA / Firepower Threat Defense (FTD)',
    tier: 'enterprise',
    pqcStatus: 'roadmap',
    tlsInspectionPQC: 'roadmap',
    mlKemStatus: 'roadmap',
    mlDsaStatus: 'roadmap',
    hybridMode: false,
    certSizeLimit: '8KB (post FTD 7.4)',
    roadmapYear: 2027,
    hardwareOffload: true,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'Cisco quantum-safe roadmap targets ML-KEM hybrid IKEv2 VPN for 2027 as part of CNSA 2.0 compliance.',
    notes:
      'Current ASA 9.x does not support PQC key exchange. FTD 7.4+ has hybrid X25519+ML-KEM-768 preview, but full migration targets 2027.',
  },
  {
    id: 'palo-alto-ngfw',
    vendor: 'Palo Alto Networks',
    product: 'PAN-OS 12.1',
    tier: 'enterprise',
    pqcStatus: 'ga',
    tlsInspectionPQC: 'supported',
    mlKemStatus: 'ga',
    mlDsaStatus: 'ga',
    hybridMode: true,
    certSizeLimit: '16KB (PAN-OS 11.1+)',
    roadmapYear: 2025,
    hardwareOffload: true,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'PAN-OS 12.1 required for full NIST standard PQC algorithms. PA-5500 and ruggedized PA-455R-5G recommended for hardware acceleration.',
    notes:
      'Features quantum readiness dashboard with real-time cryptographic asset inventory and inline remediation. Automated cipher translation instantly upgrades applications to quantum-safe encryption.',
  },
  {
    id: 'fortinet-fortigate',
    vendor: 'Fortinet',
    product: 'FortiGate / FortiOS 7.6+',
    tier: 'enterprise',
    pqcStatus: 'beta',
    tlsInspectionPQC: 'roadmap',
    mlKemStatus: 'beta',
    mlDsaStatus: 'beta',
    hybridMode: true,
    certSizeLimit: '4KB (current); 16KB planned FortiOS 7.6.2',
    roadmapYear: 2026,
    hardwareOffload: true,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'FortiOS 7.6 required for ML-KEM/ML-DSA beta. FortiGate 1000F+ with NP7 ASIC for hardware offload. FortiManager 7.6 for policy management. TLS inspection with PQC certs requires 7.6.2+ (Q3 2026).',
    notes:
      'Fortinet Security Fabric integration extends PQC visibility to FortiProxy, FortiWeb, and FortiADC. FortiOS 7.6 ships OpenSSL 3.3 backend enabling FIPS 203/204 algorithm support. Current 4KB cert size limit in TLS inspection profiles is a known limitation being addressed in 7.6.2.',
  },
  {
    id: 'juniper-srx',
    vendor: 'Juniper Networks',
    product: 'SRX Series (Junos 24.x)',
    tier: 'enterprise',
    pqcStatus: 'beta',
    tlsInspectionPQC: 'roadmap',
    mlKemStatus: 'beta',
    mlDsaStatus: 'roadmap',
    hybridMode: true,
    certSizeLimit: '4KB (Junos 24.x)',
    roadmapYear: 2026,
    hardwareOffload: false,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'Junos 24.1R1+ for hybrid ML-KEM IPsec/IKEv2 support. SRX5000 hardware offload for PQC targeted Junos 24.2R1. SSL proxy PQC inspection requires Junos 25.x (2026). Advanced Threat Prevention (ATP) Cloud updated for PQC traffic classification.',
    notes:
      'Juniper updated IPsec implementation to RFC 9370 (hybrid KEM for IKEv2) in Junos 24.1. AppSecure SSL proxy engine requires 24.2R1+ for PQC cert inspection. Security Director Cloud policy for PQC migration automation in preview. No hardware crypto offload for ML-KEM on current SRX hardware.',
  },
  {
    id: 'check-point',
    vendor: 'Check Point',
    product: 'Quantum Security Gateway (R82)',
    tier: 'enterprise',
    pqcStatus: 'ga',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'ga',
    mlDsaStatus: 'roadmap',
    hybridMode: true,
    certSizeLimit: '2KB (current TLS inspection limit)',
    roadmapYear: 2026,
    hardwareOffload: true,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'R82 is the recommended release with QSKE (Quantum Safe Key Exchange). Remote access VPN PQC support on roadmap.',
    notes:
      'Supported quantum-safe key exchange for IKEv2 site-to-site VPNs using ML-KEM-512/768/1024. Default MKE proposal configures DH group 15 + ML-KEM-768.',
  },
  {
    id: 'sophos-xgs',
    vendor: 'Sophos',
    product: 'XGS Series (SFOS 21.x)',
    tier: 'mid-market',
    pqcStatus: 'roadmap',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'roadmap',
    mlDsaStatus: 'not-supported',
    hybridMode: false,
    certSizeLimit: '3KB (SFOS current)',
    roadmapYear: 2026,
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: true,
    upgradeDetails:
      'SFOS 21.5 (Q3 2026) planned PQC TLS support via OpenSSL 3.x backend upgrade. XGS 5500+ hardware recommended for PQC workloads. Sophos Central policy management updated for PQC configuration. No hardware crypto offload on current XGS lineup.',
    notes:
      'Sophos SFOS migrating from internal TLS stack to OpenSSL 3.3 in SFOS 21.5, enabling FIPS 203/204 algorithm support. XGS hardware lacks dedicated crypto ASIC — all PQC operations will run in software. Mid-market price point means hardware refresh unlikely before 2027.',
  },
  {
    id: 'sonicwall',
    vendor: 'SonicWall',
    product: 'NSa / TZ Series (SonicOS 7.1+)',
    tier: 'mid-market',
    pqcStatus: 'roadmap',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'not-supported',
    mlDsaStatus: 'not-supported',
    hybridMode: false,
    certSizeLimit: '2KB (SonicOS current)',
    roadmapYear: 2027,
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: true,
    upgradeDetails:
      'SonicOS 7.2+ (2027) targeted for PQC TLS inspection. NSa 9700 hardware platform has Cavium-based crypto engine with potential PQC support via firmware. Network Security Manager (NSM) 3.x planned for PQC policy management.',
    notes:
      'SonicWall SonicOS 7.1 uses OpenSSL 3.x internally but has not exposed PQC algorithms in the TLS inspection pipeline. NSa 9700 Cavium OCTEON crypto engine supports custom algorithm loading — PQC feasibility under evaluation. TZ series (SMB) unlikely to receive PQC TLS inspection due to hardware constraints.',
  },
  {
    id: 'pfsense-opnsense',
    vendor: 'Netgate / Deciso',
    product: 'pfSense Community / OPNsense 24.7+',
    tier: 'open-source',
    pqcStatus: 'beta',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'beta',
    mlDsaStatus: 'not-supported',
    hybridMode: true,
    certSizeLimit: 'No limit (OS-level, no appliance buffer)',
    roadmapYear: 2025,
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: false,
    upgradeDetails:
      'pfSense CE has no PQC roadmap. OPNsense 24.7+ includes strongSwan plugin with experimental ML-KEM hybrid IKEv2 support.',
    notes:
      'The OPNsense team has been proactive with PQC integration compared to pfSense. Suricata IDS/IPS in OPNsense supports PQC traffic detection.',
  },
]

// ── Feature Filters ───────────────────────────────────────────────────────────

export interface FeatureFilter {
  id: string
  label: string
}

export const FEATURE_FILTERS: FeatureFilter[] = [
  { id: 'all', label: 'All Vendors' },
  { id: 'tls-inspection', label: 'TLS Inspection PQC' },
  { id: 'ml-kem', label: 'ML-KEM Support' },
  { id: 'ml-dsa', label: 'ML-DSA Support' },
  { id: 'hardware-offload', label: 'Hardware Offload' },
  { id: 'ga', label: 'GA Only' },
  { id: 'enterprise', label: 'Enterprise Tier' },
]
