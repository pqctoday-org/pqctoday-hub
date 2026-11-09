// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Trust Hardware Selector (Architect Quantum Impact, Step 6): all text and all source ids.
 *
 * Every card sentence, grid cell, scenario answer and combine case carries the Library ids it
 * rests on, so the test can check that each id resolves. A cell with no published source says
 * "Not published in the sources read." (kind 'not-published') instead of being filled from judgement.
 *
 * Source ids are Library reference_ids, cited exactly as admitted for this release.
 *
 * Wording rules:
 *  - Tessera is described from its specifications and repositories only: specification and code,
 *    no product or certificate yet. Its targets are requirements, never measurements.
 *  - Microsoft describes Tessera as an evolution of the Azure Integrated HSM; facts about the
 *    earlier Azure Integrated HSM sit only in the box labelled "About the earlier Azure Integrated HSM".
 *  - Where products differ the cell says "varies by product" rather than choosing one vendor.
 */

export type CategoryId =
  | 'tpm'
  | 'caliptra'
  | 'tessera'
  | 'hardware-hsm'
  | 'cloud-hsm'
  | 'confidential-computing'
  | 'dpu-bought'
  | 'dpu-cloud'

// ---- Library ids -------------------------------------------------------------------------
// Rows already in the Library.
const TPM_P1 = 'TCG-TPM-V185-Part1'
const TPM_P2 = 'TCG-TPM-V185-Part2'
const TPM_P3 = 'TCG-TPM-2.0-Library-v1.85-Part3-Published'
const TPM_PC = 'TCG-PC-Client-Platform-TPM-Profile-v1.07'
const DICE = 'TCG-Hardware-Requirements-for-a-Device-Identifier-Compositio'
const RATS = 'RFC 9334'
const RATS_HSM = 'draft-ietf-rats-pkix-key-attestation-08'
const OCP_DOT = 'OCP-Device-Ownership-Transfer-1.0'
const GOOGLE_HSM = 'Cloud-HSM-architecture-Security-Google-Cloud-Documentation'
const GOOGLE_QS_IMPORT = 'Google-Cloud-KMS-Quantum-Safe-Key-Import'
const SECUROSYS = 'Securosys-Primus-HSM-CyberVault-PQC-ready'
const NITRO = 'The-Security-Design-of-the-AWS-Nitro-System'
const TEE_SOK = 'SoK-Hardware-supported-Trusted-Execution-Environments'
const NIST_CC = 'NIST IR 8320E'
const CSA_GUIDE = 'CSA-PQC-Guide-2025'
const IG_PQC = 'NIST-FIPS140-3-IG-PQC'
const GSMA_PQ03 = 'GSMA PQ.03 PQC Guidelines'

// Library rows added for this release, cited exactly as in the Library.
const TESSERA_DEF = 'Tessera-Integrated-HSM-Project-Definition-0-5-0'
const TESSERA_CHIP = 'Tessera-Integrated-HSM-Chip-Requirements-Specification-0-5-0'
const TESSERA_TMK = 'Tessera-Masking-Key-Transfer-Protocol-0-5-0'
const TESSERA_DARC = 'Tessera-Integrated-HSM-DARC-Device-Authentication-Root-Certi'
const TESSERA_DEPLOY = 'Tessera-Integrated-HSM-Architectural-Specification-Deploymen'
const TESSERA_SW = 'Tessera-Integrated-HSM-SDK-tessera-sw-README'
const TESSERA_RTL = 'tessera-abr-params-pkg-sv-ML-DSA-and-ML-KEM-accelerator-para'
const TESSERA_MS = 'Open-source-Integrated-HSM-for-hardware-security-Microsoft-A'
const AZ_INTEGRATED = 'Azure-Integrated-HSM-overview'
const CAL_HW = 'Hardware-Specification-Caliptra-2-1-Documentation'
const CAL_VER = 'Caliptra-versioning'
const ADAMS_BRIDGE = 'ML-KEM-Documentation-Caliptra-2-1-Documentation-Adams-Bridge'
const AZ_CLOUD_HSM = 'Overview-of-Azure-Cloud-HSM'
const AZ_CLOUD_FAQ = 'Frequently-Asked-Questions-FAQ-About-Azure-Cloud-HSM'
const AWS_MECHANISMS = 'Supported-mechanisms-for-the-PKCS-11-library-for-AWS-CloudHS'
const DOCA_PSP = 'DOCA-PSP-Gateway-Application-Guide'
const OCTEON = 'OCTEON-10-DPU-Family-media-deck'
const PENSANDO = 'CMVP-Certificate-4819-AMD-Pensando-PenTrust-Security-Module'
const TITANIUM = 'Titanium-hardware-security-architecture-at-Google'
const AZ_SKR = 'Secure-Key-Release-with-Azure-Key-Vault-and-Azure-Confidenti'
const AWS_KMS_NITRO = 'Using-cryptographic-attestation-with-AWS-KMS-AWS-Nitro-Encla'
const SECUROSYS_X2 = 'Primus-HSM-CyberVault-X2-models-fact-sheet-Securosys'
const UTIMACO_SP = 'Utimaco-u-trust-Anchor-FIPS-140-3-Non-Proprietary-Security-P'
const LUNA_PQC = 'Post-Quantum-Algorithms-Luna-HSM'
const LUNA_BRIEF = 'Product-Brief-Luna-Network-HSM-7'
const AWS_FAQ = 'FAQs-AWS-CloudHSM'
const AWS_COMPLIANCE = 'Compliance-validation-for-AWS-CloudHSM'
const CMVP_4703 = 'CMVP-Certificate-4703-Marvell-LS2-HSM-Family'
const AZ_CLOUD_AUDIT = 'Tutorial-Configure-and-Query-HSM-Operation-Audit-Logs-for-Az'
const AZ_BOOST = 'Overview-of-Azure-Boost'
const CALIPTRA_ROT = 'Caliptra-A-Datacenter-System-on-a-Chip-SoC-Root-of-Trust-RoT'
const CONFIDENTIAL_VMS = 'Confidential-VMs-Explained-An-Empirical-Analysis-of-AMD-SEV'
/** Key release to an attested workload: Azure Secure Key Release and AWS KMS with Nitro Enclaves. */
const KEY_RELEASE = [AZ_SKR, AWS_KMS_NITRO]

// ---- Shapes ------------------------------------------------------------------------------

export interface Sourced {
  text: string
  /** Library reference ids this text rests on. */
  sources: string[]
}

