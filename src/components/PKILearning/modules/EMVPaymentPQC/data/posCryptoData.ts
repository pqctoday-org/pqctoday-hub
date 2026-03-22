// SPDX-License-Identifier: GPL-3.0-only
import type { POSTerminalProfile, KeyInjectionCeremony } from './emvConstants'

export const POS_TERMINAL_PROFILES: POSTerminalProfile[] = [
  {
    id: 'traditional-pos',
    name: 'Traditional Countertop POS',
    type: 'traditional-pos',
    processorClass: 'ARM Cortex-A7 / A35',
    ramKB: 512,
    flashKB: 4096,
    tamperResistant: true,
    keySchemes: ['dukpt-3des', 'dukpt-aes', 'mk-sk', 'rsa-key-transport'],
    cryptoChips: ['NXP JCOP4', 'Infineon SLE78', 'Microchip ATECC608B'],
    quantumVulnerabilities: [
      'RSA-2048 key transport at Key Injection Facility',
      'TLS RSA/ECDSA key exchange with acquirer',
      'EMV offline authentication (RSA certificate chain verification)',
    ],
    pqcConstraints: [
      'Sufficient RAM (512 KB) for ML-KEM-768 and ML-DSA-44',
      'Firmware update via TLS required for PQC support',
      'Tamper-resistant secure element may need hardware refresh for PQC',
    ],
  },
  {
    id: 'mpos',
    name: 'Mobile POS (mPOS)',
    type: 'mpos',
    processorClass: 'ARM Cortex-M4 / M33',
    ramKB: 128,
    flashKB: 1024,
    tamperResistant: true,
    keySchemes: ['dukpt-3des', 'dukpt-aes'],
    cryptoChips: ['NXP SE050', 'Infineon OPTIGA Trust M'],
    quantumVulnerabilities: [
      'RSA key transport at Key Injection Facility',
      'Bluetooth/BLE pairing with smartphone (ECDH)',
      'TLS to payment processor via phone tethering',
    ],
    pqcConstraints: [
      '128 KB RAM is tight for ML-KEM-768 (needs ~50 KB working memory)',
      'ML-DSA-44 signature verification feasible but slow (~500ms)',
      'FN-DSA-512 produces smaller signatures (~690 bytes vs ~2,420 for ML-DSA-44), reducing memory requirements on constrained devices',
      'Battery-powered: PQC computation cost affects battery life',
    ],
  },
  {
    id: 'softpos',
    name: 'SoftPOS (Tap-on-Phone)',
    type: 'softpos',
    processorClass: 'Smartphone SoC (Snapdragon / Exynos / A-series)',
    ramKB: 4_194_304,
    flashKB: 67_108_864,
    tamperResistant: false,
    keySchemes: ['dukpt-aes'],
    cryptoChips: ['Smartphone TEE (TrustZone)', 'Optional hardware SE'],
    quantumVulnerabilities: [
      'Software-based key storage (no hardware tamper resistance)',
      'TLS key exchange with payment processor',
      'Device attestation (ECDSA Play Integrity / App Attest)',
    ],
    pqcConstraints: [
      'Abundant resources \u2014 no memory or compute constraints for PQC',
      'Software-only model enables fastest PQC migration via app update',
      'Key challenge is secure key storage without hardware SE',
      'TEE attestation must migrate to PQC for platform trust',
    ],
  },
  {
    id: 'atm',
    name: 'ATM (Automated Teller Machine)',
    type: 'atm',
    processorClass: 'x86 (Intel Atom / Celeron)',
    ramKB: 2_097_152,
    flashKB: 16_777_216,
    tamperResistant: true,
    keySchemes: ['dukpt-3des', 'dukpt-aes', 'mk-sk', 'rsa-key-transport'],
    cryptoChips: ['Integrated ATM HSM (e.g., Diebold Nixdorf)', 'EPP (Encrypting PIN Pad)'],
    quantumVulnerabilities: [
      'RSA-2048 key transport for PIN encryption keys',
      'TLS to host/switch (RSA/ECDSA key exchange)',
      'Remote key loading (RSA key transport)',
      'PIN block encryption (3DES \u2014 Grover reduces to 56-bit effective)',
    ],
    pqcConstraints: [
      'Abundant compute/memory for all PQC algorithms',
      'Deployed for 7-12 year physical terminal replacement cycle — replacement is slow',
      'EPP hardware may need physical replacement for PQC PIN encryption',
      'Remote key management migration requires coordinated HSM + ATM update',
    ],
  },
  {
    id: 'unattended',
    name: 'Unattended Terminal (Vending, Parking, Transit)',
    type: 'unattended',
    processorClass: 'ARM Cortex-M4 / M7',
    ramKB: 256,
    flashKB: 2048,
    tamperResistant: true,
    keySchemes: ['dukpt-3des', 'dukpt-aes'],
    cryptoChips: ['NXP PN7160 (NFC)', 'Microchip ATECC608B'],
    quantumVulnerabilities: [
      'RSA key transport at initial deployment',
      'Cellular/WiFi TLS to payment processor',
      'Contactless card offline authentication (RSA)',
    ],
    pqcConstraints: [
      '256 KB RAM supports FN-DSA-512 but tight for ML-KEM-768',
      'Often in remote locations \u2014 firmware updates are complex',
      'Long deployment lifecycle with 7-12 year physical terminal replacement cycle',
      'Network connectivity may be intermittent \u2014 offline operation critical',
    ],
  },
]

