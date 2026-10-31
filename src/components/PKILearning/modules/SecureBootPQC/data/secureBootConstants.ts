// SPDX-License-Identifier: AGPL-3.0-only

export type UEFIKeyType = 'PK' | 'KEK' | 'db' | 'dbx' | 'MOK'
export type FirmwareVendor = 'AMI' | 'Insyde' | 'Tianocore' | 'Dell' | 'HPE' | 'Intel'
export type TPMVersion = '1.2' | '2.0'
export type AttestationType = 'measured-boot' | 'tpm-quote' | 'dice' | 'fido-onboard' | 'remote-tls'
export type SecureBootState = 'disabled' | 'setup' | 'enabled' | 'deployed'
export type PQCMigrationStatus = 'available' | 'announced' | 'in-progress'

export interface UEFIKeyTypeInfo {
  id: UEFIKeyType
  name: string
  fullName: string
  description: string
  currentAlgorithm: string
  typicalSize: string
  pqcAlgorithm: string
  /** Algorithm for National Security Systems per the NSA CNSA 2.0 FAQ v2.2 (algorithm table p.7-8; LMS/XMSS only, no HSS/XMSS^MT, p.11). */
  cnsaAlgorithm: string
  pqcSize: string
  quantumVulnerable: boolean
  owner: string
  migrationPriority: 'critical' | 'high' | 'medium' | 'low'
}

export interface TPMPCREntry {
  index: number
  name: string
  description: string
  measuredBy: string
  pqcRelevance: string
}

/**
 * forgeryUrgency is the module's migration-priority rubric for a signature or
 * attestation key. A signature protects no secret, so it is not a
 * harvest-now-decrypt-later exposure: the risk is forgery once a CRQC exists,
 * and the urgency follows how long the device and its trust anchors stay in
 * the field (NSA CNSA 2.0 FAQ v2.2 p.13: firmware-signing algorithms are
 * "frequently locked in for the life of a system").
 */
export interface BootChainStage {
  id: string
  name: string
  order: number
  description: string
  signingKey: string
  currentAlgorithm: string
  pqcStatus: string
  forgeryUrgency: 'critical' | 'high' | 'medium' | 'low' | 'none'
}

export interface AttestationTypeInfo {
  id: AttestationType
  name: string
  description: string
  currentCrypto: string
  forgeryUrgency: 'critical' | 'high' | 'medium' | 'low'
  pqcMigrationPath: string
  tpmNative: boolean
  standardsBody: string
}

export interface AlgorithmSizeRecord {
  algorithm: string
  type: 'classical' | 'pqc'
  publicKeyBytes: number
  privateKeyBytes: number
  signatureBytes: number
  /** PQC rows: the NIST security category (FIPS 204 / 205). Classical rows: the comparable security
   *  strength in bits (SP 800-57 Part 1 Rev. 5 Table 2), which is a different measure. */
  nistLevel: string
  quantumSafe: boolean
}

// ── UEFI Key Types ────────────────────────────────────────────────────────────

