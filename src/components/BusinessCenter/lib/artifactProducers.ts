// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Where each artifact type that has no Command Center builder is made.
 *
 * The zone map keeps a card for every type its zones list, so a document saved
 * from another page still has a place to show. An uncreated card for one of
 * these types links to the page that makes it, instead of opening a drawer with
 * nothing to build.
 *
 * The architecture, operations and research packs are panels on /business that
 * render only for one persona. Their cards link to the panel when the visitor
 * has that persona. For any other visitor the card shows the note only: this
 * page does not change the visitor's persona to reach the panel.
 */
import type { PersonaId } from '@/data/personaIds'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { ORPHAN_ARTIFACT_TYPES, type OrphanArtifactType } from './cswp39StepMapping'

export interface ArtifactProducer {
  /** Route the producer lives at, without query or hash. */
  to: string
  /** Optional query string, including the leading "?". */
  search?: string
  /** Optional panel anchor on that page, including the leading "#". */
  hash?: string
  /** Name of the producer, read as "Made in {label}". */
  label: string
  /** Set for a pack panel that renders only for this persona. */
  panelFor?: { persona: PersonaId; roleName: string }
}

const PACK_PANEL_PAGE = '/business'

export const ARTIFACT_PRODUCERS: Record<OrphanArtifactType, ArtifactProducer> = {
  'sim-roadmap': { to: '/simulation', label: 'the Simulation console' },
  'crypto-champion-roster': {
    to: '/learn/skills-team-structure',
    label: 'the Skills & Team Structure module',
  },
  'team-sizing-plan': {
    to: '/learn/skills-team-structure',
    label: 'the Skills & Team Structure module',
  },
  'certification-plan': {
    to: '/learn/crypto-product-certification',
    label: 'the Crypto Product Certification module',
  },
  'architecture-scope': {
    to: PACK_PANEL_PAGE,
    hash: '#architecture-pack',
    label: 'the Architecture pack',
    panelFor: { persona: 'architect', roleName: 'Architect' },
  },
  'architecture-decision-record': {
    to: PACK_PANEL_PAGE,
    hash: '#architecture-pack',
    label: 'the Architecture pack',
    panelFor: { persona: 'architect', roleName: 'Architect' },
  },
  'architecture-test-plan': {
    to: PACK_PANEL_PAGE,
    hash: '#architecture-pack',
    label: 'the Architecture pack',
    panelFor: { persona: 'architect', roleName: 'Architect' },
  },
  'ops-scope': {
    to: PACK_PANEL_PAGE,
    hash: '#operations-pack',
    label: 'the Operations pack',
    panelFor: { persona: 'ops', roleName: 'Ops' },
  },
  'ops-test-plan': {
    to: PACK_PANEL_PAGE,
    hash: '#operations-pack',
    label: 'the Operations pack',
    panelFor: { persona: 'ops', roleName: 'Ops' },
  },
  'kmip-quick-run': {
    to: '/playground/cacp',
    search: '?tab=migration',
    label: 'the KMIP Playground migration tab',
  },
  'hsm-capacity-plan': { to: '/playground/hsm-capacity', label: 'the HSM capacity calculator' },
  'cert-capacity-plan': { to: '/learn/pki-workshop', label: 'the PKI Workshop module' },
  'protocol-config': {
    to: '/learn/vpn-ssh-pqc',
    label: 'the config generator in the VPN and SSH module',
  },
  'vpn-sim-run': { to: '/playground/vpn-sim', label: 'the VPN simulator' },
  'run-manifest': {
    to: '/openssl',
    label: 'a researcher tool, such as the TLS simulator in OpenSSL Studio',
  },
  'library-collection': { to: '/library', label: 'the Library' },
  'claim-matrix': {
    to: PACK_PANEL_PAGE,
    hash: '#research-workspace',
    label: 'the Research workspace',
    panelFor: { persona: 'researcher', roleName: 'Researcher' },
  },
  'reproduction-record': {
    to: PACK_PANEL_PAGE,
    hash: '#research-workspace',
    label: 'the Research workspace',
    panelFor: { persona: 'researcher', roleName: 'Researcher' },
  },
  'research-question': {
    to: PACK_PANEL_PAGE,
    hash: '#research-workspace',
    label: 'the Research workspace',
    panelFor: { persona: 'researcher', roleName: 'Researcher' },
  },
}

/** The producer for a type with no builder, or null for a type that has one. */
export function artifactProducerFor(type: ExecutiveDocumentType): ArtifactProducer | null {
  return (ORPHAN_ARTIFACT_TYPES as ExecutiveDocumentType[]).includes(type)
    ? ARTIFACT_PRODUCERS[type as OrphanArtifactType]
    : null
}

/** Link to the producer, or null when the visitor cannot reach it from here.
 *  A pack panel is reachable only for its own persona. */
export function producerHref(producer: ArtifactProducer, persona: PersonaId | null): string | null {
  if (producer.panelFor && producer.panelFor.persona !== persona) return null
  return `${producer.to}${producer.search ?? ''}${producer.hash ?? ''}`
}

/** Sentence naming where the document is made, e.g. "Made in the HSM capacity calculator". */
export function producerNote(producer: ArtifactProducer): string {
  if (producer.panelFor) {
    return `Made in ${producer.label}, shown on this page for the ${producer.panelFor.roleName} role`
  }
  return `Made in ${producer.label}`
}
