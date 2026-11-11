// SPDX-License-Identifier: AGPL-3.0-only
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { libraryData, type LibraryItem } from '@/data/libraryData'
import { citedRfcNumber, cmsSourceRole, sourceReviewContext } from './librarySourceContext'
import { CmsSourceGuide, LibraryReviewProcess } from './LibrarySourceLabels'
import { LibraryDocumentCard } from './redesign/LibraryDocumentCard'
import { LibraryDetailDrawer } from './redesign/LibraryDetailDrawer'
import { LibraryDetailPopover } from './LibraryDetailPopover'
vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
const noop = () => undefined
function real(id: string) {
  const row = libraryData.find((x) => x.referenceId === id)
  if (!row) throw new Error(id)
  return row
}
function sample(changes: Partial<LibraryItem>): LibraryItem {
  return {
    ...libraryData[0],
    referenceId: 'sample-paper',
    downloadUrl: 'https://arxiv.org/abs/2006.08249',
    documentType: 'Research Paper',
    documentStatus: 'Published',
    peerReviewed: 'yes',
    ...changes,
  }
}
function wrapped(content: React.ReactNode) {
  return render(<MemoryRouter>{content}</MemoryRouter>)
}
describe('Source review process without transferring authority between source types', () => {
  it('separates academic review recorded for a paper from useful preprint research and standards review', () => {
    const paper = sourceReviewContext(sample({})),
      preprint = sourceReviewContext(sample({ peerReviewed: 'no' }))
    expect(paper.label).toBe('Academic peer review recorded')
    expect(sourceReviewContext(sample({ peerReviewed: 'partial' })).label).toBe(
      'Partial academic review recorded'
    )
    expect(preprint.label).toBe('Research preprint')
    expect(preprint.detail).toContain('methods and results remain useful')
    const standard = sourceReviewContext(
      sample({ downloadUrl: 'https://csrc.nist.gov/pubs/fips/203/final', documentType: 'Standard' })
    )
    expect(standard.label).toBe('Standards publication')
    expect(standard.detail).toContain('not academic peer review')
  })
  it('distinguishes consensus Informational PKCS12, PKCS-process PKCS10 and Independent Submission DNSSEC', () => {
    expect(
      sourceReviewContext(real('PKCS-12-Personal-Information-Exchange-Syntax-v1-1')).label
    ).toBe('IETF consensus · Informational RFC')
    expect(
      sourceReviewContext(real('RFC-2986-PKCS-10-Certification-Request-Syntax-Specification'))
        .detail
    ).toContain('Change control remains in the PKCS process')
    const independent = sourceReviewContext(
      real('RFC-9563-SM2-Digital-Signature-Algorithm-for-DNSSEC')
    )
    expect(independent.label).toBe('Independent Submission · Informational RFC')
    expect(independent.detail).toContain('does not have IETF community consensus')
  })
  it('resolves the named RFC source before a conflicting catalogue reference, with no arbitrary-host inference', () => {
    expect(
      citedRfcNumber({
        referenceId: 'RFC 5083',
        downloadUrl: 'https://www.rfc-editor.org/rfc/rfc5084.html',
      })
    ).toBe(5084)
    expect(
      citedRfcNumber({
        referenceId: 'Article about CMS',
        downloadUrl: 'https://example.invalid/rfc5083',
      })
    ).toBeNull()
    expect(citedRfcNumber({ referenceId: 'RFC-9563-SM2-DNSSEC', downloadUrl: '' })).toBe(9563)
  })
  it('preserves industry consensus and hosted proposal process without promoting either to an IETF standard', () => {
    expect(sourceReviewContext(real('SLSA-Specification-v1.1')).label).toBe(
      'Industry-consensus specification'
    )
    const proposed = real('SIMD-0461-Falcon-FN-DSA-Signature-Verification-Precompile')
    expect(sourceReviewContext(proposed).label).toBe('Withdrawn hosted proposal')
    expect(sourceReviewContext({ ...proposed, documentStatus: 'Open' }).label).toBe(
      'Hosted proposal'
    )
    const generic = sourceReviewContext(
      sample({
        referenceId: 'RFC 999999',
        downloadUrl: 'https://www.rfc-editor.org/rfc/rfc999999.html',
        documentType: 'RFC',
        documentStatus: 'Informational',
      })
    )
    expect(generic.label).toBe('Informational RFC')
    expect(generic.label).not.toContain('consensus')
  })
})
describe('Actual Library source-label surfaces', () => {
  it('renders independent publication scope on the real card', async () => {
    await act(async () => {
      wrapped(
        <LibraryDocumentCard
          item={real('RFC-9563-SM2-Digital-Signature-Algorithm-for-DNSSEC')}
          bookmarked={false}
          onToggleBookmark={noop}
          onOpen={noop}
        />
      )
    })
    expect(screen.getByTestId('library-review-process')).toHaveTextContent(
      'Independent Submission · Informational RFC'
    )
    expect(screen.queryByText('Academic peer review recorded')).not.toBeInTheDocument()
  })
  it.each(['drawer', 'popover'] as const)(
    'renders the same useful CMS decision guide on the %s',
    (surface) => {
      const item = real('RFC 5083')
      wrapped(
        surface === 'drawer' ? (
          <LibraryDetailDrawer
            item={item}
            bookmarked={false}
            onToggleBookmark={noop}
            onClose={noop}
          />
        ) : (
          <LibraryDetailPopover item={item} isOpen onClose={noop} />
        )
      )
      const guide = screen.getByRole('region', { name: 'CMS specification roles' })
      expect(
        within(guide).getByRole('link', {
          name: 'RFC 5083 — Cryptographic Message Syntax (CMS) Authenticated-Enveloped-Data Content Type',
        })
      ).toHaveAttribute('href', 'https://www.rfc-editor.org/rfc/rfc5083.html')
      expect(
        within(guide).getByRole('link', {
          name: /RFC 5084 — Using AES-CCM and AES-GCM Authenticated Encryption/,
        })
      ).toHaveAttribute('href', 'https://www.rfc-editor.org/rfc/rfc5084.html')
      expect(guide).toHaveTextContent(
        'Base CMS content types, including SignedData and EnvelopedData.'
      )
      expect(guide).toHaveTextContent('Defines the AuthEnvelopedData structure')
      expect(guide).toHaveTextContent('algorithm conventions')
      expect(screen.queryByText('Peer reviewed', { exact: true })).not.toBeInTheDocument()
    }
  )
  it('keeps base CMS and algorithm profile roles distinct despite the original erroneous title', () => {
    expect(cmsSourceRole(real('RFC 5652'))?.role).toBe(
      'Base CMS content types, including SignedData and EnvelopedData.'
    )
    expect(cmsSourceRole(real('RFC 5083'))?.number).toBe(5083)
    render(
      <CmsSourceGuide
        item={sample({
          referenceId: 'RFC 5084',
          downloadUrl: 'https://www.rfc-editor.org/rfc/rfc5084.html',
        })}
        compact
      />
    )
    expect(screen.getByText(/RFC 5084:/)).toHaveTextContent(
      'algorithm conventions for AuthEnvelopedData'
    )
  })
  it('keeps the research methods and limitations visible alongside its review-process label', () => {
    render(<LibraryReviewProcess item={sample({})} />)
    expect(screen.getByTestId('library-review-process')).toHaveTextContent(
      'Evaluate its methods, assumptions and results'
    )
  })
})