export type CardQuestion = 'what' | 'origin' | 'where' | 'protects' | 'pq'

export interface CardSentence extends Sourced {
  q: CardQuestion
}

export interface ModuleLink {
  label: string
  to: string
}

export interface TrustCard {
  id: CategoryId
  name: string
  /** Short label under the name, shown in the grid header. */
  tagline: string
  /** Shown as a badge on the card (Tessera only). */
  status?: string
  modules: ModuleLink[]
  sentences: CardSentence[]
  /** Facts about an earlier product, kept apart from the card's own evidence. */
  ancestorBox?: { title: string; sentences: Sourced[] }
}

export type CellKind = 'stated' | 'specified' | 'varies' | 'not-published'

export interface GridCell extends Sourced {
  kind: CellKind
}

export interface GridRow {
  id: string
  label: string
  question: string
  cells: Record<CategoryId, GridCell>
}

export interface Scenario {
  id: string
  title: string
  prompt: string
  /** 'landscape' scenarios start from an Industry Landscape use case; 'authored' ones were written for this step. */
  origin: 'landscape' | 'authored'
  /** Industry Landscape use_case_id for 'landscape' scenarios. */
  landscapeUseCaseId?: string
  /** One or two categories the answer accepts. */
  best: CategoryId[]
  why: Sourced
  lessWell: { category: CategoryId; text: string; sources: string[] }[]
}

export interface CombineCase {
  id: string
  title: string
  parts: CategoryId[]
  steps: Sourced[]
  takeaway: Sourced
}

const NOT_PUBLISHED = 'Not published in the sources read.'

const np = (): GridCell => ({ kind: 'not-published', text: NOT_PUBLISHED, sources: [] })

// ---- Cards -------------------------------------------------------------------------------

const DEEP = {
  secureBoot: { label: 'Secure Boot & Firmware', to: '/learn/secure-boot-pqc' },
  hwAccel: { label: 'PQC Hardware Acceleration', to: '/learn/pqc-hw-acceleration' },
  hsm: { label: 'HSM & PQC Operations', to: '/learn/hsm-pqc' },
  kms: { label: 'KMS & PQC', to: '/learn/kms-pqc' },
  cc: { label: 'Confidential Computing & TEEs', to: '/learn/confidential-computing' },
  network: { label: 'Network Security & PQC', to: '/learn/network-security-pqc' },
} as const

