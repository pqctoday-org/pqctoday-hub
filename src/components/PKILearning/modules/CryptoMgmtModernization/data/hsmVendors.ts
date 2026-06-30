// SPDX-License-Identifier: GPL-3.0-only
/**
 * HSM vendor FIPS 140-3 Level 3 posture data.
 *
 * NOTE: Cert numbers, firmware bindings, and PQC support are illustrative
 * for educational use. Verify live against csrc.nist.gov/projects/
 * cryptographic-module-validation-program and the vendor's official pages.
 */

import type { EsvStatus, FipsStatus, RiskColor } from './cryptoLibraries'
import { getCatalogStatus, type CatalogAvailability } from '@/data/catalogStatus'

export interface HsmVendorRecord {
  id: string
  /** softwareName in the central catalog. Omit only for EOL/deprecated products not in the active catalog. */
  catalogName?: string
  vendor: string
  product: string
  firmwareRev: string
  fipsLevel: 2 | 3 | 4
  fipsStatus: FipsStatus
  cmvpCertNumber: string | null
  esvStatus: EsvStatus // SP 800-90B entropy source validation status
  pqcSupport: string
  platformBinding: string
  lastVerified: string
  posture: RiskColor
  notes: string
}

export const HSM_VENDORS: HsmVendorRecord[] = [
  {
    id: 'thales-luna-7',
    catalogName: 'Thales Luna HSM',
    vendor: 'Thales',
    product: 'Luna Network HSM 7',
    firmwareRev: '7.13.3',
    fipsLevel: 3,
    fipsStatus: 'active-pqc',
    cmvpCertNumber: '#4962 (Luna G7)',
    esvStatus: 'active',
    pqcSupport: 'ML-KEM-768/1024, ML-DSA-65/87 (FIPS 203/204)',
    platformBinding: 'Luna Network appliance; K7 crypto module',
    lastVerified: '2026-04-18',
    posture: 'green',
    notes:
      'First major HSM with FIPS 140-3 L3 PQC coverage in production. Firmware-bound cert; upgrade requires re-validation path.',
  },
  {
    id: 'entrust-nshield-5',
    catalogName: 'Entrust nShield',
    vendor: 'Entrust',
    product: 'nShield 5c',
    firmwareRev: '13.6.2',
    fipsLevel: 3,
    fipsStatus: 'active-pqc',
    cmvpCertNumber: '#4765 (nShield 5s)',
    esvStatus: 'active',
    pqcSupport: 'ML-KEM-768, ML-DSA-65, SLH-DSA-SHA2-128s',
    platformBinding: 'nShield 5c network appliance / nShield 5s PCIe',
    lastVerified: '2026-04-22',
    posture: 'green',
    notes:
      'SLH-DSA coverage distinguishes nShield 5 from Luna 7. CodeSafe apps for PQC workloads. CMVP cert #4765 covers the 5s form factor; verify 5c cert status separately at csrc.nist.gov.',
  },
  {
    id: 'utimaco-cp5',
    catalogName: 'Utimaco SecurityServer',
    vendor: 'Utimaco',
    product: 'SecurityServer CP5 Se-Series',
    firmwareRev: '6.0.1',
    fipsLevel: 3,
    fipsStatus: 'in-mip',
    cmvpCertNumber: null,
    esvStatus: 'in-mip',
    pqcSupport: 'ML-KEM, ML-DSA (lab validated; CMVP MIP)',
    platformBinding: 'CP5 Se-Gen2 PCIe',
    lastVerified: '2026-04-12',
    posture: 'yellow',
    notes:
      'Validation submitted 2025-Q4; currently in CMVP Modules-in-Process queue. Non-FIPS path usable today with customer risk-acceptance.',
  },
  {
    id: 'crypto4a-qxhsm',
    catalogName: 'Crypto4A QxHSM',
    vendor: 'Crypto4A',
    product: 'QxHSM (QASM core)',
    firmwareRev: 'QxOS 5 (v5.0)',
    fipsLevel: 3,
    fipsStatus: 'in-mip',
    cmvpCertNumber: '#4250 (QASM core; v5.0 PQC resubmission in MIP)',
    esvStatus: 'active',
    pqcSupport:
      'ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA (all 12 param sets), LMS/HSS, XMSS (CAVP A4204 + A5631)',
    platformBinding: 'QxBMC-1/3/12 chassis (desktop/1U/4U); FPGA-based QASM core',
    lastVerified: '2026-06-06',
    posture: 'green',
    notes:
      "First HSM submitted for FIPS 140-3 Level 3 covering all NIST PQC algorithms. FPGA-based QASM core enables in-field firmware upgrades without hardware swap. CAVP A5631 (ML-KEM, ML-DSA, SLH-DSA, LMS) and A4204 (LMS — world's first PQC CAVP cert) validated. QxOS 5 (Jun 2025). Classic McEliece on roadmap. Integrations: EJBCA v9.3+, DigiCert, Keyfactor. Canadian sovereign solution (Ottawa).",
  },
  {
    id: 'fortanix-dsm',
    catalogName: 'Fortanix Data Security Manager',
    vendor: 'Fortanix',
    product: 'Data Security Manager (confidential-computing HSM)',
    firmwareRev: '4.42',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#4139 (SDKMS Appliance)',
    esvStatus: 'in-mip',
    pqcSupport: 'ML-KEM, ML-DSA via SGX-backed key objects (outside FIPS boundary)',
    platformBinding: 'Intel SGX-enabled appliance / cloud tenant',
    lastVerified: '2026-04-22',
    posture: 'yellow',
    notes:
      'Confidential-computing architecture; product rebranded from SDKMS to DSM. CMVP cert #4139 covers the SDKMS Appliance (same hardware). PQC algorithms exposed via the API but not yet inside the CMVP boundary.',
  },
  {
    id: 'yubihsm2',
    catalogName: 'Yubico YubiHSM 2',
    vendor: 'Yubico',
    product: 'YubiHSM 2',
    firmwareRev: '2.4.0',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#3916 (YubiHSM 2)',
    esvStatus: 'not-validated',
    pqcSupport: 'Ed25519, ECDSA, RSA; no PQC in FIPS boundary yet',
    platformBinding: 'YubiHSM 2 FIPS USB device',
    lastVerified: '2026-04-11',
    posture: 'yellow',
    notes:
      'Compact FIPS 140-3 L3 device; PQC roadmap pending. Suitable for CA signing keys at branch scale.',
  },
  {
    id: 'aws-cloudhsm',
    catalogName: 'AWS CloudHSM',
    vendor: 'Amazon Web Services',
    product: 'AWS CloudHSM (hsm2m.medium)',
    firmwareRev: 'Cavium LiquidSecurity fw 3.4',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#5219 (Marvell NITROX III CNN35XX — underlying hw)',
    esvStatus: 'active',
    pqcSupport: 'ML-KEM, ML-DSA on hsm2m instance family (outside FIPS boundary)',
    platformBinding: 'hsm2m.medium instance; region-bound',
    lastVerified: '2026-04-22',
    posture: 'yellow',
    notes:
      'AWS CloudHSM uses Marvell NITROX III CNN35XX hardware; the FIPS cert belongs to Marvell (#5219), not Amazon. PQC algorithms available via PKCS#11 but pending IG-aligned re-validation.',
  },
  {
    id: 'azure-dedicated-hsm',
    // No catalogName: this product is deprecated in the active catalog (EOL Aug 2025 — no new customers).
    // posture: 'red' is correct and intentional; do not wire to a Marvell or Managed HSM entry.
    vendor: 'Microsoft Azure',
    product: 'Azure Dedicated HSM (Luna 7)',
    firmwareRev: '7.7.2',
    fipsLevel: 3,
    fipsStatus: 'historical',
    cmvpCertNumber: '#3892 (historical)',
    esvStatus: 'historical',
    pqcSupport: 'None in validated boundary',
    platformBinding: 'Luna 7 appliance hosted by Azure',
    lastVerified: '2026-03-30',
    posture: 'red',
    notes:
      'Current Azure Dedicated HSM ships Luna 7.7.2 firmware whose CMVP cert is historical. Customers should request migration to Luna Network HSM 7.13.x for active-PQC coverage.',
  },
  {
    id: 'gcp-cloud-hsm',
    catalogName: 'Google Cloud HSM',
    vendor: 'Google Cloud',
    product: 'Cloud HSM (Marvell LiquidSecurity)',
    firmwareRev: 'LS2 fw 3.4.5',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#5220 (Marvell LS2 HSM — underlying hw)',
    esvStatus: 'in-mip',
    pqcSupport: 'No PQC in FIPS boundary; roadmap disclosed 2026H2',
    platformBinding: 'Marvell LiquidSecurity 2 HSM',
    lastVerified: '2026-04-22',
    posture: 'yellow',
    notes:
      'GCP Cloud HSM uses Marvell LS2 (LiquidSecurity 2) hardware; the FIPS cert belongs to Marvell (#5220), not Google. PQC integration pending.',
  },
]

// ── Catalog-derived headline status ───────────────────────────────────────────
// Map catalog availability → this module's posture vocabulary. The catalog is
// the single source of truth for PQC status; never hardcode posture in records.
const AVAIL_TO_POSTURE: Record<CatalogAvailability, RiskColor> = {
  available: 'green',
  partial: 'yellow',
  roadmap: 'yellow',
  none: 'red',
  unverified: 'yellow',
}

/** Headline PQC posture for an HSM vendor, derived live from the central catalog.
 *  Falls back to the record's own posture for EOL products with no active catalog entry. */
export function getHsmPqcPosture(v: HsmVendorRecord): RiskColor {
  if (!v.catalogName) return v.posture
  const status = getCatalogStatus(v.catalogName)
  return status ? AVAIL_TO_POSTURE[status.availability] : 'yellow'
}
