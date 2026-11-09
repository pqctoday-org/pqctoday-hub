// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library rows the trust-hardware changes of release 4.202 cite, by module. The ids are the
 * reference_id values of the rows admitted for that release. A module declares them in its
 * content.ts through citedStandards(), which skips an id the loaded Library CSV does not contain
 * yet (getStandard would throw at import); trustHardwareCitations.test.ts requires every id to
 * resolve, so a missing row cannot ship unnoticed.
 */
import { findStandard, type StandardRef } from '@/data/standardsRegistry'

export const TRUST_HARDWARE_CITATIONS = {
  'hsm-pqc': [
    'Overview-of-Azure-Cloud-HSM',
    'Frequently-Asked-Questions-FAQ-About-Azure-Cloud-HSM',
    'About-keys-Azure-Key-Vault-Managed-HSM',
    'Azure-Managed-HSM-BYOK',
    'Primus-HSM-CyberVault-X2-models-fact-sheet-Securosys',
    'List-of-Algorithms-and-Functions-for-Firmware-v3-x-Securosys',
    'Securosys-Primus-HSM-CyberVault-PQC-ready',
    'Tessera-Integrated-HSM-Project-Definition-0-5-0',
    'Tessera-Integrated-HSM-Chip-Requirements-Specification-0-5-0',
    'Tessera-Integrated-HSM-DARC-Device-Authentication-Root-Certi',
    'Tessera-Integrated-HSM-SDK-tessera-sw-README',
    'Open-source-Integrated-HSM-for-hardware-security-Microsoft-A',
  ],
  'confidential-computing': ['Confidential-VMs-Explained-An-Empirical-Analysis-of-AMD-SEV'],
  'secure-boot-pqc': [
    'TCG-TPM-V185-Part1',
    'TCG-Hardware-Requirements-for-a-Device-Identifier-Compositio',
    'Hardware-Specification-Caliptra-2-1-Documentation',
    'Caliptra-A-Datacenter-System-on-a-Chip-SoC-Root-of-Trust-RoT',
    'ML-DSA-Documentation-Caliptra-2-1-Documentation-Adams-Bridge',
  ],
  'pqc-hw-acceleration': [
    'Hardware-Specification-Caliptra-2-1-Documentation',
    'Caliptra-versioning',
    'ML-DSA-Documentation-Caliptra-2-1-Documentation-Adams-Bridge',
    'ML-KEM-Documentation-Caliptra-2-1-Documentation-Adams-Bridge',
    'Adam-s-Bridge-Hardware-Specification-Version-3-0',
    'Adams-Bridge-chipsalliance-adams-bridge-README',
    'Adam-s-Bridge-Side-Channel-Protection',
    'tessera-abr-params-pkg-sv-ML-DSA-and-ML-KEM-accelerator-para',
  ],
  'kms-pqc': [
    'Secure-Key-Release-with-Azure-Key-Vault-and-Azure-Confidenti',
    'Using-cryptographic-attestation-with-AWS-KMS-AWS-Nitro-Encla',
  ],
} as const

export type TrustHardwareModuleId = keyof typeof TRUST_HARDWARE_CITATIONS

/** The Library rows of a module's trust-hardware changes that the loaded CSV already contains. */
export function citedStandards(moduleId: TrustHardwareModuleId): StandardRef[] {
  // eslint-disable-next-line security/detect-object-injection -- moduleId is a literal key of the map
  return TRUST_HARDWARE_CITATIONS[moduleId].flatMap((id) => {
    const std = findStandard(id)
    return std ? [std] : []
  })
}