export const TRUST_CARDS: TrustCard[] = [
  {
    id: 'tpm',
    name: 'TPM 2.0',
    tagline: 'Host root of trust',
    modules: [DEEP.secureBoot],
    sentences: [
      {
        q: 'what',
        text: 'A TPM is a security module defined by the TCG TPM 2.0 library specification; it can be a discrete chip on the board or an integrated TPM that runs inside a protected execution environment in a system-on-chip.',
        sources: [TPM_P1, TPM_PC],
      },
      {
        q: 'where',
        text: 'It belongs to the host platform: platform firmware records boot measurements into it and software reaches it over a local interface.',
        sources: [TPM_P1, TPM_PC],
      },
      {
        q: 'protects',
        text: 'It measures what boots, signs quotes of those measurements, and holds a small number of keys; most keys are kept outside the TPM, encrypted under a key inside it.',
        sources: [TPM_P1],
      },
      {
        q: 'pq',
        text: 'Version 1.85 of the library specification adds ML-KEM and ML-DSA, and the PC Client profile 1.07 makes both mandatory for PC platform TPMs.',
        sources: [TPM_P2, TPM_P3, TPM_PC],
      },
    ],
  },
  {
    id: 'caliptra',
    name: 'Caliptra',
    tagline: 'Root of trust inside a chip',
    modules: [DEEP.secureBoot, DEEP.hwAccel],
    sentences: [
      {
        q: 'what',
        text: 'Caliptra is an open root-of-trust design from the CHIPS Alliance; its hardware specification defines a cryptographic subsystem for measurement.',
        sources: [CAL_HW],
      },
      {
        q: 'where',
        text: 'It is a block that a chip maker builds into a larger chip, so it serves that one chip rather than the whole server.',
        sources: [CAL_HW],
      },
      {
        q: 'protects',
        text: 'It boots and measures the chip’s own firmware and gives the chip a device identity built with DICE; in Tessera’s chip requirements, Caliptra’s crypto serves only Caliptra’s own functions.',
        sources: [CAL_HW, DICE, TESSERA_CHIP],
      },
      {
        q: 'pq',
        text: 'Release 2.0 adds ML-DSA firmware-signature support and release 2.1 adds ML-KEM in the Adams Bridge accelerator, which supports ML-KEM-1024 only.',
        sources: [CAL_VER, ADAMS_BRIDGE],
      },
    ],
  },
  {
    id: 'tessera',
    name: 'Tessera',
    tagline: 'Workload-attached HSM design',
    status: 'Specification and code, no product or certificate yet',
    modules: [DEEP.hsm],
    sentences: [
      {
        q: 'what',
        text: 'Tessera is an open design for an HSM that attaches to a workload’s server, published as specifications and as firmware and hardware-design repositories: specification and code, no product or certificate yet.',
        sources: [TESSERA_DEF, TESSERA_SW, TESSERA_RTL],
      },
      {
        q: 'origin',
        text: 'Microsoft describes Tessera as an evolution of the Azure Integrated HSM.',
        sources: [TESSERA_MS],
      },
      {
        q: 'where',
        text: 'The Project Definition describes companion HSMs attached to the workload, and the chip requirements call for a Caliptra 2.2 root of trust inside the chip.',
        sources: [TESSERA_DEF, TESSERA_CHIP],
      },
      {
        q: 'protects',
        text: 'The aim is to keep keys inside an HSM boundary while operations run next to the workload; the Deployment Models paper describes a stateless key cache and a clustered HSM service built on the same device.',
        sources: [TESSERA_DEF, TESSERA_DEPLOY],
      },
      {
        q: 'pq',
        text: 'The chip requirements list ML-DSA and ML-KEM acceleration and FIPS 140-3 Level 3 certification of the full chip as requirements, not measurements; the software repository states it is not yet ready for deployment.',
        sources: [TESSERA_CHIP, TESSERA_SW],
      },
    ],
    ancestorBox: {
      title: 'About the earlier Azure Integrated HSM',
      sentences: [
        {
          text: 'Microsoft-designed HSM chips are embedded on certain Azure servers, and Microsoft states that they meet FIPS 140-3 Level 3.',
          sources: [AZ_INTEGRATED],
        },
        {
          text: 'It works as a local key cache for ephemeral operations: keys do not persist across a reboot of the virtual machine.',
          sources: [AZ_INTEGRATED],
        },
        {
          text: 'Microsoft lists limits: Windows guests only, customer opt-in, and the Trusted Launch security type only.',
          sources: [AZ_INTEGRATED],
        },
      ],
    },
  },
  {
    id: 'hardware-hsm',
    name: 'Hardware HSM',
    tagline: 'Thales, Entrust, Utimaco, Securosys',
    modules: [DEEP.hsm],
    sentences: [
      {
        q: 'what',
        text: 'A hardware security module is a tamper-protected device that keeps keys and performs cryptographic operations inside its boundary; Thales describes Luna Network HSMs as tamper-resistant, network-attached appliances.',
        sources: [SECUROSYS_X2, UTIMACO_SP, LUNA_BRIEF],
      },
      {
        q: 'where',
        text: 'The owner runs it, for example as a 1U rack appliance (Securosys Primus CyberVault X2, Thales Luna Network HSM 7) or as a PCIe plug-in card (Utimaco u.trust Anchor).',
        sources: [SECUROSYS_X2, UTIMACO_SP, LUNA_BRIEF],
      },
      {
        q: 'protects',
        text: 'It performs operations on keys inside a tamper-protected boundary; the Primus CyberVault X2 can run customer-defined logic inside that boundary, and Luna Network HSM 7 lists separate roles, multi-person MofN approval with multi-factor authentication, and secure audit logging.',
        sources: [SECUROSYS_X2, LUNA_BRIEF],
      },
      {
        q: 'pq',
        text: 'Post-quantum support varies by product: Luna HSMs list ML-DSA and ML-KEM from firmware 7.9.0 and LMS-HSS from 7.8.9, and the Primus CyberVault series lists ML-KEM, ML-DSA, SLH-DSA, HSS/LMS and XMSS. Algorithm validations, such as those NIST’s CAVP lists for Securosys, are not by themselves FIPS 140 module validations.',
        sources: [LUNA_PQC, SECUROSYS_X2, SECUROSYS],
      },
    ],
  },
  {
    id: 'cloud-hsm',
    name: 'Cloud HSM',
    tagline: 'AWS, Azure, Google',
    modules: [DEEP.hsm, DEEP.kms],
    sentences: [
      {
        q: 'what',
        text: 'A cloud HSM is an HSM service in which the provider runs the hardware: Azure Cloud HSM is a customer-managed, single-tenant cluster, Google Cloud HSM is a managed set of HSMs behind Cloud KMS, and AWS CloudHSM offers clusters of HSMs with a PKCS#11 library.',
        sources: [AZ_CLOUD_HSM, GOOGLE_HSM, AWS_MECHANISMS],
      },
      {
        q: 'where',
        text: 'The HSMs sit in the provider’s data centre and you reach them over the network; Azure Cloud HSM clients connect through a private endpoint.',
        sources: [AZ_CLOUD_HSM],
      },
      {
        q: 'protects',
        text: 'It holds long-term keys for cloud workloads; in Azure Cloud HSM the customer administers users and keys while Microsoft handles patching and maintenance.',
        sources: [AZ_CLOUD_HSM],
      },
      {
        q: 'pq',
        text: 'Support differs by service: AWS CloudHSM lists ML-DSA through vendor-defined mechanisms, and Google’s quantum-safe key import is limited to software-backed keys.',
        sources: [AWS_MECHANISMS, GOOGLE_QS_IMPORT],
      },
    ],
  },
  {
    id: 'confidential-computing',
    name: 'Confidential computing',
    tagline: 'AMD SEV-SNP, Intel TDX, AWS Nitro Enclaves',
    modules: [DEEP.cc],
    sentences: [
      {
        q: 'what',
        text: 'Confidential computing uses hardware that encrypts a workload’s memory and limits which code can read it, so data stays protected while it is processed.',
        sources: [NIST_CC, TEE_SOK, CONFIDENTIAL_VMS],
      },
      {
        q: 'where',
        text: 'It is a mode of the CPU and platform rather than a separate key device: a virtual machine or enclave runs in the protected mode.',
        sources: [NIST_CC, TEE_SOK, CONFIDENTIAL_VMS],
      },
      {
        q: 'protects',
        text: 'It protects data and code in use. In the key-release workflow that NIST describes, the workload fetches keys after remote attestation and uses them in protected memory.',
        sources: [NIST_CC, ...KEY_RELEASE],
      },
      {
        q: 'pq',
        text: 'Attestation uses the roles in RFC 9334; the sources read do not state a post-quantum attestation path for these platforms.',
        sources: [RATS, NIST_CC],
      },
    ],
  },
  {
    id: 'dpu-bought',
    name: 'DPU you buy',
    tagline: 'NVIDIA BlueField, Marvell OCTEON, AMD Pensando',
    modules: [DEEP.network],
    sentences: [
      {
        q: 'what',
        text: 'A data processing unit is a network device with its own processors and crypto engines that handles networking, storage and security work in place of the host; NVIDIA’s DOCA guide describes secure network communication fully offloaded to BlueField or ConnectX hardware.',
        sources: [OCTEON, DOCA_PSP],
      },
      {
        q: 'where',
        text: 'It sits in the packet path and can encrypt traffic inline. In NVIDIA’s DOCA PSP Gateway sample the application can run on the DPU, where the PSP resources are on the DPU and transparent to the host, or on the host.',
        sources: [DOCA_PSP, OCTEON],
      },
      {
        q: 'protects',
        text: 'It protects traffic on the wire at the device’s rated speed. In NVIDIA’s sample the receiver derives its keys inside the device from master keys the device manages, and the key exchange between applications uses a gRPC channel that is unencrypted unless you change it.',
        sources: [DOCA_PSP],
      },
      {
        q: 'pq',
        text: 'The sources read give no post-quantum key exchange for these devices; certification varies, and AMD Pensando PenTrust holds FIPS 140-3 Level 1.',
        sources: [PENSANDO, DOCA_PSP],
      },
    ],
  },
  {
    id: 'dpu-cloud',
    name: 'Cloud operator DPU',
    tagline: 'AWS Nitro, Azure Boost, Google Titanium',
    modules: [DEEP.cc],
    sentences: [
      {
        q: 'what',
        text: 'These are the provider’s own cards, chips and offload hardware that run its virtualisation, network and storage, such as AWS Nitro Cards, Azure Boost and Google Titanium.',
        sources: [NITRO, AZ_BOOST, TITANIUM],
      },
      {
        q: 'where',
        text: 'They sit in the provider’s servers and the provider designs and runs them; AWS describes its Nitro Cards as independent of the main system board, and Microsoft describes Azure Boost as its in-house developed hardware and software.',
        sources: [NITRO, AZ_BOOST, TITANIUM],
      },
      {
        q: 'protects',
        text: 'They isolate customer instances from the provider’s own operators and, on some AWS instance types, encrypt traffic between instances with AES-256-GCM.',
        sources: [NITRO],
      },
      {
        q: 'pq',
        text: 'The documents read describe no tenant-facing post-quantum attestation or key loading for these cards.',
        sources: [NITRO, TITANIUM],
      },
    ],
  },
]

