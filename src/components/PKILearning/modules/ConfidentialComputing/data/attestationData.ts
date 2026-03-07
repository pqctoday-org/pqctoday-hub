// SPDX-License-Identifier: GPL-3.0-only
import type {
  AttestationFlow,
  MemoryEncryptionEngine,
  TEEHSMIntegration,
  QuantumThreatVector,
} from './ccConstants'

// ── Attestation Flows ────────────────────────────────────────────────────

export const ATTESTATION_FLOWS: AttestationFlow[] = [
  {
    id: 'intel-dcap',
    name: 'Intel DCAP Remote Attestation',
    teeVendor: 'intel-sgx',
    rootOfTrust: 'Intel PCK Certificate (ECDSA P-256)',
    signingAlgorithm: 'ECDSA P-256',
    hashAlgorithm: 'SHA-256',
    pqcMigrationStatus: 'planned',
    pqcMigrationNotes:
      'Intel has committed to PQC attestation key migration for DCAP. Estimated timeline: 2027. Will require PCK certificate chain re-issuance with ML-DSA keys.',
    steps: [
      {
        id: 'dcap-1',
        order: 1,
        label: 'Generate Enclave Report',
        type: 'generate',
        actor: 'enclave',
        description:
          'Enclave generates a REPORT structure containing MRENCLAVE (code measurement), MRSIGNER (developer identity), and user-supplied REPORTDATA (e.g., a nonce or public key hash).',
        cryptoUsed: ['SHA-256 (measurement hash)'],
        quantumVulnerable: false,
        dataExchanged: 'SGX REPORT structure (432 bytes)',
      },
      {
        id: 'dcap-2',
        order: 2,
        label: 'Quoting Enclave Signs Quote',
        type: 'sign',
        actor: 'platform',
        description:
          'The Quoting Enclave (QE) verifies the REPORT locally using the REPORT key, then signs it with the platform Attestation Key (AK) to produce a Quote.',
        cryptoUsed: ['ECDSA P-256 (quote signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        dataExchanged: 'SGX Quote v3 (variable, ~5-10 KB)',
      },
      {
        id: 'dcap-3',
        order: 3,
        label: 'Send Quote to Verifier',
        type: 'provision',
        actor: 'enclave',
        description:
          'The signed Quote is sent to the Relying Party along with the PCK certificate chain for offline verification (no Intel online service needed in DCAP model).',
        cryptoUsed: ['TLS 1.2/1.3 transport'],
        quantumVulnerable: false,
        dataExchanged: 'Quote + PCK cert chain (~15-20 KB)',
      },
      {
        id: 'dcap-4',
        order: 4,
        label: 'Verify Quote Signature',
        type: 'verify',
        actor: 'relying-party',
        description:
          'Relying Party verifies the ECDSA signature on the Quote using the PCK certificate, then validates the cert chain up to the Intel Root CA.',
        cryptoUsed: ['ECDSA P-256 (signature verification)', 'SHA-256 (cert chain hash)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65 + SHA-3-256',
        dataExchanged: 'Verification result (accept/reject)',
      },
      {
        id: 'dcap-5',
        order: 5,
        label: 'Check TCB Status',
        type: 'verify',
        actor: 'relying-party',
        description:
          'Relying Party checks the TCB level from the Quote against the latest TCB Info from the Intel Provisioning Certification Service (PCS) to ensure the platform is up-to-date.',
        cryptoUsed: ['ECDSA P-256 (TCB Info signature)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        dataExchanged: 'TCB Info JSON (signed, ~2-5 KB)',
      },
    ],
  },
  {
    id: 'arm-cca-attestation',
    name: 'ARM CCA Realm Attestation',
    teeVendor: 'arm-cca',
    rootOfTrust: 'ARM CCA Platform Token (ECDSA P-256)',
    signingAlgorithm: 'ECDSA P-256',
    hashAlgorithm: 'SHA-256',
    pqcMigrationStatus: 'planned',
    pqcMigrationNotes:
      'ARM has indicated PQC support for CCA attestation tokens on the roadmap. Initial implementations use ECDSA P-256 per PSA Attestation Token specification. Estimated PQC timeline: 2028.',
    steps: [
      {
        id: 'cca-1',
        order: 1,
        label: 'Generate Realm Token',
        type: 'generate',
        actor: 'enclave',
        description:
          'The Realm generates a Realm Token containing the Realm Initial Measurement (RIM), Realm Extensible Measurement (REM), and challenge nonce. Signed by the Realm Attestation Key (RAK).',
        cryptoUsed: ['ECDSA P-256 (RAK signing)', 'SHA-256 (measurements)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        dataExchanged: 'CCA Realm Token (COSE_Sign1, ~1-2 KB)',
      },
      {
        id: 'cca-2',
        order: 2,
        label: 'Generate Platform Token',
        type: 'sign',
        actor: 'platform',
        description:
          'The Realm Management Monitor (RMM) generates a Platform Token containing the platform identity, lifecycle state, and implementation ID. Binds to the Realm Token via hash reference.',
        cryptoUsed: ['ECDSA P-256 (platform signing)', 'SHA-256 (binding hash)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        dataExchanged: 'CCA Platform Token (COSE_Sign1, ~1-2 KB)',
      },
      {
        id: 'cca-3',
        order: 3,
        label: 'Combine and Send Tokens',
        type: 'provision',
        actor: 'enclave',
        description:
          'Realm Token and Platform Token are combined into a CCA Attestation Bundle and sent to the Relying Party via a secure transport channel.',
        cryptoUsed: ['TLS 1.3 transport'],
        quantumVulnerable: false,
        dataExchanged: 'CCA Attestation Bundle (~3-4 KB)',
      },
      {
        id: 'cca-4',
        order: 4,
        label: 'Verify Attestation Bundle',
        type: 'verify',
        actor: 'relying-party',
        description:
          'Relying Party verifies both token signatures independently, checks measurement values against reference values, and validates the platform lifecycle state.',
        cryptoUsed: ['ECDSA P-256 (dual signature verification)', 'SHA-256'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        dataExchanged: 'Verification result + appraisal policy decision',
      },
    ],
  },
  {
    id: 'amd-sev-snp-attestation',
    name: 'AMD SEV-SNP Attestation',
    teeVendor: 'amd-sev-snp',
    rootOfTrust: 'AMD VCEK Certificate (ECDSA P-384)',
    signingAlgorithm: 'ECDSA P-384',
    hashAlgorithm: 'SHA-384',
    pqcMigrationStatus: 'planned',
    pqcMigrationNotes:
      'AMD VCEK uses ECDSA P-384 — quantum-vulnerable. AMD has acknowledged PQC migration needs but has not published a specific timeline. VCEK is fused per-chip, requiring hardware refresh for PQC attestation keys.',
    steps: [
      {
        id: 'snp-1',
        order: 1,
        label: 'Request Attestation Report',
        type: 'generate',
        actor: 'enclave',
        description:
          'Guest VM issues SNP_GUEST_REQUEST to the AMD Secure Processor (ASP) via the hypervisor. The ASP generates an Attestation Report containing the launch measurement, guest policy, and platform info.',
        cryptoUsed: ['SHA-384 (measurement hash)'],
        quantumVulnerable: false,
        dataExchanged: 'SNP Attestation Report request (64 bytes)',
      },
      {
        id: 'snp-2',
        order: 2,
        label: 'ASP Signs Report with VCEK',
        type: 'sign',
        actor: 'platform',
        description:
          'The AMD Secure Processor signs the Attestation Report using the Versioned Chip Endorsement Key (VCEK), a per-chip ECDSA P-384 key derived from fused secrets and TCB version.',
        cryptoUsed: ['ECDSA P-384 (VCEK signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-87',
        dataExchanged: 'Signed Attestation Report (1,184 bytes)',
      },
      {
        id: 'snp-3',
        order: 3,
        label: 'Fetch VCEK Certificate Chain',
        type: 'provision',
        actor: 'relying-party',
        description:
          'Relying Party fetches the VCEK certificate from the AMD Key Distribution Service (KDS), along with the intermediate AMD SEV CA and AMD Root Key certificates.',
        cryptoUsed: ['HTTPS (AMD KDS API)'],
        quantumVulnerable: false,
        dataExchanged: 'VCEK cert + CA chain (~3-5 KB)',
      },
      {
        id: 'snp-4',
        order: 4,
        label: 'Verify Report and TCB',
        type: 'verify',
        actor: 'relying-party',
        description:
          'Relying Party verifies the VCEK signature on the report, validates the certificate chain to AMD Root Key, checks TCB version against minimum requirements, and evaluates the guest policy.',
        cryptoUsed: ['ECDSA P-384 (signature + chain verification)', 'SHA-384'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-87',
        dataExchanged: 'Verification result + policy decision',
      },
    ],
  },
  {
    id: 'aws-nitro-attestation',
    name: 'AWS Nitro Enclave Attestation',
    teeVendor: 'aws-nitro',
    rootOfTrust: 'AWS Nitro Root CA Certificate (ECDSA P-384)',
    signingAlgorithm: 'ECDSA P-384',
    hashAlgorithm: 'SHA-384',
    pqcMigrationStatus: 'preview',
    pqcMigrationNotes:
      'AWS KMS supports ML-KEM for key agreement (preview). Nitro attestation documents still use ECDSA P-384. AWS has committed to PQC TLS for KMS, but attestation document PQC migration timeline is not yet public.',
    steps: [
      {
        id: 'nitro-1',
        order: 1,
        label: 'Generate Attestation Document',
        type: 'generate',
        actor: 'enclave',
        description:
          'Nitro Enclave calls nsm_get_attestation_document() with optional user_data, nonce, and public_key fields. The Nitro Security Module (NSM) creates a CBOR-encoded attestation document.',
        cryptoUsed: ['SHA-384 (PCR measurements)'],
        quantumVulnerable: false,
        dataExchanged: 'Attestation document request (user_data + nonce)',
      },
      {
        id: 'nitro-2',
        order: 2,
        label: 'NSM Signs Document',
        type: 'sign',
        actor: 'platform',
        description:
          'The Nitro Security Module signs the attestation document using an enclave-specific ECDSA P-384 key, including PCR values (PCR0: enclave image, PCR1: OS, PCR2: application).',
        cryptoUsed: ['ECDSA P-384 (document signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-87',
        dataExchanged: 'Signed attestation document (COSE_Sign1, ~5-10 KB)',
      },
      {
        id: 'nitro-3',
        order: 3,
        label: 'Send to KMS with Attestation',
        type: 'provision',
        actor: 'enclave',
        description:
          'The signed attestation document is sent to AWS KMS via the vsock proxy. KMS validates the document before releasing decryption keys to the enclave.',
        cryptoUsed: ['TLS 1.3 (vsock → KMS)'],
        quantumVulnerable: false,
        dataExchanged: 'KMS Decrypt/GenerateDataKey request + attestation document',
      },
      {
        id: 'nitro-4',
        order: 4,
        label: 'KMS Verifies and Releases Key',
        type: 'verify',
        actor: 'attestation-service',
        description:
          'AWS KMS verifies the ECDSA P-384 signature, validates the certificate chain to the Nitro Root CA, checks PCR values against the KMS key policy conditions, and releases the key material.',
        cryptoUsed: ['ECDSA P-384 (signature + chain verification)', 'SHA-384'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-87 + ML-KEM-1024',
        dataExchanged: 'Decrypted key material (wrapped with enclave public key)',
      },
    ],
  },
]

// ── Memory Encryption Engines ────────────────────────────────────────────

export const MEMORY_ENCRYPTION_ENGINES: MemoryEncryptionEngine[] = [
  {
    id: 'intel-tme-mk',
    name: 'Intel TME-MK',
    vendor: 'Intel',
    algorithm: 'AES-XTS-128',
    keyWidth: 128,
    granularity: 'Cache line (64 bytes)',
    integrityProtection: true,
    integrityMechanism: 'Integrity trees with TD partitioning (TDX) or MEE integrity tree (SGX)',
    quantumImpact: 'grover-halved',
    quantumNotes:
      "AES-128 effective security drops to 64-bit under Grover's algorithm. This is below the NIST Level 1 threshold (128-bit post-quantum). Upgrade path: AES-XTS-256 in future CPU generations.",
    sealingKeyDerivation:
      'Platform root key (fused) → CPU SVN → Enclave identity (MRENCLAVE/MRSIGNER) → Sealing key via EGETKEY',
    protectionScope: [
      'DRAM contents',
      'Cache lines (encrypted at LLC boundary)',
      'Page table entries',
    ],
  },
  {
    id: 'amd-sme-sev',
    name: 'AMD SME/SEV Encryption Engine',
    vendor: 'AMD',
    algorithm: 'AES-XTS-128',
    keyWidth: 128,
    granularity: 'Page (4 KB)',
    integrityProtection: true,
    integrityMechanism:
      'Reverse Map Table (RMP) enforces page ownership; prevents remapping attacks',
    quantumImpact: 'grover-halved',
    quantumNotes:
      'AES-128 effective security drops to 64-bit under Grover. AMD has not announced AES-256 memory encryption for future EPYC generations. RMP integrity is hash-based (quantum-safe for collision resistance).',
    sealingKeyDerivation:
      'AMD Secure Processor root key (fused) → TCB version → VM encryption key (VEK) derived per-VM via ASP key derivation',
    protectionScope: ['Full VM memory', 'Register state (VMSA)', 'Interrupt descriptor table'],
  },
  {
    id: 'arm-tz-crypto',
    name: 'ARM TrustZone Crypto',
    vendor: 'ARM',
    algorithm: 'Vendor-specific (typically AES-256 inline encryption)',
    keyWidth: 256,
    granularity: 'Memory region (TZASC-configured)',
    integrityProtection: false,
    quantumImpact: 'none',
    quantumNotes:
      'AES-256 provides 128-bit post-quantum security under Grover — meets NIST Level 1. However, TrustZone relies on access control (TZASC) rather than encryption for most isolation, which is not cryptographically affected by quantum.',
    sealingKeyDerivation:
      'Hardware Unique Key (HUK, fused per-SoC) → Key derivation via Secure World service (vendor-specific KDF)',
    protectionScope: [
      'Secure World memory regions',
      'Secure peripherals',
      'Crypto accelerator key slots',
    ],
  },
  {
    id: 'aws-nitro-kms',
    name: 'AWS Nitro Platform Encryption',
    vendor: 'AWS',
    algorithm: 'Hardware-managed (Nitro Security Chip)',
    keyWidth: 256,
    granularity: 'Instance-level (hypervisor-enforced memory isolation)',
    integrityProtection: true,
    integrityMechanism:
      'Nitro Hypervisor enforces memory isolation; Nitro Security Chip manages platform integrity',
    quantumImpact: 'none',
    quantumNotes:
      'AWS Nitro uses a hardware security chip for platform-level encryption with 256-bit keys (Grover-resilient). The primary protection mechanism is hypervisor-enforced isolation rather than memory encryption.',
    sealingKeyDerivation:
      'Nitro Security Chip root key → Instance-specific key via Nitro attestation → Enclave key via KMS attestation policy',
    protectionScope: [
      'Enclave memory (hypervisor-isolated)',
      'Vsock channel data',
      'KMS key material in-transit',
    ],
  },
]

// ── TEE-HSM Integrations ─────────────────────────────────────────────────

export const TEE_HSM_INTEGRATIONS: TEEHSMIntegration[] = [
  {
    id: 'sgx-luna-pkcs11',
    name: 'SGX Enclave ↔ Thales Luna HSM',
    teeVendor: 'intel-sgx',
    hsmVendor: 'Thales Luna 7',
    channelType: 'pkcs11',
    mutualAttestation: true,
    tlsChannelBinding: true,
    currentSigningAlgo: 'ECDSA P-256',
    currentKEM: 'ECDH P-256 (TLS 1.3 key exchange)',
    pqcSigningAlgo: 'ML-DSA-65',
    pqcKEM: 'ML-KEM-768',
    keyProvisioningFlow:
      'HSM generates PQC keypair → Wrapped export via TLS 1.3 channel → Enclave receives wrapped key → Unsealed with EGETKEY-derived wrapping key → Key loaded into enclave memory',
    migrationComplexity: 'high',
    notes:
      'Requires both Intel DCAP attestation key migration (ECDSA → ML-DSA) and Luna firmware upgrade (v7.9.2+ for ML-KEM/ML-DSA). PKCS#11 v3.2 mechanisms required on both sides. Thales Luna Partition Owner role must configure PQC-enabled partition.',
  },
  {
    id: 'sev-snp-nshield',
    name: 'SEV-SNP VM ↔ Entrust nShield HSM',
    teeVendor: 'amd-sev-snp',
    hsmVendor: 'Entrust nShield 5',
    channelType: 'pkcs11',
    mutualAttestation: true,
    tlsChannelBinding: true,
    currentSigningAlgo: 'ECDSA P-384',
    currentKEM: 'ECDH P-384 (TLS 1.3 key exchange)',
    pqcSigningAlgo: 'ML-DSA-87',
    pqcKEM: 'ML-KEM-1024',
    keyProvisioningFlow:
      'SNP guest requests key from nShield → Guest presents SEV-SNP attestation report → nShield verifies VCEK chain → TLS 1.3 channel established → PQC keys provisioned via PKCS#11',
    migrationComplexity: 'high',
    notes:
      'Entrust nShield 5 supports ML-DSA and SLH-DSA. Migration requires AMD VCEK chain to support PQC signatures (AMD dependency). nShield Security World must be configured with PQC-enabled key types.',
  },
  {
    id: 'nitro-cloudhsm',
    name: 'Nitro Enclave ↔ AWS CloudHSM',
    teeVendor: 'aws-nitro',
    hsmVendor: 'AWS CloudHSM',
    channelType: 'pkcs11',
    mutualAttestation: false,
    tlsChannelBinding: false,
    currentSigningAlgo: 'ECDSA P-384',
    currentKEM: 'ECDH P-256 (TLS 1.3)',
    pqcSigningAlgo: undefined,
    pqcKEM: undefined,
    keyProvisioningFlow:
      'Nitro Enclave connects to CloudHSM via vsock proxy → KMS attestation policy gates access → CloudHSM provisions key via PKCS#11 → Key material decrypted inside enclave',
    migrationComplexity: 'medium',
    notes:
      'CloudHSM has ML-DSA preview via SDK only — no native PKCS#11 PQC mechanism support yet. Attestation flows through KMS (not directly to CloudHSM). Simpler migration path: AWS manages HSM infrastructure upgrades.',
  },
  {
    id: 'tdx-marvell-kmip',
    name: 'TDX Trust Domain ↔ Marvell LiquidSecurity HSM',
    teeVendor: 'intel-tdx',
    hsmVendor: 'Marvell LiquidSecurity 3',
    channelType: 'kmip',
    mutualAttestation: true,
    tlsChannelBinding: true,
    currentSigningAlgo: 'ECDSA P-256',
    currentKEM: 'ECDH P-256 (TLS 1.3)',
    pqcSigningAlgo: 'ML-DSA-65',
    pqcKEM: 'ML-KEM-768',
    keyProvisioningFlow:
      'TD sends attestation quote to KMIP server → KMIP server verifies via Intel PCS → TLS 1.3 channel with KMIP key management → HSM provisions wrapped keys to TD',
    migrationComplexity: 'medium',
    notes:
      'KMIP 2.1+ supports PQC key types. Marvell LiquidSecurity 3 has ML-KEM and ML-DSA support (preview). TDX attestation shares DCAP infrastructure with SGX — PQC migration coupled.',
  },
]

// ── Quantum Threat Vectors ───────────────────────────────────────────────

export const QUANTUM_THREAT_VECTORS: QuantumThreatVector[] = [
  {
    id: 'attestation-ecdsa',
    name: 'ECDSA Attestation Chain Forgery',
    component: 'Remote Attestation',
    currentCrypto: 'ECDSA P-256/P-384 (Intel PCK, ARM CCA token, AMD VCEK, AWS Nitro)',
    vulnerability:
      "Shor's algorithm breaks ECDSA in polynomial time. An attacker with a CRQC can forge attestation quotes, impersonate legitimate enclaves, and bypass all trust decisions based on attestation.",
    severity: 'critical',
    migrationPriority: 1,
    pqcSolution:
      'ML-DSA-65/87 for attestation key signing. Hybrid ECDSA+ML-DSA during transition period. Certificate chain re-issuance from vendor root CAs.',
    vendorTimeline: 'Intel: 2027, ARM: 2028, AMD: 2028, AWS: TBD',
    hndlExposure: true,
    migrationEffort: 4,
  },
  {
    id: 'sealing-key-compromise',
    name: 'Sealing Key Recovery via Side-Channel + Quantum',
    component: 'Key Management',
    currentCrypto: 'AES-128 sealing keys derived from platform root (SGX EGETKEY, SEV-SNP ASP)',
    vulnerability:
      "Grover's algorithm halves AES key strength. If sealing keys use AES-128, effective post-quantum security is 64-bit — feasible for a CRQC to brute-force. Combined with side-channel leakage of key bits, recovery becomes more practical.",
    severity: 'high',
    migrationPriority: 2,
    pqcSolution:
      'Upgrade sealing key derivation to AES-256 (128-bit post-quantum security). Add PQC KDF (HKDF-SHA3-256) for key derivation chain.',
    vendorTimeline: 'Requires next-gen CPU silicon: Intel 2027+, AMD 2028+',
    hndlExposure: false,
    migrationEffort: 5,
  },
  {
    id: 'memory-encryption-grover',
    name: 'Memory Encryption Grover Halving',
    component: 'Memory Encryption',
    currentCrypto: 'AES-XTS-128 (Intel TME-MK, AMD SME/SEV)',
    vulnerability:
      "Grover's algorithm reduces AES-128 effective security to 64-bit. While brute-forcing AES-128 memory encryption keys in real-time is unlikely even with a CRQC (requires sustained high qubit count), it weakens the security margin below NIST Level 1.",
    severity: 'medium',
    migrationPriority: 3,
    pqcSolution:
      'AES-XTS-256 memory encryption in next-gen CPUs. Alternatively, software-layer encryption with AES-256-GCM inside the enclave for sensitive data.',
    vendorTimeline: 'Intel (Granite Rapids+): 2027, AMD (Zen 6+): 2028',
    hndlExposure: false,
    migrationEffort: 5,
  },
  {
    id: 'tls-channel-downgrade',
    name: 'TEE-HSM TLS Channel Key Exchange Compromise',
    component: 'TEE-HSM Communication',
    currentCrypto: 'ECDH P-256/P-384 (TLS 1.3 key exchange between TEE and HSM)',
    vulnerability:
      "Shor's algorithm breaks ECDH key exchange. An attacker recording TLS sessions between a TEE and HSM can retroactively decrypt all key provisioning data once a CRQC is available (HNDL attack on key material in transit).",
    severity: 'critical',
    migrationPriority: 1,
    pqcSolution:
      'Hybrid ML-KEM-768 + ECDH P-256 for TLS 1.3 key exchange (forward secrecy). Requires PQC-capable TLS stacks on both TEE and HSM sides.',
    vendorTimeline: 'OpenSSL 3.5+ (2025), wolfSSL (available), BoringSSL (available)',
    hndlExposure: true,
    migrationEffort: 3,
  },
  {
    id: 'firmware-supply-chain',
    name: 'Firmware Signature Forgery',
    component: 'Supply Chain',
    currentCrypto:
      'RSA-2048/ECDSA (firmware signing for TEE updates, microcode, and security monitor patches)',
    vulnerability:
      "Shor's algorithm can forge firmware signatures. An attacker could sign malicious TEE firmware, security monitor updates, or microcode patches that pass signature verification. Particularly dangerous for remote firmware update channels.",
    severity: 'high',
    migrationPriority: 2,
    pqcSolution:
      'ML-DSA-65/87 or SLH-DSA for firmware signing. Dual-signature (classical + PQC) during transition. Hardware root of trust must support PQC verification.',
    vendorTimeline:
      'Requires silicon refresh: Intel (2027+), AMD (2028+), ARM (SoC vendor dependent)',
    hndlExposure: false,
    migrationEffort: 4,
  },
]
