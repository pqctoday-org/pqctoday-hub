// SPDX-License-Identifier: AGPL-3.0-only
/**
 * HSM vendor FIPS 140-3 Level 3 posture data.
 *
 * NOTE: Firmware bindings and PQC support are illustrative for educational use.
 * CMVP certificate numbers, standards, statuses and approved PQC algorithms were
 * re-checked against the CMVP certificate pages on 2026-09-24; SP 800-90B ESV statuses
 * against the ESV certificate search the same day (an ESV status means the vendor
 * holds an entropy-source certificate for that hardware line). Verify live against
 * csrc.nist.gov/projects/cryptographic-module-validation-program before relying on them.
 */

import { hsmCapabilitySummary } from '@/data/hsmCapabilityXrefData'
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

const HSM_VENDOR_SCENARIOS: Omit<HsmVendorRecord, 'pqcSupport'>[] = [
  {
    id: 'thales-luna-7',
    catalogName: 'Thales Luna HSM',
    vendor: 'Thales',
    product: 'Luna Network HSM 7',
    firmwareRev: '7.13.3',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#4684 (Luna K7 module; firmware 7.8.4 and 7.8.5 only)',
    esvStatus: 'active',
    platformBinding: 'Luna Network appliance; K7 crypto module',
    lastVerified: '2026-09-24',
    posture: 'green',
    notes:
      'Certificate #4684 (Luna K7 module, FIPS 140-3 Level 3, Active) covers firmware 7.8.4 and 7.8.5 only and lists no PQC algorithm; this record’s firmware 7.13.3 is not named on it. ML-KEM and ML-DSA are available from firmware 7.9.0, which that certificate does not cover. The Luna T7 is a different module: its certificate #5450 (29 Jul 2026) does list ML-KEM and ML-DSA as approved, so check which module certificate your appliance and firmware map to. A firmware upgrade needs its own re-validation path.',
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
    platformBinding: 'nShield 5c network appliance / nShield 5s PCIe',
    lastVerified: '2026-09-24',
    posture: 'green',
    notes:
      "Entrust documents SLH-DSA (all twelve FIPS 205 parameter sets) in the nShield PKCS #11 API from Security World v13.9.5; the Thales Luna pages the Hub holds do not mention SLH-DSA. Entrust's PQC Option Pack (LMS) is deployed as CodeSafe machines. CMVP cert #5329 (nShield 5s, FIPS 140-3 Level 3, Active, replacing #4765) lists no PQC mechanism; another nShield 5s entry is on the NIST CMVP Modules In Process (MIP) List (Review, 30 Jul 2026), which is not evidence of the outcome. Verify 5c cert status separately at csrc.nist.gov.",
  },
  {
    id: 'utimaco-cp5',
    catalogName: 'Utimaco uTrust HSM',
    vendor: 'Utimaco',
    product: 'SecurityServer CP5 Se-Series',
    firmwareRev: '6.0.1',
    fipsLevel: 3,
    fipsStatus: 'historical',
    cmvpCertNumber: '#3925 (CryptoServer Se-Series Gen2; FIPS 140-2 L3, historical)',
    esvStatus: 'active',
    platformBinding: 'CP5 Se-Gen2 PCIe',
    lastVerified: '2026-09-24',
    posture: 'yellow',
    notes:
      "No Se-Series entry is on the CMVP Modules-in-Process list (checked 2026-09-24). Utimaco's newer u.trust Anchor holds a FIPS 140-3 L3 certificate (NIST CMVP Certificate #5223, 1 Apr 2026).",
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
    platformBinding: 'QxBMC-1/3/12 chassis (desktop/1U/4U); FPGA-based QASM core',
    lastVerified: '2026-09-24',
    posture: 'green',
    notes: 'CMVP certificate #5497 lists ML-KEM, ML-DSA, SLH-DSA and LMS as approved.',
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
    esvStatus: 'active',
    platformBinding: 'Intel SGX-enabled appliance / cloud tenant',
    lastVerified: '2026-09-24',
    posture: 'yellow',
    notes:
      'Confidential-computing architecture; product rebranded from SDKMS to DSM (not sourced in the Library). CMVP cert #4139 covers the SDKMS Appliance (same hardware); it is a FIPS 140-2 certificate that CMVP moved to the Historical list at sunset (not sourced in the Library). PQC algorithms exposed via the API but not yet inside the CMVP boundary (not sourced in the Library). NIST ESV Certificate E232, with E233 (Fortanix DRNG RDSEED entropy sources, 14 Mar 2025).',
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
    firmwareRev: 'Marvell LS2 firmware (AWS-managed)',
    fipsLevel: 3,
    fipsStatus: 'active',
    cmvpCertNumber: '#4703 (Marvell LS2 HSM Family; FIPS 140-3 L3, per AWS CloudHSM docs)',
    esvStatus: 'active',
    platformBinding: 'hsm2m.medium instance; region-bound',
    lastVerified: '2026-10-15',
    posture: 'yellow',
    notes:
      "AWS's CloudHSM compliance page names certificate #4703 (Marvell LS2 HSM Family) for hsm2m.medium; the older hsm1.medium certificate #4218 (FIPS 140-2) was due to move to the Historical list on 4 Jan 2026. #4703 lists no PQC algorithm as approved. Its Security Policy names the OCTEON HW RBG entropy source without an ESV number; Marvell's later LS2 certificate #5502 cites ESV E231 for that source. ML-DSA is available in FIPS mode on hsm2m.medium from 1 Sep 2026 (AWS CloudHSM documentation) through vendor-defined PKCS#11 mechanisms, but #4703 still lists no PQC algorithm (checked 15 Oct 2026), so it is not inside the validated boundary yet. No ML-KEM.",
  },
  {
    id: 'azure-dedicated-hsm',
    catalogName: 'Azure Dedicated HSM (Thales Luna 7)',
    vendor: 'Microsoft Azure',
    product: 'Azure Dedicated HSM (Luna 7)',
    firmwareRev: '7.0.3',
    fipsLevel: 3,
    fipsStatus: 'historical',
    cmvpCertNumber: null,
    esvStatus: 'active',
    platformBinding: 'Luna 7 appliance (model A790) hosted by Azure',
    lastVerified: '2026-10-29',
    posture: 'green',
    notes:
      "Azure's FAQ names client software 7.2, compatible with FIPS 140-2 Level 3 validated firmware 7.0.3, and lists no PQC algorithm. The CMVP certificate for that firmware was not identified here (#3892, listed previously, is a Red Hat OpenSSH module), and CMVP moved FIPS 140-2 certificates to the Historical list on 21 Sep 2026. Thales documents ML-KEM and ML-DSA from Luna firmware 7.9.0 and LMS-HSS from 7.8.9; Azure says the customer administers the firmware, after consulting Thales Support, and does not say whether the service offers those firmware versions. The Luna 7 K7 and G7 hardware entropy sources hold active ESV certificates E98 and E97 (checked 2026-09-24). Azure Dedicated HSM is retiring: no new customer onboardings, existing customers supported until 31 July 2028 (Azure pages checked 2026-10-29).",
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
    esvStatus: 'active',
    platformBinding: 'Marvell LiquidSecurity 2 HSM',
    lastVerified: '2026-09-24',
    posture: 'yellow',
    notes:
      'GCP Cloud HSM uses Marvell LS2 (LiquidSecurity 2) hardware; Marvell\u2019s LS2 certificates are #4703 and #5502, neither listing a PQC algorithm as approved (#5220 is a JISA Softech LS2 certificate). #5502\u2019s Security Policy cites ESV E231 (Marvell OCTEON TRNG). PQC integration pending.',
  },
]

export const HSM_VENDORS: HsmVendorRecord[] = HSM_VENDOR_SCENARIOS.map((vendor) => ({
  ...vendor,
  pqcSupport: hsmCapabilitySummary(vendor.catalogName),
}))

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