// ---- Grid (10 rows x 8 columns) ----------------------------------------------------------

const C = (kind: CellKind, text: string, ...sources: string[]): GridCell => ({
  kind,
  text,
  sources,
})

export const GRID_ROWS: GridRow[] = [
  {
    id: 'where',
    label: 'Where it sits',
    question: 'Where does the trust hardware sit relative to the workload?',
    cells: {
      tpm: C(
        'stated',
        'A discrete chip on the board, or an integrated TPM inside a protected environment in the system-on-chip.',
        TPM_PC
      ),
      caliptra: C(
        'stated',
        'A root-of-trust block inside a larger chip; its specification calls it a cryptographic subsystem.',
        CAL_HW
      ),
      tessera: C(
        'specified',
        'Specified as a companion HSM chip attached to the workload’s server, with a Caliptra root of trust inside it.',
        TESSERA_DEF,
        TESSERA_CHIP
      ),
      'hardware-hsm': C(
        'stated',
        'A tamper-protected device that you run: a 1U rack appliance (Primus CyberVault X2, Luna Network HSM 7) or a PCIe plug-in card (Utimaco u.trust Anchor).',
        SECUROSYS_X2,
        UTIMACO_SP,
        LUNA_BRIEF
      ),
      'cloud-hsm': C(
        'stated',
        'The provider’s HSMs in its data centre, reached over the network; Azure Cloud HSM uses a private endpoint.',
        AZ_CLOUD_HSM,
        GOOGLE_HSM
      ),
      'confidential-computing': C(
        'stated',
        'A mode of the CPU and platform: the VM or enclave runs in memory that the hardware encrypts and isolates.',
        NIST_CC,
        TEE_SOK
      ),
      'dpu-bought': C(
        'stated',
        'A network device with its own processors in the packet path, able to encrypt traffic inline; NVIDIA’s sample can run on the DPU or on the host.',
        OCTEON,
        DOCA_PSP
      ),
      'dpu-cloud': C(
        'stated',
        'The provider’s own cards and offload hardware, running its virtualisation, network and storage; AWS describes Nitro Cards as independent of the main system board.',
        NITRO,
        AZ_BOOST,
        TITANIUM
      ),
    },
  },
  {
    id: 'control',
    label: 'Who controls the hardware and the keys',
    question: 'Who runs the hardware, and who holds control of the keys?',
    cells: {
      tpm: C(
        'stated',
        'Separate control domains for platform firmware, the owner and the endorsement hierarchy.',
        TPM_P1
      ),
      caliptra: C(
        'stated',
        'The chip’s owner; OCP Device Ownership Transfer describes how a device’s owner can change.',
        OCP_DOT,
        CAL_HW
      ),
      tessera: C(
        'specified',
        'Specified with a device owner and separate partition owners, each with its own certificate anchors.',
        TESSERA_DEPLOY
      ),
      'hardware-hsm': C(
        'stated',
        'You run the device and its administration. Luna Network HSM 7 lists separate roles and multi-person MofN approval; the Primus CyberVault X2 lists local console and remote SSH administration.',
        SECUROSYS_X2,
        LUNA_BRIEF
      ),
      'cloud-hsm': C(
        'stated',
        'The provider runs the hardware; the customer administers users and keys. In Azure Cloud HSM, Microsoft handles patching and maintenance.',
        AZ_CLOUD_HSM
      ),
      'confidential-computing': C(
        'stated',
        'The data owner or a relying party sets the attestation policy; the key service releases keys to a workload that meets it.',
        NIST_CC
      ),
      'dpu-bought': C(
        'stated',
        'The server owner runs it. In NVIDIA’s DOCA PSP Gateway sample, the application that exchanges keys and programs the device can run on the DPU or on the host.',
        DOCA_PSP
      ),
      'dpu-cloud': C(
        'stated',
        'The cloud provider designs, runs and updates the cards; Microsoft calls Azure Boost a system it designed.',
        NITRO,
        AZ_BOOST,
        TITANIUM
      ),
    },
  },
  {
    id: 'long-term-keys',
    label: 'Where long-term keys live',
    question: 'Does it keep long-term keys, cache them, or fetch them when it runs?',
    cells: {
      tpm: C(
        'stated',
        'Keeps a few; most keys are stored outside the TPM, encrypted under a key inside it.',
        TPM_P1
      ),
      caliptra: C(
        'stated',
        'Its own device keys; Tessera’s chip requirements say Caliptra’s crypto serves only Caliptra’s own functions, not the rest of the chip.',
        CAL_HW,
        TESSERA_CHIP
      ),
      tessera: C(
        'specified',
        'Two models on the same device: a stateless cache that keeps no keys across a reset, or a clustered HSM service.',
        TESSERA_DEPLOY
      ),
      'hardware-hsm': C(
        'stated',
        'Keeps them inside the module; Thales states that Luna keys always remain in FIPS-validated, tamper-evident hardware, and the Primus CyberVault X2 lists storage partitions.',
        SECUROSYS_X2,
        LUNA_BRIEF
      ),
      'cloud-hsm': C(
        'stated',
        'Keeps them in the provider’s HSMs; in Azure Cloud HSM the HSMs of a cluster synchronise keys.',
        AZ_CLOUD_HSM
      ),
      'confidential-computing': C(
        'stated',
        'Fetches them: the workload obtains keys after attestation and uses them in protected memory.',
        NIST_CC,
        ...KEY_RELEASE
      ),
      'dpu-bought': C(
        'stated',
        'Holds the keys of the connections it encrypts; in NVIDIA’s sample the receiver derives them in the device from a pair of master keys the device manages.',
        DOCA_PSP
      ),
      'dpu-cloud': C(
        'stated',
        'The provider’s own keys: AWS says the keys for EBS, instance storage and VPC networking are only ever in plaintext in the Nitro Cards’ protected volatile memory.',
        NITRO
      ),
    },
  },
  {
    id: 'attestation',
    label: 'Attestation today',
    question: 'What can it prove about itself today?',
    cells: {
      tpm: C(
        'stated',
        'Signed quotes of boot measurements, and certification of its keys.',
        TPM_P1
      ),
      caliptra: C(
        'stated',
        'A DICE device-identity chain, and measurement of the firmware it loads.',
        CAL_HW,
        DICE
      ),
      tessera: C(
        'specified',
        'Specified: Caliptra attests the chip’s security configuration, and Tessera’s identity chains to Caliptra’s.',
        TESSERA_CHIP
      ),
      'hardware-hsm': C(
        'varies',
        'Key-attestation formats differ by product; an IETF draft defines one evidence format for HSMs.',
        RATS_HSM
      ),
      'cloud-hsm': C(
        'varies',
        'Varies by service; Google Cloud HSM gives a signed attestation for a key, with certificate chains.',
        GOOGLE_HSM
      ),
      'confidential-computing': C(
        'stated',
        'Remote attestation: a signed report of the VM or enclave that a verifier checks before it releases keys.',
        NIST_CC,
        RATS
      ),
      'dpu-bought': np(),
      'dpu-cloud': C(
        'stated',
        'Provider-side: Azure Boost uses attestation through Azure’s Attestation Service, and Google’s Titan chips attest the firmware version deployed on a machine.',
        AZ_BOOST,
        TITANIUM
      ),
    },
  },
  {
    id: 'pq-attestation',
    label: 'Post-quantum attestation',
    question: 'Is attestation itself signed with a post-quantum algorithm?',
    cells: {
      tpm: C(
        'stated',
        'ML-DSA signing keys are specified in V1.85, and the PC Client profile 1.07 makes ML-DSA support mandatory.',
        TPM_P2,
        TPM_PC
      ),
      caliptra: C(
        'stated',
        'Release 1.3 adds an ML-DSA-87 identity chain beside the ECDSA chain, in firmware; release 2.0 adds ML-DSA firmware-signature checks.',
        CAL_VER
      ),
      tessera: C(
        'specified',
        'Requirement: hardware support for ML-DSA-44, ML-DSA-65 and ML-DSA-87 in SPDM sessions.',
        TESSERA_CHIP
      ),
      'hardware-hsm': np(),
      'cloud-hsm': np(),
      'confidential-computing': np(),
      'dpu-bought': np(),
      'dpu-cloud': np(),
    },
  },
  {
    id: 'pq-key-exchange',
    label: 'Post-quantum key exchange or key import',
    question: 'How does it take in or move keys with post-quantum algorithms?',
    cells: {
      tpm: C(
        'stated',
        'V1.85 adds ML-KEM and the TPM2_Encapsulate and TPM2_Decapsulate commands.',
        TPM_P2,
        TPM_P3
      ),
      caliptra: C(
        'stated',
        'Release 2.1 adds an ML-KEM-1024 accelerator (Adams Bridge); its documentation describes caller-supplied ephemeral decapsulation keys (for example through a mailbox command) and no long-term keys.',
        ADAMS_BRIDGE,
        TESSERA_CHIP
      ),
      tessera: C(
        'specified',
        'Requirement: ML-KEM and ML-DSA acceleration; the key-transfer protocol drafts use HPKE.',
        TESSERA_CHIP,
        TESSERA_TMK
      ),
      'hardware-hsm': C(
        'varies',
        'Luna HSMs list ML-KEM from firmware 7.9.0 and the Primus CyberVault series lists ML-KEM. Varies by product.',
        LUNA_PQC,
        SECUROSYS
      ),
      'cloud-hsm': C(
        'varies',
        'Varies by service. Google’s quantum-safe key import uses KEMs and HPKE for software-backed keys only; AWS CloudHSM lists ML-DSA mechanisms and no ML-KEM mechanism.',
        GOOGLE_QS_IMPORT,
        AWS_MECHANISMS
      ),
      'confidential-computing': np(),
      'dpu-bought': np(),
      'dpu-cloud': np(),
    },
  },
  {
    id: 'firmware',
    label: 'Firmware update and rollback protection',
    question: 'Who updates the firmware, and what stops a rollback?',
    cells: {
      tpm: C(
        'stated',
        'The specification describes an optional field upgrade, full or incremental.',
        TPM_P1
      ),
      caliptra: C(
        'stated',
        'Firmware is checked against manufacturer keys (ECC plus LMS or ML-DSA, each with a revoke fuse); a security version number is compared with a fuse minimum, and an anti-rollback disable fuse exists.',
        CALIPTRA_ROT
      ),
      tessera: C(
        'specified',
        'Requirement: all firmware is loaded and measured by Caliptra, with an anti-rollback counter of at least 32 counts for non-Caliptra firmware.',
        TESSERA_CHIP
      ),
      'hardware-hsm': C(
        'varies',
        'The customer’s administrator applies updates; for example Securosys lists local and remote firmware update. Varies by product.',
        SECUROSYS_X2
      ),
      'cloud-hsm': C(
        'varies',
        'The provider decides; in Azure Cloud HSM, Microsoft oversees the firmware and the customer takes no action; the HSM manufacturer maintains the hardware.',
        AZ_CLOUD_FAQ
      ),
      'confidential-computing': np(),
      'dpu-bought': np(),
      'dpu-cloud': C(
        'stated',
        'Provider-side: Google’s Titan chips reject bad firmware pushes and help enforce revocation of known-vulnerable code, which mitigates rollback and replay attacks.',
        TITANIUM
      ),
    },
  },
  {
    id: 'audit',
    label: 'Audit and tamper evidence',
    question: 'What record exists, and can tampering with it be detected?',
    cells: {
      tpm: C(
        'stated',
        'Command audit keeps a digest so that a log held outside the TPM can be checked; the TPM does not store the log.',
        TPM_P1
      ),
      caliptra: np(),
      tessera: C(
        'specified',
        'Specified: key operations should emit audit records, and the firmware must keep an event log.',
        TESSERA_DARC,
        TESSERA_CHIP
      ),
      'hardware-hsm': C(
        'varies',
        'Luna Network HSM 7 lists secure audit logging, Securosys lists secure log and audit, and the Utimaco u.trust Anchor policy lists an audit-log key. Varies by product.',
        SECUROSYS_X2,
        UTIMACO_SP,
        LUNA_BRIEF
      ),
      'cloud-hsm': C(
        'varies',
        'Varies by service. Azure Cloud HSM records tamper-evident entries generated by the HSM firmware for management operations such as sign-ins, key creation and deletion, and backup and restore; the HSM signs each batch.',
        AZ_CLOUD_AUDIT
      ),
      'confidential-computing': np(),
      'dpu-bought': np(),
      'dpu-cloud': C(
        'stated',
        'Provider-side: AWS says operator access to the servers goes through authenticated, authorized, logged and audited administrative APIs.',
        NITRO
      ),
    },
  },
  {
    id: 'certification',
    label: 'Certification',
    question: 'What certification is published?',
    cells: {
      tpm: C(
        'stated',
        'Not published for TPMs in general; the PC Client profile notes TCG’s FIPS 140-3 guidance for TPM 2.0 only for self-test behaviour and timing.',
        TPM_PC
      ),
      caliptra: np(),
      tessera: C(
        'specified',
        'Specification only: the chip requirements call for FIPS 140-3 Level 3 certification at the full chip boundary; there is no certificate yet.',
        TESSERA_CHIP
      ),
      'hardware-hsm': C(
        'varies',
        'Varies by product and firmware. Algorithm validations, such as those NIST’s CAVP lists for Securosys, are not by themselves FIPS 140 module validations, so check the module’s own certificate.',
        SECUROSYS,
        IG_PQC
      ),
      'cloud-hsm': C(
        'varies',
        'Azure Cloud HSM states 140-3 Level 3 and Google Cloud HSM 140-2 Level 3. AWS cites certificate 4703 for hsm2m.medium in FIPS mode; NIST lists 4703 as Marvell LS2 HSM Family, in approved mode.',
        AZ_CLOUD_HSM,
        GOOGLE_HSM,
        AWS_FAQ,
        AWS_COMPLIANCE,
        CMVP_4703
      ),
      'confidential-computing': np(),
      'dpu-bought': C(
        'varies',
        'AMD Pensando PenTrust holds FIPS 140-3 Level 1, a software-hybrid module; for other devices, not published.',
        PENSANDO
      ),
      'dpu-cloud': C(
        'varies',
        'Provider statements: Azure Boost cites NIST 800-193 certification and a FIPS 140 certified system kernel; Google lists BoringSSL and PSP in FIPS 140-3 level 1 libraries.',
        AZ_BOOST,
        TITANIUM
      ),
    },
  },
  {
    id: 'typical-use',
    label: 'Typical use for an architect',
    question: 'What is the stated purpose?',
    cells: {
      tpm: C(
        'stated',
        'Measure the boot and tie keys and attestation to the platform’s state.',
        TPM_P1
      ),
      caliptra: C(
        'stated',
        'Secure boot and identity for one chip, built in by the chip maker.',
        CAL_HW
      ),
      tessera: C(
        'specified',
        'Stated purpose: HSM operations next to the workload, keys kept inside the HSM boundary, no network round trip. Nothing to deploy yet.',
        TESSERA_DEF
      ),
      'hardware-hsm': C(
        'stated',
        'Key management and high-speed cryptographic processing in regulated settings, in a device you run (Primus CyberVault X2 fact sheet).',
        SECUROSYS_X2
      ),
      'cloud-hsm': C(
        'stated',
        'Keys for cloud workloads in hardware the provider runs.',
        AZ_CLOUD_HSM,
        GOOGLE_HSM
      ),
      'confidential-computing': C(
        'stated',
        'Protect data and code while a workload runs, with keys released only after attestation.',
        NIST_CC
      ),
      'dpu-bought': C(
        'stated',
        'Move network, storage and security work away from the host, including inline encryption.',
        OCTEON,
        DOCA_PSP
      ),
      'dpu-cloud': C(
        'stated',
        'Run the cloud’s virtual network, storage and isolation for customer instances; Azure Boost offloads storage processing to an FPGA.',
        NITRO,
        AZ_BOOST,
        TITANIUM
      ),
    },
  },
]

