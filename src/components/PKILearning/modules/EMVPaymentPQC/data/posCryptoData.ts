// SPDX-License-Identifier: AGPL-3.0-only
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
      'TLS key exchange with acquirer ((EC)DHE; RSA key transport in legacy TLS 1.2)',
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
      'ML-DSA-44 signature verification feasible but slow (~500ms)',
      'FN-DSA-512 produces smaller signatures (666 bytes vs ~2,420 for ML-DSA-44), reducing memory requirements on constrained devices',
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
      'TLS to host/switch (key exchange; RSA/ECDSA certificate signatures separately authenticate)',
      'Remote key loading (RSA key transport)',
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
      "In this module's reading, 256 KB RAM supports FN-DSA-512 but tight for ML-KEM-768",
      'Often in remote locations \u2014 firmware updates are complex',
      'Long deployment lifecycle with 7-12 year physical terminal replacement cycle',
      'Network connectivity may be intermittent \u2014 offline operation critical',
    ],
  },
]

export const KEY_INJECTION_CEREMONY: KeyInjectionCeremony = {
  id: 'standard-kif',
  name: 'Illustrative Key Injection Facility (KIF) Scenario: Fictional RSA Remote Key Loading',
  description:
    'One fictional teaching scenario, not a universal procedure: a secured, audited facility with dual-control, split-knowledge procedures derives a unique initial key for a terminal and delivers it with RSA key transport. Real deployments differ (manual loading, symmetric transport under key blocks, other asymmetric profiles); PCI PIN Security Requirements v3.1 requirement 12-7 allows asymmetric or manual techniques for the initial key and requirement 18-3 requires encrypted symmetric keys to be managed as key blocks (for example TR-31 or TR-34, or AES key wrap per ANSI X9.102), so check the current requirements. In this scenario the RSA key transport of the derived initial key is the quantum-vulnerable point; the BDK stays inside the authorised HSM.',
  steps: [
    {
      order: 1,
      label: 'BDK Generation and Initial Key Derivation in Payment HSM',
      description:
        'The Base Derivation Key (BDK) is generated inside a payment HSM (for example a PCI-approved PTS HSM) and never leaves it in cleartext. Dual custody is required (two key custodians each contribute key components). Inside the HSM boundary, the terminal\u2019s unique Key Serial Number (KSN) is used to derive that terminal\u2019s Initial PIN Encryption Key (IPEK). Only the derived initial key is ever sent toward the terminal: PCI PIN requirement 20-3 says base derivation keys must never be loaded onto POI devices.',
      cryptoUsed: 'AES-256 key generation and 3DES/AES DUKPT derivation (HSM internal, symmetric)',
      quantumVulnerable: false,
      pqcReplacement:
        'No change needed \u2014 symmetric key generation and derivation are quantum-safe',
    },
    {
      order: 2,
      label: 'Initial Key Wrapping for Transport (Fictional RSA Case)',
      description:
        'In this fictional remote key loading case, the HSM encrypts (wraps) the derived initial key \u2014 not the BDK \u2014 under an RSA-2048 key-transport key tied to the terminal. THIS IS THE QUANTUM VULNERABILITY IN THIS CASE: an attacker who recorded the wrapped initial key and later breaks RSA could recover that one terminal\u2019s initial key and the keys derived from it, but not the BDK.',
      cryptoUsed: 'RSA-2048 key transport (PKCS#1 v1.5 or OAEP)',
      quantumVulnerable: true,
      pqcReplacement:
        'ML-KEM-768 key encapsulation as the key-establishment step: its shared secret goes through a key-derivation function and an authenticated key wrap that carries the initial key, with the terminal authenticated and its identity and the key purpose bound in. ML-KEM does not encrypt the initial key by itself. This toggle is conceptual, not a complete implementation.',
    },
    {
      order: 3,
      label: 'Secure Transport to Terminal',
      description:
        'The wrapped initial key is transferred to the terminal over a secure channel (TLS or a dedicated link). The terminal\u2019s security module unwraps it with its RSA private key.',
      cryptoUsed: 'RSA-2048 key decryption + TLS 1.2/1.3',
      quantumVulnerable: true,
      pqcReplacement:
        'ML-KEM-768 decapsulation in the terminal, then the same KDF and authenticated unwrap, plus hybrid ML-KEM TLS for the channel',
    },
    {
      order: 4,
      label: 'Terminal Key Loading & Per-Transaction Derivation',
      description:
        'The initial key is stored in the terminal\u2019s tamper-resistant security module, and the BDK is not present on the terminal. All subsequent per-transaction keys are derived on the terminal from the initial key using symmetric DUKPT derivation.',
      cryptoUsed: '3DES/AES DUKPT key derivation (symmetric)',
      quantumVulnerable: false,
      pqcReplacement: 'No change needed \u2014 symmetric DUKPT derivation is quantum-safe',
    },
  ],
}

export const DUKPT_DERIVATION_TREE = {
  description:
    'DUKPT (Derived Unique Key Per Transaction) generates a unique symmetric key for every transaction from a Base Derivation Key. The symmetric derivation chain is quantum-safe; in the fictional remote key loading case this module models, only the RSA transport of the terminal\u2019s derived initial key is quantum-vulnerable.',
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
    'In the fictional RSA remote key loading case, the RSA-2048 transport of a terminal\u2019s derived initial key. The BDK itself is meant to stay inside the authorised HSM; compromising it would allow derivation of the transaction keys of every terminal that shares it.',
}
