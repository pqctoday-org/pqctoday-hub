// SPDX-License-Identifier: GPL-3.0-only

import type { PQCMigrationStatus } from './secureBootConstants'

export type VendorTier = 'enterprise' | 'smb' | 'open-source'

export interface FirmwareVendorStatus {
  id: string
  vendor: string
  product: string
  tier: VendorTier
  category: string
  currentAlgorithm: string
  pqcStatus: PQCMigrationStatus
  roadmapYear: string
  products: string[]
  pqcAlgorithm: string
  migrationGuidance: string
  notes: string
  certifications: string[]
}

export const VENDOR_STATUS_LABELS: Record<
  PQCMigrationStatus,
  { label: string; className: string }
> = {
  available: {
    label: 'Available',
    className: 'bg-status-success/10 text-status-success border-status-success/30',
  },
  merged: {
    label: 'Merged / GA',
    className: 'bg-status-success/10 text-status-success border-status-success/30',
  },
  roadmap: {
    label: 'Roadmap',
    className: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  },
  evaluation: {
    label: 'Evaluation',
    className: 'bg-status-info/10 text-status-info border-status-info/30',
  },
  'not-started': {
    label: 'Not Started',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

export const FIRMWARE_VENDORS: FirmwareVendorStatus[] = [
  {
    id: 'ami',
    vendor: 'AMI',
    product: 'APTIO V UEFI Firmware',
    tier: 'enterprise',
    category: 'UEFI Firmware',
    currentAlgorithm: 'RSA-2048 (firmware signing), RSA-4096 (PK)',
    pqcStatus: 'roadmap',
    roadmapYear: '2026',
    products: ['APTIO V (Intel)', 'APTIO V (AMD)', 'APTIO OpenEdition'],
    pqcAlgorithm: 'ML-DSA-65 (firmware signing), ML-DSA-87 (PK)',
    migrationGuidance:
      'AMI has announced ML-DSA-65 support in APTIO V for Xeon Scalable 5th/6th Gen and EPYC Genoa/Turin platforms. Customers must upgrade firmware to APTIO V 5.35+ and re-enroll PK/KEK/db with ML-DSA certificates. AMI provides a BIOS Signing Upgrade Kit with migration utilities.',
    notes:
      'APTIO V is the most widely deployed UEFI firmware in enterprise servers. ML-DSA support targets H1 2026. Hybrid (RSA + ML-DSA) dual-signature mode available for transition. CNSA 2.0 compliance certification expected Q3 2026.',
    certifications: ['FIPS 140-3 (target Q3 2026)', 'CNSA 2.0'],
  },
  {
    id: 'insyde',
    vendor: 'Insyde Software',
    product: 'InsydeH2O UEFI Firmware',
    tier: 'enterprise',
    category: 'UEFI Firmware',
    currentAlgorithm: 'RSA-2048 (standard), RSA-4096 (secure configurations)',
    pqcStatus: 'evaluation',
    roadmapYear: '2027',
    products: ['InsydeH2O (x86)', 'InsydeH2O for ARM', 'Kernel Abstraction Layer'],
    pqcAlgorithm: 'ML-DSA-65 (planned, UEFI specification compliance track)',
    migrationGuidance:
      'Insyde is tracking UEFI Forum PQC specification work. ML-DSA support will be added to InsydeH2O once UEFI Forum finalizes the Secure Boot key management specification for PQC. OEM customers should contact Insyde for roadmap access and early evaluation builds.',
    notes:
      'InsydeH2O powers many commercial laptops (HP, Lenovo consumer, Acer) and embedded systems. Insyde participates in UEFI Forum Technical Advisory Board PQC subcommittee. Timeline depends on UEFI Forum spec finalization (estimated 2026).',
    certifications: ['FIPS 140-2 (selected configurations)'],
  },
  {
    id: 'phoenix',
    vendor: 'Phoenix Technologies',
    product: 'SecureCore Technology UEFI',
    tier: 'smb',
    category: 'UEFI Firmware',
    currentAlgorithm: 'RSA-2048',
    pqcStatus: 'not-started',
    roadmapYear: 'TBD',
    products: ['SecureCore Tiano', 'SecureCore (ARM)', 'BIOS Guard'],
    pqcAlgorithm: 'Evaluating NIST PQC finalists; no committed algorithm',
    migrationGuidance:
      'Phoenix has not announced a PQC migration timeline. Organizations using Phoenix SecureCore in production should engage their ODM/OEM vendor for firmware upgrade paths and consider whether platform replacement is more cost-effective than waiting for Phoenix PQC support.',
    notes:
      'Phoenix SecureCore is common in commercial/SMB laptops. Lack of committed timeline is a concern for CNSA 2.0-bound organizations. Monitor UEFI Forum announcements for Phoenix participation in PQC working groups.',
    certifications: [],
  },
  {
    id: 'tianocore',
    vendor: 'TianoCore',
    product: 'EDK2 (EFI Development Kit II)',
    tier: 'open-source',
    category: 'Open-Source UEFI',
    currentAlgorithm: 'RSA-2048 (default), RSA-4096 (configurable)',
    pqcStatus: 'merged',
    roadmapYear: '2026 (Q1 merged)',
    products: ['EDK2 open-source', 'OVMF (QEMU/KVM)', 'CorebootPayload'],
    pqcAlgorithm: 'ML-DSA-65 (MdeModulePkg, merged Q1 2026)',
    migrationGuidance:
      'ML-DSA-65 support is merged into EDK2 main branch as of Q1 2026. Use CryptoPkg PQC library or OpenSSL provider. Enable via CryptoPkg configuration (PCD names may vary by EDK2 branch). Key enrollment via efi-updatevar tool with ML-DSA cert in EFI_SIGNATURE_LIST format.',
    notes:
      'EDK2 is the reference UEFI implementation and foundation for most vendor BIOS products. PQC ML-DSA support landed through the EDK2 Crypto community call and is available in stable-202502 branch. OVMF (QEMU) PQC testing available immediately for lab validation.',
    certifications: ['NIST CAVP (via OpenSSL 3.x provider)', 'Open Source (no FIPS)'],
  },
  {
    id: 'dell',
    vendor: 'Dell Technologies',
    product: 'Dell UEFI (PowerEdge / Precision)',
    tier: 'enterprise',
    category: 'OEM UEFI',
    currentAlgorithm: 'RSA-2048 (standard), RSA-4096 (CNSA-compliant configs)',
    pqcStatus: 'roadmap',
    roadmapYear: '2026',
    products: ['PowerEdge R650/R750/R760', 'Precision 7xxx', 'OptiPlex (enterprise)'],
    pqcAlgorithm: 'ML-DSA-65 firmware signing; CNSA 2.0 PK migration',
    migrationGuidance:
      "Dell's CNSA 2.0 roadmap targets PowerEdge server platforms for ML-DSA-65 firmware signing in 2026. Use Dell iDRAC 9 firmware update API with PQC signing certificates. Dell Server Update Utility (SUU) will validate ML-DSA signatures from Dell Cybersecurity firmware package.",
    notes:
      "Dell iDRAC 9 (firmware signing) targets CNSA 2.0 compliance ahead of US Federal procurement requirements. iDRAC 10 (Spire chipset, PowerEdge Gen17) has PQC-native attestation. Dell's Product Security Office published a PQC posture statement in November 2024.",
    certifications: ['FIPS 140-2 Level 1 (iDRAC)', 'CNSA 2.0 (target 2026)', 'CC EAL2'],
  },
  {
    id: 'hpe',
    vendor: 'HPE',
    product: 'HPE iLO 6 (ProLiant / Synergy)',
    tier: 'enterprise',
    category: 'OEM UEFI / BMC',
    currentAlgorithm: 'RSA-2048 (firmware signing), ECDSA P-384 (iLO TLS)',
    pqcStatus: 'available',
    roadmapYear: '2025 (iLO 6.20+)',
    products: ['ProLiant DL360 Gen11', 'ProLiant DL380 Gen11', 'Synergy 480 Gen11'],
    pqcAlgorithm: 'ML-DSA-65 firmware signing in iLO 6.20+',
    migrationGuidance:
      'Upgrade iLO 6 firmware to version 6.20 or later to enable ML-DSA firmware signing. Use HPE Integrated Smart Update Manager (iSUM) 5.0+ for PQC-signed firmware packages. HPE Security Protocol and Data Model (SPDM) 1.3 adds ML-DSA device attestation in iLO 6.30.',
    notes:
      'HPE is the first major OEM to GA ML-DSA firmware signing for production servers (iLO 6.20, released Q4 2025). HPE Silicon Root of Trust (iLO Amplifier) supports PQC-signed firmware chains. SPDM 1.3 + ML-DSA attestation available in 6.30 for confidential computing deployments.',
    certifications: ['FIPS 140-3 Level 1 (iLO 6)', 'CNSA 2.0 (iLO 6.20+)', 'CC EAL2'],
  },
  {
    id: 'lenovo',
    vendor: 'Lenovo',
    product: 'Lenovo BIOS (ThinkSystem / ThinkStation)',
    tier: 'enterprise',
    category: 'OEM UEFI',
    currentAlgorithm: 'RSA-2048 (BIOS signing), RSA-4096 (ThinkShield key hierarchy)',
    pqcStatus: 'roadmap',
    roadmapYear: '2026 Q3',
    products: ['ThinkSystem SR650 V3', 'ThinkSystem SR850 V3', 'ThinkStation P Series'],
    pqcAlgorithm: 'ML-DSA-65 (ThinkShield PQC Firmware Signing)',
    migrationGuidance:
      'Lenovo ThinkShield PQC migration roadmap targets Q3 2026 for ThinkSystem servers. Lenovo will provide a ThinkShield Migration Toolkit including ML-DSA certificate enrollment scripts, BIOS update packages with PQC signatures, and XClarity integrator for automated deployment.',
    notes:
      "Lenovo's ThinkShield security architecture extends to firmware signing. ThinkSystem V3 servers ship with hardware root of trust that will be PQC-extended in firmware update. ThinkPad consumer laptops are on a separate, later timeline (2027+).",
    certifications: ['FIPS 140-3 (XClarity)', 'CNSA 2.0 (target Q3 2026)'],
  },
  {
    id: 'intel',
    vendor: 'Intel',
    product: 'Intel Boot Guard (TXT / ACM)',
    tier: 'enterprise',
    category: 'Hardware Root of Trust',
    currentAlgorithm: 'RSA-2048 (Boot Guard ACM signing), RSA-3072 (Key Manifest)',
    pqcStatus: 'roadmap',
    roadmapYear: '2026 (Granite Rapids+)',
    products: ['Xeon Scalable 5th Gen (Emerald Rapids)', 'Xeon Scalable 6th Gen (Granite Rapids)'],
    pqcAlgorithm: 'ML-DSA-65 in Boot Guard ACM (Granite Rapids+)',
    migrationGuidance:
      'Intel Boot Guard PQC support requires new silicon. Existing Emerald Rapids systems cannot be field-upgraded to ML-DSA Boot Guard — this is a hardware feature baked into the ACM in flash. Plan platform refresh to Granite Rapids (Xeon 6) for PQC Boot Guard. Intel Platform Trust Technology (PTT) firmware TPM is on a parallel PQC roadmap.',
    notes:
      'Boot Guard locks the initial BIOS measurement against a Key Manifest fused into the processor at manufacture. PQC migration requires new CPU silicon AND new firmware ACM. This is the longest lead-time item in a server PQC migration. Intel confirmed Granite Rapids (2026) will include PQC Boot Guard via Intel Platform Innovation Framework.',
    certifications: ['FIPS 140-3 (ACM, target 2026)', 'Intel PTT FIPS 140-2 Level 2'],
  },
]
