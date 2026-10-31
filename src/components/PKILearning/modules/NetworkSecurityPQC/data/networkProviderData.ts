// SPDX-License-Identifier: AGPL-3.0-only
import { getCatalogStatus, type CatalogAvailability } from '@/data/catalogStatus'

export interface VendorMigrationStatus {
  id: string
  vendor: string
  product: string
  tier: 'enterprise' | 'mid-market' | 'open-source'
  /**
   * Reference to the product's `software_name` in the central catalog
   * (`pqc_product_catalog_*.csv`). The headline `pqcStatus` is DERIVED from the
   * catalog via `getVendorPqcStatus` — it is NOT stored here, so the module can
   * never drift from the single source of truth. The granular per-capability
   * fields below (ml-kem / ml-dsa / tls-inspection / hardware-offload) remain
   * module-authored teaching detail the catalog does not track.
   */
  catalogName: string
  tlsInspectionPQC: 'supported' | 'partial' | 'roadmap' | 'not-supported'
  /** 'not-stated' when the vendor's own pages name no maturity for the capability. */
  mlKemStatus: 'ga' | 'beta' | 'roadmap' | 'not-supported' | 'not-stated'
  /** 'not-stated' when the vendor's own pages name no maturity for the capability. */
  mlDsaStatus: 'ga' | 'beta' | 'roadmap' | 'not-supported' | 'not-stated'
  /** Omitted when the vendor's own pages do not say. */
  hybridMode?: boolean
  certSizeLimit: string
  /** Omitted when the vendor's own pages do not say. */
  roadmapYear?: number
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

// The per-capability fields use 'not-supported' (a vendor that ships the
// product without the capability) while the catalogue-derived headline uses
// 'not-planned'; both need a label, or a vendor row with an unsupported
// capability crashed the Vendor Matrix step (round-9 walk, 2026-09-19).
export const PQC_STATUS_LABELS: Record<PQCStatusKey | 'not-supported' | 'not-stated', StatusLabel> =
  {
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
      label: 'None today',
      className: 'bg-destructive/10 text-status-error border-destructive/30',
      color: 'text-status-error',
    },
    'not-supported': {
      label: 'Not Supported',
      className: 'bg-destructive/10 text-status-error border-destructive/30',
      color: 'text-status-error',
    },
    'not-stated': {
      label: 'Not stated',
      className: 'bg-muted text-muted-foreground border-border',
      color: 'text-muted-foreground',
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
    product: 'ASA / Secure Firewall Threat Defense (FTD)',
    tier: 'enterprise',
    catalogName: 'Cisco ASA (Adaptive Security Appliance)',
    tlsInspectionPQC: 'roadmap',
    mlKemStatus: 'roadmap',
    mlDsaStatus: 'roadmap',
    hybridMode: false,
    certSizeLimit: 'Not stated by Cisco',
    roadmapYear: 2026,
    hardwareOffload: true,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'The Cisco Secure Firewall roadmap blog (13 April 2026) says ML-KEM support arrives in FTD 10.5 and ASA 9.25, targeted for General Availability in late 2026, and that ML-DSA and SLH-DSA support is planned for FTD/ASA 11.0, in the second half of calendar year 2027. Cisco says delivery timelines are subject to change.',
    notes:
      'Before ML-KEM arrives, the blog lists RFC 8784 (a post-quantum pre-shared key mixed into IKEv2, available on ASA since 9.18) and the RFC 9370 hybrid key exchange framework (available on ASA since 9.19). It plans visibility into PQC-negotiated sessions and QUIC decryption with PQC support for FTD 11.0.',
  },
  {
    id: 'palo-alto-ngfw',
    vendor: 'Palo Alto Networks',
    product: 'PAN-OS 12.1',
    tier: 'enterprise',
    catalogName: 'Palo Alto PAN-OS',
    tlsInspectionPQC: 'supported',
    mlKemStatus: 'ga',
    mlDsaStatus: 'ga',
    hybridMode: true,
    certSizeLimit: 'Not stated by Palo Alto Networks',
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
    catalogName: 'Fortinet FortiGate (FortiOS)',
    tlsInspectionPQC: 'partial',
    mlKemStatus: 'ga',
    mlDsaStatus: 'not-stated',
    hybridMode: true,
    certSizeLimit: 'Not stated by Fortinet',
    hardwareOffload: true,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'Fortinet documentation lists post-quantum key exchange for IPsec from FortiOS 7.6.1 (hybrid key exchange per RFC 9370, with ML-KEM-512, ML-KEM-768 and ML-KEM-1024 as the FIPS 203 groups) and hybrid post-quantum cryptography in SSL deep inspection in flow mode from FortiOS 7.6.5.',
    notes:
      'FortiOS 7.6.5 also lists enhanced HTTPS management security with post-quantum TLS algorithms. This entry records no ML-DSA support level, certificate size limit or roadmap year.',
  },
  {
    id: 'juniper-srx',
    vendor: 'Juniper Networks',
    product: 'SRX Series (Junos OS 25.4R1)',
    tier: 'enterprise',
    catalogName: 'Juniper SRX Series Firewalls',
    tlsInspectionPQC: 'roadmap',
    mlKemStatus: 'roadmap',
    mlDsaStatus: 'ga',
    certSizeLimit: 'Not stated by Juniper',
    roadmapYear: 2026,
    hardwareOffload: false,
    fipsCompliant: true,
    upgradeRequired: true,
    upgradeDetails:
      'Junos OS 25.4R1 adds ML-DSA-87 post-quantum signatures for software images on SRX Series and other platforms, validated off-box. For IPsec, Juniper documents quantum-safe VPNs with post-quantum pre-shared keys (RFC 8784), not an ML-KEM key exchange.',
    notes:
      'The product catalog says an ML-KEM hybrid IKEv2 key exchange is not yet shipping in Junos OS as of release 26.2R1. A post-quantum pre-shared key (RFC 8784) is an out-of-band secret added at both peers, used alongside the IKEv2 authentication method; it is not a KEM.',
  },
  {
    id: 'check-point',
    vendor: 'Check Point',
    product: 'Quantum Security Gateway (R82)',
    tier: 'enterprise',
    catalogName: 'Check Point Quantum',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'ga',
    mlDsaStatus: 'roadmap',
    hybridMode: true,
    certSizeLimit: 'Not stated by Check Point',
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
    catalogName: 'Sophos XGS',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'not-stated',
    mlDsaStatus: 'not-stated',
    hybridMode: false,
    certSizeLimit: 'Not stated by Sophos',
    hardwareOffload: true,
    fipsCompliant: false,
    upgradeRequired: true,
    upgradeDetails:
      'SFOS 21.5 (GA, 2 June 2025) mentions post-quantum cryptography only as a DPI-mode Path MTU fix for connections that use the ML-KEM (Kyber) key exchange supported in browsers. SFOS 22.0 MR2 (Build 546, 14 July 2026) adds detection and control of PQC: intrusion prevention can detect and block pure and hybrid PQC key exchange algorithms based on ML-KEM, and Web Protection prevents web sessions from negotiating unsupported PQC algorithms. The new IPS patterns are disabled by default.',
    notes:
      'The 22.0 MR2 release notes describe detecting and controlling ML-KEM-based key exchange (intrusion prevention and Web Protection); they do not describe ML-KEM or ML-DSA in the firewall’s own services. The Sophos XGS datasheet says every XGS model has a dedicated Xstream Flow Processor and that Xstream offloads crypto operations; it does not say whether that covers post-quantum algorithms. Catalog status: none.',
  },
  {
    id: 'sonicwall',
    vendor: 'SonicWall',
    product: 'NSa / TZ Series (SonicOS 7.1+)',
    tier: 'mid-market',
    catalogName: 'SonicWall NSa / TZ (SonicOS)',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'not-supported',
    mlDsaStatus: 'not-supported',
    hybridMode: false,
    certSizeLimit: 'Not stated by SonicWall',
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: true,
    upgradeDetails:
      'The product catalog on this site (last verified 18 August 2026; latest SonicOS 8.2.2) says SonicOS firewall cryptography contains no post-quantum support today, and that the IPsec VPN documentation for SonicOS 7.0, 7.1 and 8.0 lists only classical algorithms.',
    notes: 'Catalog status: none.',
  },
  {
    id: 'opnsense',
    vendor: 'Deciso',
    product: 'OPNsense 26.7.4+',
    tier: 'open-source',
    catalogName: 'OPNsense',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'not-stated',
    mlDsaStatus: 'not-supported',
    hybridMode: true,
    certSizeLimit: 'No limit (OS-level, no appliance buffer)',
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: false,
    upgradeDetails:
      'OPNsense 26.7.4 (15 September 2026) updated strongSwan to 6.1.0 and added hybrid post-quantum variants as an additional key exchange in its IPsec settings: X25519 or P-256 with ML-KEM-768, or P-384 with ML-KEM-1024.',
    notes:
      'Split from the former combined pfSense/OPNsense row (2026-06-19): OPNsense is the one with a PQC path, so the catalog tracks it as partial. OPNsense offers ML-KEM only as an additional key exchange next to a classical one, not as the primary key exchange.',
  },
  {
    id: 'pfsense',
    vendor: 'Netgate',
    product: 'pfSense Community Edition',
    tier: 'open-source',
    catalogName: 'pfSense Community Edition',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'not-supported',
    mlDsaStatus: 'not-supported',
    hybridMode: false,
    certSizeLimit: 'No limit (OS-level, no appliance buffer)',
    roadmapYear: 0,
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: false,
    upgradeDetails:
      'pfSense Community Edition has no committed PQC roadmap and ships no native ML-KEM/ML-DSA in its IPsec/TLS path as released. Migrating workloads to OPNsense (or a PQC-capable upstream) is required for quantum-safe key exchange.',
    notes:
      'Split from the former combined pfSense/OPNsense row (2026-06-19): pfSense CE does not ship the PQC path that OPNsense does, so the catalog tracks it as none.',
  },
]

// ── Catalog-derived headline status ───────────────────────────────────────────
// A vendor's overall PQC status is the SINGLE SOURCE OF TRUTH in the central
// product catalog (`pqc_product_catalog_*.csv` → `softwareData`). This module no
// longer stores it; it maps catalog availability → the module's display vocabulary.
const AVAIL_TO_PQC: Record<CatalogAvailability, PQCStatusKey> = {
  available: 'ga',
  partial: 'beta',
  roadmap: 'roadmap',
  none: 'not-planned',
  unverified: 'roadmap',
}

/** Headline PQC status for a vendor row, derived live from the central catalog. */
export function getVendorPqcStatus(v: VendorMigrationStatus): PQCStatusKey {
  const status = getCatalogStatus(v.catalogName)
  return status ? AVAIL_TO_PQC[status.availability] : 'roadmap'
}

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