export const UEFI_KEY_TYPES: UEFIKeyTypeInfo[] = [
  {
    id: 'PK',
    name: 'PK',
    fullName: 'Platform Key',
    description:
      'Root of trust for UEFI Secure Boot. Owned by the platform manufacturer (OEM). Controls the key exchange keys (KEKs). Only one PK may be enrolled. Compromise of the PK invalidates the entire Secure Boot chain.',
    currentAlgorithm: 'RSA-2048 or RSA-4096',
    typicalSize: '256–512 bytes public key',
    pqcAlgorithm: 'ML-DSA-65 (FIPS 204)',
    cnsaAlgorithm: 'ML-DSA-87; LMS or XMSS (SP 800-208) where the key signs firmware or software',
    pqcSize: '1,952 bytes public key, 3,309 bytes signature',
    quantumVulnerable: true,
    owner: 'OEM / Platform Manufacturer',
    migrationPriority: 'critical',
  },
  {
    id: 'KEK',
    name: 'KEK',
    fullName: 'Key Exchange Key',
    description:
      'Authorized to update the Signature Database (db) and Forbidden Signatures Database (dbx). Typically owned by the OS vendor and OEM. Multiple KEKs may be enrolled. Compromise allows unauthorized db updates.',
    currentAlgorithm: 'RSA-2048',
    typicalSize: '256 bytes public key',
    pqcAlgorithm: 'ML-DSA-65 (FIPS 204)',
    cnsaAlgorithm: 'ML-DSA-87; LMS or XMSS (SP 800-208) where the key signs firmware or software',
    pqcSize: '1,952 bytes public key, 3,309 bytes signature',
    quantumVulnerable: true,
    owner: 'OS Vendor / OEM',
    migrationPriority: 'critical',
  },
  {
    id: 'db',
    name: 'db',
    fullName: 'Authorized Signature Database',
    description:
      'Contains allowed signatures, certificate hashes, and image hashes. UEFI firmware checks bootloaders and drivers against db before executing. Larger with PQC certificates due to ML-DSA certificate size (a minimal self-signed ML-DSA-65 certificate is about 5.5 KB vs about 0.8 KB for RSA-2048, measured with OpenSSL 3.6.3).',
    currentAlgorithm: 'RSA-2048 certificates',
    typicalSize: '0.8 KB per minimal certificate (809 bytes, measured)',
    pqcAlgorithm: 'ML-DSA-65 X.509 certificates',
    cnsaAlgorithm:
      'ML-DSA-87 certificates; LMS or XMSS (SP 800-208) for firmware or software signatures',

    pqcSize: '5.5 KB per minimal certificate (5,538 bytes, measured)',
    quantumVulnerable: true,
    owner: 'OS Vendor / Software Publisher',
    migrationPriority: 'high',
  },
  {
    id: 'dbx',
    name: 'dbx',
    fullName: 'Forbidden Signatures Database',
    description:
      'Contains revoked hashes of known-bad binaries and compromised certificates. Must be updated when vulnerabilities (e.g., BootHole, GRUB2 CVEs) are discovered. Critical for supply chain integrity.',
    currentAlgorithm: 'SHA-256 hashes',
    typicalSize: 'Variable (grows over time)',
    pqcAlgorithm: 'SHA-256 hashes (unchanged for revocation)',
    cnsaAlgorithm: 'SHA-384 or SHA-512 (CNSA 2.0 hash algorithms)',

    pqcSize: 'Unchanged (hashes are quantum-safe at 256-bit)',
    quantumVulnerable: false,
    owner: 'UEFI Forum / OEM / OS Vendor',
    migrationPriority: 'low',
  },
  {
    id: 'MOK',
    name: 'MOK',
    fullName: 'Machine Owner Key',
    description:
      'User-managed Secure Boot extension maintained by shim (RHEL/Ubuntu). Allows enrollment of custom signing keys without modifying db. MOKManager runs before the OS. Used for kernel modules, custom bootloaders.',
    currentAlgorithm: 'RSA-2048 or RSA-4096',
    typicalSize: '256–512 bytes',
    pqcAlgorithm: 'ML-DSA-65 (when shim supports FIPS 204)',
    cnsaAlgorithm: 'ML-DSA-87 (when shim supports FIPS 204)',

    pqcSize: '1,952 bytes public key',
    quantumVulnerable: true,
    owner: 'Machine Owner / Admin',
    migrationPriority: 'medium',
  },
]

// ── TPM PCR Banks ─────────────────────────────────────────────────────────────