export const KEY_INJECTION_CEREMONY: KeyInjectionCeremony = {
  id: 'standard-kif',
  name: 'Standard Key Injection Facility (KIF) Ceremony',
  description:
    'A secure, audited process where cryptographic keys are loaded into payment terminals. The KIF is a physically secured room with dual-control, split-knowledge procedures. This is the primary quantum-vulnerable point in the DUKPT key management chain.',
  steps: [
    {
      order: 1,
      label: 'BDK Generation in Payment HSM',
      description:
        'The Base Derivation Key (BDK) is generated inside a FIPS 140-3 Level 3 validated payment HSM. The BDK never leaves the HSM in cleartext. Dual custody is required (two key custodians each contribute key components).',
      cryptoUsed: 'AES-256 key generation (HSM internal)',
      quantumVulnerable: false,
      pqcReplacement: 'No change needed \u2014 symmetric key generation is quantum-safe',
    },
    {
      order: 2,
      label: 'BDK Wrapping for Transport',
      description:
        'The BDK is encrypted (wrapped) using an RSA-2048 key transport key for secure transfer to the terminal injection station. THIS IS THE PRIMARY QUANTUM VULNERABILITY: a quantum computer could recover the BDK from the RSA-wrapped ciphertext.',
      cryptoUsed: 'RSA-2048 key transport (PKCS#1 v1.5 or OAEP)',
      quantumVulnerable: true,
      pqcReplacement: 'ML-KEM-768 key encapsulation mechanism',
    },
    {
      order: 3,
      label: 'Secure Transport to Terminal',
      description:
        'The RSA-wrapped BDK is transferred to the injection station via secure channel (TLS or dedicated HSM-to-HSM link). The injection station decrypts using its RSA private key.',
      cryptoUsed: 'RSA-2048 key decryption + TLS 1.2/1.3',
      quantumVulnerable: true,
      pqcReplacement: 'ML-KEM-768 decapsulation + Hybrid ML-KEM TLS',
    },
    {
      order: 4,
      label: 'Terminal Key Injection & Derivation',
      description:
        'The BDK is loaded into the terminal\u2019s tamper-resistant security module. The terminal derives an Initial PIN Encryption Key (IPEK) from the BDK using the terminal\u2019s unique Key Serial Number (KSN). All subsequent per-transaction keys are derived from the IPEK using symmetric DUKPT derivation.',
      cryptoUsed: '3DES/AES DUKPT key derivation (symmetric)',
      quantumVulnerable: false,
      pqcReplacement: 'No change needed \u2014 symmetric DUKPT derivation is quantum-safe',
    },
  ],
}

export const DUKPT_DERIVATION_TREE = {
  description:
    'DUKPT (Derived Unique Key Per Transaction) generates a unique symmetric key for every transaction from a Base Derivation Key. The symmetric derivation chain is quantum-safe; only the initial key injection uses RSA (quantum-vulnerable).',
  levels: [
    {
      level: 0,
      label: 'Base Derivation Key (BDK)',
      description: 'Master key stored in payment HSM. Never exported in cleartext.',
      algorithm: 'AES-256 or 3DES (168-bit)',
      quantumSafe: true,
    },
    {
      level: 1,
      label: 'Initial PIN Encryption Key (IPEK)',
      description: 'Derived from BDK + terminal Key Serial Number (KSN). Unique per terminal.',
      algorithm: 'AES-256 / 3DES key derivation',
      quantumSafe: true,
    },
    {
      level: 2,
      label: 'Future Keys (21 keys in tree)',
      description:
        'Binary tree of 21 future keys derived from IPEK. Each transaction consumes one key and derives the next.',
      algorithm: 'AES-256 / 3DES key derivation',
      quantumSafe: true,
    },
    {
      level: 3,
      label: 'Per-Transaction Key',
      description:
        'Unique key for each transaction. Used for PIN block encryption (EP) and data encryption (DE). Discarded after use.',
      algorithm: 'AES-256 / 3DES encryption',
      quantumSafe: true,
    },
  ],
  vulnerablePoint:
    'RSA-2048 key transport of BDK at Key Injection Facility (KIF). Compromising the BDK allows derivation of ALL past and future transaction keys for terminals sharing that BDK.',
}
