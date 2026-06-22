// SPDX-License-Identifier: GPL-3.0-only
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
    product: 'ASA / Firepower Threat Defense (FTD 7.4+)',
    tier: 'enterprise',
    catalogName: 'Cisco ASA (Adaptive Security Appliance)',
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
    catalogName: 'Palo Alto PAN-OS',
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
    catalogName: 'Fortinet FortiGate (FortiOS)',
    tlsInspectionPQC: 'partial',
    mlKemStatus: 'ga',
    mlDsaStatus: 'ga',
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
    product: 'SRX Series (Junos 24.x / 25.4R1)',
    tier: 'enterprise',
    catalogName: 'Juniper SRX Series Firewalls',
    tlsInspectionPQC: 'roadmap',
    mlKemStatus: 'roadmap',
    mlDsaStatus: 'ga',
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
    catalogName: 'Check Point Quantum',
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
    catalogName: 'Sophos XGS',
    tlsInspectionPQC: 'not-supported',
    mlKemStatus: 'not-supported',
    mlDsaStatus: 'not-supported',
    hybridMode: false,
    certSizeLimit: '3KB (SFOS current)',
    roadmapYear: 0,
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: true,
    upgradeDetails:
      'No committed native PQC roadmap. The only PQC-related change in SFOS 21.5 (GA 2025) is a DPI Path-MTU fix so the firewall correctly passes through clients negotiating ML-KEM (Kyber) TLS — the firewall itself does not implement ML-KEM/ML-DSA. XGS hardware lacks a dedicated crypto ASIC.',
    notes:
      'Verified 2026-06-19 against the official SFOS 21.5 release notes: no native NIST PQC (ML-KEM/ML-DSA) in the firewall data or management plane — only transparent pass-through of client ML-KEM TLS. Catalog status: none.',
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
    certSizeLimit: '2KB (SonicOS current)',
    roadmapYear: 0,
    hardwareOffload: false,
    fipsCompliant: false,
    upgradeRequired: true,
    upgradeDetails:
      'No committed native PQC roadmap. SonicOS 7.0/7.1/8.0 IPsec & SSL VPN cryptography documents only classical algorithms (AES, 3DES, ECDH/DH, ECDSA, SHA-2, Suite B). PQC feasibility on the NSa 9700 Cavium OCTEON engine remains under evaluation with no public commitment.',
    notes:
      'Verified 2026-06-19 against SonicOS VPN crypto docs: no ML-KEM/ML-DSA in the TLS-inspection or VPN pipeline. Catalog status: none.',
  },
  {
    id: 'opnsense',
    vendor: 'Deciso',
    product: 'OPNsense 24.7+',
    tier: 'open-source',
    catalogName: 'OPNsense',
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
      'OPNsense 24.7+ ships a strongSwan plugin with hybrid ML-KEM IKEv2 key exchange (IKEv2 KE method per RFC 9370) and inherits PQC TLS from its OpenSSL/LibreSSL base. Enable the post-quantum proposals in the IPsec connection settings.',
    notes:
      'Split from the former combined pfSense/OPNsense row (2026-06-19): OPNsense is the one with a PQC path (strongSwan hybrid ML-KEM), so the catalog tracks it as partial. Suricata IDS/IPS additionally classifies PQC traffic.',
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
