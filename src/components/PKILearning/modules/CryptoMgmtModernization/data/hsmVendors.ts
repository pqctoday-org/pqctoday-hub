// SPDX-License-Identifier: GPL-3.0-only
/**
 * HSM vendor FIPS 140-3 Level 3 posture data.
 *
 * NOTE: Firmware bindings and PQC support are illustrative for educational use.
 * CMVP certificate numbers, standards, statuses and approved PQC algorithms were
 * re-checked against the CMVP certificate pages on 2026-09-24. Verify live against
 * csrc.nist.gov/projects/cryptographic-module-validation-program before relying on them.
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
    fipsStatus: 'active',
    cmvpCertNumber: '#4962 (Luna G7)',
    esvStatus: 'active',
    pqcSupport:
      'ML-KEM-768/1024, ML-DSA-65/87 in firmware; not in the approved-algorithm list of #4962 or the K7 module #4684',
    platformBinding: 'Luna Network appliance; K7 crypto module',
    lastVerified: '2026-09-24',
    posture: 'green',
    notes:
      "Thales's Luna T7 module certificate #5450 (29 Jul 2026) does list ML-KEM and ML-DSA as approved; check which module certificate your appliance and firmware map to. Firmware-bound cert; upgrade requires re-validation path.",
  },
  {
    id: 'entrust-nshield-5',
    catalogName: 'Entrust nShield',
    vendor: 'Entrust',
    product: 'nShield 5c',
    firmwareRev: '13.6.2',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#5329 (nShield 5s; replaces #4765, now historical)',
    esvStatus: 'active',
    pqcSupport:
      'ML-KEM-768, ML-DSA-65, SLH-DSA-SHA2-128s (CAVP A7285); not in the approved-algorithm list of #5329',
    platformBinding: 'nShield 5c network appliance / nShield 5s PCIe',
    lastVerified: '2026-09-24',
    posture: 'green',
    notes:
      'SLH-DSA coverage distinguishes nShield 5 from Luna 7. CodeSafe apps for PQC workloads. CMVP cert #5329 covers the 5s form factor; another nShield 5s entry is on the Modules in Process list (Review, 30 Jul 2026), which is not evidence of the outcome. Verify 5c cert status separately at csrc.nist.gov.',
  },
  {
    id: 'utimaco-cp5',
    catalogName: 'Utimaco uTrust HSM',
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
    fipsStatus: 'active-pqc',
    cmvpCertNumber:
      '#5497 = FIPS 140-3 Level 3 (19 Aug 2026, QASM Cryptographic Module); #4250 (FIPS 140-2) historical',
    esvStatus: 'active',
    pqcSupport:
      'ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA (all 12 param sets), LMS/HSS (CAVP A4204 = LMS; A5631 = LMS/ML-DSA/ML-KEM/SLH-DSA)',
    platformBinding: 'QxBMC-1/3/12 chassis (desktop/1U/4U); FPGA-based QASM core',
    lastVerified: '2026-09-24',
    posture: 'green',
    notes:
      "CMVP certificate #5497 lists ML-KEM, ML-DSA, SLH-DSA and LMS as approved. FPGA-based QASM core enables in-field firmware upgrades without hardware swap. CAVP A5631 (ML-KEM, ML-DSA, SLH-DSA, LMS) and A4204 (LMS — world's first PQC CAVP cert) validated. QxOS 5. Classic McEliece on roadmap. Integrations: EJBCA v9.3+, DigiCert, Keyfactor. Canadian sovereign solution (Ottawa).",
  },
  {
    id: 'fortanix-dsm',
    catalogName: 'Fortanix Data Security Manager',
    vendor: 'Fortanix',
    product: 'Data Security Manager (confidential-computing HSM)',
    firmwareRev: '4.42',
    fipsLevel: 3,
    fipsStatus: 'historical',
    cmvpCertNumber: '#4139 (SDKMS Appliance; FIPS 140-2, historical)',
    esvStatus: 'in-mip',
    pqcSupport: 'ML-KEM, ML-DSA via SGX-backed key objects (outside FIPS boundary)',
    platformBinding: 'Intel SGX-enabled appliance / cloud tenant',
    lastVerified: '2026-04-22',
    posture: 'yellow',
    notes:
      'Confidential-computing architecture; product rebranded from SDKMS to DSM. CMVP cert #4139 covers the SDKMS Appliance (same hardware); it is a FIPS 140-2 certificate that CMVP moved to the Historical list at sunset (checked 2026-09-24). PQC algorithms exposed via the API but not yet inside the CMVP boundary.',
  },
  {
    id: 'yubihsm2',
    catalogName: 'Yubico YubiHSM 2',
    vendor: 'Yubico',
    product: 'YubiHSM 2',
    firmwareRev: '2.4.0',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#5302 (YubiHSM 2; FIPS 140-3 L3). #3916 (FIPS 140-2) is historical',
    esvStatus: 'not-validated',
    pqcSupport: 'Ed25519, ECDSA, RSA; no PQC in FIPS boundary yet',
    platformBinding: 'YubiHSM 2 FIPS USB device',
    lastVerified: '2026-04-11',
    posture: 'yellow',
    notes:
      'Compact FIPS 140-3 L3 device (#5302, 3 Jun 2026; no PQC in its approved-algorithm list); PQC roadmap pending. Suitable for CA signing keys at branch scale.',
  },
  {
    id: 'aws-cloudhsm',
    catalogName: 'AWS CloudHSM',
    vendor: 'Amazon Web Services',
    product: 'AWS CloudHSM (hsm2m.medium)',
    firmwareRev: 'Cavium LiquidSecurity fw 3.4',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: null,
    esvStatus: 'active',
    pqcSupport: 'ML-KEM, ML-DSA on hsm2m instance family (outside FIPS boundary)',
    platformBinding: 'hsm2m.medium instance; region-bound',
    lastVerified: '2026-04-22',
    posture: 'yellow',
    notes:
      'AWS CloudHSM uses Marvell NITROX III CNN35XX hardware. The certificate number is not verified here: #5219, listed previously, is a JISA Softech NITROX III certificate, not Marvell or Amazon. PQC algorithms available via PKCS#11 but pending IG-aligned re-validation.',
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
    cmvpCertNumber: null,
    esvStatus: 'historical',
    pqcSupport: 'None in validated boundary',
    platformBinding: 'Luna 7 appliance hosted by Azure',
    lastVerified: '2026-03-30',
    posture: 'red',
    notes:
      'Current Azure Dedicated HSM ships Luna 7.7.2 firmware whose CMVP cert is historical (cert number not verified here; #3892, listed previously, is a Red Hat OpenSSH module). Customers should request migration to Luna Network HSM 7.13.x for active-PQC coverage.',
  },
  {
    id: 'gcp-cloud-hsm',
    catalogName: 'Google Cloud HSM',
    vendor: 'Google Cloud',
    product: 'Cloud HSM (Marvell LiquidSecurity)',
    firmwareRev: 'LS2 fw 3.4.5',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#4703 / #5502 (Marvell LS2 HSM Family; confirm with Google which applies)',
    esvStatus: 'in-mip',
    pqcSupport: 'No PQC in FIPS boundary; roadmap disclosed 2026H2',
    platformBinding: 'Marvell LiquidSecurity 2 HSM',
    lastVerified: '2026-04-22',
    posture: 'yellow',
    notes:
      'GCP Cloud HSM uses Marvell LS2 (LiquidSecurity 2) hardware; Marvell\u2019s LS2 certificates are #4703 and #5502, neither listing a PQC algorithm as approved (#5220 is a JISA Softech LS2 certificate). PQC integration pending.',
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
