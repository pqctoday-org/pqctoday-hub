// SPDX-License-Identifier: AGPL-3.0-only
import type { LibraryItem } from '@/data/libraryData'

type SourceRecord = Pick<
  LibraryItem,
  'referenceId' | 'downloadUrl' | 'documentType' | 'documentStatus' | 'peerReviewed'
>
export interface SourceReviewContext {
  label: string
  detail: string
}

/** Resolve the cited RFC itself, rather than a title that may mention another RFC. */
export function citedRfcNumber(
  item: Pick<LibraryItem, 'referenceId' | 'downloadUrl'>
): number | null {
  try {
    const url = new URL(item.downloadUrl)
    if (['www.rfc-editor.org', 'rfc-editor.org', 'datatracker.ietf.org'].includes(url.hostname)) {
      const match = /\/rfc(\d+)(?:\.(?:html|txt|pdf))?\/?$/i.exec(url.pathname)
      if (match) return Number(match[1])
    }
  } catch {
    /* A missing source URL can still have a stable RFC reference ID. */
  }
  const match = /^RFC[ -]*(\d+)(?:$|[ -])/i.exec(item.referenceId)
  return match ? Number(match[1]) : null
}

/** Source publication/review process is separate from the catalogue's trust or review score.
 * A non-academic record's peer_reviewed flag never becomes academic peer review here. */
export function sourceReviewContext(item: SourceRecord): SourceReviewContext {
  const rfc = citedRfcNumber(item)
  if (rfc === 9563)
    return {
      label: 'Independent Submission · Informational RFC',
      detail:
        'Published in the independent RFC stream; the document explicitly does not have IETF community consensus and is not an Internet Standard.',
    }
  if (rfc === 2986)
    return {
      label: 'Informational RFC · PKCS republication',
      detail:
        'Republishes RSA Laboratories’ PKCS #10 v1.7. Change control remains in the PKCS process; RFC publication does not make it an Internet Standard.',
    }
  if (rfc === 7292)
    return {
      label: 'IETF consensus · Informational RFC',
      detail:
        'PKCS #12 v1.1 received public review and IESG approval, with change control transferred to the IETF. Informational publication is distinct from Standards Track and academic peer review.',
    }
  if (/^https:\/\/slsa\.dev\/spec\//i.test(item.downloadUrl))
    return {
      label: 'Industry-consensus specification',
      detail:
        'SLSA defines software supply-chain levels and provenance through its project specification process. It is not an IETF Internet-Draft or a cryptographic algorithm validation.',
    }
  if (
    /github\.com\/solana-foundation\/solana-improvement-documents\/pull\/461\/?$/i.test(
      item.downloadUrl
    )
  )
    return {
      label: /withdrawn|closed|rejected/i.test(item.documentStatus)
        ? 'Withdrawn hosted proposal'
        : 'Hosted proposal',
      detail:
        'A Falcon verification syscall proposal discussed in the SIMD repository. Its stated disposition determines adoption; repository hosting and review comments alone do not make it a Solana standard.',
    }
  if (rfc !== null || item.documentType === 'RFC') {
    if (
      /standards track|proposed standard|internet standard|draft standard/i.test(
        item.documentStatus
      )
    )
      return {
        label: 'Standards-track RFC',
        detail:
          'Use the RFC’s stated standards status and protocol requirements. Standards review is distinct from academic peer review or certification of an implementation.',
      }
    return {
      label: /informational/i.test(item.documentStatus) ? 'Informational RFC' : 'RFC publication',
      detail:
        'An RFC number identifies a published document. Its stream and status determine whether it represents IETF consensus or Standards Track; the catalogue review flag does not establish either.',
    }
  }
  if (item.documentType === 'Research Paper') {
    if (item.peerReviewed === 'yes')
      return {
        label: 'Academic peer review recorded',
        detail:
          'The catalogue records academic peer review for this paper. Evaluate its methods, assumptions and results; publication does not validate every implementation or deployment.',
      }
    if (item.peerReviewed === 'partial')
      return {
        label: 'Partial academic review recorded',
        detail:
          'The catalogue records partial review. Check which version and parts were reviewed before transferring confidence to other results or implementations.',
      }
    return {
      label: /arxiv\.org\//i.test(item.downloadUrl) ? 'Research preprint' : 'Research paper',
      detail:
        'Academic peer review is not recorded for this source. The manuscript’s stated methods and results remain useful evidence within their own scope.',
    }
  }
  if (item.documentType === 'Internet-Draft')
    return {
      label: 'Internet-Draft · work in progress',
      detail:
        'A draft proposal can change, expire or be replaced. It is not a published RFC or an adopted standard.',
    }
  if (item.documentType === 'Standard')
    return {
      label: 'Standards publication',
      detail:
        'Read the named publisher, edition and document status for its requirements and applicability. A catalogue review flag is not academic peer review or product certification.',
    }
  return {
    label: item.documentType || 'Source document',
    detail:
      'Use the publisher’s document type, scope and status. The catalogue’s checking and trust metadata describe this record, not academic peer review or standards adoption.',
  }
}

export const CMS_SOURCE_ROLES = [
  {
    number: 5652,
    title: 'Cryptographic Message Syntax (CMS)',
    role: 'Base CMS content types, including SignedData and EnvelopedData.',
  },
  {
    number: 5083,
    title: 'Cryptographic Message Syntax (CMS) Authenticated-Enveloped-Data Content Type',
    role: 'Defines the AuthEnvelopedData structure for authenticated encryption.',
  },
  {
    number: 5084,
    title:
      'Using AES-CCM and AES-GCM Authenticated Encryption in the Cryptographic Message Syntax (CMS)',
    role: 'Specifies the AES-CCM and AES-GCM algorithm conventions for AuthEnvelopedData.',
  },
] as const

export function cmsSourceRole(item: Pick<LibraryItem, 'referenceId' | 'downloadUrl'>) {
  const number = citedRfcNumber(item)
  return CMS_SOURCE_ROLES.find((source) => source.number === number)
}
