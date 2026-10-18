// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LibraryDocumentCard } from './LibraryDocumentCard'
import type { LibraryItem } from '@/data/libraryData'

function makeItem(overrides: Partial<LibraryItem>): LibraryItem {
  return {
    referenceId: 'TEST-1',
    documentTitle: 'Test document',
    downloadUrl: '',
    initialPublicationDate: '2025-01-01',
    lastUpdateDate: '2025-01-01',
    documentStatus: 'Final',
    lifecycleLabel: 'Released',
    shortDescription: '',
    documentType: '',
    applicableIndustries: [],
    authorsOrOrganization: '',
    dependencies: '',
    regionScope: '',
    algorithmFamily: '',
    securityLevels: '',
    protocolOrToolImpact: '',
    toolchainSupport: '',
    migrationUrgency: '',
    categories: [],
    ...overrides,
  } as LibraryItem
}

const noop = () => {}

describe('LibraryDocumentCard — source affordance', () => {
  it('shows an Open link when a source URL exists', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({ downloadUrl: 'https://example.com/doc.pdf' })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByRole('link', { name: /open/i })).toHaveAttribute(
      'href',
      'https://example.com/doc.pdf'
    )
  })

  it('shows "Source unavailable" (and no link) when there is no source URL', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({ downloadUrl: '' })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByText(/source unavailable/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /open/i })).toBeNull()
  })

  it('labels a paid publisher URL as an access page rather than an open document', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({
          downloadUrl: 'https://publisher.example/standard',
          accessType: 'paid',
        })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByRole('link', { name: 'Publisher access' })).toHaveAttribute(
      'href',
      'https://publisher.example/standard'
    )
    expect(screen.queryByText(/^Open$/)).toBeNull()
  })

  it('uses a free summary before a paid publisher page', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({
          downloadUrl: 'https://publisher.example/standard',
          freeSummaryUrl: 'https://publisher.example/abstract',
          accessType: 'paid',
        })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByRole('link', { name: 'Free summary' })).toHaveAttribute(
      'href',
      'https://publisher.example/abstract'
    )
  })

  it('does not invent a summary when no reviewed summary is catalogued', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({ shortDescription: '' })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByText(/no reviewed pqctoday summary yet/i)).toBeInTheDocument()
  })

  it('warns when low-confidence obligation language needs a source-scope check', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({
          shortDescription: 'All products must implement this profile.',
          confidenceScore: 60,
        })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByText(/scope-sensitive — verify the official source/i)).toBeInTheDocument()
  })

  it('shows the lifecycle label, in the new wording', () => {
    for (const lifecycleLabel of [
      'Released',
      'Draft',
      'Expired',
      'Historical',
      'Research Paper',
      'Misc',
    ] as const) {
      const { unmount } = render(
        <LibraryDocumentCard
          item={makeItem({ lifecycleLabel })}
          bookmarked={false}
          onToggleBookmark={noop}
          onOpen={noop}
        />
      )
      expect(screen.getByText(lifecycleLabel)).toBeInTheDocument()
      unmount()
    }
  })

  it("shows the current row's own label, never an older revision's", () => {
    render(
      <LibraryDocumentCard
        item={makeItem({
          lifecycleLabel: 'Draft',
          priorRevisions: [
            {
              referenceId: 'OLD',
              documentTitle: 'Older edition',
              documentStatus: 'Published',
              lifecycleLabel: 'Released',
              downloadUrl: '',
              supersededBy: 'X',
            },
          ],
        })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.queryByText('Released')).toBeNull()
  })
})
