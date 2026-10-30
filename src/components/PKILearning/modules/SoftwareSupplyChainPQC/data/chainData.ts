// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Orientation map for lesson 1: the links of a software delivery chain and the kind of control
 * each one relies on. This is the lesson's own map, not a statement from any source; the
 * sourced statements for each link are rendered from `sourceClaims.ts` in the later sections.
 */

export type ControlKind = 'signature' | 'attestation' | 'log' | 'policy' | 'hash and signature'

export interface ModuleLink {
  label: string
  to: string
}

export interface ChainLink {
  id: string
  link: string
  control: ControlKind
  what: string
  /** Learn modules that teach the link in depth */
  taughtIn: ModuleLink[]
  /** Section of this lesson that reads the link from its documents, if any */
  here: string | null
}

const CODE_SIGNING: ModuleLink = { label: 'Code Signing', to: '/learn/code-signing' }
const PLATFORM: ModuleLink = { label: 'Platform Engineering', to: '/learn/platform-eng-pqc' }
const SECURE_BOOT: ModuleLink = { label: 'Secure Boot', to: '/learn/secure-boot-pqc' }
const IOT: ModuleLink = { label: 'IoT', to: '/learn/iot-pqc' }
const SBOM: ModuleLink = { label: 'SBOM', to: '/learn/sbom' }

export const CHAIN_LINKS: ChainLink[] = [
  {
    id: 'developer',
    link: 'Developer workstation and source',
    control: 'signature',
    what: 'Signing keys and credentials held by people and tools',
    taughtIn: [CODE_SIGNING],
    here: 'Section 1',
  },
  {
    id: 'build',
    link: 'Build',
    control: 'attestation',
    what: 'Provenance: a record of how and where an artifact was built',
    taughtIn: [],
    here: 'Section 4',
  },
  {
    id: 'sbom',
    link: 'Dependency inventory (SBOM)',
    control: 'attestation',
    what: 'An inventory of components that its author can sign',
    taughtIn: [SBOM],
    here: 'Section 4',
  },
  {
    id: 'release',
    link: 'Release artifact',
    control: 'hash and signature',
    what: 'A hash or signature that the consumer checks before use',
    taughtIn: [CODE_SIGNING],
    here: 'Sections 1 and 2',
  },
  {
    id: 'log',
    link: 'Registry or transparency log',
    control: 'log',
    what: 'A recorded entry that others can inspect',
    taughtIn: [CODE_SIGNING],
    here: 'Section 2',
  },
  {
    id: 'policy',
    link: 'Pipeline policy gate',
    control: 'policy',
    what: 'A rule that admits or rejects an artifact in the pipeline',
    taughtIn: [PLATFORM],
    here: null,
  },
  {
    id: 'delivery',
    link: 'Update delivery',
    control: 'signature',
    what: 'Signed metadata from roles that need a threshold of keys',
    taughtIn: [],
    here: 'Section 3',
  },
  {
    id: 'verifier',
    link: 'Device verifier',
    control: 'signature',
    what: 'Boot ROM or updater code that checks signatures on the device',
    taughtIn: [SECURE_BOOT, IOT],
    here: 'Section 5',
  },
]

/** What the lesson leaves to the neighbouring modules, so it does not repeat them. */
export const NEIGHBOUR_TOPICS: { topic: string; module: ModuleLink }[] = [
  { topic: 'Signing mechanics, certificate chains and timestamping', module: CODE_SIGNING },
  { topic: 'The delivery pipeline and container signing', module: PLATFORM },
  { topic: 'The boot chain and UEFI', module: SECURE_BOOT },
  { topic: 'SUIT, firmware signing and device constraints', module: IOT },
  {
    topic: 'LMS and XMSS state management',
    module: { label: 'Stateful Signatures', to: '/learn/stateful-signatures' },
  },
  { topic: 'SBOM formats and minimum elements', module: SBOM },
  { topic: 'Cryptographic inventories', module: { label: 'CBOM', to: '/learn/cbom' } },
]
