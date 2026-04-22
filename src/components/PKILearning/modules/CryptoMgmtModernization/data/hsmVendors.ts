// SPDX-License-Identifier: GPL-3.0-only
/**
 * HSM vendor FIPS 140-3 Level 3 posture data.
 *
 * NOTE: Cert numbers, firmware bindings, and PQC support are illustrative
 * for educational use. Verify live against csrc.nist.gov/projects/
 * cryptographic-module-validation-program and the vendor's official pages.
 */

import type { EsvStatus, FipsStatus, RiskColor } from './cryptoLibraries'

export interface HsmVendorRecord {
  id: string
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
    id: 'fortanix-dsm',
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
