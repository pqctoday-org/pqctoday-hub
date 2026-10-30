// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Lesson 2: the status map. One entry per ecosystem; each entry lists the sourced sentences that
 * describe it, and the label that sentence earns. The sentences themselves live in
 * `sourceClaims.ts`; this file only groups them and assigns the label.
 *
 * Labels describe what the held document says about its own form, never a plan or a deadline:
 *  - rfc: the document is an RFC that specifies the mechanism
 *  - draft: the document is an Internet-Draft, not an RFC
 *  - experimental: the document marks the post-quantum entries it lists as experimental
 *  - requirement: the document sets a requirement on keys or key protection
 *  - recommended: a standards body recommends the mechanism
 *  - silent: the held text of this edition contains no post-quantum term
 */
import type { SourceClaimId } from './sourceClaims'

export type StatusLabel =
  'rfc' | 'draft' | 'experimental' | 'requirement' | 'recommended' | 'silent'

export const STATUS_LABELS: Record<StatusLabel, { text: string; meaning: string }> = {
  rfc: {
    text: 'Specified in an RFC',
    meaning: 'The document is an RFC that specifies the mechanism.',
  },
  draft: { text: 'Draft', meaning: 'The document is an Internet-Draft. It is not an RFC.' },
  experimental: {
    text: 'Experimental',
    meaning: 'The document marks the post-quantum entries it lists as experimental.',
  },
  requirement: {
    text: 'Requirement',
    meaning: 'The document sets a requirement on keys or on how keys are protected.',
  },
  recommended: {
    text: 'Recommended',
    meaning: 'A standards body recommends the mechanism.',
  },
  silent: {
    text: 'Silent in this edition',
    meaning:
      'The held text of this edition contains none of the post-quantum terms listed in the note under the map. That is a statement about one document; it does not say what anyone plans.',
  },
}

export interface StatusEntry {
  claim: SourceClaimId
  label: StatusLabel
}

export interface StatusRow {
  id: string
  ecosystem: string
  entries: StatusEntry[]
}

export interface StatusGroup {
  id: string
  title: string
  intro: string
  rows: StatusRow[]
}

export const STATUS_GROUPS: StatusGroup[] = [
  {
    id: 'policy',
    title: 'Where signing keys and algorithms are specified',
    intro:
      'Three documents that set rules for signing keys or list the signature algorithms a signing system supports. For each, the lesson reads what the held edition says and whether it contains a post-quantum term.',
    rows: [
      {
        id: 'sigstore',
        ecosystem: 'Sigstore',
        entries: [{ claim: 'SC-2.1', label: 'experimental' }],
      },
      {
        id: 'cabf',
        ecosystem: 'CA/Browser Forum code signing requirements',
        entries: [
          { claim: 'SC-2.2', label: 'requirement' },
          { claim: 'SC-2.3', label: 'requirement' },
          { claim: 'SC-2.4', label: 'requirement' },
          { claim: 'SC-2.2n', label: 'silent' },
        ],
      },
      {
        id: 'uefi',
        ecosystem: 'UEFI Secure Boot',
        entries: [
          { claim: 'SC-2.6', label: 'requirement' },
          { claim: 'SC-2.6n', label: 'silent' },
        ],
      },
    ],
  },
  {
    id: 'encodings',
    title: 'Encodings: where a post-quantum or hash-based signature can travel',
    intro:
      'A signature algorithm needs an encoding in each format that carries it. The documents below are the ones this lesson reads for four of those formats; it does not claim the list is complete.',
    rows: [
      {
        id: 'cose',
        ecosystem: 'COSE and JOSE',
        entries: [
          { claim: 'SC-2.7a', label: 'rfc' },
          { claim: 'SC-2.7b', label: 'rfc' },
          { claim: 'SC-2.7c', label: 'draft' },
        ],
      },
      {
        id: 'cms',
        ecosystem: 'CMS',
        entries: [
          { claim: 'SC-2.8a', label: 'rfc' },
          { claim: 'SC-2.8b', label: 'rfc' },
          { claim: 'SC-2.8c', label: 'rfc' },
        ],
      },
      {
        id: 'x509',
        ecosystem: 'X.509',
        entries: [
          { claim: 'SC-2.9a', label: 'rfc' },
          { claim: 'SC-2.9b', label: 'rfc' },
          { claim: 'SC-2.9c', label: 'rfc' },
        ],
      },
      {
        id: 'openpgp',
        ecosystem: 'OpenPGP',
        entries: [{ claim: 'SC-2.10', label: 'rfc' }],
      },
    ],
  },
  {
    id: 'firmware',
    title: 'Firmware manifests and recommendations',
    intro: 'One manifest format and one standards body that names mechanisms for signatures.',
    rows: [
      {
        id: 'suit',
        ecosystem: 'SUIT manifest',
        entries: [{ claim: 'SC-2.5', label: 'draft' }],
      },
      {
        id: 'etsi',
        ecosystem: 'ETSI TS 119 312',
        entries: [{ claim: 'SC-2.11', label: 'recommended' }],
      },
    ],
  },
]
