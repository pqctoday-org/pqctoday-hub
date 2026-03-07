// SPDX-License-Identifier: GPL-3.0-only
import type { TEEArchitecture } from './ccConstants'

export const TEE_ARCHITECTURES: TEEArchitecture[] = [
  {
    id: 'intel-sgx',
    name: 'Intel SGX',
    vendor: 'Intel',
    scope: 'process',
    description:
      'Software Guard Extensions create hardware-isolated enclaves within user-space processes. Code and data inside an enclave are encrypted in memory and inaccessible to the OS, hypervisor, or other processes.',
    isolationMechanism: 'Enclave Page Cache (EPC) with hardware-enforced access control',
    memoryEncryption: 'Memory Encryption Engine (MEE), AES-128-CTR with integrity tree',
    attestationType: 'both',
    attestationRoot: 'Intel DCAP PCK Certificate (ECDSA P-256)',
    maxEnclaveSize: '256 MB (EPC, expandable via oversubscription)',
    keyManagement:
      'Sealing key derived from MRSIGNER + MRENCLAVE + CPU SVN via EGETKEY instruction',
    sideChannelProtection: ['AEX-Notify (SGX2)', 'TD partitioning', 'LFENCE serialization'],
    deploymentModel: 'both',
    cloudProviders: ['Azure DCsv3/DCdsv3', 'Alibaba Cloud', 'OVHcloud', 'Equinix Metal'],
    maturityLevel: 'mature',
    pqcReadiness: 'planned',
    pqcNotes:
      'Intel has announced PQC attestation key migration for DCAP targeting 2027. Current ECDSA P-256 attestation chains are quantum-vulnerable. SGX sealing uses AES-128 (Grover-halved to 64-bit effective).',
    strengths: [
      'Smallest TCB of any TEE (CPU + enclave code only)',
      'Process-level isolation — no hypervisor in trust boundary',
      'Mature SDK and attestation ecosystem (DCAP, Gramine, Occlum)',
      'Widest third-party tooling support',
    ],
    limitations: [
      'Limited EPC size (256 MB) — performance cliff on large workloads',
      'History of side-channel vulnerabilities (Foreshadow, Plundervolt, ÆPIC)',
      'Deprecated on consumer-grade CPUs (Alder Lake+)',
      'Complex programming model (must partition code into enclave/non-enclave)',
    ],
    radarScores: { isolation: 5, encryption: 4, attestation: 5, cloud: 4, pqc: 2, maturity: 5 },
  },
  {
    id: 'intel-tdx',
    name: 'Intel TDX',
    vendor: 'Intel',
    scope: 'vm',
    description:
      'Trust Domain Extensions provide VM-level isolation through a Secure Arbitration Mode (SEAM) module. Each Trust Domain (TD) runs as a fully isolated VM with encrypted memory, invisible to the hypervisor.',
    isolationMechanism:
      'SEAM module mediates all hypervisor-TD interactions; SEPT for address translation',
    memoryEncryption: 'Total Memory Encryption Multi-Key (TME-MK), AES-XTS-128 per TD',
    attestationType: 'remote',
    attestationRoot: 'Intel TDX Module Quote (ECDSA P-256 via DCAP infrastructure)',
    maxEnclaveSize: 'Full VM memory (no EPC limitation)',
    keyManagement:
      'Per-TD encryption key managed by TME-MK hardware; sealing via TD Report binding',
    sideChannelProtection: ['TD partitioning', 'Interrupt filtering', 'MSR access control'],
    deploymentModel: 'cloud',
    cloudProviders: ['Azure DCesv5', 'GCP C3 (preview)', 'Alibaba Cloud g8i'],
    maturityLevel: 'emerging',
    pqcReadiness: 'planned',
    pqcNotes:
      'Shares DCAP attestation infrastructure with SGX — PQC migration timeline aligned at 2027. TME-MK uses AES-128 (Grover concern). Future CPUs expected to support AES-256.',
    strengths: [
      'Full VM isolation — run unmodified OS and applications',
      'No EPC size limitation — full VM memory encrypted',
      'Simpler programming model than SGX (lift-and-shift VMs)',
      'Hardware-enforced memory integrity via TD partitioning',
    ],
    limitations: [
      'Larger TCB than SGX (includes guest OS and hypervisor shim)',
      'Requires 4th Gen+ Xeon Scalable (Sapphire Rapids)',
      'Cloud-only deployment in practice (limited on-prem availability)',
      'Attestation infrastructure still maturing',
    ],
    radarScores: { isolation: 4, encryption: 4, attestation: 4, cloud: 3, pqc: 2, maturity: 3 },
  },
  {
    id: 'arm-trustzone',
    name: 'ARM TrustZone',
    vendor: 'ARM',
    scope: 'hardware-partition',
    description:
      'TrustZone partitions the processor into Secure World and Normal World at the hardware level. The Secure World runs a trusted OS with exclusive access to secure peripherals, memory regions, and cryptographic accelerators.',
    isolationMechanism:
      'Hardware partition via NS-bit on AXI bus; Secure Monitor Call (SMC) interface',
    memoryEncryption:
      'TrustZone Address Space Controller (TZASC) enforces access; vendor-specific inline encryption',
    attestationType: 'local',
    attestationRoot: 'Platform-specific (OP-TEE + Secure Boot chain, vendor root key)',
    maxEnclaveSize: 'Configurable secure memory region (typically 16–256 MB)',
    keyManagement:
      'Hardware Unique Key (HUK) fused per-chip; derived keys via Secure World key derivation service',
    sideChannelProtection: ['Speculation barriers (SSBS)', 'Cache partitioning (optional)'],
    deploymentModel: 'on-prem',
    cloudProviders: ['Ampere Altra (Oracle Cloud)', 'Graviton (limited TrustZone exposure)'],
    maturityLevel: 'mature',
    pqcReadiness: 'community-only',
    pqcNotes:
      'No vendor-supplied PQC attestation. OP-TEE community has experimental ML-DSA patches. TrustZone crypto accelerators are AES/SHA-only — PQC must run in software within Secure World.',
    strengths: [
      'Ubiquitous — available on virtually all ARM Cortex-A/M processors',
      'Minimal hardware overhead (no memory encryption engine)',
      'Mature ecosystem (OP-TEE, Trusty, vendor TEE OS)',
      'Well-suited for IoT and mobile (power-efficient)',
    ],
    limitations: [
      'Single Secure World — no multi-tenant isolation',
      'No standardized remote attestation protocol',
      'Limited to local attestation without custom infrastructure',
      'Vendor fragmentation (each SoC vendor has custom Secure World implementation)',
    ],
    radarScores: { isolation: 3, encryption: 2, attestation: 2, cloud: 1, pqc: 1, maturity: 5 },
  },
  {
    id: 'arm-cca',
    name: 'ARM CCA',
    vendor: 'ARM',
    scope: 'vm',
    description:
      'Confidential Compute Architecture introduces Realms — isolated VM-like execution environments managed by a Realm Management Monitor (RMM). CCA separates the hypervisor from the trusted firmware, reducing TCB.',
    isolationMechanism:
      'Realm Management Extension (RME); Granule Protection Table (GPT) enforces memory isolation',
    memoryEncryption: 'Memory Encryption Engine (MEE) with per-Realm keys; AES-XTS-128',
    attestationType: 'remote',
    attestationRoot: 'CCA Attestation Token (ECDSA P-256, signed by Platform token + Realm token)',
    maxEnclaveSize: 'Full Realm memory (VM-sized)',
    keyManagement:
      'Per-Realm memory encryption key generated by RMM; platform attestation key in root of trust',
    sideChannelProtection: ['RME hardware isolation', 'Speculation barriers', 'GPT access control'],
    deploymentModel: 'cloud',
    cloudProviders: ['Expected: major ARM-based cloud providers (2026+)'],
    maturityLevel: 'emerging',
    pqcReadiness: 'planned',
    pqcNotes:
      'ARM has indicated PQC support in CCA attestation tokens on the roadmap. Initial CCA implementations use ECDSA P-256. Timeline for PQC attestation: estimated 2028.',
    strengths: [
      'Designed from scratch for cloud confidential computing',
      'Hypervisor removed from TCB (smaller trust boundary than TrustZone)',
      'Standardized attestation token format (PSA-based)',
      'Multi-tenant Realm isolation',
    ],
    limitations: [
      'Not yet in production silicon (Cortex-X925/A925 pending)',
      'Limited cloud provider support initially',
      'Tooling and SDK ecosystem still developing',
      'Requires new ARM v9.2 architecture — no retrofit to existing ARM chips',
    ],
    radarScores: { isolation: 4, encryption: 4, attestation: 4, cloud: 2, pqc: 2, maturity: 2 },
  },
  {
    id: 'amd-sev-snp',
    name: 'AMD SEV-SNP',
    vendor: 'AMD',
    scope: 'vm',
    description:
      'Secure Encrypted Virtualization with Secure Nested Paging provides VM-level memory encryption and integrity protection. SNP adds a Reverse Map Table (RMP) to prevent hypervisor-based memory remapping attacks.',
    isolationMechanism:
      'AMD Secure Processor (ASP) manages VM encryption keys; RMP enforces page ownership',
    memoryEncryption: 'AES-XTS-128 via AMD Secure Memory Encryption (SME) engine, per-VM key',
    attestationType: 'remote',
    attestationRoot: 'AMD VCEK Certificate (ECDSA P-384, signed by AMD Root Key)',
    maxEnclaveSize: 'Full VM memory (limited only by platform memory)',
    keyManagement:
      'Versioned Chip Endorsement Key (VCEK) derived from CPU fuses; per-VM memory encryption key generated by ASP',
    sideChannelProtection: [
      'RMP integrity checks',
      'VMSA register encryption',
      'SNP firmware attestation',
    ],
    deploymentModel: 'both',
    cloudProviders: ['Azure DCasv5/ECasv5', 'GCP N2D', 'AWS (EPYC-based instances)'],
    maturityLevel: 'mature',
    pqcReadiness: 'planned',
    pqcNotes:
      'AMD VCEK uses ECDSA P-384 (quantum-vulnerable). AMD has acknowledged the need for PQC attestation keys but has not published a specific migration timeline. SEV memory encryption uses AES-128 (Grover concern).',
    strengths: [
      'No application changes needed — encrypts full VM transparently',
      'Strong memory integrity via RMP (prevents hypervisor remapping)',
      'Wide cloud availability (Azure, GCP, AWS)',
      'Hardware-based key management via AMD Secure Processor',
    ],
    limitations: [
      'Larger TCB than SGX (includes full guest OS)',
      'AES-128 memory encryption (Grover halves to 64-bit effective)',
      'VCEK certificate chain tied to AMD root — centralized trust',
      'Performance overhead on memory-intensive workloads (~2-5%)',
    ],
    radarScores: { isolation: 4, encryption: 4, attestation: 4, cloud: 5, pqc: 2, maturity: 4 },
  },
  {
    id: 'risc-v-keystone',
    name: 'RISC-V Keystone',
    vendor: 'RISC-V (Open Source)',
    scope: 'process',
    description:
      'Keystone is an open-source TEE framework for RISC-V processors using Physical Memory Protection (PMP) to create isolated enclaves. It provides a customizable security monitor that mediates all enclave-host interactions.',
    isolationMechanism:
      'Physical Memory Protection (PMP) registers configured by Security Monitor (SM)',
    memoryEncryption: 'Optional — requires RISC-V Crypto Extension or software-based encryption',
    attestationType: 'remote',
    attestationRoot: 'Security Monitor attestation key (Ed25519 or platform-specific)',
    maxEnclaveSize:
      'PMP-configurable (hardware-limited by PMP entry count, typically 8-16 regions)',
    keyManagement:
      'Platform root key provisioned at manufacturing; SM-derived enclave keys via KDF',
    sideChannelProtection: [
      'PMP isolation',
      'Cache partitioning (Sanctum variant)',
      'Fence.t instruction',
    ],
    deploymentModel: 'on-prem',
    cloudProviders: [],
    maturityLevel: 'experimental',
    pqcReadiness: 'community-only',
    pqcNotes:
      'Open-source nature allows custom PQC attestation key integration. No production silicon with Keystone TEE support yet. RISC-V Crypto Extension adds AES/SHA but no PQC-specific instructions.',
    strengths: [
      'Fully open-source — auditable security monitor and enclave runtime',
      'Customizable trust model (user-defined SM policies)',
      'No vendor lock-in — runs on any RISC-V processor with PMP',
      'Research platform for novel TEE designs',
    ],
    limitations: [
      'No production-grade silicon deployment',
      'No hardware memory encryption by default',
      'Limited tooling and SDK maturity',
      'PMP entry count limits number of concurrent enclaves',
    ],
    radarScores: { isolation: 3, encryption: 1, attestation: 2, cloud: 0, pqc: 1, maturity: 1 },
  },
  {
    id: 'aws-nitro',
    name: 'AWS Nitro Enclaves',
    vendor: 'AWS',
    scope: 'vm',
    description:
      'Nitro Enclaves are isolated VMs created by the Nitro Hypervisor, a purpose-built lightweight hypervisor. Enclaves have no persistent storage, no external networking, and no operator access — only a vsock channel to the parent instance.',
    isolationMechanism: 'Nitro Hypervisor partitions CPU and memory; no network/storage in enclave',
    memoryEncryption:
      'Nitro security chip provides platform-level encryption; enclave memory isolated at hypervisor level',
    attestationType: 'remote',
    attestationRoot: 'Nitro Attestation Document (ECDSA P-384, signed by AWS Nitro root CA)',
    maxEnclaveSize: 'Up to parent instance memory minus 512 MB (configurable via allocator)',
    keyManagement:
      'AWS KMS integration via attestation-based key policies; enclave-specific key derivation via Nitro attestation document',
    sideChannelProtection: [
      'Dedicated CPU cores',
      'No shared memory with parent',
      'No operator access',
    ],
    deploymentModel: 'cloud',
    cloudProviders: ['AWS (all Nitro-based instance families)'],
    maturityLevel: 'mature',
    pqcReadiness: 'preview',
    pqcNotes:
      'AWS KMS supports ML-KEM for key agreement (preview). Nitro attestation documents still use ECDSA P-384. AWS has committed to PQC TLS for KMS but attestation key migration timeline is not public.',
    strengths: [
      'Extremely simple trust model — no OS, no network, no storage in enclave',
      'Tight KMS integration for attestation-based key access',
      'Mature deployment tooling (Nitro CLI, ACM for Nitro)',
      'No side-channel exposure from shared resources',
    ],
    limitations: [
      'AWS-only — no multi-cloud or on-prem deployment',
      'No persistent state — all data must flow through vsock',
      'Limited debugging capabilities (by design)',
      'Attestation tied to AWS Nitro root CA (vendor lock-in)',
    ],
    radarScores: { isolation: 5, encryption: 3, attestation: 4, cloud: 3, pqc: 3, maturity: 4 },
  },
]

export const TEE_COMPARISON_DIMENSIONS = [
  { key: 'scope', label: 'Isolation Scope' },
  { key: 'memoryEncryption', label: 'Memory Encryption' },
  { key: 'attestationType', label: 'Attestation' },
  { key: 'cloudProviders', label: 'Cloud Availability' },
  { key: 'pqcReadiness', label: 'PQC Readiness' },
  { key: 'maturityLevel', label: 'Maturity' },
] as const