// ---- Findings above the grid -------------------------------------------------------------

export const GRID_FINDINGS: (Sourced & { heading: string })[] = [
  {
    heading: 'What they share',
    text: 'All eight rest on a hardware root; what differs is who builds, runs and controls that hardware.',
    sources: [TPM_P1, CAL_HW, TESSERA_CHIP, SECUROSYS_X2, AZ_CLOUD_HSM, NIST_CC, OCTEON, NITRO],
  },
  {
    heading: 'The biggest split',
    text: 'Who holds long-term keys. HSMs keep them, Tessera specifies a cache and a clustered service, and confidential computing fetches them when it runs.',
    sources: [TESSERA_DEPLOY, NIST_CC, AZ_CLOUD_HSM],
  },
  {
    heading: 'Measured versus required',
    text: 'Some entries are published facts about existing products. Tessera’s speed and certification are requirements in a specification, and its earlier Azure Integrated HSM is a separate product.',
    sources: [TESSERA_CHIP, AZ_INTEGRATED],
  },
]

export const GRID_FOOTNOTE: Sourced = {
  text: 'Where products differ the cell says “varies by product” and gives an example. Figures are not like for like, so check the specific model, firmware and region before relying on a cell. “Not published in the sources read” means these documents do not state it, not that it does not exist.',
  sources: [SECUROSYS],
}