export const TPM_PCR_BANKS: TPMPCREntry[] = [
  {
    index: 0,
    name: 'PCR[0]',
    description: 'Core System Firmware executable code (BIOS/UEFI code)',
    measuredBy: 'Firmware (pre-OS)',
    pqcRelevance: 'Captures UEFI firmware integrity; changes when PQC firmware is flashed',
  },
  {
    index: 1,
    name: 'PCR[1]',
    description: 'Core System Firmware data (BIOS/UEFI configuration)',
    measuredBy: 'Firmware (pre-OS)',
    pqcRelevance: 'UEFI Secure Boot variable changes (db/KEK/PK updates) extend this PCR',
  },
  {
    index: 2,
    name: 'PCR[2]',
    description: 'Extended or plugin firmware code (Option ROMs)',
    measuredBy: 'Firmware (pre-OS)',
    pqcRelevance: 'PCI device firmware with PQC signing will affect this measurement',
  },
  {
    index: 3,
    name: 'PCR[3]',
    description: 'Extended or plugin firmware data',
    measuredBy: 'Firmware (pre-OS)',
    pqcRelevance: 'Option ROM configuration data',
  },
  {
    index: 4,
    name: 'PCR[4]',
    description: 'IPL code (bootloader) including address of code, e.g., MBR, EFI load option',
    measuredBy: 'Firmware (pre-OS)',
    pqcRelevance:
      'Bootloader (GRUB2, systemd-boot) measurement; changes when bootloader is re-signed with ML-DSA',
  },
  {
    index: 5,
    name: 'PCR[5]',
    description: 'IPL code data (bootloader configuration)',
    measuredBy: 'Firmware (pre-OS)',
    pqcRelevance: 'Bootloader config files; may change during PQC migration',
  },
  {
    index: 7,
    name: 'PCR[7]',
    description: 'Secure Boot state: variables, policy, and authority',
    measuredBy: 'Firmware (pre-OS)',
    pqcRelevance:
      'CRITICAL: All Secure Boot key changes (PK/KEK/db enrollment) extend PCR[7]. Migrating to ML-DSA will change this PCR — BitLocker and disk encryption must re-seal against new PCR[7] value.',
  },
  {
    index: 8,
    name: 'PCR[8]',
    description: 'Commands and scripts passed to the bootloader',
    measuredBy: 'Bootloader (OS pre-boot)',
    pqcRelevance: 'GRUB2 command lines; used in remote attestation policies',
  },
  {
    index: 9,
    name: 'PCR[9]',
    description: 'Files loaded by the bootloader (kernel image, initrd)',
    measuredBy: 'Bootloader (OS pre-boot)',
    pqcRelevance: 'Kernel image hash; changes when PQC-signed kernel is loaded',
  },
  {
    index: 11,
    name: 'PCR[11]',
    description: 'BitLocker boot-time access control (Windows) / systemd-boot (Linux) measurements',
    measuredBy: 'OS Boot Manager',
    pqcRelevance: 'Used by BitLocker sealing; critical to re-seal after PK/KEK/db migration',
  },
  {
    index: 14,
    name: 'PCR[14]',
    description: 'MOK certificates and MOK state (shim)',
    measuredBy: 'shim + MOKManager',
    pqcRelevance:
      'MOK list changes when ML-DSA MOK keys are enrolled; affects Linux remote attestation',
  },
  {
    index: 15,
    name: 'PCR[15]',
    description: 'User-defined / application-specific measurements (Linux IMA/EVM)',
    measuredBy: 'OS / Applications',
    pqcRelevance:
      'IMA (Integrity Measurement Architecture) records; supports PQC algorithm agility through policy',
  },
]

// ── Boot Chain Stages ─────────────────────────────────────────────────────────