// ---- Exercise 1: pick the right one ------------------------------------------------------

export const SCENARIOS: Scenario[] = [
  {
    id: 'cloud-customer-keys',
    title: 'Customer-managed keys for a cloud application',
    prompt:
      'A cloud application needs encryption keys that you control, and you accept that the provider runs the hardware.',
    origin: 'landscape',
    landscapeUseCaseId: 'cloud-kms',
    best: ['cloud-hsm'],
    why: {
      text: 'A cloud HSM keeps customer-controlled keys in hardware that the provider runs; in Azure Cloud HSM the customer administers users and keys while Microsoft maintains the hardware.',
      sources: [AZ_CLOUD_HSM, CSA_GUIDE],
    },
    lessWell: [
      {
        category: 'hardware-hsm',
        text: 'It also keeps keys inside a module, but you run the appliance yourself, which the scenario does not ask for.',
        sources: [SECUROSYS_X2],
      },
      {
        category: 'confidential-computing',
        text: 'It protects the workload while it runs; the long-term key still has to come from a key service after attestation.',
        sources: [NIST_CC],
      },
    ],
  },
  {
    id: 'code-signing-root',
    title: 'Signing keys for firmware and code releases',
    prompt:
      'Your release process signs firmware and software. The signing key must stay in certified hardware that you run, with several people approving its use.',
    origin: 'landscape',
    landscapeUseCaseId: 'cross-code-signing',
    best: ['hardware-hsm'],
    why: {
      text: 'An HSM you run keeps keys inside a tamper-protected boundary and products list secure log and audit. The Landscape row for code signing names hash-based and ML-DSA signatures as the replacements, so check which your model lists: Luna lists LMS-HSS from firmware 7.8.9 and ML-DSA from 7.9.0, and Primus CyberVault lists ML-DSA, SLH-DSA, HSS/LMS and XMSS.',
      sources: [SECUROSYS_X2, LUNA_PQC, IG_PQC],
    },
    lessWell: [
      {
        category: 'cloud-hsm',
        text: 'It can hold signing keys, but the provider runs the hardware; choose it only if that trust arrangement fits.',
        sources: [AZ_CLOUD_HSM],
      },
      {
        category: 'tpm',
        text: 'It keeps a few keys and stores most outside the module, so it suits platform keys better than a release-signing root.',
        sources: [TPM_P1],
      },
    ],
  },
  {
    id: 'laptop-boot-state',
    title: 'Disk key tied to a known boot state',
    prompt:
      'A laptop fleet must release the disk key only when the machine booted the expected firmware, and a server must be able to check the platform’s state.',
    origin: 'landscape',
    landscapeUseCaseId: 'semis-tpm',
    best: ['tpm'],
    why: {
      text: 'A TPM records boot measurements, signs quotes of them and keeps keys bound to platform state; the PC Client profile 1.07 requires it to support ML-KEM and ML-DSA.',
      sources: [TPM_P1, TPM_PC],
    },
    lessWell: [
      {
        category: 'caliptra',
        text: 'Choose it when the need is one chip’s own boot and identity; for the host platform’s measurements, a TPM is the module the PC Client profile describes.',
        sources: [CAL_HW, TPM_PC],
      },
      {
        category: 'confidential-computing',
        text: 'Its attestation reports on the VM or enclave; ask the host’s TPM for the board’s boot state.',
        sources: [NIST_CC],
      },
    ],
  },
  {
    id: 'ipsec-line-rate',
    title: 'IPsec at line rate without using server CPU',
    prompt:
      'A network function encrypts backhaul traffic with IPsec at very high rates and cannot spend server CPU on it.',
    origin: 'landscape',
    landscapeUseCaseId: 'telco-transport',
    best: ['dpu-bought'],
    why: {
      text: 'A DPU you buy sits in the packet path with crypto engines and encrypts traffic inline. The Landscape row names IPsec on the security gateway; the DPU documents describe the inline offload, and in NVIDIA’s sample the application can run on the DPU itself.',
      sources: [OCTEON, DOCA_PSP, GSMA_PQ03],
    },
    lessWell: [
      {
        category: 'hardware-hsm',
        text: 'An HSM is a key device reached through interfaces such as PKCS#11, JCE, KMIP and REST; it is not in the packet path.',
        sources: [SECUROSYS_X2],
      },
      {
        category: 'dpu-cloud',
        text: 'These are the provider’s cards; the documents describe no way for you to choose their design or load your own keys into them.',
        sources: [NITRO, TITANIUM],
      },
    ],
  },
  {
    id: 'attested-vm-key',
    title: 'Prove a VM booted the expected image before giving it a key',
    prompt:
      'A service must hand a decryption key to a virtual machine only after the machine proves what it is running.',
    origin: 'authored',
    best: ['confidential-computing'],
    why: {
      text: 'In the documented flow the workload attests, a relying party checks the report, and the key is released into protected memory. The key itself can stay in a key service that supports key release.',
      sources: [NIST_CC, ...KEY_RELEASE, RATS],
    },
    lessWell: [
      {
        category: 'tpm',
        text: 'It attests the host platform’s boot, not the VM’s own state, though the two can be used together.',
        sources: [TPM_P1, RATS],
      },
      {
        category: 'cloud-hsm',
        text: 'It can hold the key, but it does not by itself check the VM’s attestation; a key service with key release does.',
        sources: [...KEY_RELEASE],
      },
    ],
  },
  {
    id: 'hsm-by-every-server',
    title: 'An HSM next to every workload, today',
    prompt:
      'Your architects want an HSM attached to each server so keys never leave an HSM boundary and there is no network round trip, and they want to buy it this year with FIPS 140-3 Level 3.',
    origin: 'authored',
    best: ['hardware-hsm', 'cloud-hsm'],
    why: {
      text: 'The design that matches the wish is Tessera, but it is specification and code with no product or certificate yet. Today the HSMs you can run are appliances or cards you operate, or cloud services; both are reached over a network or bus, so plan for the round trip.',
      sources: [TESSERA_DEF, TESSERA_SW, SECUROSYS_X2],
    },
    lessWell: [
      {
        category: 'tessera',
        text: 'Its FIPS 140-3 Level 3 certification and its speed are requirements in the specification, and the software repository states it is not yet ready for deployment.',
        sources: [TESSERA_CHIP, TESSERA_SW],
      },
    ],
  },
  {
    id: 'chip-root-of-trust',
    title: 'A root of trust inside a chip you are designing',
    prompt:
      'You are choosing building blocks for a data-centre chip and need secure boot and a device identity inside it.',
    origin: 'authored',
    best: ['caliptra'],
    why: {
      text: 'Caliptra is an open root-of-trust block that a chip maker builds in, with a DICE identity chain and firmware measurement. Tessera’s chip requirements adopt it for the same job.',
      sources: [CAL_HW, DICE, TESSERA_CHIP],
    },
    lessWell: [
      {
        category: 'tpm',
        text: 'It is a module for the host platform, either a separate chip or an integrated TPM, not a block for a chip’s own boot.',
        sources: [TPM_PC],
      },
    ],
  },
  {
    id: 'vpc-encryption',
    title: 'Encrypt traffic inside the provider’s network without running keys yourself',
    prompt:
      'You want traffic between your cloud instances encrypted on the provider’s network and prefer not to operate any key hardware.',
    origin: 'authored',
    best: ['dpu-cloud'],
    why: {
      text: 'AWS documents that some instance types use Nitro hardware offload to encrypt traffic between instances with AES-256-GCM. The provider runs the cards, and the documents describe no customer key loading into them.',
      sources: [NITRO],
    },
    lessWell: [
      {
        category: 'dpu-bought',
        text: 'Consider it when you run your own servers; inside a provider’s network, the provider’s own cards do this work.',
        sources: [OCTEON, DOCA_PSP],
      },
      {
        category: 'cloud-hsm',
        text: 'It holds your keys for your own use; it is not what encrypts the provider’s network traffic.',
        sources: [AZ_CLOUD_HSM],
      },
    ],
  },
]