export const BOOT_CHAIN_STAGES: BootChainStage[] = [
  {
    id: 'uefi-firmware',
    name: 'UEFI Firmware',
    order: 0,
    description:
      'The UEFI firmware itself (AMI APTIO, Insyde H2O, etc.) is the first code to run after power-on. It must be signed by the OEM private key and verified by Intel Boot Guard or AMD Platform Security Processor before UEFI Secure Boot validation begins.',
    signingKey: 'OEM Code Signing Key (stored in Boot Guard ACM / PSP)',
    currentAlgorithm: 'RSA-2048 with SHA-256',
    pqcStatus:
      'Vendor statements differ: see the Firmware Vendor Matrix (Intel Boot Guard, AMI, Insyde)',
    forgeryUrgency: 'critical',
  },
  {
    id: 'uefi-db-check',
    name: 'UEFI Secure Boot Validation',
    order: 1,
    description:
      'UEFI checks the bootloader signature against the Authorized Signature Database (db). The trust chain: PK authorizes KEK, KEK authorizes db updates, db contains bootloader certificate. This is the primary PQC migration surface.',
    signingKey: 'Bootloader Code Signing Certificate (in db)',
    currentAlgorithm: 'RSA-2048 or RSA-4096 EFI signature list',
    pqcStatus: 'Requires PK/KEK/db migration to ML-DSA-65 and UEFI spec update',
    forgeryUrgency: 'critical',
  },
  {
    id: 'bootloader',
    name: 'Bootloader (GRUB2 / systemd-boot / shim)',
    order: 2,
    description:
      'The bootloader is loaded and executed after UEFI signature verification. Shim (on RHEL/Ubuntu) is signed by Microsoft KEK. GRUB2 or systemd-boot is then signature-checked by shim. Each layer must independently verify PQC signatures.',
    signingKey: 'Microsoft UEFI CA (for shim) / Distro signing key (for GRUB2)',
    currentAlgorithm: 'RSA-2048 (shim) + ECDSA P-384 (GRUB2 signing)',
    pqcStatus: 'GRUB2 PQC support planned; shim PQC requires Microsoft KEK migration',
    forgeryUrgency: 'high',
  },
  {
    id: 'os-kernel',
    name: 'OS Kernel',
    order: 3,
    description:
      'The OS kernel image is verified by the bootloader before execution. Linux uses IMA (Integrity Measurement Architecture) for runtime file integrity. Windows uses Code Integrity (CI.dll). Both must support ML-DSA verification for PQC-signed kernels.',
    signingKey: 'Kernel Build Signing Key (stored in distro HSM)',
    currentAlgorithm: 'RSA-4096 (Linux kernel signing)',
    pqcStatus:
      'ML-DSA kernel module signing is in mainline Linux from 7.0 (X.509 and PKCS#7); IMA/EVM ML-DSA signature verification from 7.2.',
    forgeryUrgency: 'high',
  },
  {
    id: 'drivers',
    name: 'Kernel Modules & Drivers',
    order: 4,
    description:
      'Kernel modules (device drivers, security modules) must be signed to load on systems with Secure Boot enabled. On Linux, module signing uses the same key as kernel signing. On Windows, WHQL certification is required for cross-signed drivers.',
    signingKey: 'Module Signing Key (same as kernel signing key)',
    currentAlgorithm: 'RSA-2048 or RSA-4096',
    pqcStatus: 'Dependent on kernel signing migration; follows OS kernel timeline',
    forgeryUrgency: 'medium',
  },
]

// ── Attestation Types ─────────────────────────────────────────────────────────