// ---- Exercise 2: how they combine --------------------------------------------------------

export const COMBINE_CASES: CombineCase[] = [
  {
    id: 'caliptra-in-tessera',
    title: 'Caliptra as the root of trust named in Tessera’s specification',
    parts: ['caliptra', 'tessera'],
    steps: [
      {
        text: 'Tessera’s chip requirements say the chip must have a Caliptra 2.2 subsystem as its root of trust, and that no other root of trust may be present.',
        sources: [TESSERA_CHIP],
      },
      {
        text: 'Caliptra loads and measures all firmware on the chip and attests claims about its security configuration.',
        sources: [TESSERA_CHIP, CAL_HW],
      },
      {
        text: 'Tessera’s device identity is derived from the Caliptra identity hierarchy, which follows the DICE approach.',
        sources: [TESSERA_CHIP, DICE],
      },
    ],
    takeaway: {
      text: 'The two are not alternatives: in the specification, Caliptra is a part inside Tessera. All of this is a requirement in a specification, not a measured product.',
      sources: [TESSERA_CHIP, TESSERA_SW],
    },
  },
  {
    id: 'tpm-and-confidential-vm',
    title: 'A TPM measuring the host next to a confidential VM’s own attestation',
    parts: ['tpm', 'confidential-computing'],
    steps: [
      {
        text: 'The host’s TPM records boot measurements and can sign a quote of them.',
        sources: [TPM_P1],
      },
      {
        text: 'The confidential VM or enclave produces its own attestation report from the CPU’s protected mode.',
        sources: [NIST_CC, TEE_SOK],
      },
      {
        text: 'RFC 9334 describes a composite device whose trustworthiness is judged by appraising the evidence of all its sub-entities, each with its own attesting environment.',
        sources: [RATS],
      },
    ],
    takeaway: {
      text: 'The two attest different things, the host platform and the VM; a verifier can ask for both. Whether a given product combines them is a product decision to check.',
      sources: [RATS, TPM_P1, NIST_CC],
    },
  },
  {
    id: 'key-release',
    title: 'Key release from a key service to an attested workload',
    parts: ['cloud-hsm', 'confidential-computing'],
    steps: [
      {
        text: 'Azure Secure Key Release lets Azure Key Vault Managed HSM or Premium release an HSM-protected key to an attested trusted execution environment.',
        sources: [...KEY_RELEASE],
      },
      {
        text: 'AWS KMS works with Nitro Enclaves attestation, so a key policy can depend on the enclave’s attested state.',
        sources: [...KEY_RELEASE],
      },
      {
        text: 'NIST IR 8320E (initial public draft) describes the same pattern in general terms: configure a TEE-capable VM, attest it, let a relying party decide, then release the key.',
        sources: [NIST_CC],
      },
    ],
    takeaway: {
      text: 'Name the service: this is documented for Azure Key Vault Managed HSM and Premium, and for AWS KMS with Nitro Enclaves, not for any cloud HSM or KMS.',
      sources: [...KEY_RELEASE],
    },
  },
  {
    id: 'dpu-keys',
    title: 'A DPU you buy encrypting traffic: where its keys come from',
    parts: ['dpu-bought', 'hardware-hsm'],
    steps: [
      {
        text: 'In NVIDIA’s DOCA PSP Gateway sample, keys are exchanged between application instances and then installed in the device with encryption rules.',
        sources: [DOCA_PSP],
      },
      {
        text: 'The sample exchanges those keys over a gRPC channel that is unencrypted unless you change the application.',
        sources: [DOCA_PSP],
      },
      {
        text: 'The DPU documents read describe no standard way to load a wrapped key from an HSM into a DPU.',
        sources: [DOCA_PSP],
      },
    ],
    takeaway: {
      text: 'This case teaches a limit: the sources read describe key exchange handled by an application, over a channel that is unencrypted by default in NVIDIA’s sample, and no HSM-to-DPU flow. Do not assume one exists.',
      sources: [DOCA_PSP],
    },
  },
]

// ---- Helpers for the component and the tests ---------------------------------------------

export const CATEGORY_IDS: CategoryId[] = TRUST_CARDS.map((c) => c.id)

export const CATEGORY_NAMES: Record<CategoryId, string> = Object.fromEntries(
  TRUST_CARDS.map((c) => [c.id, c.name])
) as Record<CategoryId, string>

/** Every text unit with its sources, for the test that checks citations and wording. */
export function allSourcedUnits(): {
  where: string
  text: string
  sources: string[]
  optional?: boolean
}[] {
  const out: { where: string; text: string; sources: string[]; optional?: boolean }[] = []
  for (const card of TRUST_CARDS) {
    card.sentences.forEach((s, i) => out.push({ where: `card ${card.id} #${i}`, ...s }))
    card.ancestorBox?.sentences.forEach((s, i) =>
      out.push({ where: `card ${card.id} ancestor #${i}`, ...s })
    )
  }
  for (const row of GRID_ROWS) {
    for (const id of CATEGORY_IDS) {
      const cell = row.cells[id]
      out.push({
        where: `grid ${row.id}/${id}`,
        text: cell.text,
        sources: cell.sources,
        optional: cell.kind === 'not-published',
      })
    }
  }
  GRID_FINDINGS.forEach((f, i) =>
    out.push({ where: `finding #${i}`, text: f.text, sources: f.sources })
  )
  out.push({ where: 'grid footnote', ...GRID_FOOTNOTE })
  for (const s of SCENARIOS) {
    out.push({ where: `scenario ${s.id} why`, ...s.why })
    s.lessWell.forEach((l, i) =>
      out.push({ where: `scenario ${s.id} less #${i}`, text: l.text, sources: l.sources })
    )
  }
  for (const c of COMBINE_CASES) {
    c.steps.forEach((s, i) => out.push({ where: `combine ${c.id} #${i}`, ...s }))
    out.push({ where: `combine ${c.id} takeaway`, ...c.takeaway })
  }
  return out
}