export const ATTESTATION_TYPES: AttestationTypeInfo[] = [
  {
    id: 'measured-boot',
    name: 'Measured Boot',
    description:
      'TPM PCR banks record measurements of each boot stage. Values are deterministic for identical configurations. No signature operations during boot — measurements are SHA-256 extends into PCRs.',
    currentCrypto: 'SHA-256 hash extends (no signatures in measurement itself)',
    forgeryUrgency: 'low',
    pqcMigrationPath:
      'PCR hash operations (SHA-256/SHA-384) are quantum-safe. Migration needed only for TPM Quote signatures used during attestation verification.',
    tpmNative: true,
    standardsBody: 'TCG (Trusted Computing Group)',
  },
  {
    id: 'tpm-quote',
    name: 'TPM Quote',
    description:
      'TPM uses an Attestation Identity Key (AIK) to sign a snapshot of selected PCR values plus a nonce. The relying party verifies the AIK certificate chain and the PCR values match expected golden values.',
    currentCrypto: 'RSA-2048 or ECDSA P-256 (AIK signing key)',
    forgeryUrgency: 'high',
    pqcMigrationPath:
      'TPM 2.0 Library v185 (TCG, March 2026) adds ML-DSA, and TCG names it for Attestation Keys, so a TPM that implements v185 can sign quotes with ML-DSA. A TPM built to an earlier library version needs the hybrid approach: TPM RSA quote + software ML-DSA binding. Product availability depends on the TPM vendor.',
    tpmNative: true,
    standardsBody: 'TCG (Trusted Computing Group)',
  },
  {
    id: 'dice',
    name: 'DICE (Device Identity Composition Engine)',
    description:
      "Layered identity derived from immutable hardware secrets. Each software layer derives its identity from the previous layer's measurement. Used in IoT and constrained devices as a TPM alternative.",
    currentCrypto: 'ECDSA P-256 or Ed25519 (layer-derived keys)',
    forgeryUrgency: 'high',
    pqcMigrationPath:
      '',
    tpmNative: false,
    standardsBody: 'TCG DICE Working Group / IETF RATS',
  },
  {
    id: 'fido-onboard',
    name: 'FIDO Device Onboard (FDO)',
    description:
      'Automated device onboarding protocol using device attestation certificates. Device proves identity to rendezvous server during first boot. OEM transfers ownership securely. Used in cloud and edge deployments.',
    currentCrypto: 'RSA-2048 or ECDSA P-384 (device attestation cert)',
    forgeryUrgency: 'high',
    pqcMigrationPath:
      'FIDO Alliance FDO specification (planned PQC update) adds ML-DSA support for device attestation certificates. OEM supply chain must issue PQC device attestation certs at manufacture time.',
    tpmNative: false,
    standardsBody: 'FIDO Alliance',
  },
  {
    id: 'remote-tls',
    name: 'Remote Attestation via TLS',
    description:
      'Device presents attestation evidence (TPM quote, DICE certificate chain) embedded in a TLS connection. Relying party validates via RA-TLS (RFC-track) or custom attestation extension. Common in confidential computing.',
    currentCrypto: 'TLS 1.3 (ECDH + ECDSA) + embedded attestation signature',
    forgeryUrgency: 'critical',
    pqcMigrationPath:
      'TLS layer: migrate to ML-KEM-768 + ML-DSA-65 hybrid (existing TLS 1.3 PQC migration path). Attestation layer: replace embedded RSA/ECDSA signatures with ML-DSA-65. The TLS key exchange is exposed to harvest-now-decrypt-later (a recorded session can be decrypted later), so migrate it first. The embedded attestation signatures are a forgery risk once a CRQC exists, so their urgency follows how long the device and its trust anchors stay in service.',
    tpmNative: false,
    standardsBody: 'IETF RATS WG / Confidential Computing Consortium',
  },
]

// ── Algorithm Size Reference ──────────────────────────────────────────────────

export const FIRMWARE_ALGO_SIZES: AlgorithmSizeRecord[] = [
  {
    algorithm: 'RSA-2048',
    type: 'classical',
    publicKeyBytes: 256,
    privateKeyBytes: 1192,
    signatureBytes: 256,
    nistLevel: '112-bit (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'RSA-4096',
    type: 'classical',
    publicKeyBytes: 512,
    privateKeyBytes: 2350,
    signatureBytes: 512,
    nistLevel: '128–192-bit (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'ECDSA P-256',
    type: 'classical',
    publicKeyBytes: 65,
    privateKeyBytes: 32,
    signatureBytes: 72,
    nistLevel: '128-bit (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'ECDSA P-384',
    type: 'classical',
    publicKeyBytes: 97,
    privateKeyBytes: 48,
    signatureBytes: 104,
    nistLevel: '192-bit (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'ML-DSA-44',
    type: 'pqc',
    publicKeyBytes: 1312,
    privateKeyBytes: 2560,
    signatureBytes: 2420,
    nistLevel: 'NIST Level 2',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-DSA-65',
    type: 'pqc',
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    signatureBytes: 3309,
    nistLevel: 'NIST Level 3',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-DSA-87',
    type: 'pqc',
    publicKeyBytes: 2592,
    privateKeyBytes: 4896,
    signatureBytes: 4627,
    nistLevel: 'NIST Level 5',
    quantumSafe: true,
  },
  {
    algorithm: 'SLH-DSA-SHA2-128s',
    type: 'pqc',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureBytes: 7856,
    nistLevel: 'NIST Level 1',
    quantumSafe: true,
  },
]
